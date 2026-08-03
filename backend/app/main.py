import os
import uuid
import io
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

# Looks up the already-deployed Modal function by name, rather than
# redefining it here - "modal deploy" must have been run at least
# once for this to find it.
catvton_function = modal.Function.from_name("almari-adda-catvton", "run_full_outfit")

app = FastAPI(title="Almari-Adda API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chatbot_router)


@app.get("/")
def root():
    return {"status": "Almari-Adda API is running"}


@app.post("/upload")
async def upload_clothing_item(file: UploadFile = File(...)):
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

    return {
        "item": insert_result.data[0] if insert_result.data else None,
        "all_predictions": result["all_predictions"],
    }


@app.get("/catalogue")
def get_catalogue():
    result = supabase.table("items").select("*").execute()
    return {"items": result.data}


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
def visualize_outfit(top_item_id: str = None, bottom_item_id: str = None, model: str = "female"):
    """
    Renders a try-on visualization of a chosen top and/or bottom on
    either the male or female base model, using the CatVTON pipeline
    deployed on Modal. Returns a URL to the generated composite image.
    """
    if model not in ("male", "female"):
        raise HTTPException(status_code=400, detail="model must be 'male' or 'female'")

    if not top_item_id and not bottom_item_id:
        raise HTTPException(status_code=400, detail="Provide at least one of top_item_id or bottom_item_id")

    top_bytes = None
    bottom_bytes = None

    if top_item_id:
        top_result = supabase.table("items").select("*").eq("id", top_item_id).execute()
        if not top_result.data:
            raise HTTPException(status_code=404, detail=f"Top item {top_item_id} not found")
        top_bytes = _download_image_bytes(top_result.data[0]["image_url"])

    if bottom_item_id:
        bottom_result = supabase.table("items").select("*").eq("id", bottom_item_id).execute()
        if not bottom_result.data:
            raise HTTPException(status_code=404, detail=f"Bottom item {bottom_item_id} not found")
        bottom_bytes = _download_image_bytes(bottom_result.data[0]["image_url"])

    person_photo_path = f"app/ml/visualization/assets/person_base_{model}.jpg"
    with open(person_photo_path, "rb") as f:
        person_bytes = f.read()

    try:
        result_bytes = catvton_function.remote(
            person_bytes,
            top_image_bytes=top_bytes,
            bottom_image_bytes=bottom_bytes,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Visualization failed: {str(e)}")

    # Upload the result to Supabase storage so the frontend gets a
    # stable URL back, same pattern as the /upload endpoint
    result_filename = f"visualization_{uuid.uuid4()}.png"
    supabase.storage.from_("clothing-images").upload(
        result_filename,
        result_bytes,
        file_options={"content-type": "image/png"},
    )
    result_url = supabase.storage.from_("clothing-images").get_public_url(result_filename)

    return {"visualization_url": result_url}