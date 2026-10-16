import uuid
from flask import Blueprint, request, jsonify, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app.models.base import db
from backend.app.models.user import User, UserRole, Organization
from backend.app.models.ewaste import EWasteRequest, RequestStatus, RequestStatusHistory, DeviceCategory
from backend.app.models.rewards import CommunityCampaign
from backend.app.services.csv_service import CSVService
from backend.app.services.audit_service import AuditService

organization_bp = Blueprint("organization", __name__)

@organization_bp.route("/bulk-template", methods=["GET"])
def download_bulk_template():
    csv_text = CSVService.generate_bulk_template_csv()
    response = make_response(csv_text)
    response.headers["Content-Type"] = "text/csv"
    response.headers["Content-Disposition"] = "attachment; filename=ecocycle_bulk_device_inventory_template.csv"
    return response


@organization_bp.route("/bulk-upload", methods=["POST"])
@jwt_required()
def upload_bulk_inventory():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    if "file" not in request.files:
        return jsonify({"error": "No CSV file provided in 'file' form field"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    try:
        content = file.read().decode("utf-8")
    except Exception:
        return jsonify({"error": "Could not decode file as UTF-8 text."}), 400

    parsed = CSVService.validate_and_parse_bulk_csv(content)
    if not parsed["success"]:
        return jsonify({
            "success": False,
            "errors": parsed["errors"],
            "total_valid_rows": parsed.get("total_valid_rows", 0)
        }), 400

    # Ensure organization exists or link
    org_id = user.organization_id
    if not org_id:
        org = Organization(
            name=user.full_name + " Institution",
            org_type="college",
            contact_email=user.email,
            contact_phone=user.phone,
            city="Hyderabad",
            state="Telangana"
        )
        db.session.add(org)
        db.session.flush()
        user.organization_id = org.id
        org_id = org.id

    created_requests = []
    category_cache = {c.name: c for c in DeviceCategory.query.all()}

    for row in parsed["rows"]:
        cat_obj = category_cache.get(row["category"])
        req_code = f"ORG-2026-{uuid.uuid4().hex[:6].upper()}"
        
        req = EWasteRequest(
            request_code=req_code,
            user_id=user.id,
            category_id=cat_obj.id if cat_obj else None,
            organization_id=org_id,
            device_name=row["device_name"],
            device_description=f"Bulk institutional import. Asset tag: {row['serial_or_asset_tag']}. Location: {row['location_notes']}",
            quantity=row["quantity"],
            estimated_weight_kg=row["estimated_weight_kg"],
            status=RequestStatus.SUBMITTED,
            recommendation="reuse" if row["condition"] == "working" else "recycle",
            carbon_offset_kg=round(row["estimated_weight_kg"] * 2.8, 2)
        )
        db.session.add(req)
        created_requests.append(req_code)

    db.session.commit()
    AuditService.log_event("BULK_UPLOAD", actor_user_id=user.id, target_type="organization", target_id=org_id, details={"count": len(created_requests), "total_weight": parsed["total_estimated_weight_kg"]})

    return jsonify({
        "success": True,
        "message": f"Successfully processed {len(created_requests)} batch items ({parsed['total_quantity']} total units, ~{parsed['total_estimated_weight_kg']} kg).",
        "total_requests_created": len(created_requests),
        "total_weight_kg": parsed["total_estimated_weight_kg"],
        "sample_codes": created_requests[:5]
    }), 201


@organization_bp.route("/campaigns", methods=["GET", "POST"])
def manage_campaigns():
    if request.method == "GET":
        campaigns = CommunityCampaign.query.filter_by(is_active=True).all()
        return jsonify({"campaigns": [c.to_dict() for c in campaigns]}), 200

    # POST new campaign
    data = request.get_json() or {}
    new_camp = CommunityCampaign(
        title=data.get("title", "Campus Green Drive"),
        title_te=data.get("title_te"),
        description=data.get("description", "Community e-waste collection drive"),
        description_te=data.get("description_te"),
        city=data.get("city", "Hyderabad"),
        location_name=data.get("location_name", "Main Auditorium"),
        target_weight_kg=float(data.get("target_weight_kg", 500.0)),
        start_date=data.get("start_date", "2026-10-01"),
        end_date=data.get("end_date", "2026-10-31"),
        image_url=data.get("image_url")
    )
    db.session.add(new_camp)
    db.session.commit()
    return jsonify({"message": "Campaign created", "campaign": new_camp.to_dict()}), 201
