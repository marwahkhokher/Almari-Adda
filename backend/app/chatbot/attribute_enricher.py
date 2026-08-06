"""
Fills in missing color/formality attributes on catalogue items.
Uses instant subcategory-based inference to guarantee < 0.01s response times
and avoid hitting Groq API 429 Rate Limits.
"""
import logging
from typing import List, Tuple
from app.chatbot.schemas import ClothingItem

logger = logging.getLogger(__name__)

def _infer_fast_attributes(item: ClothingItem) -> Tuple[str, str]:
    """Instant subcategory attribute mapping (0.0001s)."""
    sub = (item.subcategory or "").lower()
    cat = (item.category or "").lower()
    
    if "blazer" in sub or "suit" in sub or "formal" in sub or "coat" in sub or "gown" in sub or "saree" in sub or "lehenga" in sub:
        return "navy/black", "formal"
    elif "skirt" in sub or "blouse" in sub or "sweater" in sub or "chinos" in sub or "satin" in sub or "cardigan" in sub:
        return "rose/beige", "semi-formal"
    elif "jeans" in sub or "trousers" in sub or "pant" in sub:
        return "blue/dark", "casual"
    elif "t-shirt" in sub or "tee" in sub or "hoodie" in sub:
        return "white/black", "casual"
    elif "dress" in sub:
        return "rose/red", "semi-formal"
    else:
        return "neutral", "casual"

async def enrich_items(items: List[ClothingItem]) -> List[ClothingItem]:
    """
    Return items with color/formality filled in instantly.
    """
    enriched: List[ClothingItem] = []
    for item in items:
        if item.color and item.formality:
            enriched.append(item)
            continue

        color, formality = _infer_fast_attributes(item)

        enriched.append(
            item.model_copy(
                update={
                    "color": item.color or color,
                    "formality": item.formality or formality,
                    "attributes_inferred": True,
                }
            )
        )
    return enriched