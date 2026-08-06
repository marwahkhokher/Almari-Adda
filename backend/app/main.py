import os
import uuid
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path
from supabase import create_client, Client
from typing import Optional, List, Union
from app.ml.pipeline import process_clothing_upload
from app.color_utils import get_dominant_color, get_color_name
from datetime import date

from app.chatbot.router import router as chatbot_router
from app.item_metadata import router as item_metadata_router
from app.filters import router as filters_router

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
app.include_router(filters_router)


@app.on_event("startup")
async def _warmup_ml_models():
    """Pre-load CLIP classifier, U2-Net segmentation session, and warm up catalogue cache."""
    import logging
    log = logging.getLogger(__name__)
    log.info("Pre-warming ML models and catalogue cache...")
    try:
        from app.ml.segmentation.segment import _get_session
        _get_session()

        from app.chatbot.outfit_engine_client import fetch_outfit_suggestions
        await fetch_outfit_suggestions()
        log.info("All ML models, segmentation sessions, and catalogue cache ready.")
    except Exception as e:
        log.warning("Warmup warning: %s", e)

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
    Returns every item saved in the catalogue so far (cached for instant load),
    enriched with color/season from item_metadata so downstream consumers
    (like the chatbot) don't need to re-detect these via slow AI calls.
    """
    global _catalogue_cache
    if _catalogue_cache is None:
        items_result = supabase.table("items").select("*").execute()
        metadata_result = supabase.table("item_metadata").select("*").execute()
        metadata_by_id = {m["item_id"]: m for m in metadata_result.data}

        enriched_items = []
        for item in items_result.data:
            meta = metadata_by_id.get(item["id"], {})
            item["color"] = meta.get("color")
            item["season"] = meta.get("season")
            enriched_items.append(item)

        _catalogue_cache = {"items": enriched_items}
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


@app.patch("/catalogue/{item_id}")
@app.put("/catalogue/{item_id}")
def update_catalogue_item(item_id: str, updates: dict):
    """
    Updates an item's category/subcategory and metadata (color/season).
    Fixes 405 Method Not Allowed when UploadScreen saves edited details.
    """
    global _catalogue_cache
    item_fields = {}
    if "category" in updates:
        item_fields["category"] = updates["category"]
    if "subcategory" in updates:
        item_fields["subcategory"] = updates["subcategory"]
    if item_fields:
        supabase.table("items").update(item_fields).eq("id", item_id).execute()

    meta_fields = {}
    if "color" in updates:
        meta_fields["color"] = updates["color"]
    if "season" in updates:
        meta_fields["season"] = updates["season"]
    if meta_fields:
        supabase.table("item_metadata").update(meta_fields).eq("item_id", item_id).execute()

    _catalogue_cache = None
    return {"status": "updated", "id": item_id}


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

def _download_image_bytes(url: str, retries: int = 2, backoff_seconds: float = 0.5) -> bytes:
    """Downloads an image, retrying a couple times on transient connection
    drops (e.g. 'Connection aborted' / RemoteDisconnected) before giving up."""
    import time

    last_exc = None
    for attempt in range(retries + 1):
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            return response.content
        except requests.exceptions.RequestException as e:
            last_exc = e
            if attempt < retries:
                time.sleep(backoff_seconds)
                continue
            raise
    raise last_exc  # pragma: no cover

def _generate_local_overlay(person_bytes: bytes, top_bytes: bytes = None, bottom_bytes: bytes = None, dress_bytes: bytes = None) -> bytes:
    import io
    from PIL import Image, ImageFilter

    person_img = Image.open(io.BytesIO(person_bytes)).convert("RGBA")
    w, h = person_img.size

    def _prep_garment(img_bytes, max_w_frac, max_h_frac):
        """Load a garment image, strip a near-white background if it doesn't
        already have real transparency, and resize it to FIT within a max
        box while preserving its original aspect ratio (no stretching)."""
        img = Image.open(io.BytesIO(img_bytes)).convert("RGBA")

        # If there's no real transparency (fully opaque alpha channel), this
        # is probably a plain product photo on a white background rather
        # than a segmented cutout — knock out near-white pixels so it isn't
        # a flat rectangle when pasted.
        if img.getchannel("A").getextrema() == (255, 255):
            pixels = img.load()
            for y in range(img.height):
                for x in range(img.width):
                    r, g, b, a = pixels[x, y]
                    if r > 235 and g > 235 and b > 235:
                        pixels[x, y] = (r, g, b, 0)

        max_w = max(1, int(w * max_w_frac))
        max_h = max(1, int(h * max_h_frac))
        img.thumbnail((max_w, max_h), Image.LANCZOS)  # preserves aspect ratio, unlike .resize()
        return img

    def _soft_shadow(garment):
        """Cheap drop shadow so the garment reads as sitting on the body
        instead of looking like a flat sticker."""
        shadow = Image.new("RGBA", garment.size, (0, 0, 0, 0))
        shadow.putalpha(garment.getchannel("A").point(lambda a: min(a, 70)))
        return shadow.filter(ImageFilter.GaussianBlur(6))

    def _paste_centered(base, garment, center_x_frac, top_y_frac):
        x = int(w * center_x_frac) - garment.width // 2
        y = int(h * top_y_frac)
        shadow = _soft_shadow(garment)
        base.alpha_composite(shadow, (x + 4, y + 6))
        base.alpha_composite(garment, (x, y))

    if dress_bytes:
        dress_img = _prep_garment(dress_bytes, max_w_frac=0.55, max_h_frac=0.62)
        _paste_centered(person_img, dress_img, center_x_frac=0.5, top_y_frac=0.20)
    else:
        if top_bytes:
            top_img = _prep_garment(top_bytes, max_w_frac=0.5, max_h_frac=0.32)
            _paste_centered(person_img, top_img, center_x_frac=0.5, top_y_frac=0.20)
        if bottom_bytes:
            bottom_img = _prep_garment(bottom_bytes, max_w_frac=0.45, max_h_frac=0.38)
            _paste_centered(person_img, bottom_img, center_x_frac=0.5, top_y_frac=0.48)

    out_buf = io.BytesIO()
    person_img.convert("RGB").save(out_buf, format="PNG")
    return out_buf.getvalue()

def _ensure_valid_image_bytes(img_bytes: Optional[bytes]) -> Optional[bytes]:
    if not img_bytes:
        return None
    try:
        from PIL import Image
        import io
        img = Image.open(io.BytesIO(img_bytes))
        img.verify()
        img = Image.open(io.BytesIO(img_bytes)).convert("RGBA")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return buf.getvalue()
    except Exception as e:
        logger.warning("Failed to validate image bytes: %s", e)
        return img_bytes

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

    person_bytes = _ensure_valid_image_bytes(person_bytes)
    top_bytes = _ensure_valid_image_bytes(top_bytes)
    bottom_bytes = _ensure_valid_image_bytes(bottom_bytes)
    dress_bytes = _ensure_valid_image_bytes(dress_bytes)

    result_bytes = None

    if dress_function and catvton_function:
        try:
            if dress_bytes:
                result_bytes = await dress_function.remote.aio(person_bytes, dress_bytes)
            else:
                result_bytes = await catvton_function.remote.aio(
                    person_bytes,
                    top_image_bytes=top_bytes,
                    bottom_image_bytes=bottom_bytes,
                )
        except Exception as e:
            logger.warning("Modal remote execution failed, falling back to local overlay: %s", e)
            result_bytes = None

    if not result_bytes:
        result_bytes = _generate_local_overlay(person_bytes, top_bytes, bottom_bytes, dress_bytes)

    result_filename = f"visualization_{uuid.uuid4()}.png"
    supabase.storage.from_("clothing-images").upload(
        result_filename,
        result_bytes,
        file_options={"content-type": "image/png"},
    )
    result_url = supabase.storage.from_("clothing-images").get_public_url(result_filename)

    return {"visualization_url": result_url}

import random

@app.post("/build-outfit")
def build_outfit(preferences: dict):
    """
    Generates a full outfit, preferring one that best matches the
    given colors/seasons/formality preferences. Color is weighted
    highest, so a color match always wins over a season or formality
    match. If no outfit satisfies every selected preference, returns
    the closest match along with a message explaining what didn't
    match.

    Accepts an optional "exclude" list of outfit keys (as returned in
    a previous response's "outfit_key" field) so the caller can ask
    for a different outfit than ones already shown - this powers the
    "regenerate" button on the frontend.
    """
    from app.outfit_matching import get_valid_outfits
    from app.formality_utils import get_formality

    colors = preferences.get("colors", [])
    seasons = preferences.get("seasons", [])
    formality = preferences.get("formality", [])
    exclude = set(preferences.get("exclude", []))

    items_result = supabase.table("items").select("*").execute()
    metadata_result = supabase.table("item_metadata").select("*").execute()
    metadata_by_item = {m["item_id"]: m for m in metadata_result.data}

    all_items = items_result.data
    outfits = get_valid_outfits(all_items)

    if not outfits:
        raise HTTPException(
            status_code=404,
            detail="Not enough items in your closet to form any outfit yet.",
        )

    def outfit_pieces(outfit):
        if outfit.get("type") == "top_bottom":
            return [outfit["top"], outfit["bottom"]]
        return [outfit["item"]]

    def outfit_key(outfit):
        if outfit.get("type") == "top_bottom":
            return f"top:{outfit['top']['id']}|bottom:{outfit['bottom']['id']}"
        return f"single:{outfit['item']['id']}"

    def outfit_criteria_match(outfit):
        pieces = outfit_pieces(outfit)

        matched_color = bool(colors) and any(
            metadata_by_item.get(p["id"], {}).get("color") in colors
            for p in pieces
        )

        if "all seasons" in seasons:
            matched_season = True
        elif seasons:
            matched_season = any(
                s in metadata_by_item.get(p["id"], {}).get("season", [])
                for p in pieces for s in seasons
            )
        else:
            matched_season = False

        matched_formality = bool(formality) and any(
            get_formality(p.get("subcategory", "")) in formality
            for p in pieces
        )

        return matched_color, matched_season, matched_formality

    def outfit_score(outfit):
        matched_color, matched_season, matched_formality = outfit_criteria_match(outfit)
        return matched_color * 100 + matched_season * 10 + matched_formality * 1

    scored = [(o, outfit_score(o)) for o in outfits]

    if colors or seasons or formality:
        best_score = max(s for _, s in scored)
        top_tier = [o for o, s in scored if s == best_score]
    else:
        best_score = None
        top_tier = [o for o, _ in scored]

    # Prefer outfits not already shown; if we've exhausted the top
    # tier, allow repeats rather than falling back to a worse outfit -
    # a repeat is a better user experience than a worse match.
    fresh = [o for o in top_tier if outfit_key(o) not in exclude]
    pool = fresh if fresh else top_tier

    best = random.choice(pool)
    matched_color, matched_season, matched_formality = outfit_criteria_match(best)

    missed = []
    if colors and not matched_color:
        missed.append("color")
    if seasons and not matched_season:
        missed.append("season")
    if formality and not matched_formality:
        missed.append("style")

    message = None
    if missed:
        missed_str = missed[0] if len(missed) == 1 else ", ".join(missed[:-1]) + " or " + missed[-1]
        message = f"No outfit matched your {missed_str} preference — showing the closest match instead."

    return {
        "outfit": best,
        "outfit_key": outfit_key(best),
        "matched_item_count": len(all_items),
        "match_quality": outfit_score(best),
        "matched_criteria": {
            "color": matched_color,
            "season": matched_season,
            "formality": matched_formality,
        },
        "requested_preferences": {"colors": colors, "seasons": seasons, "formality": formality},
        "message": message,
        "has_alternatives": len(top_tier) > 1,
    }
