import colorsys
from io import BytesIO

import requests
from PIL import Image


# ============================================================
# COLOR DETECTION
# ============================================================

def get_dominant_color(image_path):
    """
    Detects the dominant clothing color from a background-removed image.

    Accepts either a local file path (used right after the upload
    pipeline runs) or a remote http(s) URL (used when reading items
    back from Supabase storage, e.g. during outfit matching).

    Uses only visible pixels and ignores:
    - transparent pixels
    - extremely dark pixels
    - extremely light pixels when they are likely background artifacts

    Returns an RGB tuple.
    """

    if isinstance(image_path, str) and image_path.startswith("http"):
        response = requests.get(image_path, timeout=10)
        response.raise_for_status()
        img = Image.open(BytesIO(response.content)).convert("RGBA")
    else:
        img = Image.open(image_path).convert("RGBA")

    # Smaller image = faster processing
    img.thumbnail((150, 150))

    pixels = []

    for r, g, b, a in img.getdata():

        # Ignore transparent background
        if a < 50:
            continue

        # Ignore almost-black artifacts
        if r < 8 and g < 8 and b < 8:
            continue

        pixels.append((r, g, b))

    if not pixels:
        return (128, 128, 128)

    # --------------------------------------------------------
    # Quantize colors slightly so tiny lighting differences
    # don't create hundreds of separate colors.
    # --------------------------------------------------------

    color_counts = {}

    for r, g, b in pixels:

        # 16-level quantization
        key = (
            round(r / 16) * 16,
            round(g / 16) * 16,
            round(b / 16) * 16,
        )

        key = tuple(min(255, max(0, x)) for x in key)

        color_counts[key] = color_counts.get(key, 0) + 1

    # --------------------------------------------------------
    # Instead of blindly choosing the most common RGB value,
    # choose the strongest representative color.
    # --------------------------------------------------------

    dominant = max(
        color_counts,
        key=color_counts.get
    )

    return dominant


# ============================================================
# RGB → HSV
# ============================================================

def rgb_to_hsv(rgb):
    """
    Converts RGB (0-255) into HSV:
    H = 0-360
    S = 0-1
    V = 0-1
    """

    r, g, b = [x / 255.0 for x in rgb]

    h, s, v = colorsys.rgb_to_hsv(r, g, b)

    return h * 360, s, v


def rgb_to_hue(rgb):
    """
    Returns hue in degrees.
    """

    h, _, _ = rgb_to_hsv(rgb)

    return h


# ============================================================
# COLOR COMPATIBILITY
# ============================================================

def is_color_compatible(rgb_a, rgb_b):
    """
    Determines whether two colors work well together.
    """

    _, s_a, _ = rgb_to_hsv(rgb_a)
    _, s_b, _ = rgb_to_hsv(rgb_b)

    # Low saturation = neutral
    if s_a < 0.15 or s_b < 0.15:
        return True

    hue_a = rgb_to_hue(rgb_a)
    hue_b = rgb_to_hue(rgb_b)

    diff = abs(hue_a - hue_b)
    diff = min(diff, 360 - diff)

    # Analogous
    if diff <= 30:
        return True

    # Complementary
    if 150 <= diff <= 210:
        return True

    return False


# ============================================================
# COLOR NAME DETECTION
# ============================================================

def get_color_name(rgb):
    """
    Converts an RGB color into a human-readable clothing color.

    Uses HSV-based rules instead of raw RGB distance.

    This is much more reliable for clothing because colors such as
    brown, dark red, beige and pink can be very close in RGB space.
    """

    h, s, v = rgb_to_hsv(rgb)

    # --------------------------------------------------------
    # BLACK
    # --------------------------------------------------------

    if v < 0.15:
        return "black"

    # --------------------------------------------------------
    # WHITE
    # --------------------------------------------------------

    if v > 0.90 and s < 0.12:
        return "white"

    # --------------------------------------------------------
    # GREY
    # --------------------------------------------------------

    if s < 0.12:
        if v < 0.35:
            return "dark gray"

        if v < 0.70:
            return "gray"

        return "light gray"

    # --------------------------------------------------------
    # VERY LOW SATURATION / EARTHY NEUTRALS
    # --------------------------------------------------------

    # Beige / cream
    if (
        25 <= h <= 55
        and s < 0.35
        and v > 0.65
    ):
        return "beige"

    # Tan
    if (
        20 <= h <= 45
        and 0.30 <= s <= 0.65
        and v >= 0.45
    ):
        return "tan"

    # --------------------------------------------------------
    # BROWN
    #
    # IMPORTANT:
    # Brown is basically a dark, moderately saturated orange.
    # We explicitly catch it BEFORE red.
    # This prevents brown from becoming "dark red".
    # --------------------------------------------------------

    if (
        15 <= h <= 40
        and s >= 0.30
        and v < 0.65
    ):
        return "brown"

    # Dark brown
    if (
        15 <= h <= 40
        and s >= 0.20
        and v < 0.42
    ):
        return "dark brown"

    # --------------------------------------------------------
    # RED / PINK
    # --------------------------------------------------------

    # Pink:
    # high value + moderate/high saturation + red/magenta hue
    if (
        (h >= 330 or h <= 15)
        and s >= 0.20
        and v >= 0.65
    ):
        return "pink"

    # Also catch lighter pinks that drift toward magenta
    if (
        300 <= h < 360
        and s >= 0.15
        and v >= 0.60
    ):
        return "pink"

    # Dark red
    if (
        (h >= 345 or h <= 10)
        and v < 0.45
        and s >= 0.35
    ):
        return "dark red"

    # Regular red
    if (
        (h >= 345 or h <= 15)
        and s >= 0.35
    ):
        return "red"

    # --------------------------------------------------------
    # ORANGE
    # --------------------------------------------------------

    if (
        15 < h < 45
        and s >= 0.45
        and v >= 0.45
    ):
        return "orange"

    # --------------------------------------------------------
    # YELLOW
    # --------------------------------------------------------

    if (
        45 <= h < 70
        and s >= 0.35
        and v >= 0.50
    ):
        return "yellow"

    # --------------------------------------------------------
    # GREEN
    # --------------------------------------------------------

    if (
        70 <= h < 170
        and s >= 0.25
    ):
        if v < 0.40:
            return "dark green"

        return "green"

    # --------------------------------------------------------
    # CYAN / TEAL
    # --------------------------------------------------------

    if (
        170 <= h < 200
        and s >= 0.30
    ):
        return "teal"

    if (
        170 <= h < 195
        and s >= 0.45
    ):
        return "cyan"

    # --------------------------------------------------------
    # BLUE
    # --------------------------------------------------------

    if (
        195 <= h < 250
        and s >= 0.30
    ):
        if v < 0.40:
            return "navy blue"

        return "blue"

    # --------------------------------------------------------
    # PURPLE
    # --------------------------------------------------------

    if (
        250 <= h < 300
        and s >= 0.25
    ):
        return "purple"

    # --------------------------------------------------------
    # MAGENTA
    # --------------------------------------------------------

    if (
        300 <= h < 330
        and s >= 0.30
    ):
        return "magenta"

    # --------------------------------------------------------
    # FALLBACK
    # --------------------------------------------------------

    # If the color doesn't fit perfectly into a category,
    # use the closest broad hue family.
    if h < 15 or h >= 345:
        return "red"

    if h < 45:
        return "orange"

    if h < 70:
        return "yellow"

    if h < 170:
        return "green"

    if h < 200:
        return "teal"

    if h < 250:
        return "blue"

    if h < 300:
        return "purple"

    return "pink"