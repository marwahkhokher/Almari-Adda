"""
P3 - Virtual Mannequin Visualizer
Crops each item to its visible content, then places it on the mannequin.
The shirt gets warped into a trapezoid (wider at shoulders, narrower at
waist) so it follows the torso shape instead of looking flat.
"""

from PIL import Image
import requests
import numpy as np
from io import BytesIO

MANNEQUIN_PATH = "assets/mannequin_base.png"

SLOTS = {
    "top":          {"box": (110, 170, 410, 550)},
    "bottom":       {"box": (130, 550, 390, 1000)},
    "dress":        {"box": (110, 170, 410, 1000)},
    "eastern wear": {"box": (110, 170, 410, 1000)},
}

# How much narrower the waist is than the shoulders, in pixels on each side
WAIST_TAPER = 45

FULL_BODY_CATEGORIES = {"dress", "eastern wear"}
ANCHOR_BY_CATEGORY = {"bottom": "top", "dress": "top", "eastern wear": "top"}


def load_image_from_url(url: str) -> Image.Image:
    response = requests.get(url, timeout=10)
    response.raise_for_status()
    return Image.open(BytesIO(response.content)).convert("RGBA")


def crop_to_content(img: Image.Image) -> Image.Image:
    """Crops away transparent padding, keeping only the visible garment."""
    bbox = img.getbbox()
    return img.crop(bbox) if bbox else img


def fit_image_to_box(img: Image.Image, box: tuple) -> Image.Image:
    box_w = box[2] - box[0]
    box_h = box[3] - box[1]
    img_ratio = img.width / img.height
    box_ratio = box_w / box_h
    if img_ratio > box_ratio:
        new_w, new_h = box_w, int(box_w / img_ratio)
    else:
        new_h, new_w = box_h, int(box_h * img_ratio)
    return img.resize((new_w, new_h), Image.LANCZOS)


def paste_anchored(base: Image.Image, item_img: Image.Image, box: tuple, anchor: str = "top"):
    box_w = box[2] - box[0]
    offset_x = box[0] + (box_w - item_img.width) // 2
    offset_y = box[1] if anchor == "top" else box[3] - item_img.height
    base.paste(item_img, (offset_x, offset_y), item_img)


def find_coeffs(source_coords, target_coords):
    matrix = []
    for s, t in zip(source_coords, target_coords):
        matrix.append([t[0], t[1], 1, 0, 0, 0, -s[0]*t[0], -s[0]*t[1]])
        matrix.append([0, 0, 0, t[0], t[1], 1, -s[1]*t[0], -s[1]*t[1]])
    A = np.array(matrix, dtype=float)
    B = np.array(source_coords).reshape(8)
    return np.linalg.solve(A, B)


def warp_top_to_trapezoid(item_img: Image.Image, box: tuple) -> tuple:
    """Fits the shirt into its box, then warps it into a trapezoid shape
    (full width at shoulders, narrower at waist). Returns (warped_image, x, y)."""
    fitted = fit_image_to_box(item_img, box)
    w, h = fitted.size

    target_coords = [
        (0, 0), (w, 0),                              # shoulders: full width
        (w - WAIST_TAPER, h), (WAIST_TAPER, h),      # waist: narrower
    ]
    source_coords = [(0, 0), (w, 0), (w, h), (0, h)]
    coeffs = find_coeffs(source_coords, target_coords)
    warped = fitted.transform((w, h), Image.PERSPECTIVE, coeffs, Image.BICUBIC, fillcolor=(0, 0, 0, 0))

    box_w = box[2] - box[0]
    paste_x = box[0] + (box_w - w) // 2
    paste_y = box[1]
    return warped, paste_x, paste_y


def generate_outfit_composite(outfit_items: list) -> Image.Image:
    base = Image.open(MANNEQUIN_PATH).convert("RGBA")
    categories_present = {item["category"] for item in outfit_items}
    has_full_body = bool(categories_present & FULL_BODY_CATEGORIES)

    for item in outfit_items:
        category = item["category"]
        if has_full_body and category in ("top", "bottom"):
            continue
        if category not in SLOTS:
            print(f"Warning: unknown category '{category}', skipping")
            continue

        box = SLOTS[category]["box"]
        item_img = load_image_from_url(item["image_url"])
        item_img = crop_to_content(item_img)

        if category == "top":
            warped, x, y = warp_top_to_trapezoid(item_img, box)
            base.paste(warped, (x, y), warped)
        else:
            fitted = fit_image_to_box(item_img, box)
            anchor = ANCHOR_BY_CATEGORY.get(category, "top")
            paste_anchored(base, fitted, box, anchor)

    return base


if __name__ == "__main__":
    test_outfit = [
        {"category": "top", "image_url": "https://uvwksbijmqqdwfmjnapf.supabase.co/storage/v1/object/public/clothing-images/1f42b5e5-b404-473d-bd09-b2abce4d26a3_sample_shirtt_segmented.png"},
        {"category": "bottom", "image_url": "https://uvwksbijmqqdwfmjnapf.supabase.co/storage/v1/object/public/clothing-images/87e93fd3-498a-4688-8357-33c381f39d86_sample_pant_segmented.png"},
    ]
    result = generate_outfit_composite(test_outfit)
    result.save("test_composite.png")
    print("Saved test_composite.png — open it to check placement")
