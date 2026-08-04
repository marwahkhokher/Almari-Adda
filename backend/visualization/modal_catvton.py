import modal

app = modal.App("almari-adda-catvton")

image = (
    modal.Image.debian_slim(python_version="3.10")
    .apt_install("git", "libgl1", "libglib2.0-0")
    .pip_install(
        "torch", "torchvision", "diffusers", "transformers",
        "accelerate", "opencv-python-headless", "pillow", "numpy",
        "huggingface_hub", "gradio", "fvcore", "cloudpickle","omegaconf", "pycocotools", "av", "scipy",
    )
    .run_commands("git clone https://github.com/Zheng-Chong/CatVTON.git /root/CatVTON")
)


@app.function(image=image, gpu="T4", timeout=300)
def run_tryon(person_image_bytes: bytes, cloth_image_bytes: bytes, cloth_type: str = "upper"):
    import sys
    sys.path.insert(0, "/root/CatVTON")

    import io
    import os
    from PIL import Image
    import app as catvton_app

    person_img = Image.open(io.BytesIO(person_image_bytes)).convert("RGB")
    cloth_img = Image.open(io.BytesIO(cloth_image_bytes)).convert("RGB")

    os.makedirs("/tmp/catvton", exist_ok=True)

    person_path = "/tmp/catvton/person.png"
    person_img.save(person_path)

    blank_mask_path = "/tmp/catvton/blank_mask.png"
    Image.new("L", person_img.size, 0).save(blank_mask_path)

    person_image_input = {
        "background": person_path,
        "layers": [blank_mask_path],
    }

    result_image = catvton_app.submit_function(
        person_image_input,
        cloth_img,
        cloth_type,
        30,
        2.5,
        42,
        "result only",
    )

    output_buffer = io.BytesIO()
    result_image.save(output_buffer, format="PNG")
    return output_buffer.getvalue()

@app.local_entrypoint()
def main():
    with open("app/ml/visualization/assets/person_base_male.jpg", "rb") as f:
        person_bytes = f.read()
    with open("processed/sample_shirtt_segmented.png", "rb") as f:
        cloth_bytes = f.read()

    result = run_tryon.remote(person_bytes, cloth_bytes, "upper")

    with open("test_images/modal_catvton_result.png", "wb") as f:
        f.write(result)

    print("Saved result to test_images/modal_catvton_result.png")