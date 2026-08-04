import colorsys
from PIL import Image
import requests
from io import BytesIO

# def get_dominant_color(image_url):
#     """
#     Downloads an image and returns its dominant RGB color,
#     ignoring transparent pixels (since our images are background-removed).
#     """
#     response = requests.get(image_url)
#     img = Image.open(BytesIO(response.content)).convert("RGBA")
#     img = img.resize((100, 100))

#     pixels = img.getdata()
#     color_counts = {}

#     for r, g, b, a in pixels:
#         if a < 50:
#             continue
#         key = (r // 20 * 20, g // 20 * 20, b // 20 * 20)
#         color_counts[key] = color_counts.get(key, 0) + 1

#     if not color_counts:
#         return (128, 128, 128)

#     dominant = max(color_counts, key=color_counts.get)
#     return dominant


# def rgb_to_hue(rgb):
#     r, g, b = [x / 255.0 for x in rgb]
#     h, s, v = colorsys.rgb_to_hsv(r, g, b)
#     return h * 360

def get_dominant_color(image_path):
    """
    Opens a local image file and returns its dominant RGB color,
    ignoring transparent pixels.
    """
    img = Image.open(image_path).convert("RGBA")
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


COLOR_NAMES = {
    (0, 0, 0): "black",
    (255, 255, 255): "white",
    (128, 128, 128): "gray",
    (255, 0, 0): "red",
    (139, 0, 0): "dark red",
    (255, 165, 0): "orange",
    (255, 255, 0): "yellow",
    (128, 128, 0): "olive",
    (0, 128, 0): "green",
    (0, 100, 0): "dark green",
    (0, 255, 0): "lime",
    (0, 128, 128): "teal",
    (0, 255, 255): "cyan",
    (0, 0, 255): "blue",
    (0, 0, 139): "navy blue",
    (128, 0, 128): "purple",
    (255, 0, 255): "magenta",
    (255, 192, 203): "pink",
    (165, 42, 42): "brown",
    (210, 180, 140): "tan",
    (245, 245, 220): "beige",
}


def get_color_name(rgb):
    """
    Finds the closest named color to the given RGB tuple using
    simple Euclidean distance in RGB space.
    """
    r, g, b = rgb
    closest_name = "gray"
    closest_distance = float("inf")

    for (nr, ng, nb), name in COLOR_NAMES.items():
        distance = (r - nr) ** 2 + (g - ng) ** 2 + (b - nb) ** 2
        if distance < closest_distance:
            closest_distance = distance
            closest_name = name

    return closest_name
