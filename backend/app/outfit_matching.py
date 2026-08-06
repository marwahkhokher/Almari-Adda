import logging

from app.formality_utils import get_formality, is_formality_compatible
from app.embedding_utils import cosine_similarity

logger = logging.getLogger(__name__)

SINGLE_PIECE_KEYWORDS = (
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
    "suit",
    "tuxedo",
)


def _is_single_piece(subcategory: str) -> bool:
    subcategory = subcategory.lower()
    return any(keyword in subcategory for keyword in SINGLE_PIECE_KEYWORDS)


def get_valid_outfits(items, prompt_embedding=None):
    """
    Given a list of catalogue items, return valid outfit combinations.
    Handles two cases:
    1. Top + bottom pairs, filtered by formality and color compatibility.
    2. Single-piece items (dresses, gowns, abayas, sarees, kurtas, etc.) that are complete outfits on their own.

    If prompt_embedding is given, each outfit gets a "similarity" score
    against that embedding (averaging the embeddings of its pieces),
    and the returned list is sorted best-match-first.
    """
    if not items:
        return []

    valid_outfits = []

    tops = [item for item in items if item.get("category") == "top"]
    bottoms = [item for item in items if item.get("category") == "bottom"]

    def _get_color_name(item):
        """Return pre-computed color name if available, else None."""
        return item.get("_cached_color")

    def _are_colors_compatible_by_name(color_a, color_b):
        """Quick string-based color compatibility check using pre-stored color names."""
        if not color_a or not color_b:
            return True  # skip check if either color is unknown

        NEUTRALS = {"black", "white", "gray", "dark gray", "light gray", "beige", "tan", "cream"}
        if color_a in NEUTRALS or color_b in NEUTRALS:
            return True

        # Same color family is always compatible
        if color_a == color_b:
            return True

        # Known good pairings (analogous / complementary)
        COMPATIBLE_PAIRS = {
            frozenset({"blue", "navy blue"}),
            frozenset({"blue", "white"}),
            frozenset({"red", "dark red"}),
            frozenset({"pink", "red"}),
            frozenset({"green", "dark green"}),
            frozenset({"brown", "dark brown"}),
            frozenset({"blue", "brown"}),
            frozenset({"blue", "orange"}),
            frozenset({"navy blue", "brown"}),
            frozenset({"navy blue", "tan"}),
            frozenset({"green", "brown"}),
            frozenset({"teal", "brown"}),
            frozenset({"purple", "pink"}),
            frozenset({"red", "blue"}),
            frozenset({"yellow", "blue"}),
            frozenset({"green", "yellow"}),
        }

        return frozenset({color_a, color_b}) in COMPATIBLE_PAIRS

    def _score(outfit_embeddings):
        if prompt_embedding is None:
            return None
        valid_embeddings = [e for e in outfit_embeddings if e]
        if not valid_embeddings:
            return None
        dims = len(valid_embeddings[0])
        avg = [
            sum(e[i] for e in valid_embeddings) / len(valid_embeddings)
            for i in range(dims)
        ]
        return cosine_similarity(avg, prompt_embedding)

    # Case 1: top + bottom pairs
    for top in tops:
        for bottom in bottoms:
            top_sub = top.get("subcategory", "") or top.get("category", "")
            bottom_sub = bottom.get("subcategory", "") or bottom.get("category", "")

            top_formality = get_formality(top_sub)
            bottom_formality = get_formality(bottom_sub)

            if not is_formality_compatible(top_formality, bottom_formality):
                continue

            # Use pre-computed color names — NO image downloads
            top_color = _get_color_name(top)
            bottom_color = _get_color_name(bottom)
            if not _are_colors_compatible_by_name(top_color, bottom_color):
                continue

            similarity = _score([top.get("embedding"), bottom.get("embedding")])

            valid_outfits.append({
                "type": "top_bottom",
                "top": top,
                "bottom": bottom,
                "formality": top_formality if top_formality == bottom_formality else "semi-formal",
                "similarity": similarity,
            })

    # Case 2: single-piece outfits (dresses, gowns, abayas, sarees, kurtas, etc.)
    for item in items:
        subcategory = (item.get("subcategory") or item.get("category") or "").lower()
        if _is_single_piece(subcategory) or "dress" in subcategory:
            formality = get_formality(subcategory)
            similarity = _score([item.get("embedding")])
            valid_outfits.append({
                "type": "single_piece",
                "item": item,
                "formality": formality,
                "similarity": similarity,
            })

    # Sort best-match-first only if we actually have similarity scores
    if prompt_embedding is not None:
        valid_outfits.sort(
            key=lambda o: o["similarity"] if o["similarity"] is not None else -1,
            reverse=True,
        )

    return valid_outfits