from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from PIL import Image, ImageDraw, ImageFont
import requests
from io import BytesIO
import os
import razorpay
import hmac
import hashlib
import secrets
import re
import json
from datetime import datetime, timezone

# Firebase Admin
import firebase_admin
from firebase_admin import credentials, auth, firestore


app = Flask(__name__)
CORS(app)


# =========================================================
# FIREBASE ADMIN INITIALIZATION
# =========================================================

firebase_service_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")

if not firebase_service_json:
    raise RuntimeError("FIREBASE_SERVICE_ACCOUNT_JSON is missing")

try:
    service_account_info = json.loads(firebase_service_json)

    if not firebase_admin._apps:
        cred = credentials.Certificate(service_account_info)
        firebase_admin.initialize_app(cred)

    firestore_db = firestore.client()

except Exception as e:
    print("Firebase Admin initialization error:", e)
    raise


# =========================================================
# RAZORPAY
# =========================================================
# IMPORTANT:
# Keys are now taken from Render Environment Variables.
# NEVER put the secret directly inside this file.

RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "")

razor_client = None

if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
    razor_client = razorpay.Client(
        auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)
    )


# =========================================================
# TEMPLATE
# =========================================================

DEFAULT_TEMPLATE_URL = (
    "https://res.cloudinary.com/httsesgq/image/upload/star_sapphire_3.png"
)


# =========================================================
# FONT HELPER
# =========================================================

def get_font(font_type, size):
    base_dir = os.path.dirname(__file__)
    fonts_dir = os.path.join(base_dir, "fonts")

    font_map = {
        "Frasa": [
            "FrasaDisplay-Bold.ttf",
            "FrasaDisplay.ttf",
            "Frasa.ttf"
        ],
        "Garat": [
            "Garat.ttf",
            "Garat-Bold.ttf"
        ],
        "Alice": [
            "ALICE.ttf",
            "Alice-Regular.ttf"
        ],
        "Canva": [
            "CanvaSans.ttf",
            "CanvaSans-Regular.ttf"
        ]
    }

    for fname in font_map.get(font_type, []):
        path = os.path.join(fonts_dir, fname)

        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, int(size))
            except Exception:
                pass

    return ImageFont.load_default()


# =========================================================
# CIRCLE PHOTO
# =========================================================

def create_circle_photo(photo_file, size):
    photo = Image.open(photo_file).convert("RGB")

    w, h = photo.size
    min_side = min(w, h)

    left = (w - min_side) // 2
    top = (h - min_side) // 2

    photo = photo.crop(
        (
            left,
            top,
            left + min_side,
            top + min_side
        )
    )

    photo = photo.resize(
        (size, size),
        Image.LANCZOS
    )

    mask = Image.new(
        "L",
        (size, size),
        0
    )

    ImageDraw.Draw(mask).ellipse(
        (0, 0, size, size),
        fill=255
    )

    result = Image.new(
        "RGBA",
        (size, size),
        (0, 0, 0, 0)
    )

    result.paste(
        photo,
        (0, 0),
        mask
    )

    return result


# =========================================================
# TEXT
# =========================================================

def draw_text_with_shadow(
    image,
    text,
    x,
    y,
    font_size,
    font_type,
    color="white"
):
    draw = ImageDraw.Draw(image)

    font = get_font(
        font_type,
        font_size
    )

    shadow_offset = max(
        2,
        int(font_size * 0.06)
    )

    shadow_color = (
        (0, 0, 0, 160)
        if color != "black"
        else (255, 255, 255, 100)
    )

    draw.text(
        (
            x + shadow_offset,
            y + shadow_offset
        ),
        text,
        font=font,
        fill=shadow_color
    )

    draw.text(
        (x, y),
        text,
        font=font,
        fill=color
    )


# =========================================================
# BASIC HEALTH CHECK
# =========================================================

@app.route("/health")
def health():
    return jsonify({
        "status": "ok",
        "firebase": True
    })


# =========================================================
# AUTH HELPERS
# =========================================================

USERNAME_REGEX = re.compile(
    r"^[a-z0-9_]{4,20}$"
)


def normalize_username(username):
    if not username:
        return ""

    return username.strip().lower()


def validate_pin(pin):
    return bool(
        re.fullmatch(r"\d{4}", str(pin))
    )


def hash_pin(pin, salt=None):
    if salt is None:
        salt = secrets.token_hex(16)

    pin_hash = hashlib.pbkdf2_hmac(
        "sha256",
        str(pin).encode("utf-8"),
        salt.encode("utf-8"),
        150000
    ).hex()

    return pin_hash, salt


def verify_pin(pin, stored_hash, salt):
    calculated_hash, _ = hash_pin(
        pin,
        salt
    )

    return hmac.compare_digest(
        calculated_hash,
        stored_hash
    )


def verify_firebase_token(id_token):
    if not id_token:
        raise ValueError("Firebase ID token is required")

    decoded_token = auth.verify_id_token(
        id_token
    )

    return decoded_token


# =========================================================
# GENERATE USERNAME
# =========================================================

def generate_unique_username(name):
    name = (name or "user").lower()

    name = re.sub(
        r"[^a-z0-9]",
        "",
        name
    )

    if not name:
        name = "user"

    name = name[:12]

    for _ in range(20):

        random_number = secrets.randbelow(9000) + 1000

        username = f"{name}{random_number}"

        existing = (
            firestore_db
            .collection("users")
            .where(
                "usernameLower",
                "==",
                username
            )
            .limit(1)
            .stream()
        )

        if not any(existing):
            return username

    raise RuntimeError(
        "Could not generate unique username"
    )


# =========================================================
# GOOGLE FIRST LOGIN / PROFILE SETUP
# =========================================================

@app.route(
    "/auth/setup-profile",
    methods=["POST"]
)
def setup_profile():

    try:
        data = request.get_json() or {}

        id_token = data.get("idToken")
        requested_username = normalize_username(
            data.get("username")
        )
        pin = str(data.get("pin", ""))

        # ---------------------------------------------
        # VERIFY GOOGLE/FIREBASE LOGIN
        # ---------------------------------------------

        decoded_token = verify_firebase_token(
            id_token
        )

        uid = decoded_token["uid"]

        email = decoded_token.get(
            "email",
            ""
        )

        name = (
            decoded_token.get("name")
            or email.split("@")[0]
            or "User"
        )

        photo = decoded_token.get(
            "picture",
            ""
        )

        # ---------------------------------------------
        # PIN VALIDATION
        # ---------------------------------------------

        if not validate_pin(pin):
            return jsonify({
                "success": False,
                "message": "PIN must be exactly 4 digits."
            }), 400

        # ---------------------------------------------
        # GET USER DOCUMENT
        # ---------------------------------------------

        user_ref = firestore_db.collection(
            "users"
        ).document(uid)

        user_doc = user_ref.get()

        # ---------------------------------------------
        # USERNAME
        # ---------------------------------------------

        if requested_username:

            if not USERNAME_REGEX.match(
                requested_username
            ):
                return jsonify({
                    "success": False,
                    "message": (
                        "Username must be 4-20 characters "
                        "and contain only letters, numbers "
                        "or underscore."
                    )
                }), 400

            username = requested_username

        else:
            username = generate_unique_username(
                name
            )

        # ---------------------------------------------
        # CHECK USERNAME UNIQUE
        # ---------------------------------------------

        username_query = (
            firestore_db
            .collection("users")
            .where(
                "usernameLower",
                "==",
                username
            )
            .limit(1)
            .stream()
        )

        for existing_doc in username_query:

            if existing_doc.id != uid:
                return jsonify({
                    "success": False,
                    "message": "Username already exists."
                }), 409

        # ---------------------------------------------
        # HASH PIN
        # ---------------------------------------------

        pin_hash, pin_salt = hash_pin(pin)

        # ---------------------------------------------
        # PRESERVE EXISTING CREDITS
        # ---------------------------------------------

        credits = 0

        if user_doc.exists:

            old_data = user_doc.to_dict() or {}

            credits = old_data.get(
                "credits",
                0
            )

        # ---------------------------------------------
        # SAVE PROFILE
        # ---------------------------------------------

        user_data = {
            "uid": uid,
            "username": username,
            "usernameLower": username,
            "pinHash": pin_hash,
            "pinSalt": pin_salt,
            "name": name,
            "email": email,
            "photo": photo,
            "credits": credits,
            "authProvider": "google",
            "updatedAt": datetime.now(
                timezone.utc
            )
        }

        if not user_doc.exists:

            user_data["createdAt"] = datetime.now(
                timezone.utc
            )

        user_ref.set(
            user_data,
            merge=True
        )

        # ---------------------------------------------
        # FIREBASE CUSTOM TOKEN
        # ---------------------------------------------

        custom_token = auth.create_custom_token(
            uid
        )

        return jsonify({
            "success": True,
            "message": "Profile created successfully.",
            "customToken": custom_token.decode("utf-8"),
            "uid": uid,
            "username": username,
            "name": name,
            "email": email,
            "photo": photo
        })

    except Exception as e:

        print(
            "Setup Profile Error:",
            str(e)
        )

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# =========================================================
# USERNAME + 4 DIGIT PIN LOGIN
# =========================================================

@app.route(
    "/auth/login",
    methods=["POST"]
)
def username_login():

    try:
        data = request.get_json() or {}

        username = normalize_username(
            data.get("username")
        )

        pin = str(
            data.get("pin", "")
        )

        # ---------------------------------------------
        # VALIDATION
        # ---------------------------------------------

        if not username:
            return jsonify({
                "success": False,
                "message": "Username is required."
            }), 400

        if not validate_pin(pin):
            return jsonify({
                "success": False,
                "message": "PIN must be exactly 4 digits."
            }), 400

        # ---------------------------------------------
        # FIND USER
        # ---------------------------------------------

        query = (
            firestore_db
            .collection("users")
            .where(
                "usernameLower",
                "==",
                username
            )
            .limit(1)
            .stream()
        )

        user_doc = None

        for doc_snapshot in query:
            user_doc = doc_snapshot
            break

        if user_doc is None:

            return jsonify({
                "success": False,
                "message": "Invalid username or PIN."
            }), 401

        user_data = user_doc.to_dict()

        stored_hash = user_data.get(
            "pinHash"
        )

        stored_salt = user_data.get(
            "pinSalt"
        )

        if not stored_hash or not stored_salt:

            return jsonify({
                "success": False,
                "message": (
                    "PIN is not configured for this account."
                )
            }), 401

        # ---------------------------------------------
        # VERIFY PIN
        # ---------------------------------------------

        if not verify_pin(
            pin,
            stored_hash,
            stored_salt
        ):

            return jsonify({
                "success": False,
                "message": "Invalid username or PIN."
            }), 401

        uid = user_data.get(
            "uid",
            user_doc.id
        )

        # ---------------------------------------------
        # CREATE FIREBASE CUSTOM TOKEN
        # ---------------------------------------------

        custom_token = auth.create_custom_token(
            uid
        )

        # ---------------------------------------------
        # UPDATE LOGIN TIME
        # ---------------------------------------------

        firestore_db.collection(
            "users"
        ).document(uid).set(
            {
                "lastLoginAt": datetime.now(
                    timezone.utc
                )
            },
            merge=True
        )

        return jsonify({
            "success": True,
            "message": "Login successful.",
            "customToken": custom_token.decode("utf-8"),
            "uid": uid,
            "username": user_data.get(
                "username",
                username
            ),
            "name": user_data.get(
                "name",
                ""
            ),
            "email": user_data.get(
                "email",
                ""
            ),
            "photo": user_data.get(
                "photo",
                ""
            )
        })

    except Exception as e:

        print(
            "Username Login Error:",
            str(e)
        )

        return jsonify({
            "success": False,
            "message": "Login failed."
        }), 500


# =========================================================
# RAZORPAY CREATE ORDER
# =========================================================

@app.route(
    "/create-order",
    methods=["POST"]
)
def create_order():

    try:

        if razor_client is None:
            return jsonify({
                "error": "Razorpay is not configured yet."
            }), 503

        data = request.get_json() or {}

        amount_in_rupees = data.get(
            "amount",
            100
        )

        amount_in_paise = (
            int(amount_in_rupees) * 100
        )

        order_data = {
            "amount": amount_in_paise,
            "currency": "INR",
            "payment_capture": 1
        }

        order = razor_client.order.create(
            data=order_data
        )

        return jsonify({
            "id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "key_id": RAZORPAY_KEY_ID
        })

    except Exception as e:

        print(
            "Razorpay Order Creation Error:",
            e
        )

        return jsonify({
            "error": str(e)
        }), 500


# =========================================================
# RAZORPAY VERIFY PAYMENT
# =========================================================

@app.route(
    "/verify-payment",
    methods=["POST"]
)
def verify_payment():

    try:

        if not RAZORPAY_KEY_SECRET:

            return jsonify({
                "success": False,
                "message": "Razorpay is not configured."
            }), 503

        data = request.get_json() or {}

        razorpay_order_id = data.get(
            "razorpay_order_id"
        )

        razorpay_payment_id = data.get(
            "razorpay_payment_id"
        )

        razorpay_signature = data.get(
            "razorpay_signature"
        )

        if not razorpay_order_id or not razorpay_payment_id or not razorpay_signature:
            return jsonify({
                "success": False,
                "message": "Incomplete Razorpay payment response."
            }), 400

        # Frontend sends the Firebase UID + selected credit pack.
        uid = str(data.get("uid", "")).strip()
        selected_points_raw = data.get(
            "points",
            data.get("selectedPoints", 0)
        )

        if not uid:
            return jsonify({
                "success": False,
                "message": "User UID is required."
            }), 400

        try:
            selected_points = int(selected_points_raw)
        except (TypeError, ValueError):
            return jsonify({
                "success": False,
                "message": "Invalid points value."
            }), 400

        # Keep the credit-pack input within the packs currently used
        # by Aarsh. The actual amount/payment is still verified by Razorpay.
        allowed_points = {30, 100, 200, 500, 1000, 2000}

        if selected_points not in allowed_points:
            return jsonify({
                "success": False,
                "message": "Invalid credit pack."
            }), 400

        msg = (
            f"{razorpay_order_id}|"
            f"{razorpay_payment_id}"
        )

        generated_signature = hmac.new(
            RAZORPAY_KEY_SECRET.encode("utf-8"),
            msg.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(
            generated_signature,
            razorpay_signature or ""
        ):
            return jsonify({
                "success": False,
                "message": "Invalid Signature"
            }), 400

        # -----------------------------------------------------
        # IMPORTANT:
        # Credit the user's Firestore balance only AFTER the
        # Razorpay signature has been verified.
        #
        # A payment ID is used as an idempotency key so refreshing
        # /verify-payment cannot credit the same payment twice.
        # -----------------------------------------------------

        user_ref = firestore_db.collection("users").document(uid)
        payment_ref = (
            firestore_db
            .collection("razorpay_payments")
            .document(razorpay_payment_id)
        )

        transaction = firestore_db.transaction()

        @firestore.transactional
        def apply_payment(transaction):
            existing_payment = payment_ref.get(transaction=transaction)

            # Same Razorpay payment was already processed.
            if existing_payment.exists:
                payment_data = existing_payment.to_dict() or {}
                return {
                    "alreadyProcessed": True,
                    "newCredits": int(
                        payment_data.get("newCredits", 0)
                    ),
                    "addedPoints": int(
                        payment_data.get("addedPoints", selected_points)
                    )
                }

            user_snapshot = user_ref.get(transaction=transaction)

            if not user_snapshot.exists:
                raise ValueError("User account not found.")

            user_data = user_snapshot.to_dict() or {}

            try:
                old_credits = int(user_data.get("credits", 0) or 0)
            except (TypeError, ValueError):
                old_credits = 0

            new_credits = old_credits + selected_points
            now = datetime.now(timezone.utc)

            transaction.set(
                user_ref,
                {
                    "credits": new_credits,
                    "updatedAt": now
                },
                merge=True
            )

            transaction.set(
                payment_ref,
                {
                    "paymentId": razorpay_payment_id,
                    "orderId": razorpay_order_id,
                    "uid": uid,
                    "addedPoints": selected_points,
                    "previousCredits": old_credits,
                    "newCredits": new_credits,
                    "status": "verified",
                    "createdAt": now
                },
                merge=False
            )

            return {
                "alreadyProcessed": False,
                "newCredits": new_credits,
                "addedPoints": selected_points
            }

        result = apply_payment(transaction)

        return jsonify({
            "success": True,
            "message": (
                "Payment verified and credits updated successfully."
            ),
            "addedPoints": result["addedPoints"],
            "newCredits": result["newCredits"],
            "alreadyProcessed": result["alreadyProcessed"]
        })

        return jsonify({
            "success": False,
            "message": "Invalid Signature"
        }), 400

    except Exception as e:

        print(
            "Razorpay Payment Verification Error:",
            e
        )

        return jsonify({
            "error": str(e)
        }), 500


# =========================================================
# POSTER GENERATION
# =========================================================

@app.route(
    "/generate",
    methods=["POST"]
)
def generate():

    try:

        template_url = request.form.get(
            "template_url"
        )

        if (
            not template_url
            or template_url.strip() == ""
        ):
            template_url = DEFAULT_TEMPLATE_URL

        leader_name = request.form.get(
            "leader_name",
            ""
        ).strip()

        leader_place = request.form.get(
            "leader_place",
            ""
        ).strip()

        achiever_name = request.form.get(
            "achiever_name",
            ""
        ).strip()

        rank = request.form.get(
            "rank",
            ""
        ).strip()

        phone = request.form.get(
            "phone",
            ""
        ).strip()

        leader_photo = request.files.get(
            "leader_photo"
        )

        achiever_photo = request.files.get(
            "achiever_photo"
        )

        response = requests.get(
            template_url,
            timeout=20
        )

        response.raise_for_status()

        poster = Image.open(
            BytesIO(response.content)
        ).convert("RGBA")

        # IMPORTANT:
        # Aarsh templates are 1067 x 1600.
        poster = poster.resize(
            (1067, 1600),
            Image.LANCZOS
        )

        # ---------------------------------------------
        # LEADER PHOTO
        # ---------------------------------------------

        if (
            leader_photo
            and leader_photo.filename != ""
        ):

            size = 359

            circle = create_circle_photo(
                leader_photo,
                size
            )

            poster.alpha_composite(
                circle,
                (49, 246)
            )

        # ---------------------------------------------
        # ACHIEVER PHOTO
        # ---------------------------------------------

        if (
            achiever_photo
            and achiever_photo.filename != ""
        ):

            size = 247

            circle = create_circle_photo(
                achiever_photo,
                size
            )

            poster.alpha_composite(
                circle,
                (778, 1115)
            )

        # ---------------------------------------------
        # TEXT
        # ---------------------------------------------

        if leader_name:

            draw_text_with_shadow(
                poster,
                leader_name,
                690,
                560,
                23,
                "Frasa",
                "#C5A35C"
            )

        if leader_place:

            draw_text_with_shadow(
                poster,
                leader_place,
                699,
                640,
                27,
                "Garat",
                "white"
            )

        if achiever_name:

            draw_text_with_shadow(
                poster,
                achiever_name,
                376,
                1285,
                24,
                "Frasa",
                "white"
            )

        if rank:

            draw_text_with_shadow(
                poster,
                f"AWPL, {rank}",
                460,
                1330,
                13,
                "Frasa",
                "white"
            )

        if phone:

            draw_text_with_shadow(
                poster,
                f"FOR SUCCESS CALL ON - {phone}",
                144,
                1445,
                18,
                "Alice",
                "black"
            )

        # ---------------------------------------------
        # OUTPUT
        # ---------------------------------------------

        output = BytesIO()

        poster.convert(
            "RGB"
        ).save(
            output,
            format="PNG"
        )

        output.seek(0)

        return send_file(
            output,
            mimetype="image/png"
        )

    except Exception as e:

        print(
            "POSTER ERROR:",
            e
        )

        return jsonify({
            "error": str(e)
        }), 500


# =========================================================
# START SERVER
# =========================================================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=int(
            os.environ.get(
                "PORT",
                5000
            )
        ),
        debug=False
    )