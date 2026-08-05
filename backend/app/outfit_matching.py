from app.color_utils import get_dominant_color, is_color_compatible
from app.formality_utils import get_formality, is_formality_compatible

SINGLE_PIECE_KEYWORDS = {
    "dress",
    "gown",
    "abaya",
    "saree",
    "sari",
    "jumpsuit",
    "lehenga",
    "romper",
    "frock",
    "kurta",
    "shalwar kameez",
    "sherwani",
}


def get_valid_outfits(items):
    """
    Given a list of catalogue items, return valid outfit combinations.
    Handles two cases:
    1. Top + bottom pairs, filtered by formality and color compatibility.
    2. Single-piece items (dresses, gowns, sarees, etc.) that are complete outfits on their own.
    """
    if not items:
        return []

    valid_outfits = []

    # Case 1: top + bottom pairs
    tops = [item for item in items if item.get("category") == "top"]
    bottoms = [item for item in items if item.get("category") == "bottom"]

    for top in tops:
        for bottom in bottoms:
            top_sub = top.get("subcategory", "") or top.get("category", "")
            bottom_sub = bottom.get("subcategory", "") or bottom.get("category", "")

            top_formality = get_formality(top_sub)
            bottom_formality = get_formality(bottom_sub)

            if not is_formality_compatible(top_formality, bottom_formality):
                continue

            try:
                top_color = get_dominant_color(top.get("image_url", ""))
                bottom_color = get_dominant_color(bottom.get("image_url", ""))
                if top_color and bottom_color and not is_color_compatible(top_color, bottom_color):
                    continue
            except Exception:
                pass  # Keep valid top + bottom pair if color extraction fails

            valid_outfits.append({
                "type": "top_bottom",
                "top": top,
                "bottom": bottom,
                "formality": top_formality if top_formality == bottom_formality else "semi-formal",
            })

    # Case 2: single-piece outfits (dresses, gowns, abayas, sarees, etc.)
    for item in items:
        cat = (item.get("category") or "").lower()
        sub = (item.get("subcategory") or "").lower()
        if cat in ("dress", "eastern wear", "eastern") or any(kw in sub for kw in SINGLE_PIECE_KEYWORDS) or "dress" in sub:
            formality = get_formality(sub)
            valid_outfits.append({
                "type": "single_piece",
                "item": item,
                "formality": formality,
            })

    return valid_outfits
