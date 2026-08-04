"""
Client for calling P2's outfit-matching engine. Calls the matching
logic directly in-process instead of over HTTP, since the chatbot
runs inside the same FastAPI app as the /outfit-suggest route.
"""
import logging
from typing import List

logger = logging.getLogger(__name__)


async def fetch_outfit_suggestions() -> List[dict]:
    """
    Fetch the catalogue and return the same outfit combination list
    that GET /outfit-suggest would return, without an HTTP round trip.
    """
    from app.main import supabase
    from app.outfit_matching import get_valid_outfits

    try:
        result = supabase.table("items").select("*").execute()
        items = result.data
        return get_valid_outfits(items)
    except Exception as e:
        logger.error("Failed to compute outfit suggestions: %s", e)
        raise RuntimeError("Could not compute outfit suggestions") from e