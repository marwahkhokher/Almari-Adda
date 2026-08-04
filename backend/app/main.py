import os
import uuid
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path
from pathlib import Path
from supabase import create_client, Client
from datetime import datetime

from app.ml.pipeline import process_clothing_upload
from app.color_utils import get_dominant_color, get_color_name
from datetime import date

from app.chatbot.router import router as chatbot_router
from app.item_metadata import router as item_metadata_router

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / '.env', override=True)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set in .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI(title="Almari-Adda API") 

# Allow the frontend (running on a different port/domain) to call this API.
# "*" is fine for this week's timeline - lock this down to your actual
# frontend domain once you deploy, but not worth the time now.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chatbot_router)
app.include_router(item_metadata_router)

_catalogue_cache = None

@app.get("/")
def root():
    return {"status": "Almari-Adda API is running"}


@app.post("/upload")
async def upload_clothing_item(file: UploadFile = File(...)):
    """
    Accepts a photo upload, runs it through the segmentation +
    classification pipeline, uploads the segmented image to
    Supabase storage, and saves the item's metadata to the
    items table.
    """
    global _catalogue_cache
    # Save the incoming upload to a temp local path first - the
    # pipeline function works off a file path, not raw bytes
    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    temp_filename = f"{uuid.uuid4()}_{file.filename}"
    temp_path = os.path.join(temp_dir, temp_filename)

    with open(temp_path, "wb") as f:
        content = await file.read()
        f.write(content)

    try:
        # Run the ML pipeline - segmentation + classification
        result = process_clothing_upload(temp_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline failed: {str(e)}")

    # Automatically detect the dominant color
    dominant_rgb = get_dominant_color(temp_path)
    detected_color = get_color_name(dominant_rgb)

    detected_season = detect_best_season(
        result["category"],
        result["subcategory"]
    )
    # Upload the segmented PNG to Supabase storage
    segmented_path = result["segmented_image_path"]
    storage_filename = os.path.basename(segmented_path)

    with open(segmented_path, "rb") as f:
        supabase.storage.from_("clothing-images").upload(
            storage_filename,
            f.read(),
            file_options={"content-type": "image/png"},
        )

    # Get the public URL for the uploaded image
    image_url = supabase.storage.from_("clothing-images").get_public_url(
        storage_filename
    )

    # Save the item metadata to the database
    insert_result = (
        supabase.table("items")
        .insert(
            {
                "category": result["category"],
                "subcategory": result["subcategory"],
                "confidence": result["confidence"],
                "image_url": image_url,
                "created_at": datetime.now().isoformat(),
            }
        )
        .execute()
    )

    created_item = insert_result.data[0]

    supabase.table("item_metadata").insert(
        {
            "item_id": created_item["id"],
            "color": detected_color,
            "season": detected_season,
        }
    ).execute()

    # Clean up temp files - don't let these pile up on disk
    os.remove(temp_path)

    # Invalidate cache so next /catalogue call fetches fresh data
    _catalogue_cache = None

    return {
        "item": insert_result.data[0] if insert_result.data else None,
        "all_predictions": result["all_predictions"],
        "color": detected_color,
        "season": detected_season,
        "date_added": datetime.now().isoformat(),
    }

def detect_best_season(category, subcategory):
    """
    Automatically determines the best time to wear an item
    based on the detected clothing type.
    """

    clothing_type = f"{category} {subcategory}".lower()

    # Mostly warm-weather clothing
    if any(word in clothing_type for word in [
        "shorts",
        "tank",
        "crop top",
        "swim",
        "swimsuit",
        "bikini",
        "sandal",
        "short sleeve",
        "t-shirt",
        "tee"
    ]):
        return ["spring", "summer"]

    # Mostly cold-weather clothing
    if any(word in clothing_type for word in [
        "coat",
        "jacket",
        "sweater",
        "hoodie",
        "cardigan",
        "trench",
        "puffer",
        "boots"
    ]):
        return ["fall", "winter"]

    # Items that work particularly well in transitional weather
    if any(word in clothing_type for word in [
        "jeans",
        "blazer",
        "long sleeve",
        "trousers",
        "pants",
        "sweatshirt"
    ]):
        return ["spring", "fall"]

    # Everything else
    return ["all seasons"]

@app.get("/catalogue")
def get_catalogue():
    """
    Returns every item saved in the catalogue so far (cached for instant load).
    """
    global _catalogue_cache
    if _catalogue_cache is None:
        result = supabase.table("items").select("*").execute()
        _catalogue_cache = {"items": result.data}
    return _catalogue_cache

@app.delete("/catalogue/{item_id}")
def delete_item(item_id: str):
    """
    Deletes an item from the catalogue by id, and invalidates the
    catalogue cache so the next /catalogue call reflects the removal.
    """
    global _catalogue_cache
    supabase.table("items").delete().eq("id", item_id).execute()
    _catalogue_cache = None
    return {"status": "deleted", "id": item_id}


@app.post("/outfit-suggest")
def outfit_suggest():
    """
    Returns valid outfit combinations from the catalogue,
    filtered by category completeness, formality compatibility,
    and color compatibility.
    """
    from app.outfit_matching import get_valid_outfits

    result = supabase.table("items").select("*").execute()
    items = result.data

    outfits = get_valid_outfits(items)

    return {"outfits": outfits}
