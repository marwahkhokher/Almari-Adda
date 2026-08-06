"""
Client for calling P2's outfit-matching engine. Calls the matching
logic directly in-process instead of over HTTP, since the chatbot
runs inside the same FastAPI app as the /outfit-suggest route.
"""
import logging
from typing import List, Optional

logger = logging.getLogger(__name__)


async def fetch_outfit_suggestions(prompt_embedding: Optional[list] = None) -> List[dict]:
    """
    Fetch the catalogue and return the same outfit combination list
    that GET /outfit-suggest would return, without an HTTP round trip.

    If prompt_embedding is given, outfits are ranked by similarity to
    it (best match first) instead of being returned in arbitrary order.

    Performance: joins item_metadata to get pre-computed colors so
    get_valid_outfits never needs to download images at runtime.
    """
    from app.main import supabase
    from app.outfit_matching import get_valid_outfits

    try:
        result = supabase.table("items").select("*").execute()
        items = result.data

        # Fetch pre-computed colors from item_metadata so the outfit
        # matcher can skip the expensive image-download color detection.
        meta_result = supabase.table("item_metadata").select("item_id, color").execute()
        color_lookup = {m["item_id"]: m["color"] for m in (meta_result.data or []) if m.get("color")}

        # Inject the pre-computed color into each item dict
        for item in items:
            if item.get("id") in color_lookup:
                item["_cached_color"] = color_lookup[item["id"]]

        return get_valid_outfits(items, prompt_embedding=prompt_embedding)
    except Exception as e:
        logger.error("Failed to compute outfit suggestions: %s", e)
        raise RuntimeError("Could not compute outfit suggestions") from e