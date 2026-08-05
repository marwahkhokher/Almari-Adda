import os
import uuid
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path
from supabase import create_client, Client
from datetime import datetime

from app.ml.pipeline import process_clothing_upload
from app.color_utils import get_dominant_color, get_color_name
from datetime import date

from app.chatbot.router import router as chatbot_router
from app.item_metadata import router as item_metadata_router

import requests
import modal

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / '.env', override=True)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set in .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Looks up the already-deployed Modal functions by name - "modal deploy"
# must have been run at least once against modal_catvton.py for this
# to find them.
catvton_function = modal.Function.from_name("almari-adda-catvton", "run_full_outfit")
dress_function = modal.Function.from_name("almari-adda-catvton", "run_dress_tryon")

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


from app.jobs.db import create_job, get_job

@app.get("/jobs/{job_id}")
def get_job_status(job_id: str):
    """
    Returns current status and results of a queued background job.
    Status can be: 'pending', 'processing', 'completed', 'failed'.
    """
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@app.post("/upload")
async def upload_clothing_item(file: UploadFile = File(...), sync: bool = False):
    """
    Accepts a photo upload. Enqueues a background job for ML segmentation
    and classification, returning a job_id for state recovery.
    """
    global _catalogue_cache
    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    temp_filename = f"{uuid.uuid4()}_{file.filename}"
    temp_path = os.path.join(temp_dir, temp_filename)

    with open(temp_path, "wb") as f:
        content = await file.read()
        f.write(content)

    if not sync:
        job = create_job(
            job_type="clothing_upload",
            payload={"temp_path": temp_path, "filename": file.filename},
        )
        if not job:
            raise HTTPException(status_code=500, detail="Failed to enqueue upload job")
        return {"job_id": job["id"], "status": "pending"}

    try:
        # Run the ML pipeline - segmentation + classification
        result = process_clothing_upload(temp_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline failed: {str(e)}")

    # Automatically detect the dominant color
    # Detect colour from the segmented clothing image,
    # not the original uploaded photo.
    dominant_rgb = get_dominant_color(
        result["segmented_image_path"]
    )

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
                "embedding": result["embedding"],
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

def _download_image_bytes(url: str) -> bytes:
    response = requests.get(url)
    response.raise_for_status()
    return response.content


def _generate_local_overlay(person_bytes: bytes, top_bytes: bytes = None, bottom_bytes: bytes = None, dress_bytes: bytes = None) -> bytes:
    import io
    from PIL import Image

    person_img = Image.open(io.BytesIO(person_bytes)).convert("RGBA")
    w, h = person_img.size

    if dress_bytes:
        dress_img = Image.open(io.BytesIO(dress_bytes)).convert("RGBA")
        dress_img = dress_img.resize((int(w * 0.75), int(h * 0.7)), Image.LANCZOS)
        offset_x = (w - dress_img.width) // 2
        offset_y = int(h * 0.18)
        person_img.alpha_composite(dress_img, (offset_x, offset_y))
    else:
        if top_bytes:
            top_img = Image.open(io.BytesIO(top_bytes)).convert("RGBA")
            top_img = top_img.resize((int(w * 0.65), int(h * 0.4)), Image.LANCZOS)
            offset_x = (w - top_img.width) // 2
            offset_y = int(h * 0.18)
            person_img.alpha_composite(top_img, (offset_x, offset_y))
        if bottom_bytes:
            bottom_img = Image.open(io.BytesIO(bottom_bytes)).convert("RGBA")
            bottom_img = bottom_img.resize((int(w * 0.6), int(h * 0.45)), Image.LANCZOS)
            offset_x = (w - bottom_img.width) // 2
            offset_y = int(h * 0.45)
            person_img.alpha_composite(bottom_img, (offset_x, offset_y))

    out_buf = io.BytesIO()
    person_img.convert("RGB").save(out_buf, format="PNG")
    return out_buf.getvalue()


@app.post("/visualize")
async def visualize_outfit(
    item_ids: str,
    model: str = "female",
    person_photo: UploadFile = File(None),
    sync: bool = False,
):
    """
    Enqueues a background try-on job for Modal GPU or local overlay,
    returning a job_id for state recovery.
    """
    ids = [i.strip() for i in item_ids.split(",") if i.strip()]
    if not ids:
        raise HTTPException(status_code=400, detail="No item_ids provided")

    person_photo_path = None
    if person_photo:
        temp_dir = "temp_uploads"
        os.makedirs(temp_dir, exist_ok=True)
        person_photo_path = os.path.join(temp_dir, f"person_{uuid.uuid4()}_{person_photo.filename}")
        with open(person_photo_path, "wb") as f:
            content = await person_photo.read()
            f.write(content)

    if not sync:
        job = create_job(
            job_type="outfit_visualization",
            payload={
                "item_ids": ids,
                "model": model,
                "person_photo_path": person_photo_path,
            },
        )
        if not job:
            raise HTTPException(status_code=500, detail="Failed to enqueue try-on job")
        return {"job_id": job["id"], "status": "pending"}

    top_bytes = None
    bottom_bytes = None
    dress_bytes = None

    for item_id in ids:
        result = supabase.table("items").select("*").eq("id", item_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail=f"Item {item_id} not found")
        item = result.data[0]
        category = item["category"]
        image_bytes = _download_image_bytes(item["image_url"])

        if category == "top":
            top_bytes = image_bytes
        elif category == "bottom":
            bottom_bytes = image_bytes
        elif category in ("dress", "eastern wear"):
            dress_bytes = image_bytes

    if person_photo:
        person_bytes = await person_photo.read()
    else:
        if model not in ("male", "female"):
            raise HTTPException(status_code=400, detail="model must be 'male' or 'female'")
        person_photo_path = f"app/ml/visualization/assets/person_base_{model}.jpg"
        with open(person_photo_path, "rb") as f:
            person_bytes = f.read()

    try:
        if dress_bytes:
            result_bytes = dress_function.remote(person_bytes, dress_bytes)
        else:
            result_bytes = catvton_function.remote(
                person_bytes,
                top_image_bytes=top_bytes,
                bottom_image_bytes=bottom_bytes,
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Visualization failed: {str(e)}")

    result_filename = f"visualization_{uuid.uuid4()}.png"
    supabase.storage.from_("clothing-images").upload(
        result_filename,
        result_bytes,
        file_options={"content-type": "image/png"},
    )
    result_url = supabase.storage.from_("clothing-images").get_public_url(result_filename)

    return {"visualization_url": result_url}