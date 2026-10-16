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


@organization_bp.route("/inventory", methods=["GET"])
@jwt_required()
def get_campus_inventory():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    org_id = user.organization_id if user else None

    query = EWasteRequest.query
    if org_id:
        query = query.filter_by(organization_id=org_id)
    else:
        # Fallback to organization manager user
        query = query.filter_by(user_id=user.id)

    items = query.order_by(EWasteRequest.created_at.desc()).limit(150).all()
    return jsonify({"inventory": [item.to_dict() for item in items]}), 200


@organization_bp.route("/schedule-bulk-pickup", methods=["POST"])
@jwt_required()
def schedule_bulk_pickup():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    org_id = user.organization_id if user else None
    data = request.get_json() or {}

    pickup_date = data.get("pickup_date")
    pickup_time_slot = data.get("time_slot", "10:00 - 13:00")
    special_instructions = data.get("special_instructions", "CBIT Lab clearance - multiple computer towers & CRT monitors.")
    department = data.get("department", "CSE Department Laboratories")

    # Update all submitted items for this org to READY_FOR_PICKUP
    items = EWasteRequest.query.filter_by(organization_id=org_id, status=RequestStatus.SUBMITTED).all()
    if not items:
        # If none exist, create a bulk request item
        req_code = f"CBIT-BULK-2026-{uuid.uuid4().hex[:6].upper()}"
        req = EWasteRequest(
            request_code=req_code,
            user_id=user.id,
            organization_id=org_id,
            device_name=f"Bulk E-Waste Collection ({department})",
            device_description=special_instructions,
            quantity=data.get("quantity", 25),
            estimated_weight_kg=float(data.get("estimated_weight_kg", 320.0)),
            pickup_address_text="Chaitanya Bharathi Institute of Technology (CBIT), Gandipet, Hyderabad - 500075",
            pickup_date=pickup_date,
            pickup_time_slot=pickup_time_slot,
            status=RequestStatus.READY_FOR_PICKUP,
            carbon_offset_kg=round(float(data.get("estimated_weight_kg", 320.0)) * 2.8, 2)
        )
        db.session.add(req)
        items = [req]
    else:
        for item in items:
            item.status = RequestStatus.READY_FOR_PICKUP
            item.pickup_date = pickup_date
            item.pickup_time_slot = pickup_time_slot

    db.session.commit()
    AuditService.log_event("CAMPUS_BULK_PICKUP_SCHEDULED", actor_user_id=user.id, target_type="organization", target_id=org_id, details={"date": pickup_date, "department": department})

    return jsonify({
        "message": f"Bulk pickup scheduled successfully for {len(items)} batches.",
        "pickup_date": pickup_date,
        "time_slot": pickup_time_slot
    }), 201


@organization_bp.route("/departments", methods=["GET"])
@jwt_required()
def get_campus_departments():
    departments = [
        {
            "id": "dept-cse",
            "name": "Computer Science & Engineering (CSE)",
            "coordinator": "Dr. M. Swamy (Assoc. Professor)",
            "active_assets": 142,
            "submitted_kg": 420.5,
            "drives_participated": 4,
            "status": "active"
        },
        {
            "id": "dept-ece",
            "name": "Electronics & Communication Engineering (ECE)",
            "coordinator": "Dr. P. Radha (Professor)",
            "active_assets": 89,
            "submitted_kg": 280.0,
            "drives_participated": 3,
            "status": "active"
        },
        {
            "id": "dept-it",
            "name": "Information Technology (IT)",
            "coordinator": "Prof. B. Srinivas",
            "active_assets": 76,
            "submitted_kg": 195.0,
            "drives_participated": 3,
            "status": "active"
        },
        {
            "id": "dept-mech",
            "name": "Mechanical Engineering (Robotics Lab)",
            "coordinator": "Dr. K. Ashok Kumar",
            "active_assets": 34,
            "submitted_kg": 140.0,
            "drives_participated": 2,
            "status": "active"
        },
        {
            "id": "dept-admin",
            "name": "Administration & Finance Wing",
            "coordinator": "Sri R. V. Ramana (Registrar Office)",
            "active_assets": 55,
            "submitted_kg": 115.5,
            "drives_participated": 4,
            "status": "active"
        },
        {
            "id": "dept-library",
            "name": "Central Library Digital Resource Hub",
            "coordinator": "Mrs. S. Lakshmi (Chief Librarian)",
            "active_assets": 28,
            "submitted_kg": 68.0,
            "drives_participated": 2,
            "status": "active"
        }
    ]
    return jsonify({"departments": departments}), 200
