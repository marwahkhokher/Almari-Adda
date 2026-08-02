from app.color_utils import get_dominant_color, is_color_compatible
from app.formality_utils import get_formality, is_formality_compatible

SINGLE_PIECE_SUBCATEGORIES = {
    "dress",
    "cocktail dress",
    "evening dress",
    "gown",
    "abaya",
    "saree",
    "sari",
    "jumpsuit",
    "lehenga",
}


def get_valid_outfits(items):
    """
    Given a list of catalogue items, return valid outfit combinations.
    Handles two cases:
    1. Top + bottom pairs, filtered by formality and color compatibility.
    2. Single-piece items (dress, abaya, saree, etc.) that are complete
       outfits on their own.
    Returns an empty list (never crashes) if there isn't enough data.
    """
    if not items:
        return []

    valid_outfits = []

    # Case 1: top + bottom pairs
    tops = [item for item in items if item.get("category") == "top"]
    bottoms = [item for item in items if item.get("category") == "bottom"]

    for top in tops:
        for bottom in bottoms:
            top_formality = get_formality(top.get("subcategory", ""))
            bottom_formality = get_formality(bottom.get("subcategory", ""))

            if not is_formality_compatible(top_formality, bottom_formality):
                continue

            try:
                top_color = get_dominant_color(top["image_url"])
                bottom_color = get_dominant_color(bottom["image_url"])
            except Exception:
                continue

            if not is_color_compatible(top_color, bottom_color):
                continue

            valid_outfits.append({
                "type": "top_bottom",
                "top": top,
                "bottom": bottom,
                "formality": top_formality if top_formality == bottom_formality else "mixed",
            })

    # Case 2: single-piece outfits (dress, abaya, saree, etc.)
    for item in items:
        subcategory = item.get("subcategory", "").lower()
        if subcategory in SINGLE_PIECE_SUBCATEGORIES:
            formality = get_formality(subcategory)
            valid_outfits.append({
                "type": "single_piece",
                "item": item,
                "formality": formality,
            })

    return valid_outfits
