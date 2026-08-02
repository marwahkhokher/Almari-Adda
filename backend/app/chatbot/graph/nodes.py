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

_STYLING_PROMPT = """You are an expert AI fashion stylist. Using the wardrobe
items below, recommend one complete outfit for the occasion "{occasion}"
{color_note}. Explain WHY you chose each item in 2-3 sentences.

Wardrobe items (JSON):
{items_json}

Respond in this JSON format only:
{{
  "item_ids": [list of chosen item ids],
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
    """Ask Groq to pick and justify an outfit from the relevant items."""
    if state.get("error"):
        return {}

    items = state["relevant_items"]
    if not items:
        return {"outfit_suggestions": [], "error": "Your wardrobe is empty right now."}

    items_json = json.dumps(
        [{"id": i.id, "category": i.category, "subcategory": i.subcategory,
          "color": i.color, "formality": i.formality} for i in items]
    )
    occasion = state.get("occasion") or "everyday wear"
    color_note = f"using only {state['color_constraint']} items" if state.get("color_constraint") else ""

    prompt = _STYLING_PROMPT.format(
        occasion=occasion, color_note=color_note, items_json=items_json
    )

    try:
        raw = await groq_client.complete_text(prompt)
        parsed = json.loads(raw)
        chosen_ids = set(parsed.get("item_ids", []))
        chosen_items: List[ClothingItem] = [i for i in items if i.id in chosen_ids]

        suggestion = OutfitSuggestion(
            items=chosen_items,
            reasoning=parsed.get("reasoning", ""),
            confidence_score=parsed.get("confidence_score"),
        )
        return {"outfit_suggestions": [suggestion]}
    except Exception as e:
        logger.error("Outfit generation failed: %s", e)
        return {"outfit_suggestions": [], "error": "I had trouble putting an outfit together."}


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