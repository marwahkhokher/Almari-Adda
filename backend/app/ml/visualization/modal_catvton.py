import modal

app = modal.App("almari-adda-catvton")

image = (
    modal.Image.debian_slim(python_version="3.10")
    .apt_install("git", "libgl1", "libglib2.0-0")
    .pip_install(
        "torch", "torchvision", "diffusers", "transformers",
        "accelerate", "opencv-python-headless", "pillow", "numpy",
        "huggingface_hub", "gradio", "fvcore", "cloudpickle", "omegaconf", "pycocotools", "av", "scipy",
    )
    .run_commands("git clone https://github.com/Zheng-Chong/CatVTON.git /root/CatVTON")
)


@app.function(image=image, gpu="A10G", timeout=600)
def run_full_outfit(person_image_bytes: bytes, top_image_bytes: bytes = None,
                     bottom_image_bytes: bytes = None):
    """
    Full outfit try-on - chains applying a top and/or bottom onto a
    given person photo. The person photo itself (male/female choice)
    is decided by the CALLER, not this function - this function just
    runs inference on whatever photo bytes it's given.
    """
    import sys
    sys.path.insert(0, "/root/CatVTON")

    import io
    import os
    from PIL import Image
    import app as catvton_app

    def resize(img, target_size=(768, 1024)):
        """
        Resizes to fit within target_size while preserving aspect
        ratio, then pads with white to reach the exact target
        dimensions - avoids stretching/distortion.
        """
        target_w, target_h = target_size
        ratio = min(target_w / img.width, target_h / img.height)
        new_w, new_h = int(img.width * ratio), int(img.height * ratio)
        resized = img.resize((new_w, new_h), Image.LANCZOS)

        padded = Image.new("RGB", target_size, (255, 255, 255))
        paste_x = (target_w - new_w) // 2
        paste_y = (target_h - new_h) // 2
        padded.paste(resized, (paste_x, paste_y))

        return padded

    def save_temp(img, name):
        path = f"/tmp/catvton/{name}.png"
        img.save(path)
        return path

    os.makedirs("/tmp/catvton", exist_ok=True)

    current_person_img = resize(Image.open(io.BytesIO(person_image_bytes)).convert("RGB"))
    blank_mask_path = save_temp(Image.new("L", current_person_img.size, 0), "blank_mask")

    if top_image_bytes:
        top_img = resize(Image.open(io.BytesIO(top_image_bytes)).convert("RGB"))
        top_path = save_temp(top_img, "top")
        person_path = save_temp(current_person_img, "person_before_top")

        result = catvton_app.submit_function(
            {"background": person_path, "layers": [blank_mask_path]},
            top_path,
            "upper",
            30, 2.5, 42,
            "result only",
        )
        current_person_img = resize(result.convert("RGB"))

    if bottom_image_bytes:
        bottom_img = resize(Image.open(io.BytesIO(bottom_image_bytes)).convert("RGB"))
        bottom_path = save_temp(bottom_img, "bottom")
        person_path = save_temp(current_person_img, "person_before_bottom")

        result = catvton_app.submit_function(
            {"background": person_path, "layers": [blank_mask_path]},
            bottom_path,
            "lower",
            30, 2.5, 123,
            "result only",
        )
        current_person_img = resize(result.convert("RGB"))

    output_buffer = io.BytesIO()
    current_person_img.save(output_buffer, format="PNG")
    return output_buffer.getvalue()


@app.local_entrypoint()
def main():
    # Quick manual test - change "female" to "male" to test the other option
    model_choice = "female"

    person_photo_path = f"app/ml/visualization/assets/person_base_{model_choice}.jpg"
    with open(person_photo_path, "rb") as f:
        person_bytes = f.read()
    with open("processed/sample_shirtt_segmented.png", "rb") as f:
        top_bytes = f.read()
    with open("processed/sample_pant_segmented.png", "rb") as f:
        bottom_bytes = f.read()

    result = run_full_outfit.remote(person_bytes, top_image_bytes=top_bytes, bottom_image_bytes=bottom_bytes)

    with open(f"test_images/modal_full_outfit_{model_choice}.png", "wb") as f:
        f.write(result)

    print(f"Saved full outfit result to test_images/modal_full_outfit_{model_choice}.png")

