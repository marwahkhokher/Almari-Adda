"""
Router for item metadata: material, color, season, purchase info, notes,
and wear tracking. Separate from the main catalogue data
(category/subcategory/confidence), which comes from the ML pipeline.
This is all user-editable.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import os
from supabase import create_client, Client
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / '.env', override=True)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

router = APIRouter(prefix="/item-metadata", tags=["item-metadata"])


class ItemMetadataUpdate(BaseModel):
    material: Optional[str] = None
    color: Optional[str] = None
    season: Optional[List[str]] = None
    purchase_price: Optional[float] = None
    purchase_date: Optional[str] = None
    purchase_location: Optional[str] = None
    notes: Optional[str] = None


class WearItemsPayload(BaseModel):
    item_ids: List[str]


@router.get("/{item_id}")
def get_item_metadata(item_id: str):
    """Fetch metadata for a single item. Returns empty defaults if none exists yet."""
    result = supabase.table("item_metadata").select("*").eq("item_id", item_id).execute()
    if result.data:
        row = result.data[0]
        row.setdefault("times_worn", 0)
        return row
    return {
        "item_id": item_id,
        "material": None,
        "color": None,
        "season": [],
        "purchase_price": None,
        "purchase_date": None,
        "purchase_location": None,
        "notes": None,
        "times_worn": 0,
    }


@router.put("/{item_id}")
def update_item_metadata(item_id: str, payload: ItemMetadataUpdate):
    """Create or update metadata for an item (upsert)."""
    data = payload.dict(exclude_unset=True)
    data["item_id"] = item_id

    try:
        result = supabase.table("item_metadata").upsert(data, on_conflict="item_id").execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save metadata: {str(e)}")

    return result.data[0] if result.data else data


@router.post("/increment-worn")
def increment_worn(payload: WearItemsPayload):
    """
    Increments times_worn by 1 for each item in the given list.
    Called when the user clicks "Wear Outfit" on a suggestion — logs
    that they chose to wear every item in that outfit.
    """
    updated = []

    for item_id in payload.item_ids:
        existing = supabase.table("item_metadata").select("*").eq("item_id", item_id).execute()

        if existing.data:
            current = existing.data[0].get("times_worn") or 0
            result = (
                supabase.table("item_metadata")
                .update({"times_worn": current + 1})
                .eq("item_id", item_id)
                .execute()
            )
        else:
            # No metadata row yet for this item — create one with times_worn = 1
            result = (
                supabase.table("item_metadata")
                .upsert({"item_id": item_id, "times_worn": 1}, on_conflict="item_id")
                .execute()
            )

        if result.data:
            updated.append(result.data[0])

    return {"status": "ok", "updated": updated}