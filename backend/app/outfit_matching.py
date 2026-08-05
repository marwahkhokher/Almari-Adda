import logging

from app.color_utils import get_dominant_color, is_color_compatible
from app.formality_utils import get_formality, is_formality_compatible
from app.embedding_utils import cosine_similarity

logger = logging.getLogger(__name__)

<<<<<<< HEAD
SINGLE_PIECE_KEYWORDS = {
=======
SINGLE_PIECE_KEYWORDS = (
>>>>>>> ca946a115360704b0710fd565fbe57535dd5eb26
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

    color_cache = {}

    def _get_color_cached(item):
        item_id = item.get("id")
        if item_id not in color_cache:
            color_cache[item_id] = get_dominant_color(item.get("image_url", ""))
        return color_cache[item_id]

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

            try:
                top_color = _get_color_cached(top)
                bottom_color = _get_color_cached(bottom)
                if top_color and bottom_color and not is_color_compatible(top_color, bottom_color):
                    continue
            except Exception as e:
                logger.warning("Color check skipped for top=%s bottom=%s: %s", top.get("id"), bottom.get("id"), e)

            similarity = _score([top.get("embedding"), bottom.get("embedding")])

            valid_outfits.append({
                "type": "top_bottom",
                "top": top,
                "bottom": bottom,
                "formality": top_formality if top_formality == bottom_formality else "semi-formal",
                "similarity": similarity,
            })

    # Case 2: single-piece outfits (dresses, gowns, abayas, sarees, kurtas, etc.)
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