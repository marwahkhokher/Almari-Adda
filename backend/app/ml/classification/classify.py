import torch
import open_clip
from PIL import Image


CLOTHING_TAXONOMY = {
    "top": [
        "t-shirt",
        "blouse",
        "sweater",
        "hoodie",
        "blazer",
        "jacket",
    ],
    "bottom": [
        "jeans",
        "trousers",
        "shorts",
        "skirt",
    ],
    "dress": [
        "casual dress",
        "formal dress",
    ],
    "eastern wear": [
        "shalwar kameez",
        "kurta",
    ],
}


class ClothingClassifier:
    def __init__(self):
        # ViT-B-32 is the standard lightweight CLIP variant - fast
        # enough to run on CPU, which matters since we don't have a
        # GPU set up. "laion2b_s34b_b79k" is a well-tested open
        # pretrained weight set for this architecture.
        self.model, _, self.preprocess = open_clip.create_model_and_transforms(
            "ViT-B-32", pretrained="laion2b_s34b_b79k"
        )
        self.tokenizer = open_clip.get_tokenizer("ViT-B-32")
        self.model.eval()

        # Flatten the taxonomy into (category, subcategory) pairs and
        # build the text prompts CLIP will compare the image against
        self.labels = []  # list of (category, subcategory) tuples
        prompts = []
        for category, subcategories in CLOTHING_TAXONOMY.items():
            for sub in subcategories:
                self.labels.append((category, sub))
                # Prompt phrasing matters for CLIP zero-shot accuracy -
                # "a photo of a <item>, a clothing item" gives it more
                # context than just the bare word
                prompts.append(f"a photo of a {sub}, a clothing item")

        # Pre-compute text embeddings once at startup, not per-request -
        # these don't change, so no reason to recompute them every call
        with torch.no_grad():
            text_tokens = self.tokenizer(prompts)
            self.text_features = self.model.encode_text(text_tokens)
            self.text_features /= self.text_features.norm(dim=-1, keepdim=True)

    def classify(self, image_path: str, top_k: int = 3):
        """
        Classifies a clothing image against the full taxonomy.
        Returns the top match plus the top_k ranked results with
        confidence scores, so the frontend can show alternatives
        if the top pick looks wrong.
        """
        image = Image.open(image_path).convert("RGB")
        image_input = self.preprocess(image).unsqueeze(0)

        with torch.no_grad():
            image_features = self.model.encode_image(image_input)
            image_features /= image_features.norm(dim=-1, keepdim=True)

            # Cosine similarity between image and every text prompt
            similarities = (image_features @ self.text_features.T).squeeze(0)

            # CLIP is trained with a learned logit_scale applied before
            # softmax - without this, raw cosine similarities are too
            # close together and softmax gives a near-flat, low-confidence
            # distribution even when the model is actually quite sure.
            logit_scale = self.model.logit_scale.exp()
            logits = similarities * logit_scale
            probs = logits.softmax(dim=-1)

        top_indices = probs.argsort(descending=True)[:top_k]

        results = []
        for idx in top_indices:
            category, subcategory = self.labels[idx]
            confidence = probs[idx].item()
            results.append({
                "category": category,
                "subcategory": subcategory,
                "confidence": round(confidence, 4),
            })

        return {
            "top_prediction": results[0],
            "all_predictions": results,
        }

    def score_occasion_similarity(self, image_source: str, occasion: str) -> float:
        """
        OpenCLIP Zero-Shot Occasion Embedding Scorer.
        Encodes the occasion prompt (e.g. 'clothing appropriate for date night')
        and measures cosine similarity against the image embedding.
        """
        import io
        import httpx

        prompt = f"a photo of an outfit appropriate for {occasion}"
        text_tokens = self.tokenizer([prompt])

        try:
            if image_source.startswith("http://") or image_source.startswith("https://"):
                resp = httpx.get(image_source, timeout=5.0)
                img = Image.open(io.BytesIO(resp.content)).convert("RGB")
            else:
                img = Image.open(image_source).convert("RGB")

            image_input = self.preprocess(img).unsqueeze(0)

            with torch.no_grad():
                img_features = self.model.encode_image(image_input)
                img_features /= img_features.norm(dim=-1, keepdim=True)

                text_features = self.model.encode_text(text_tokens)
                text_features /= text_features.norm(dim=-1, keepdim=True)

                sim = (img_features @ text_features.T).item()
                return round(float(sim), 4)
        except Exception:
            return 0.5

    def get_embedding(self, image_path: str):
        """
        Returns the raw CLIP image embedding as a plain Python list,
        so it can be stored in Supabase (jsonb column) and later
        compared against text embeddings for outfit matching.
        """
        image = Image.open(image_path).convert("RGB")
        image_input = self.preprocess(image).unsqueeze(0)

        with torch.no_grad():
            image_features = self.model.encode_image(image_input)
            image_features /= image_features.norm(dim=-1, keepdim=True)

        return image_features.squeeze(0).tolist()

    def get_text_embedding(self, text: str):
        """
        Returns the raw CLIP text embedding for an arbitrary prompt,
        in the same embedding space as get_embedding, so the two can
        be compared directly via cosine similarity.
        """
        with torch.no_grad():
            tokens = self.tokenizer([text])
            text_features = self.model.encode_text(tokens)
            text_features /= text_features.norm(dim=-1, keepdim=True)

        return text_features.squeeze(0).tolist()


if __name__ == "__main__":
    classifier = ClothingClassifier()
    result = classifier.classify("test_images/sample_shirt_segmented.png")

    print("Top prediction:", result["top_prediction"])
    print("\nAll top-3 predictions:")
    for pred in result["all_predictions"]:
        print(f"  {pred['category']} > {pred['subcategory']}: {pred['confidence']}")