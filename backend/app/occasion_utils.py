"""
Occasion / event inference for wardrobe items.

Colour and season are stored per-item in the item_metadata table, but
"which event is this good for?" is derived on the fly from the item's
category + subcategory + formality. Deriving it (instead of storing a
new column) means it works for every existing item immediately, needs
no database migration, and stays flexible if the mapping is tuned.

The event vocabulary is tailored to a Pakistani wardrobe (Eid, mehndi,
shaadi, etc.) as requested.
"""
from app.formality_utils import get_formality

# Canonical event list, in the order we want them shown in the UI.
ALL_OCCASIONS = [
    "Eid",
    "Wedding",
    "Mehndi",
    "Party",
    "Formal / Office",
    "Casual / Everyday",
    "University",
]

# Heavy festive / bridal pieces — strongly tied to celebrations.
_BRIDAL_KEYWORDS = [
    "lehenga",
    "sherwani",
    "gown",
    "saree",
    "sari",
    "anarkali",
    "sharara",
    "gharara",
    "maxi",
    "frock",
]

# Everyday eastern wear — worn on Eid and to work/university alike.
_EASTERN_DAILY_KEYWORDS = [
    "kurta",
    "kurti",
    "shalwar",
    "kameez",
    "abaya",
]

# Western evening wear that reads as party/wedding-appropriate.
_EVENING_KEYWORDS = [
    "evening",
    "cocktail",
]


def get_occasions(category, subcategory):
    """
    Return a sorted list of events an item suits, e.g.
    ["Eid", "Wedding", "Party"]. Never raises — falls back to a sensible
    everyday default for unknown garments.
    """
    text = f"{category or ''} {subcategory or ''}".lower()
    formality = get_formality(subcategory or "")

    occasions = set()

    # Base set from the formality tier.
    if formality == "casual":
        occasions |= {"Casual / Everyday", "University"}
    elif formality == "semi-formal":
        occasions |= {"Casual / Everyday", "University", "Formal / Office", "Party"}
    elif formality == "formal":
        occasions |= {"Formal / Office", "Party", "Wedding"}
    else:  # unknown
        occasions |= {"Casual / Everyday"}

    # Garment-specific nudges layered on top of the formality base.
    if any(word in text for word in _BRIDAL_KEYWORDS):
        occasions |= {"Wedding", "Mehndi", "Party", "Eid"}
        occasions.discard("University")
        occasions.discard("Casual / Everyday")

    if any(word in text for word in _EASTERN_DAILY_KEYWORDS):
        occasions |= {"Eid", "Formal / Office", "Party", "Wedding"}

    if any(word in text for word in _EVENING_KEYWORDS):
        occasions |= {"Party", "Wedding"}

    # Return in canonical order for stable, predictable UI ordering.
    return [o for o in ALL_OCCASIONS if o in occasions]
