import os
import uuid
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from supabase import create_client, Client

from app.ml.pipeline import process_clothing_upload

load_dotenv()

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
            }
        )
        .execute()
    )

    # Clean up temp files - don't let these pile up on disk
    os.remove(temp_path)

    return {
        "item": insert_result.data[0] if insert_result.data else None,
        "all_predictions": result["all_predictions"],
    }


@app.get("/catalogue")
def get_catalogue():
    """
    Returns every item saved in the catalogue so far.
    """
    result = supabase.table("items").select("*").execute()
    return {"items": result.data}