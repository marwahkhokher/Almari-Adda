import os
from app.ml.segmentation.segment import segment_clothing_item
from app.ml.classification.classify import ClothingClassifier

# Loaded once at import time, not per-request - this is the expensive
# part (loading CLIP's weights), so it should happen once when the
# backend server starts up, not on every single upload
_classifier = ClothingClassifier()


def process_clothing_upload(image_path: str, output_dir: str = "processed"):
    """
    Full pipeline: takes a raw uploaded photo, segments out the
    clothing item, classifies it, and returns everything the
    backend needs to save to the catalogue.

    Returns a dict with:
      - segmented_image_path: where the background-removed PNG was saved
      - category: broad category (top/bottom/dress/eastern wear)
      - subcategory: specific type (t-shirt/jeans/kurta/etc.)
      - confidence: how sure the model is
      - all_predictions: top-3 guesses, in case frontend wants to
        offer alternatives when confidence is low
    """
    os.makedirs(output_dir, exist_ok=True)

    filename = os.path.splitext(os.path.basename(image_path))[0]
    segmented_path = os.path.join(output_dir, f"{filename}_segmented.png")

    # Step 1: segment
    segment_clothing_item(image_path, segmented_path)

    # Step 2: classify the segmented (background-removed) version,
    # not the raw photo - cleaner signal for CLIP
    classification_result = _classifier.classify(segmented_path)

    return {
        "segmented_image_path": segmented_path,
        "category": classification_result["top_prediction"]["category"],
        "subcategory": classification_result["top_prediction"]["subcategory"],
        "confidence": classification_result["top_prediction"]["confidence"],
        "all_predictions": classification_result["all_predictions"],
    }


if __name__ == "__main__":
    result = process_clothing_upload("test_images/sample_shirtt.jpg")
    print("Pipeline result:")
    for key, value in result.items():
        print(f"  {key}: {value}")