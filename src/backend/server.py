from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from PIL import Image, ImageDraw, ImageFont
import requests
from io import BytesIO
import os

app = Flask(__name__)
CORS(app)

# ==============================
# TUMHARA CLOUDINARY LINK - YAHI PE HARDCODED HAI
# ==============================
# Ab frontend me URL bhejne ki zarurat nahi
DEFAULT_TEMPLATE_URL = "https://res.cloudinary.com/httsesgq/image/upload/v1788294115/star_sapphire_3.png"

# 72 templates ke liye baad me yaha list banayenge
TEMPLATE_CONFIG = {
    "default": {
        "leader": {"left": 0.038, "top": 0.065, "size": 0.235},
        "achiever": {"left": 0.688, "top": 0.688, "size": 0.202},
        "leader_name": {"left": 0.515, "top": 0.212, "font_size": 0.0332, "font": "Frasa"},
        "leader_place": {"left": 0.515, "top": 0.268, "font_size": 0.0332, "font": "Frasa"},
        "achiever_name": {"left": 0.255, "top": 0.732, "font_size": 0.0293, "font": "Garat"},
        "rank": {"left": 0.255, "top": 0.758, "font_size": 0.0254, "font": "Alice"},
        "phone": {"left": 0.095, "top": 0.830, "font_size": 0.0166, "font": "Canva"}
    }
}

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
                return ImageFont.truetype(path, size)
            except: pass
    
    for p in ["C:/Windows/Fonts/arialbd.ttf", "C:/Windows/Fonts/arial.ttf"]:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
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

def draw_text_with_shadow(image, text, x, y, font_size, font_type):
    draw = ImageDraw.Draw(image)
    font = get_font(font_type, int(font_size))
    shadow_offset = max(2, int(font_size * 0.06))
    draw.text((x + shadow_offset, y + shadow_offset), text, font=font, fill=(0,0,0,160))
    draw.text((x, y), text, font=font, fill="white")

@app.route("/health")
def health():
    return jsonify({"status": "ok"})

@app.route("/generate", methods=["POST"])
def generate():
    try:
        # YAHAN SE URL AAYEGA - AGAR FRONTEND SE AAYA TOH WOH, NAHI TOH TUMHARA DEFAULT WALA
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
        width, height = poster.size
        config = TEMPLATE_CONFIG["default"]

        if leader_photo and leader_photo.filename != "":
            size = int(width * config["leader"]["size"])
            circle = create_circle_photo(leader_photo, size)
            x = int(width * config["leader"]["left"])
            y = int(height * config["leader"]["top"])
            poster.alpha_composite(circle, (x, y))

        if achiever_photo and achiever_photo.filename != "":
            size = int(width * config["achiever"]["size"])
            circle = create_circle_photo(achiever_photo, size)
            x = int(width * config["achiever"]["left"])
            y = int(height * config["achiever"]["top"])
            poster.alpha_composite(circle, (x, y))

        if leader_name:
            x = int(width * config["leader_name"]["left"])
            y = int(height * config["leader_name"]["top"])
            draw_text_with_shadow(poster, leader_name, x, y, width * config["leader_name"]["font_size"], config["leader_name"]["font"])
        if leader_place:
            x = int(width * config["leader_place"]["left"])
            y = int(height * config["leader_place"]["top"])
            draw_text_with_shadow(poster, leader_place, x, y, width * config["leader_place"]["font_size"], config["leader_place"]["font"])
        if achiever_name:
            x = int(width * config["achiever_name"]["left"])
            y = int(height * config["achiever_name"]["top"])
            draw_text_with_shadow(poster, achiever_name, x, y, width * config["achiever_name"]["font_size"], config["achiever_name"]["font"])
        if rank:
            rank_text = f"AWPL, {rank}"
            x = int(width * config["rank"]["left"])
            y = int(height * config["rank"]["top"])
            draw_text_with_shadow(poster, rank_text, x, y, width * config["rank"]["font_size"], config["rank"]["font"])
        if phone:
            phone_text = f"FOR SUCCESS CALL ON - {phone}"
            x = int(width * config["phone"]["left"])
            y = int(height * config["phone"]["top"])
            draw_text_with_shadow(poster, phone_text, x, y, width * config["phone"]["font_size"], config["phone"]["font"])

        output = BytesIO()
        poster.convert("RGB").save(output, format="PNG")
        output.seek(0)
        return send_file(output, mimetype="image/png")

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)