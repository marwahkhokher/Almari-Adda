import os
import uuid
import requests
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from supabase import create_client, Client
import modal

from app.ml.pipeline import process_clothing_upload

from app.chatbot.router import router as chatbot_router

load_dotenv()

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chatbot_router)

_catalogue_cache = None


@app.get("/")
def root():
    return {"status": "Almari-Adda API is running"}


@app.post("/upload")
async def upload_clothing_item(file: UploadFile = File(...)):
    global _catalogue_cache
    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    temp_filename = f"{uuid.uuid4()}_{file.filename}"
    temp_path = os.path.join(temp_dir, temp_filename)

    with open(temp_path, "wb") as f:
        content = await file.read()
        f.write(content)

    try:
        result = process_clothing_upload(temp_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline failed: {str(e)}")

    segmented_path = result["segmented_image_path"]
    storage_filename = os.path.basename(segmented_path)

    with open(segmented_path, "rb") as f:
        supabase.storage.from_("clothing-images").upload(
            storage_filename,
            f.read(),
            file_options={"content-type": "image/png"},
        )

    image_url = supabase.storage.from_("clothing-images").get_public_url(
        storage_filename
    )

    insert_result = (
        supabase.table("items")
        .insert(
            {
                "category": result["category"],
                "subcategory": result["subcategory"],
                "confidence": result["confidence"],
                "image_url": image_url,
            }
        )
        .execute()
    )

    os.remove(temp_path)

    _catalogue_cache = None

    return {
        "item": insert_result.data[0] if insert_result.data else None,
        "all_predictions": result["all_predictions"],
    }


@app.get("/catalogue")
def get_catalogue():
    global _catalogue_cache
    if _catalogue_cache is None:
        result = supabase.table("items").select("*").execute()
        _catalogue_cache = {"items": result.data}
    return _catalogue_cache


@app.post("/outfit-suggest")
def outfit_suggest():
    from app.outfit_matching import get_valid_outfits

    result = supabase.table("items").select("*").execute()
    items = result.data

    outfits = get_valid_outfits(items)

    return {"outfits": outfits}


def _download_image_bytes(url: str) -> bytes:
    response = requests.get(url)
    response.raise_for_status()
    return response.content


@app.post("/visualize")
async def visualize_outfit(
    item_ids: str,
    model: str = "female",
    person_photo: UploadFile = File(None),
):
    """
    Renders a try-on visualization. Accepts a comma-separated list of
    item IDs, auto-detects each item's category (top/bottom/dress),
    and runs the appropriate Modal pipeline. If person_photo is
    provided, uses that instead of the stock male/female model.
    """
    ids = [i.strip() for i in item_ids.split(",") if i.strip()]
    if not ids:
        raise HTTPException(status_code=400, detail="No item_ids provided")

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