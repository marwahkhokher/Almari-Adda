"""
Client for calling P2's outfit-matching engine. Calls the matching
logic directly in-process instead of over HTTP, since the chatbot
runs inside the same FastAPI app as the /outfit-suggest route.
"""
import logging
import time
from typing import List, Optional

logger = logging.getLogger(__name__)

_CATALOGUE_CACHE = None
_LAST_CACHE_TIME = 0.0
CACHE_TTL_SECONDS = 30.0


async def fetch_outfit_suggestions(prompt_embedding: Optional[list] = None) -> List[dict]:
    """
    Fetch the catalogue and return the same outfit combination list
    that GET /outfit-suggest would return, without an HTTP round trip.

    Uses an in-memory 30s TTL cache for catalogue items & metadata so
    repeat queries take < 0.001s instead of 5s DB roundtrips.
    """
    global _CATALOGUE_CACHE, _LAST_CACHE_TIME
    from app.main import supabase
    from app.outfit_matching import get_valid_outfits

    try:
        now = time.time()
        if _CATALOGUE_CACHE is None or (now - _LAST_CACHE_TIME) > CACHE_TTL_SECONDS:
            result = supabase.table("items").select("*").execute()
            items = result.data or []

            meta_result = supabase.table("item_metadata").select("item_id, color").execute()
            color_lookup = {m["item_id"]: m["color"] for m in (meta_result.data or []) if m.get("color")}

            for item in items:
                if item.get("id") in color_lookup:
                    item["_cached_color"] = color_lookup[item["id"]]

            _CATALOGUE_CACHE = items
            _LAST_CACHE_TIME = now
        else:
            items = _CATALOGUE_CACHE

        return get_valid_outfits(items, prompt_embedding=prompt_embedding)
    except Exception as e:
        logger.error("Failed to compute outfit suggestions: %s", e)
        raise RuntimeError("Could not compute outfit suggestions") from e