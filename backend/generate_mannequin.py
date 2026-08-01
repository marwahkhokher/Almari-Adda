from PIL import Image, ImageDraw
import os

WIDTH, HEIGHT = 800, 1200

def generate_mannequin():
    img = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    fill_color = (248, 248, 248, 255)
    outline_color = (225, 225, 225, 255)

    head_center_x = WIDTH // 2
    draw.ellipse([head_center_x - 55, 40, head_center_x + 55, 150], fill=fill_color, outline=outline_color, width=1)
    draw.rectangle([head_center_x - 18, 145, head_center_x + 18, 185], fill=fill_color, outline=outline_color, width=1)

    torso_top_left = (240, 185); torso_top_right = (560, 185)
    torso_bottom_left = (290, 520); torso_bottom_right = (510, 520)
    draw.polygon([torso_top_left, torso_top_right, torso_bottom_right, torso_bottom_left], fill=fill_color, outline=outline_color, width=1)

    draw.rectangle([190, 195, 240, 470], fill=fill_color, outline=outline_color, width=1)
    draw.rectangle([560, 195, 610, 470], fill=fill_color, outline=outline_color, width=1)

    draw.rectangle([295, 520, 395, 950], fill=fill_color, outline=outline_color, width=1)
    draw.rectangle([405, 520, 505, 950], fill=fill_color, outline=outline_color, width=1)
    draw.ellipse([285, 940, 405, 980], fill=fill_color, outline=outline_color, width=1)
    draw.ellipse([395, 940, 515, 980], fill=fill_color, outline=outline_color, width=1)

    os.makedirs("assets", exist_ok=True)
    img.save("assets/mannequin_base.png")
    print("Saved narrower mannequin")

if __name__ == "__main__":
    generate_mannequin()
