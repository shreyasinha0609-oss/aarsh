from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from PIL import Image, ImageDraw, ImageFont
import requests
from io import BytesIO
import os
import razorpay
import hmac
import hashlib

app = Flask(__name__)
CORS(app)

# ==========================================
# RAZORPAY CONFIGURATION
# Dashboard se mili hui actual Keys ko yahan paste karein
RAZORPAY_KEY_ID = "rzp_live_TXxXsCX79t33yI"
RAZORPAY_KEY_SECRET = "T87XYAUr7glt6mGZmGRjUaxT"

razor_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
# ==========================================

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
    shadow_color = (0,0,0,160) if color != "black" else (255,255,255,100)
    draw.text((x + shadow_offset, y + shadow_offset), text, font=font, fill=shadow_color)
    draw.text((x, y), text, font=font, fill=color)

@app.route("/health")
def health():
    return jsonify({"status": "ok"})

# ==========================================
# DYNAMIC RAZORPAY API ENDPOINTS
# ==========================================

@app.route("/create-order", methods=["POST"])
def create_order():
    try:
        data = request.get_json() or {}
        # Amount in rupees equal to selected points (1 Point = ₹1)
        amount_in_rupees = data.get("amount", 100)
        amount_in_paise = int(amount_in_rupees) * 100

        order_data = {
            "amount": amount_in_paise,
            "currency": "INR",
            "payment_capture": 1
        }
        order = razor_client.order.create(data=order_data)

        return jsonify({
            "id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "key_id": RAZORPAY_KEY_ID
        })
    except Exception as e:
        print("Razorpay Order Creation Error:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/verify-payment", methods=["POST"])
def verify_payment():
    try:
        data = request.get_json() or {}
        razorpay_order_id = data.get("razorpay_order_id")
        razorpay_payment_id = data.get("razorpay_payment_id")
        razorpay_signature = data.get("razorpay_signature")
        selected_points = data.get("selectedPoints", 100)

        # Signature verification
        msg = f"{razorpay_order_id}|{razorpay_payment_id}"
        generated_signature = hmac.new(
            RAZORPAY_KEY_SECRET.encode('utf-8'),
            msg.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

        if generated_signature == razorpay_signature:
            # Payment Successful & Verified
            return jsonify({
                "success": True,
                "message": "Payment verified successfully",
                "addedPoints": selected_points
            })
        else:
            return jsonify({"success": False, "message": "Invalid Signature"}), 400

    except Exception as e:
        print("Razorpay Payment Verification Error:", e)
        return jsonify({"error": str(e)}), 500


# ==========================================
# POSTER GENERATION ENDPOINT
# ==========================================

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
        
        poster = poster.resize((1024, 1536), Image.LANCZOS)

        if leader_photo and leader_photo.filename != "":
            size = 332
            circle = create_circle_photo(leader_photo, size)
            poster.alpha_composite(circle, (58, 195))

        if achiever_photo and achiever_photo.filename != "":
            size = 245
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