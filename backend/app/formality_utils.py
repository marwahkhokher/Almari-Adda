FORMALITY_MAP = {
    # Casual
    "t-shirt": "casual",
    "tee": "casual",
    "jeans": "casual",
    "hoodie": "casual",
    "sweatshirt": "casual",
    "shorts": "casual",
    "tank top": "casual",
    "sneakers": "casual",
    "sweatpants": "casual",
    "joggers": "casual",
    "denim jacket": "casual",
    "flannel": "casual",
    "cargo pants": "casual",
    "graphic tee": "casual",
    "sandals": "casual",
    "flip flops": "casual",
    "crop top": "casual",
    "casual dress": "casual",
    "pants": "casual",
    "top": "casual",
    "jacket": "casual",

    # Semi-formal
    "blazer": "semi-formal",
    "chinos": "semi-formal",
    "polo": "semi-formal",
    "polo shirt": "semi-formal",
    "cardigan": "semi-formal",
    "sweater": "semi-formal",
    "button-up shirt": "semi-formal",
    "button-down shirt": "semi-formal",
    "skirt": "semi-formal",
    "midi skirt": "semi-formal",
    "maxi skirt": "semi-formal",
    "satin skirt": "semi-formal",
    "loafers": "semi-formal",
    "turtleneck": "semi-formal",
    "vest": "semi-formal",
    "culottes": "semi-formal",
    "jumpsuit": "semi-formal",
    "dress": "semi-formal",
    "shirt": "semi-formal",
    "blouse": "semi-formal",
    "trousers": "semi-formal",
    "dress": "semi-formal",   # generic fallback if no more specific dress type or explicit formality word is present

    # Formal
    "formal dress": "formal",
    "kurta": "formal",
    "abaya": "formal",
    "saree": "formal",
    "sari": "formal",
    "dress shirt": "formal",
    "dress pants": "formal",
    "gown": "formal",
    "suit": "formal",
    "suit jacket": "formal",
    "tuxedo": "formal",
    "cocktail dress": "formal",
    "evening dress": "formal",
    "sherwani": "formal",
    "lehenga": "formal",
    "waistcoat": "formal",
    "pencil skirt": "formal",
    "heels": "formal",
    "trench coat": "formal",
    "overcoat": "formal",
    "shalwar kameez": "formal",
}

    if not subcategory or not isinstance(subcategory, str):
        return "casual"

    subcategory = subcategory.lower().strip()

    # Exact match first (fastest, most reliable)
    if subcategory in FORMALITY_MAP:
        return FORMALITY_MAP[subcategory]

    # Explicit formality words in the subcategory itself take priority
    if "semi-formal" in subcategory or "semi formal" in subcategory:
        return "semi-formal"
    if "formal" in subcategory:
        return "formal"
    if "casual" in subcategory:
        return "casual"

    # Fall back to substring matching against known garment keywords
    for key in sorted(FORMALITY_MAP, key=len, reverse=True):
        if key in subcategory:
            return FORMALITY_MAP[key]

    return "casual"


def is_formality_compatible(formality_a, formality_b):
    if not formality_a or formality_a == "unknown":
        formality_a = "semi-formal"
    if not formality_b or formality_b == "unknown":
        formality_b = "semi-formal"

    if formality_a == formality_b:
        return True

    semi_pairs = ({"semi-formal", "casual"}, {"semi-formal", "formal"}, {"casual", "formal"})
    return {formality_a, formality_b} in semi_pairs
