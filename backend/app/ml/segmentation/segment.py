import cv2
import numpy as np


def segment_clothing_item(image_path: str, output_path: str = None, margin_ratio: float = 0.03):
    """
    Segments the main clothing item out of an image using GrabCut,
    removing the background. Returns the segmented image as a numpy
    array with an alpha channel (transparent background).
    """
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not read image at {image_path}")

    height, width = img.shape[:2]

    margin_x = int(width * margin_ratio)
    margin_y = int(height * margin_ratio)
    rect = (margin_x, margin_y, width - 2 * margin_x, height - 2 * margin_y)

    mask = np.zeros(img.shape[:2], np.uint8)
    bgd_model = np.zeros((1, 65), np.float64)
    fgd_model = np.zeros((1, 65), np.float64)

    cv2.grabCut(img, mask, rect, bgd_model, fgd_model, 5, cv2.GC_INIT_WITH_RECT)

    final_mask = np.where((mask == 2) | (mask == 0), 0, 1).astype("uint8")

    # Closing fills small internal gaps (e.g. patterns/wrinkles getting
    # misread as background) without expanding the outer boundary
    kernel = np.ones((5, 5), np.uint8)
    final_mask = cv2.morphologyEx(final_mask, cv2.MORPH_CLOSE, kernel)

    # Removed the extra dilation from before - that's what was eating
    # into the background and causing the color fringe. Closing alone
    # is enough for the sleeve-gap issue.

    # Light feathering just for anti-aliasing, not mask growth
    final_mask_soft = cv2.GaussianBlur(final_mask.astype(np.float32), (3, 3), 0)
    final_mask_soft = np.clip(final_mask_soft, 0, 1)

    # IMPORTANT FIX: keep original RGB colors as-is, don't premultiply
    # by the mask. Only the alpha channel should encode transparency.
    # Premultiplying was what made faint background pixels show up
    # as a visible tinted fringe instead of a clean edge.
    b, g, r = cv2.split(img)
    alpha = (final_mask_soft * 255).astype(np.uint8)
    result = cv2.merge([b, g, r, alpha])

    if output_path:
        cv2.imwrite(output_path, result)

    return result


if __name__ == "__main__":
    test_result = segment_clothing_item(
        "test_images/sample_shirt.jpg",
        "test_images/sample_shirt_segmented.png"
    )
    print("Segmentation complete, saved to test_images/sample_shirt_segmented.png")
    print("Output shape:", test_result.shape)