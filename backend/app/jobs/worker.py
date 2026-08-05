"""
Background Worker Service for Almari-Adda.
Continuously polls the Supabase job queue, processes pending ML & visualization tasks asynchronously,
and updates completion status & results persistently in database.
"""
import os
import uuid
import time
import logging
import asyncio
import requests
from PIL import Image
import io
from datetime import datetime

from app.main import supabase, catvton_function, dress_function, detect_best_season, _download_image_bytes, _generate_local_overlay
from app.ml.pipeline import process_clothing_upload
from app.color_utils import get_dominant_color, get_color_name
from app.jobs.db import get_pending_jobs, update_job_status

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] (Worker) %(message)s")
logger = logging.getLogger("worker")


def process_upload_job(payload: dict) -> dict:
    """Executes background segmentation, CLIP classification, and database storage for an uploaded photo."""
    local_path = payload["temp_path"]
    filename = payload["filename"]

    try:
        result = process_clothing_upload(local_path)
    except Exception as e:
        raise RuntimeError(f"Segmentation pipeline failed: {str(e)}")

    dominant_rgb = get_dominant_color(result["segmented_image_path"])
    detected_color = get_color_name(dominant_rgb)
    detected_season = detect_best_season(result["category"], result["subcategory"])

    segmented_path = result["segmented_image_path"]
    storage_filename = os.path.basename(segmented_path)

    with open(segmented_path, "rb") as f:
        supabase.storage.from_("clothing-images").upload(
            storage_filename,
            f.read(),
            file_options={"content-type": "image/png"},
        )

    image_url = supabase.storage.from_("clothing-images").get_public_url(storage_filename)

    insert_result = (
        supabase.table("items")
        .insert({
            "category": result["category"],
            "subcategory": result["subcategory"],
            "confidence": result["confidence"],
            "image_url": image_url,
            "created_at": datetime.now().isoformat(),
        })
        .execute()
    )

    created_item = insert_result.data[0]

    supabase.table("item_metadata").insert({
        "item_id": created_item["id"],
        "color": detected_color,
        "season": detected_season,
    }).execute()

    if os.path.exists(local_path):
        try:
            os.remove(local_path)
        except Exception:
            pass

    return {
        "item": created_item,
        "all_predictions": result["all_predictions"],
        "color": detected_color,
        "season": detected_season,
        "date_added": datetime.now().isoformat(),
    }


async def process_visualization_job(payload: dict) -> dict:
    """Executes CatVTON GPU try-on or local overlay rendering for selected outfit items."""
    item_ids = payload["item_ids"]
    model = payload.get("model", "female")
    person_photo_path = payload.get("person_photo_path")

    top_bytes = None
    bottom_bytes = None
    dress_bytes = None

    for item_id in item_ids:
        result = supabase.table("items").select("*").eq("id", item_id).execute()
        if not result.data:
            continue
        item = result.data[0]
        category = item["category"]
        image_bytes = _download_image_bytes(item["image_url"])

        if category == "top":
            top_bytes = image_bytes
        elif category == "bottom":
            bottom_bytes = image_bytes
        elif category in ("dress", "eastern wear"):
            dress_bytes = image_bytes

    if person_photo_path and os.path.exists(person_photo_path):
        with open(person_photo_path, "rb") as f:
            person_bytes = f.read()
    else:
        photo_file = f"app/ml/visualization/assets/person_base_{model}.jpg"
        with open(photo_file, "rb") as f:
            person_bytes = f.read()

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

    if person_photo_path and os.path.exists(person_photo_path):
        try:
            os.remove(person_photo_path)
        except Exception:
            pass

    return {"visualization_url": result_url}


async def run_worker_loop(poll_interval: float = 2.0):
    """Main background worker polling loop."""
    logger.info("Starting Almari-Adda Background Job Worker...")
    while True:
        try:
            jobs = get_pending_jobs(limit=3)
            for job in jobs:
                job_id = job["id"]
                job_type = job["job_type"]
                payload = job.get("payload") or {}

                logger.info("Processing job %s (Type: %s)...", job_id, job_type)
                update_job_status(job_id, status="processing")

                try:
                    if job_type == "clothing_upload":
                        res = process_upload_job(payload)
                    elif job_type == "outfit_visualization":
                        res = await process_visualization_job(payload)
                    else:
                        raise ValueError(f"Unknown job_type: {job_type}")

                    update_job_status(job_id, status="completed", result=res)
                    logger.info("Successfully completed job %s!", job_id)
                except Exception as e:
                    logger.error("Job %s failed: %s", job_id, e)
                    update_job_status(job_id, status="failed", error=str(e))

        except Exception as err:
            logger.error("Error in worker polling loop: %s", err)

        await asyncio.sleep(poll_interval)


if __name__ == "__main__":
    asyncio.run(run_worker_loop())
