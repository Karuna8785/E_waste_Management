import os
import uuid
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from backend.app.services.ai_service import AIService

ai_bp = Blueprint("ai", __name__)

@ai_bp.route("/analyze-image", methods=["POST"])
def analyze_image():
    if "image" not in request.files:
        return jsonify({"error": "No image file provided in 'image' form field"}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    filename = secure_filename(file.filename)
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in current_app.config["ALLOWED_EXTENSIONS"]:
        return jsonify({
            "error": f"Unsupported file type .{ext}. Allowed types: {', '.join(current_app.config['ALLOWED_EXTENSIONS'])}"
        }), 400

    try:
        raw_bytes = file.read()
        if len(raw_bytes) > current_app.config["MAX_CONTENT_LENGTH"]:
            return jsonify({"error": "File size exceeds maximum allowed limit (16MB)"}), 400

        # Validate and normalize
        normalized_img = AIService.validate_and_normalize_image(raw_bytes)

        # Generate safe unique filename and save to uploads folder
        unique_filename = f"ewaste_{uuid.uuid4().hex[:12]}.jpg"
        upload_folder = current_app.config["UPLOAD_FOLDER"]
        os.makedirs(upload_folder, exist_ok=True)
        save_path = os.path.join(upload_folder, unique_filename)
        normalized_img.save(save_path, "JPEG", quality=88)

        # Run Computer Vision inference
        cv_result = AIService.analyze_image_features(normalized_img)

        # Retrieve material benchmark recovery profile for the detected category
        cat_name = cv_result["predicted_category"]
        benchmarks = AIService.MATERIAL_BENCHMARKS.get(cat_name, AIService.MATERIAL_BENCHMARKS["Other Electronic Accessory"])

        return jsonify({
            "success": True,
            "image_filename": unique_filename,
            "image_url": f"/uploads/{unique_filename}",
            "model_version": AIService.MODEL_VERSION,
            "prediction": {
                "predicted_category": cv_result["predicted_category"],
                "confidence": cv_result["confidence"],
                "secondary_predictions": cv_result["secondary_predictions"],
                "visual_flags": cv_result["visual_flags"],
                "features": cv_result["features"],
                "benchmark_materials": benchmarks,
                "confidence_threshold_met": cv_result["confidence"] >= current_app.config["AI_CONFIDENCE_THRESHOLD"]
            }
        }), 200

    except ValueError as val_err:
        return jsonify({"error": str(val_err)}), 400
    except Exception as e:
        return jsonify({"error": f"Image processing failed: {str(e)}"}), 500


@ai_bp.route("/recommendation", methods=["POST"])
def get_recommendation():
    data = request.get_json() or {}
    category = data.get("category", "Other Electronic Accessory")
    questionnaire = data.get("questionnaire", {})
    visual_flags = data.get("visual_flags", {})

    result = AIService.evaluate_condition_and_recommend(
        category=category,
        questionnaire=questionnaire,
        visual_flags=visual_flags
    )

    return jsonify({
        "success": True,
        "recommendation": result["recommendation"],
        "safety_flag": result["safety_flag"],
        "safety_notes": result["safety_notes"],
        "reasoning_en": result["reasoning_en"],
        "reasoning_te": result["reasoning_te"],
    }), 200
