import colorsys
from PIL import Image
import requests
from io import BytesIO

def get_dominant_color(image_url):
    """
    Downloads an image and returns its dominant RGB color,
    ignoring transparent pixels (since our images are background-removed).
    """
    response = requests.get(image_url)
    img = Image.open(BytesIO(response.content)).convert("RGBA")
    img = img.resize((100, 100))

    pixels = img.getdata()
    color_counts = {}

    for r, g, b, a in pixels:
        if a < 50:
            continue
        key = (r // 20 * 20, g // 20 * 20, b // 20 * 20)
        color_counts[key] = color_counts.get(key, 0) + 1

    if not color_counts:
        return (128, 128, 128)

    dominant = max(color_counts, key=color_counts.get)
    return dominant


def rgb_to_hue(rgb):
    r, g, b = [x / 255.0 for x in rgb]
    h, s, v = colorsys.rgb_to_hsv(r, g, b)
    return h * 360


def is_color_compatible(rgb_a, rgb_b):
    """
    Basic color wheel logic:
    - neutrals (low saturation, e.g. black/white/grey/beige) go with anything
    - complementary colors (opposite on wheel) work
    - analogous colors (close on wheel) work
    """
    def is_neutral(rgb):
        r, g, b = [x / 255.0 for x in rgb]
        h, s, v = colorsys.rgb_to_hsv(r, g, b)
        return s < 0.15

    if is_neutral(rgb_a) or is_neutral(rgb_b):
        return True

    hue_a = rgb_to_hue(rgb_a)
    hue_b = rgb_to_hue(rgb_b)
    diff = abs(hue_a - hue_b)
    diff = min(diff, 360 - diff)

    if diff <= 30:
        return True
    if 150 <= diff <= 210:
        return True

    return False
