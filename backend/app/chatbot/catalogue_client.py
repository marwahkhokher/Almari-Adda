"""
Client for fetching the wardrobe catalogue.
Uses an in-memory 30s TTL cache to avoid loopback HTTP calls and latency.
"""
import logging
import time
from typing import List
import httpx
from app.chatbot.config import config
from app.chatbot.schemas import ClothingItem

logger = logging.getLogger(__name__)

_CATALOGUE_ITEMS_CACHE: List[ClothingItem] = []
_LAST_FETCH_TIME: float = 0.0
CACHE_TTL: float = 30.0


async def fetch_catalogue() -> List[ClothingItem]:
    """Fetch all items from /catalogue with 30s in-memory TTL cache."""
    global _CATALOGUE_ITEMS_CACHE, _LAST_FETCH_TIME
    now = time.time()

    if _CATALOGUE_ITEMS_CACHE and (now - _LAST_FETCH_TIME) < CACHE_TTL:
        return _CATALOGUE_ITEMS_CACHE

    # Direct query to avoid HTTP loopback overhead
    try:
        from app.main import supabase
        result = supabase.table("items").select("*").execute()
        raw_items = result.data or []
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
        _CATALOGUE_ITEMS_CACHE = items
        _LAST_FETCH_TIME = now
        return items
    except Exception as db_err:
        logger.warning("Direct DB fetch fallback to HTTP: %s", db_err)

    url = f"{config.BACKEND_BASE_URL}/catalogue"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
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
    _CATALOGUE_ITEMS_CACHE = items
    _LAST_FETCH_TIME = now
    return items