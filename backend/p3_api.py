"""
P3 - FastAPI endpoint for outfit visualization.
Run with: uvicorn p3_api:app --reload --port 8001
(use a different port than the main backend's 8000 if running both locally)
"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from io import BytesIO
from p3_visualizer import generate_outfit_composite

app = FastAPI(title="P3 Visualizer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class OutfitItem(BaseModel):
    category: str  # "top" | "bottom" | "dress" | "eastern wear"
    image_url: str


class VisualizeRequest(BaseModel):
    items: list[OutfitItem]


@app.get("/")
def root():
    return {"status": "P3 Visualizer API is running"}


@app.post("/visualize")
def visualize_outfit(request: VisualizeRequest):
    """
    Takes a list of outfit items (category + image_url, matching P2's
    outfit-suggest output) and returns a composite PNG showing the
    outfit on the mannequin.
    """
    if not request.items:
        raise HTTPException(status_code=400, detail="No items provided")

    try:
        outfit_items = [item.dict() for item in request.items]
        composite = generate_outfit_composite(outfit_items)

        buffer = BytesIO()
        composite.save(buffer, format="PNG")
        buffer.seek(0)

        return StreamingResponse(buffer, media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Visualization failed: {str(e)}")
