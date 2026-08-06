import os
import urllib.request
import cv2
import numpy as np
import onnxruntime as ort

# U2-Net is the same model rembg uses under the hood for segmentation -
# we're just calling it directly via onnxruntime instead of going
# through the rembg package, since rembg's wrapper pulls in pymatting
# (which pulls in numba) for an optional refinement step we don't need.
MODEL_URL = "https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2net.onnx"
MODEL_PATH = os.path.join(os.path.dirname(__file__), "u2net.onnx")

_session = None


def _get_session():
    global _session
    if _session is None:
        if not os.path.exists(MODEL_PATH):
            print("Downloading U2-Net model (one-time, ~176MB)...")
            urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
            print("Model downloaded.")
        _session = ort.InferenceSession(MODEL_PATH, providers=["CPUExecutionProvider"])
    return _session


def _preprocess(img):
    input_size = 320
    resized = cv2.resize(img, (input_size, input_size))
    rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0

    # These are U2-Net's expected normalization constants - fixed
    # values the model was trained with, not tunable
    mean = np.array([0.485, 0.456, 0.406])
    std = np.array([0.229, 0.224, 0.225])
    normalized = (rgb - mean) / std

    tensor = normalized.transpose(2, 0, 1)[np.newaxis, :, :, :].astype(np.float32)
    return tensor


def segment_clothing_item(image_path: str, output_path: str = None):
    """
    Segments the main clothing item out of an image using U2-Net
    (a real deep-learning saliency/matting model), removing the
    background. Returns the segmented image as a numpy array with
    an alpha channel (transparent background).
    """
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not read image at {image_path}")

    height, width = img.shape[:2]
    max_dim = max(height, width)
    if max_dim > 800:
        scale = 800.0 / max_dim
        img = cv2.resize(img, (int(width * scale), int(height * scale)), interpolation=cv2.INTER_AREA)
        height, width = img.shape[:2]

    session = _get_session()

    input_tensor = _preprocess(img)
    input_name = session.get_inputs()[0].name
    outputs = session.run(None, {input_name: input_tensor})

    pred = outputs[0][0][0]
    pred = (pred - pred.min()) / (pred.max() - pred.min() + 1e-8)
    mask = cv2.resize(pred, (width, height))

    final_mask = (mask > 0.5).astype(np.uint8)

    # Smooth edges slightly - U2-Net's output is already far cleaner
    # than GrabCut's, so minimal cleanup is needed here
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    final_mask = cv2.morphologyEx(final_mask, cv2.MORPH_CLOSE, kernel)

    # Keep only the largest connected blob, same safeguard as before
    # against stray disconnected background objects
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(
        final_mask, connectivity=8
    )
    if num_labels > 1:
        largest_label = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
        final_mask = np.where(labels == largest_label, 1, 0).astype(np.uint8)

    final_mask_soft = cv2.GaussianBlur(final_mask.astype(np.float32), (5, 5), 0)
    final_mask_soft = np.clip(final_mask_soft, 0, 1)

    b, g, r = cv2.split(img)
    alpha = (final_mask_soft * 255).astype(np.uint8)
    result = cv2.merge([b, g, r, alpha])

    if output_path:
        cv2.imwrite(output_path, result)

    return result


if __name__ == "__main__":
    test_result = segment_clothing_item(
        "test_images/sample_shirtt.jpg",
        "test_images/sample_shirtt_segmented.png"
    )
    print("Segmentation complete, saved to test_images/sample_shirtt_segmented.png")
    print("Output shape:", test_result.shape)