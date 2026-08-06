"""
LangGraph node functions for the fashion stylist agent. Each node
takes the current ChatbotState, does one job, and returns a partial
state update.
"""
import json
import random
import logging
from typing import List

from app.chatbot.attribute_enricher import enrich_items
from app.chatbot.catalogue_client import fetch_catalogue
from app.chatbot.graph.state import ChatbotState
from app.chatbot.groq_client import groq_client
from app.chatbot.schemas import ClothingItem, OutfitSuggestion
from app.chatbot.outfit_engine_client import fetch_outfit_suggestions
from app.formality_utils import get_formality, is_formality_compatible

logger = logging.getLogger(__name__)

_INTENT_PROMPT = """You are a fashion stylist assistant's intent parser.
Given the user's message, respond with ONLY a JSON object (no other text):
{{
  "intent": one of ["build_outfit", "match_item", "general_question"],
  "occasion": string or null (e.g. "wedding", "interview", "office", "university", "eid"),
  "color_constraint": string or null (e.g. "black"),
  "reference_item_id": string or null
}}

User message: "{message}"
"""

_EXPLAIN_PROMPT = """You are an expert AI fashion stylist. A rule-based outfit 
matching engine has already selected the following outfit for the occasion 
"{occasion}"{color_note}:

{outfit_json}

Write a warm, personalized 2-3 sentence explanation of why this combination 
works well for the occasion, referencing the specific items by their 
subcategory (e.g. "t-shirt", "jeans"). Do not mention any ID, product code, 
or identifier. Only mention a color if one is explicitly given in the data 
below — if color is null or missing, describe the item without guessing 
its color. If the outfit list is empty, explain clearly that no suitable 
outfit could be assembled and mention what's missing.

Respond in this JSON format only:
{{
  "reasoning": "explanation text",
  "confidence_score": float between 0 and 1
}}
"""

_OCCASION_FORMALITY = {
    "wedding": "formal",
    "interview": "formal",
    "eid": "formal",
    "gala": "formal",
    "reception": "formal",
    "office": "semi-formal",
    "work": "semi-formal",
    "party": "semi-formal",
    "date": "semi-formal",
    "date night": "semi-formal",
    "dinner": "semi-formal",
    "evening": "semi-formal",
    "university": "casual",
    "college": "casual",
    "school": "casual",
    "gym": "casual",
    "casual": "casual",
    "everyday": "casual",
    "hangout": "casual",
}


def _desired_formality(occasion):
    if not occasion or not isinstance(occasion, str):
        return None
    occ = occasion.strip().lower()
    if occ in _OCCASION_FORMALITY:
        return _OCCASION_FORMALITY[occ]
    for key, val in _OCCASION_FORMALITY.items():
        if key in occ:
            return val
    return "semi-formal"


async def parse_intent(state: ChatbotState) -> ChatbotState:
    """Use fast keyword matching or Groq to extract structured intent."""
    msg = (state.get("user_message") or "").strip().lower()

    # Fast path for preset chips & direct outfit requests (0.0001s)
    fast_occasions = ["dinner date", "casual day out", "office look", "weekend brunch", "wedding", "eid", "interview", "work", "party", "date", "dinner", "brunch", "office"]
    for occ in fast_occasions:
        if occ in msg:
            return {
                "intent": "build_outfit",
                "occasion": occ,
                "color_constraint": None,
                "reference_item_id": None,
            }

    if any(kw in msg for kw in ["outfit", "wear", "suggest", "recommend", "dress", "look", "clothes", "style", "put together"]):
        return {
            "intent": "build_outfit",
            "occasion": "everyday wear",
            "color_constraint": None,
            "reference_item_id": None,
        }

    prompt = _INTENT_PROMPT.format(message=state["user_message"])
    try:
        raw = await groq_client.complete_text(prompt)
        parsed = json.loads(raw)
        return {
            "intent": parsed.get("intent", "build_outfit"),
            "occasion": parsed.get("occasion"),
            "color_constraint": parsed.get("color_constraint"),
            "reference_item_id": parsed.get("reference_item_id"),
        }
    except Exception as e:
        logger.warning("Intent parsing failed, defaulting to build_outfit: %s", e)
        return {"intent": "build_outfit", "occasion": "everyday wear",
                "color_constraint": None, "reference_item_id": None}


async def load_catalogue(state: ChatbotState) -> ChatbotState:
    """Fetch the current wardrobe catalogue."""
    try:
        items = await fetch_catalogue()
        return {"raw_items": items}
    except Exception as e:
        logger.error("Catalogue fetch failed: %s", e)
        return {"raw_items": [], "error": "Could not load your wardrobe right now."}


async def enrich_attributes(state: ChatbotState) -> ChatbotState:
    """Fill in missing color/formality for catalogue items."""
    if state.get("error"):
        return {}
    items = await enrich_items(state["raw_items"])
    return {"enriched_items": items}


def retrieve_relevant_items(state: ChatbotState) -> ChatbotState:
    """Filter items down by color constraint, if any, before styling."""
    if state.get("error"):
        return {}
    items = state["enriched_items"]
    color_constraint = state.get("color_constraint")
    if color_constraint:
        filtered = [
            i for i in items
            if i.color and color_constraint.lower() in i.color.lower()
        ]
        # Fall back to full set if the constraint filters out everything
        items = filtered or items
    return {"relevant_items": items}


async def generate_outfit_reasoning(state: ChatbotState) -> ChatbotState:
    """
    Fetch outfit picks from P2's rule-based engine (source of truth for
    selection), then use Groq purely to explain/personalize the result
    in natural language. Does not re-decide item selection itself.
    """
    if state.get("error"):
        return {}

    import time
    t0 = time.time()
    # Fast path: skip slow CPU text embedding calculation; occasion-style matching is used below
    prompt_embedding = None
    print(f"[TIMING] embedding: {time.time() - t0:.2f}s")

    t1 = time.time()
    try:
        raw_outfits = await fetch_outfit_suggestions(prompt_embedding=prompt_embedding)
    except Exception as e:
        logger.error("Fetching outfit suggestions failed: %s", e)
        return {"outfit_suggestions": [], "error": "I couldn't reach the outfit matching engine right now."}
    print(f"[TIMING] fetch_outfit_suggestions: {time.time() - t1:.2f}s")

    occasion = state.get("occasion") or "everyday wear"
    color_constraint = state.get("color_constraint")
    color_note = f", using only {color_constraint} items" if color_constraint else ""

    # Filter P2's outfits by occasion formality and color constraint
    filtered_outfits = raw_outfits

    # ── Occasion-aware style preferences ──────────────────────────
    # Maps occasions to preferred subcategory keywords so the chatbot
    # picks culturally/contextually appropriate items.
    _OCCASION_STYLE_PREFERENCES = {
        # Eastern/cultural occasions → strongly prefer eastern wear
        "eid":       {"prefer": {"kurta", "abaya", "shalwar kameez", "lehenga", "saree", "sari", "sherwani"},
                      "category_prefer": {"eastern wear", "eastern", "dress"}},
        "mehndi":    {"prefer": {"lehenga", "saree", "sari", "kurta", "shalwar kameez"},
                      "category_prefer": {"eastern wear", "eastern"}},
        "wedding":   {"prefer": {"lehenga", "saree", "sari", "gown", "evening dress", "sherwani", "abaya", "kurta", "shalwar kameez"},
                      "category_prefer": {"eastern wear", "eastern", "dress"}},
        "reception": {"prefer": {"gown", "evening dress", "cocktail dress", "lehenga", "saree"},
                      "category_prefer": {"dress", "eastern wear"}},
        # Professional occasions → blazers, shirts, trousers
        "interview": {"prefer": {"blazer", "suit", "suit jacket", "dress shirt", "trousers", "dress pants", "pencil skirt"},
                      "category_prefer": {"top", "bottom"}},
        "office":    {"prefer": {"blazer", "blouse", "shirt", "trousers", "chinos", "pencil skirt"},
                      "category_prefer": {"top", "bottom"}},
        "work":      {"prefer": {"blazer", "blouse", "shirt", "trousers", "chinos"},
                      "category_prefer": {"top", "bottom"}},
        # Social/romantic → elegant dresses, skirts, blouses
        "date":      {"prefer": {"dress", "formal dress", "cocktail dress", "blouse", "skirt", "satin skirt"},
                      "category_prefer": {"dress", "top", "bottom"}},
        "date night": {"prefer": {"dress", "formal dress", "cocktail dress", "blouse", "skirt", "satin skirt"},
                       "category_prefer": {"dress", "top", "bottom"}},
        "dinner":    {"prefer": {"dress", "formal dress", "blouse", "skirt"},
                      "category_prefer": {"dress", "top", "bottom"}},
        "party":     {"prefer": {"cocktail dress", "dress", "formal dress", "blouse", "skirt"},
                      "category_prefer": {"dress", "top", "bottom"}},
        "gala":      {"prefer": {"gown", "evening dress", "lehenga", "saree"},
                      "category_prefer": {"dress", "eastern wear"}},
    }

    occ_lower = (occasion or "").strip().lower()

    # Find style prefs: try exact match, then substring
    style_prefs = _OCCASION_STYLE_PREFERENCES.get(occ_lower)
    if not style_prefs:
        for key, val in _OCCASION_STYLE_PREFERENCES.items():
            if key in occ_lower or occ_lower in key:
                style_prefs = val
                break

    def _outfit_style_score(outfit: dict) -> int:
        """Score an outfit by how well it matches the occasion's style preferences."""
        if not style_prefs:
            return 0
        score = 0
        preferred_subs = style_prefs.get("prefer", set())
        preferred_cats = style_prefs.get("category_prefer", set())
        for slot in ("top", "bottom", "item"):
            piece = outfit.get(slot)
            if not piece:
                continue
            sub = (piece.get("subcategory") or "").lower()
            cat = (piece.get("category") or "").lower()
            # Strong match: subcategory is in preferred list
            if sub in preferred_subs or any(p in sub for p in preferred_subs):
                score += 10
            # Moderate match: category is preferred
            if cat in preferred_cats:
                score += 3
        return score

    # Formal/Semi-formal occasion check
    FORMAL_OCCASIONS = {"wedding", "interview", "formal", "gala", "black tie", "eid", "reception", "party", "office", "business", "dinner", "mehndi"}
    if occasion and occ_lower in FORMAL_OCCASIONS:
        def _is_formal_enough(outfit: dict) -> bool:
            for slot in ("top", "bottom", "item"):
                piece = outfit.get(slot)
                if piece:
                    sub = piece.get("subcategory", "") or ""
                    formality = get_formality(sub)
                    if formality == "casual":
                        return False
            return True

        filtered_outfits = [o for o in filtered_outfits if _is_formal_enough(o)]

    if color_constraint:
        enriched_by_id = {i.id: i for i in state.get("relevant_items", [])}

        def _matches_color(outfit: dict) -> bool:
            for slot in ("top", "bottom", "item"):
                piece = outfit.get(slot)
                if not piece:
                    continue
                enriched = enriched_by_id.get(piece.get("id"))
                if enriched and enriched.color and color_constraint.lower() in enriched.color.lower():
                    return True
            return False

        filtered_outfits = [o for o in filtered_outfits if _matches_color(o)]

    # Filter by occasion's formality if we could infer one
    desired_formality = _desired_formality(state.get("occasion"))
    if desired_formality:
        def _matches_formality(outfit: dict) -> bool:
            for slot in ("top", "bottom", "item"):
                piece = outfit.get(slot)
                if not piece:
                    continue
                sub = piece.get("subcategory") or piece.get("category") or ""
                item_formality = get_formality(sub)
                if item_formality == "unknown" or not is_formality_compatible(item_formality, desired_formality):
                    return False
            return True

        formality_matched = [o for o in filtered_outfits if _matches_formality(o)]
        filtered_outfits = formality_matched or filtered_outfits

    # ── Pick the BEST outfit by style-preference score ────────────
    if not filtered_outfits:
        chosen_items: List[ClothingItem] = []
    else:
        msg_lower = (state.get("user_message") or "").lower()
        is_regen = any(kw in msg_lower for kw in ["regenerate", "different", "another", "new combo", "try again", "switch", "something else"])

        # Score every outfit by occasion-style match
        scored = [(o, _outfit_style_score(o)) for o in filtered_outfits]

        if is_regen and len(filtered_outfits) > 1:
            # Sort by score descending and select from diverse top candidates (excluding top-1)
            scored.sort(key=lambda pair: pair[1], reverse=True)
            candidates = [pair[0] for pair in scored[1:6]] or [pair[0] for pair in scored]
            top_outfit = random.choice(candidates)
        else:
            max_score = max(s for _, s in scored)
            top_scored = [o for o, s in scored if s == max_score]
            top_outfit = random.choice(top_scored)
        chosen_items = []
        for slot in ("top", "bottom", "item"):
            piece = top_outfit.get(slot)
            if piece:
                chosen_items.append(
                    ClothingItem(
                        id=piece.get("id", ""),
                        category=piece.get("category", ""),
                        subcategory=piece.get("subcategory"),
                        confidence=piece.get("confidence"),
                        image_url=piece.get("image_url", ""),
                    )
                )

    def _strip_for_prompt(outfit: dict) -> dict:
        cleaned = {}
        for slot in ("top", "bottom", "item"):
            piece = outfit.get(slot)
            if piece:
                cleaned[slot] = {
                    "category": piece.get("category"),
                    "subcategory": piece.get("subcategory"),
                    "color": piece.get("color"),
                }
        return cleaned

    prompt = _EXPLAIN_PROMPT.format(
        occasion=occasion,
        color_note=color_note,
        outfit_json=json.dumps(_strip_for_prompt(top_outfit) if filtered_outfits else {}),
    )

    t2 = time.time()
    try:
        raw = await groq_client.complete_text(prompt)
        parsed = json.loads(raw)
        suggestion = OutfitSuggestion(
            items=chosen_items,
            reasoning=parsed.get("reasoning", ""),
            confidence_score=parsed.get("confidence_score"),
        )
        print(f"[TIMING] groq explanation: {time.time() - t2:.2f}s")
        return {"outfit_suggestions": [suggestion]}
    except Exception as e:
        logger.error("Outfit explanation generation failed: %s", e)
        print(f"[TIMING] groq explanation (failed): {time.time() - t2:.2f}s")
        return {"outfit_suggestions": [], "error": "I had trouble explaining the outfit suggestion."}


def format_response(state: ChatbotState) -> ChatbotState:
    """Build the final reply text shown to the user."""
    if state.get("error"):
        return {"reply": state["error"]}

    suggestions = state.get("outfit_suggestions", [])
    if not suggestions:
        return {"reply": "I couldn't find a suitable outfit for that request."}

    top = suggestions[0]
    item_names = ", ".join(f"{i.subcategory or i.category}" for i in top.items)
    reply = f"Here's what I'd suggest: {item_names}.\n\n{top.reasoning}"
    return {"reply": reply}