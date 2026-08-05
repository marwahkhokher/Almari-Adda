def cosine_similarity(vec_a, vec_b):
    """
    Computes cosine similarity between two equal-length vectors
    (plain Python lists of floats, e.g. from CLIP embeddings).
    Returns a float between -1 and 1 - higher means more similar.
    """
    dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = sum(a * a for a in vec_a) ** 0.5
    norm_b = sum(b * b for b in vec_b) ** 0.5

    if norm_a == 0 or norm_b == 0:
        return 0.0

    return dot_product / (norm_a * norm_b)