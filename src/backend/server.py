from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from PIL import Image, ImageDraw, ImageFont
import requests
from io import BytesIO
import os

app = Flask(__name__)
CORS(app)

# FINAL TEMPLATE URL
DEFAULT_TEMPLATE_URL = "https://res.cloudinary.com/httsesgq/image/upload/star_sapphire_3.png"

def get_font(font_type, size):
    base_dir = os.path.dirname(__file__)
    fonts_dir = os.path.join(base_dir, "fonts")
    font_map = {
        "Frasa": ["FrasaDisplay-Bold.ttf", "FrasaDisplay.ttf", "Frasa.ttf"],
        "Garat": ["Garat.ttf", "Garat-Bold.ttf"],
        "Alice": ["ALICE.ttf", "Alice-Regular.ttf"],
        "Canva": ["CanvaSans.ttf", "CanvaSans-Regular.ttf"]
    }
    for fname in font_map.get(font_type, []):
        path = os.path.join(fonts_dir, fname)
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, int(size))
            except: pass
    return ImageFont.load_default()

def create_circle_photo(photo_file, size):
    photo = Image.open(photo_file).convert("RGB")
    w, h = photo.size
    min_side = min(w, h)
    left = (w - min_side)//2
    top = (h - min_side)//2
    photo = photo.crop((left, top, left+min_side, top+min_side))
    photo = photo.resize((size, size), Image.LANCZOS)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size, size), fill=255)
    result = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    result.paste(photo, (0, 0), mask)
    return result

def draw_text_with_shadow(image, text, x, y, font_size, font_type, color="white"):
    draw = ImageDraw.Draw(image)
    font = get_font(font_type, font_size)
    shadow_offset = max(2, int(font_size * 0.06))
    # shadow
    shadow_color = (0,0,0,160) if color != "black" else (255,255,255,100)
    draw.text((x + shadow_offset, y + shadow_offset), text, font=font, fill=shadow_color)
    draw.text((x, y), text, font=font, fill=color)

@app.route("/health")
def health():
    return jsonify({"status": "ok"})

@app.route("/generate", methods=["POST"])
def generate():
    try:
        template_url = request.form.get("template_url")
        if not template_url or template_url.strip() == "":
            template_url = DEFAULT_TEMPLATE_URL

        leader_name = request.form.get("leader_name", "").strip()
        leader_place = request.form.get("leader_place", "").strip()
        achiever_name = request.form.get("achiever_name", "").strip()
        rank = request.form.get("rank", "").strip()
        phone = request.form.get("phone", "").strip()
        leader_photo = request.files.get("leader_photo")
        achiever_photo = request.files.get("achiever_photo")

        response = requests.get(template_url, timeout=20)
        poster = Image.open(BytesIO(response.content)).convert("RGBA")
        
        # FIXED SIZE - Isse alignment hamesha same rahega
        poster = poster.resize((1024, 1536), Image.LANCZOS)
        width, height = poster.size

        # FINAL COORDINATES - Measured from your screenshot
        if leader_photo and leader_photo.filename != "":
            size = 332  # upper circle size
            circle = create_circle_photo(leader_photo, size)
            poster.alpha_composite(circle, (58, 195))

        if achiever_photo and achiever_photo.filename != "":
            size = 245  # lower circle size
            circle = create_circle_photo(achiever_photo, size)
            poster.alpha_composite(circle, (710, 1005))

        if leader_name:
            draw_text_with_shadow(poster, leader_name, 530, 560, 32, "Frasa", "#C5A35C")
        if leader_place:
            draw_text_with_shadow(poster, leader_place, 530, 610, 26, "Frasa", "white")
        if achiever_name:
            draw_text_with_shadow(poster, achiever_name, 130, 1100, 28, "Garat", "white")
        if rank:
            draw_text_with_shadow(poster, f"AWPL, {rank}", 130, 1145, 22, "Alice", "white")
        if phone:
            draw_text_with_shadow(poster, f"FOR SUCCESS CALL ON - {phone}", 100, 1295, 18, "Canva", "black")

        output = BytesIO()
        poster.convert("RGB").save(output, format="PNG")
        output.seek(0)
        return send_file(output, mimetype="image/png")

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)