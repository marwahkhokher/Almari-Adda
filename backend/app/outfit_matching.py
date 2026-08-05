import logging

from app.color_utils import get_dominant_color, is_color_compatible
from app.formality_utils import get_formality, is_formality_compatible
from app.embedding_utils import cosine_similarity

logger = logging.getLogger(__name__)

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
    "kurta",
    "shalwar kameez",
    "sherwani",
    "suit",
    "tuxedo",
}


def get_valid_outfits(items, prompt_embedding=None):
    """
    Given a list of catalogue items, return valid outfit combinations.
    Handles two cases:
    1. Top + bottom pairs, filtered by formality and color compatibility.
    2. Single-piece items (dress, abaya, saree, kurta, shalwar kameez,
       etc.) that are complete outfits on their own. Category doesn't
       matter here - only subcategory, since these items may be tagged
       under "eastern wear" or other non top/bottom categories.

    If prompt_embedding is given, each outfit gets a "similarity" score
    against that embedding (averaging the embeddings of its pieces),
    and the returned list is sorted best-match-first. If not given,
    outfits are returned in the order found, with no scoring - callers
    that don't care about ranking can ignore the "similarity" field.

    Returns an empty list (never crashes) if there isn't enough data.
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
            color_cache[item_id] = get_dominant_color(item["image_url"])
        return color_cache[item_id]

    def _score(outfit_embeddings):
        """Average the embeddings of an outfit's pieces and compare
        against the prompt embedding. Returns None if scoring isn't
        possible (no prompt, or a piece is missing its embedding)."""
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
            top_formality = get_formality(top.get("subcategory", ""))
            bottom_formality = get_formality(bottom.get("subcategory", ""))

            if not is_formality_compatible(top_formality, bottom_formality):
                continue

            try:
                top_color = _get_color_cached(top)
                bottom_color = _get_color_cached(bottom)
            except Exception as e:
                logger.warning(
                    "Color check failed for top=%s bottom=%s: %s",
                    top.get("id"), bottom.get("id"), e,
                )
                continue

            if not is_color_compatible(top_color, bottom_color):
                continue

            similarity = _score([top.get("embedding"), bottom.get("embedding")])

            valid_outfits.append({
                "type": "top_bottom",
                "top": top,
                "bottom": bottom,
                "formality": top_formality if top_formality == bottom_formality else "mixed",
                "similarity": similarity,
            })

    # Case 2: single-piece outfits (dress, abaya, saree, kurta, etc.)
    for item in items:
        subcategory = item.get("subcategory", "").lower()
        if subcategory in SINGLE_PIECE_SUBCATEGORIES:
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