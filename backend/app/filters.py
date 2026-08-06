"""
Dynamic catalogue filtering by colour, season and event/occasion.

- colour  -> from item_metadata.color   (set by the upload pipeline)
- season  -> from item_metadata.season  (set by the upload pipeline)
- event   -> derived on the fly from category + subcategory (see
             occasion_utils), so no schema change is needed and it
             covers every existing item.

Everything here is read-only and additive: existing endpoints are
untouched. Filter options are computed from what is actually in the
catalogue, so the UI can render fully dynamic filter chips.
"""
import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import APIRouter, Query
from supabase import Client, create_client

from app.occasion_utils import ALL_OCCASIONS, get_occasions

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env", override=True)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

router = APIRouter(tags=["filters"])

# Natural chronological order for the season chips.
CANONICAL_SEASONS = ["spring", "summer", "fall", "winter"]


def _enriched_items():
    """
    Fetch every catalogue item joined with its colour/season metadata and
    a derived list of events. The heavy `embedding` column is intentionally
    not selected to keep the payload small.
    """
    items = (
        supabase.table("items")
        .select("id,category,subcategory,confidence,image_url,date_added,created_at")
        .execute()
        .data
        or []
    )
    meta = (
        supabase.table("item_metadata")
        .select("item_id,color,season")
        .execute()
        .data
        or []
    )
    meta_by_id = {m["item_id"]: m for m in meta}

    enriched = []
    for item in items:
        m = meta_by_id.get(item["id"], {})
        enriched.append(
            {
                **item,
                "color": m.get("color"),
                "season": m.get("season") or [],
                "events": get_occasions(item.get("category", ""), item.get("subcategory", "")),
            }
        )
    return enriched


def _parse_csv(value: Optional[str]):
    """Turn a "a,b,c" query param into ["a", "b", "c"] (empty -> [])."""
    if not value:
        return []
    return [part.strip() for part in value.split(",") if part.strip()]


def _matches(item, colors, seasons, events):
    """AND across the three dimensions, OR within each dimension."""
    if colors and item.get("color") not in colors:
        return False

    if seasons:
        item_seasons = set(item.get("season") or [])
        # "all seasons" items are wearable in any selected season.
        if "all seasons" not in item_seasons and not (item_seasons & set(seasons)):
            return False

    if events and not (set(item.get("events") or []) & set(events)):
        return False

    return True


@router.get("/catalogue/enriched")
def catalogue_enriched():
    """Full catalogue with colour, season and derived events attached."""
    items = _enriched_items()
    return {"items": items, "count": len(items)}


@router.get("/filters/options")
def filter_options():
    """
    Dynamic filter options built from the current catalogue — only values
    that at least one item actually has are returned.
    """
    items = _enriched_items()

    colors = sorted({i["color"] for i in items if i.get("color")})

    present_seasons = {
        s for i in items for s in (i.get("season") or []) if s != "all seasons"
    }
    seasons = [s for s in CANONICAL_SEASONS if s in present_seasons]

    present_events = {e for i in items for e in (i.get("events") or [])}
    events = [e for e in ALL_OCCASIONS if e in present_events]

    return {"colors": colors, "seasons": seasons, "events": events}


@router.get("/catalogue/filter")
def catalogue_filter(
    colors: Optional[str] = Query(None, description="Comma-separated colour names"),
    seasons: Optional[str] = Query(None, description="Comma-separated seasons"),
    events: Optional[str] = Query(None, description="Comma-separated events"),
):
    """
    Return catalogue items matching the selected colours/seasons/events.
    With no filters supplied, returns the full enriched catalogue.
    """
    selected_colors = _parse_csv(colors)
    selected_seasons = _parse_csv(seasons)
    selected_events = _parse_csv(events)

    items = _enriched_items()
    filtered = [
        i
        for i in items
        if _matches(i, selected_colors, selected_seasons, selected_events)
    ]

    return {
        "items": filtered,
        "count": len(filtered),
        "applied": {
            "colors": selected_colors,
            "seasons": selected_seasons,
            "events": selected_events,
        },
    }
