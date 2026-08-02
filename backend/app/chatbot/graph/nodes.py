"""
LangGraph node functions for the fashion stylist agent. Each node
takes the current ChatbotState, does one job, and returns a partial
state update.
"""
import json
import logging
from typing import List

from app.chatbot.attribute_enricher import enrich_items
from app.chatbot.catalogue_client import fetch_catalogue
from app.chatbot.graph.state import ChatbotState
from app.chatbot.groq_client import groq_client
from app.chatbot.schemas import ClothingItem, OutfitSuggestion
from app.chatbot.outfit_engine_client import fetch_outfit_suggestions

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
works well for the occasion, referencing the specific items. If the outfit 
list is empty, explain clearly that no suitable outfit could be assembled 
and mention what's missing.

Respond in this JSON format only:
{{
  "reasoning": "explanation text",
  "confidence_score": float between 0 and 1
}}
"""

async def parse_intent(state: ChatbotState) -> ChatbotState:
    """Use Groq to extract structured intent from the raw user message."""
    prompt = _INTENT_PROMPT.format(message=state["user_message"])
    try:
        raw = await groq_client.complete_text(prompt)
        parsed = json.loads(raw)
        return {
            "intent": parsed.get("intent", "general_question"),
            "occasion": parsed.get("occasion"),
            "color_constraint": parsed.get("color_constraint"),
            "reference_item_id": parsed.get("reference_item_id"),
        }
    except Exception as e:
        logger.warning("Intent parsing failed, defaulting to general_question: %s", e)
        return {"intent": "general_question", "occasion": None,
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

    try:
        raw_outfits = await fetch_outfit_suggestions()
    except Exception as e:
        logger.error("Fetching outfit suggestions failed: %s", e)
        return {"outfit_suggestions": [], "error": "I couldn't reach the outfit matching engine right now."}

    occasion = state.get("occasion") or "everyday wear"
    color_constraint = state.get("color_constraint")
    color_note = f", using only {color_constraint} items" if color_constraint else ""

    # Filter P2's outfits by color constraint if the user asked for one.
    # Relies on P2's item color field if present; falls back to enriched
    # items' colors via id lookup if P2 doesn't include color itself.
    filtered_outfits = raw_outfits
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

        filtered_outfits = [o for o in raw_outfits if _matches_color(o)] or []

    if not filtered_outfits:
        chosen_items: List[ClothingItem] = []
    else:
        top_outfit = filtered_outfits[0]
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

    prompt = _EXPLAIN_PROMPT.format(
        occasion=occasion,
        color_note=color_note,
        outfit_json=json.dumps(filtered_outfits[:1] if filtered_outfits else []),
    )

    try:
        raw = await groq_client.complete_text(prompt)
        parsed = json.loads(raw)
        suggestion = OutfitSuggestion(
            items=chosen_items,
            reasoning=parsed.get("reasoning", ""),
            confidence_score=parsed.get("confidence_score"),
        )
        return {"outfit_suggestions": [suggestion]}
    except Exception as e:
        logger.error("Outfit explanation generation failed: %s", e)
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