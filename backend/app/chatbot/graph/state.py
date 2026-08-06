"""
LangGraph state schema for the fashion stylist agent. This TypedDict
is passed between every node in the graph and accumulates data as
the conversation flows through parsing, enrichment, and styling.
"""
from typing import List, Optional, TypedDict

from app.chatbot.schemas import ClothingItem, OutfitSuggestion


class ChatbotState(TypedDict, total=False):
    """Shared state threaded through the LangGraph pipeline."""

    session_id: str
    user_message: str

    # Conversation history as list of {"role": ..., "content": ...} dicts
    history: List[dict]

    # Parsed structured intent from the user's message
    intent: str
    occasion: Optional[str]
    color_constraint: Optional[str]
    reference_item_id: Optional[str]

    # Catalogue data as it moves through the pipeline
    raw_items: List[ClothingItem]
    enriched_items: List[ClothingItem]
    relevant_items: List[ClothingItem]

    # Output of styling reasoning
    outfit_suggestions: List[OutfitSuggestion]

    # Outfit keys to exclude when user requests regenerate
    excluded_outfit_keys: Optional[List[str]]

    # Final formatted reply text
    reply: str

    # Set if any node hits a recoverable error, so format_response can
    # still return something graceful to the user.
    error: Optional[str]