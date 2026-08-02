"""
Fills in missing color/formality attributes on catalogue items.
If the catalogue already provides these fields, they are used as-is.
Otherwise, Groq vision is called once per item and the result is
cached in-memory so repeated turns don't re-trigger inference.
If P1 adds color/formality to the catalogue later, this module
automatically stops calling Groq for those items — no code change needed.
"""
import logging
import time
from typing import Dict, List, Tuple

from app.chatbot.config import config
from app.chatbot.groq_client import groq_client
from app.chatbot.schemas import ClothingItem

logger = logging.getLogger(__name__)

# In-memory cache: item_id -> (color, formality, timestamp)
_attribute_cache: Dict[str, Tuple[str, str, float]] = {}

_VISION_PROMPT = (
    "Look at this clothing item image. Respond with exactly two words "
    "separated by a comma: the dominant color, then the formality level "
    "(one of: casual, formal, semi-formal, athletic). "
    "Example response: 'navy blue, casual'"
)


def _get_cached(item_id: str) -> Tuple[str, str] | None:
    cached = _attribute_cache.get(item_id)
    if not cached:
        return None
    color, formality, ts = cached
    if time.time() - ts > config.ATTRIBUTE_CACHE_TTL:
        del _attribute_cache[item_id]
        return None
    return color, formality


async def _infer_via_vision(item: ClothingItem) -> Tuple[str, str]:
    """Call Groq vision to infer color and formality for one item."""
    try:
        raw = await groq_client.describe_image(item.image_url, _VISION_PROMPT)
        parts = [p.strip() for p in raw.split(",", 1)]
        color = parts[0] if len(parts) > 0 else "unknown"
        formality = parts[1] if len(parts) > 1 else "casual"
        return color, formality
    except Exception as e:
        logger.warning("Vision inference failed for item %s: %s", item.id, e)
        return "unknown", "casual"


async def enrich_items(items: List[ClothingItem]) -> List[ClothingItem]:
    """
    Return items with color/formality filled in. Prefers catalogue data;
    falls back to cached or freshly-inferred Groq vision results.
    """
    enriched: List[ClothingItem] = []
    for item in items:
        if item.color and item.formality:
            enriched.append(item)
            continue

        cached = _get_cached(item.id)
        if cached:
            color, formality = cached
        else:
            color, formality = await _infer_via_vision(item)
            _attribute_cache[item.id] = (color, formality, time.time())

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