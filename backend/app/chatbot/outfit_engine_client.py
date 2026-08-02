"""
Client for calling P2's outfit-matching engine (/outfit-suggest). This is
the only file aware of that endpoint's request/response shape — kept
decoupled the same way catalogue_client.py is decoupled from Supabase.
If P2's endpoint changes or gets replaced, only this file needs updating.
"""
import logging
from typing import List, Optional

import httpx

from app.chatbot.config import config

logger = logging.getLogger(__name__)


async def fetch_outfit_suggestions() -> List[dict]:
    """
    Call P2's /outfit-suggest endpoint and return the raw list of
    outfit combinations as-is (top/bottom/formality dicts).
    """
    url = f"{config.BACKEND_BASE_URL}/outfit-suggest"
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(url)
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPError as e:
        logger.error("Failed to fetch outfit suggestions from %s: %s", url, e)
        raise RuntimeError("Could not reach /outfit-suggest endpoint") from e

    return data.get("outfits", [])