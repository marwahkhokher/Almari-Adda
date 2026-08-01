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

    # Semi-formal
    "blazer": "semi-formal",
    "chinos": "semi-formal",
    "polo": "semi-formal",
    "polo shirt": "semi-formal",
    "cardigan": "semi-formal",
    "sweater": "semi-formal",
    "button-up shirt": "semi-formal",
    "button-down shirt": "semi-formal",
    "midi skirt": "semi-formal",
    "loafers": "semi-formal",
    "turtleneck": "semi-formal",
    "vest": "semi-formal",
    "culottes": "semi-formal",
    "jumpsuit": "semi-formal",

    # Formal
    "kurta": "formal",
    "abaya": "formal",
    "saree": "formal",
    "sari": "formal",
    "dress shirt": "formal",
    "dress pants": "formal",
    "gown": "formal",
    "suit": "formal",
    "tuxedo": "formal",
    "cocktail dress": "formal",
    "evening dress": "formal",
    "sherwani": "formal",
    "lehenga": "formal",
    "waistcoat": "formal",
    "blouse": "formal",
    "pencil skirt": "formal",
    "heels": "formal",
    "trench coat": "formal",
    "overcoat": "formal",
    "shalwar kameez": "formal",
}


def get_formality(subcategory):
    return FORMALITY_MAP.get(subcategory.lower(), "unknown")


def is_formality_compatible(formality_a, formality_b):
    if formality_a == "unknown" or formality_b == "unknown":
        return False

    if formality_a == formality_b:
        return True

    semi_pairs = {"semi-formal", "casual"}, {"semi-formal", "formal"}
    return {formality_a, formality_b} in semi_pairs
