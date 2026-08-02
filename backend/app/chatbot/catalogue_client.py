"""
Client for fetching the wardrobe catalogue from our own backend's
GET /catalogue endpoint. Kept decoupled from P1's Supabase logic —
this only ever talks over HTTP to our own running API.
"""
import logging
from typing import List

import httpx

from app.chatbot.config import config
from app.chatbot.schemas import ClothingItem

logger = logging.getLogger(__name__)


async def fetch_catalogue() -> List[ClothingItem]:
    """Fetch all items from /catalogue and parse into ClothingItem models."""
    url = f"{config.BACKEND_BASE_URL}/catalogue"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPError as e:
        logger.error("Failed to fetch catalogue from %s: %s", url, e)
        raise RuntimeError("Could not reach /catalogue endpoint") from e

    raw_items = data.get("items", [])
    items: List[ClothingItem] = []
    for raw in raw_items:
        items.append(
            ClothingItem(
                id=str(raw.get("id")),
                category=raw.get("category", "unknown"),
                subcategory=raw.get("subcategory"),
                confidence=raw.get("confidence"),
                image_url=raw.get("image_url", ""),
                color=raw.get("color"),
                formality=raw.get("formality"),
                attributes_inferred=False,
            )
        )
    return items