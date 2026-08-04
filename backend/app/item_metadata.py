"""
Router for item metadata: material, color, season, purchase info, notes.
Separate from the main catalogue data (category/subcategory/confidence),
which comes from the ML pipeline. This is all user-editable.
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


@router.get("/{item_id}")
def get_item_metadata(item_id: str):
    """Fetch metadata for a single item. Returns empty defaults if none exists yet."""
    result = supabase.table("item_metadata").select("*").eq("item_id", item_id).execute()
    if result.data:
        return result.data[0]
    return {
        "item_id": item_id,
        "material": None,
        "color": None,
        "season": [],
        "purchase_price": None,
        "purchase_date": None,
        "purchase_location": None,
        "notes": None,
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
