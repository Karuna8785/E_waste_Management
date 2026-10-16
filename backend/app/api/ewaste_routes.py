import uuid
import json
from flask import Blueprint, request, jsonify, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app.models.base import db, utc_now
from backend.app.models.user import User, Address
from backend.app.models.ewaste import DeviceCategory, EWasteRequest, RequestStatus, RequestStatusHistory
from backend.app.models.ai_analysis import AIAnalysisRecord
from backend.app.models.pickup import HandoverReceipt
from backend.app.models.partner import ProcessingCertificate
from backend.app.services.audit_service import AuditService
from backend.app.services.pdf_service import PDFService

ewaste_bp = Blueprint("ewaste", __name__)

@ewaste_bp.route("/categories", methods=["GET"])
def get_categories():
    cats = DeviceCategory.query.all()
    return jsonify({"categories": [c.to_dict() for c in cats]}), 200


@ewaste_bp.route("/requests", methods=["GET", "POST"])
@jwt_required()
def handle_requests():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    if request.method == "GET":
        status_filter = request.args.get("status")
        query = EWasteRequest.query.filter_by(user_id=user_id)
        if status_filter:
            query = query.filter_by(status=status_filter)
        
        requests = query.order_by(EWasteRequest.created_at.desc()).all()
        return jsonify({"requests": [r.to_dict() for r in requests]}), 200

    # POST - Create new e-waste request
    data = request.get_json() or {}
    device_name = (data.get("device_name") or "").strip()
    if not device_name:
        return jsonify({"error": "device_name is required"}), 400

    category_id = data.get("category_id")
    category = DeviceCategory.query.get(category_id) if category_id else None

    # Generate human-readable unique tracking code e.g. ECO-2026-X8F9
    random_suffix = uuid.uuid4().hex[:6].upper()
    request_code = f"ECO-2026-{random_suffix}"

    address_id = data.get("address_id")
    if not address_id and user.addresses.count() > 0:
        default_addr = user.addresses.filter_by(is_default=True).first() or user.addresses.first()
        address_id = default_addr.id

    new_req = EWasteRequest(
        request_code=request_code,
        user_id=user.id,
        category_id=category.id if category else None,
        organization_id=user.organization_id,
        device_name=device_name,
        device_model=data.get("device_model"),
        device_description=data.get("device_description"),
        quantity=max(1, int(data.get("quantity", 1))),
        estimated_weight_kg=max(0.1, float(data.get("estimated_weight_kg", 1.0))),
        image_path=data.get("image_path"),
        status=RequestStatus.SUBMITTED,
        safety_flag=data.get("safety_flag", False),
        safety_notes=data.get("safety_notes"),
        recommendation=data.get("recommendation", "recycle"),
        address_id=address_id,
        pickup_date=data.get("pickup_date"),
        pickup_time_slot=data.get("pickup_time_slot", "09:00 AM - 01:00 PM"),
        carbon_offset_kg=round(float(data.get("estimated_weight_kg", 1.0)) * 2.8, 2)
    )
    db.session.add(new_req)
    db.session.flush()

    # Log status history
    history = RequestStatusHistory(
        request_id=new_req.id,
        previous_status=None,
        new_status=RequestStatus.SUBMITTED,
        changed_by_user_id=user.id,
        notes="E-waste request successfully submitted by user."
    )
    db.session.add(history)

    # Attach AI record if provided
    ai_data = data.get("ai_analysis")
    if ai_data:
        ai_rec = AIAnalysisRecord(
            request_id=new_req.id,
            image_filename=ai_data.get("image_filename", "unspecified.jpg"),
            model_version=ai_data.get("model_version", "EcoCycle-Vision-v1.4"),
            predicted_category=ai_data.get("predicted_category", category.name if category else "E-Waste"),
            confidence=float(ai_data.get("confidence", 0.90)),
            secondary_predictions_json=json.dumps(ai_data.get("secondary_predictions", [])),
            has_cracked_screen=ai_data.get("visual_flags", {}).get("has_cracked_screen", False),
            has_swollen_battery=ai_data.get("visual_flags", {}).get("has_swollen_battery", False),
            has_burn_or_corrosion=ai_data.get("visual_flags", {}).get("has_burn_or_corrosion", False),
            has_missing_casing=ai_data.get("visual_flags", {}).get("has_missing_casing", False),
            answers_json=json.dumps(data.get("questionnaire", {})),
            recommendation=new_req.recommendation,
            reasoning_en=ai_data.get("reasoning_en", "Evaluated by EcoCycle AI inference system."),
            reasoning_te=ai_data.get("reasoning_te", "ఎకోసైకిల్ AI సిస్టమ్ ద్వారా విశ్లేషించబడింది."),
            estimated_materials_json=json.dumps(ai_data.get("benchmark_materials", {}))
        )
        db.session.add(ai_rec)

    db.session.commit()

    AuditService.log_event("REQUEST_CREATED", actor_user_id=user.id, target_type="ewaste_request", target_id=new_req.id, details={"code": request_code})
    AuditService.send_notification(
        user_id=user.id,
        title="Request Submitted",
        title_te="అభ్యర్థన సమర్పించబడింది",
        message=f"Your request {request_code} for {device_name} has been received. We are scheduling an EcoCollector.",
        message_te=f"మీ అభ్యర్థన {request_code} విజయవంతంగా నమోదైంది. కలెక్టర్ కేటాయింపు ప్రక్రియలో ఉంది.",
        action_url=f"/requests/{new_req.id}"
    )

    return jsonify({"message": "Request created successfully", "request": new_req.to_dict()}), 201


@ewaste_bp.route("/requests/<request_id>", methods=["GET"])
@jwt_required()
def get_request_detail(request_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    req = EWasteRequest.query.get(request_id)
    if not req:
        return jsonify({"error": "Request not found"}), 404

    # Allow owner, collector, partner, or admin
    if req.user_id != user_id and req.assigned_collector_id != user_id and user.role not in ["admin", "super_admin", "partner"]:
        return jsonify({"error": "Forbidden"}), 403

    resp_data = req.to_dict()
    resp_data["status_history"] = [h.to_dict() for h in req.status_history]
    if req.ai_analysis:
        resp_data["ai_analysis"] = req.ai_analysis.to_dict()
    if req.handover_receipt:
        resp_data["handover_receipt"] = req.handover_receipt.to_dict()

    return jsonify({"request": resp_data}), 200


@ewaste_bp.route("/requests/<request_id>/cancel", methods=["POST"])
@jwt_required()
def cancel_request(request_id):
    user_id = get_jwt_identity()
    req = EWasteRequest.query.get(request_id)
    if not req:
        return jsonify({"error": "Request not found"}), 404

    if req.user_id != user_id:
        return jsonify({"error": "Forbidden"}), 403

    if req.status in [RequestStatus.COLLECTED, RequestStatus.IN_TRANSIT, RequestStatus.COMPLETED]:
        return jsonify({"error": "Cannot cancel request that has already been collected."}), 400

    old_status = req.status
    req.status = RequestStatus.CANCELLED
    history = RequestStatusHistory(
        request_id=req.id,
        previous_status=old_status,
        new_status=RequestStatus.CANCELLED,
        changed_by_user_id=user_id,
        notes="Cancelled by user."
    )
    db.session.add(history)
    db.session.commit()

    AuditService.log_event("REQUEST_CANCELLED", actor_user_id=user_id, target_type="ewaste_request", target_id=req.id)
    return jsonify({"message": "Request cancelled successfully", "status": RequestStatus.CANCELLED}), 200


@ewaste_bp.route("/requests/<request_id>/schedule-pickup", methods=["POST"])
@jwt_required()
def schedule_pickup(request_id):
    user_id = get_jwt_identity()
    req = EWasteRequest.query.get(request_id)
    if not req:
        return jsonify({"error": "Request not found"}), 404

    if req.user_id != user_id:
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json() or {}
    pickup_date = data.get("pickup_date")
    pickup_slot = data.get("pickup_slot", "morning")
    address_details = data.get("address_details")

    if not pickup_date:
        return jsonify({"error": "pickup_date is required"}), 400

    from datetime import datetime
    try:
        req.pickup_date = datetime.strptime(pickup_date, "%Y-%m-%d").date()
    except Exception:
        req.pickup_date = datetime.utcnow().date()

    req.pickup_slot = pickup_slot
    if address_details:
        req.pickup_address_text = address_details

    old_status = req.status
    req.status = RequestStatus.PICKUP_SCHEDULED
    history = RequestStatusHistory(
        request_id=req.id,
        previous_status=old_status,
        new_status=RequestStatus.PICKUP_SCHEDULED,
        changed_by_user_id=user_id,
        notes=f"Pickup scheduled for {pickup_date} ({pickup_slot})."
    )
    db.session.add(history)
    db.session.commit()

    AuditService.log_event("PICKUP_SCHEDULED", actor_user_id=user_id, target_type="ewaste_request", target_id=req.id)
    return jsonify({
        "message": "Pickup scheduled successfully",
        "request": req.to_dict()
    }), 200


@ewaste_bp.route("/requests/<request_id>/receipt", methods=["GET"])
@jwt_required()
def download_handover_receipt(request_id):
    req = EWasteRequest.query.get(request_id)
    if not req or not req.handover_receipt:
        return jsonify({"error": "Handover receipt not yet available for this request."}), 404

    receipt = req.handover_receipt
    receipt_data = {
        "receipt_code": receipt.receipt_code,
        "request_code": req.request_code,
        "created_at": receipt.created_at.strftime("%Y-%m-%d %H:%M UTC"),
        "city": req.address.city if req.address else "Hyderabad",
        "user_name": req.user.full_name,
        "user_phone": req.user.phone,
        "street_address": req.address.street_address if req.address else "N/A",
        "collector_name": receipt.collector.full_name if receipt.collector else "Certified Collector",
        "collector_id": receipt.collector_id,
        "device_name": req.device_name,
        "category_name": req.category.name if req.category else "E-Waste",
        "verified_item_count": receipt.verified_item_count,
        "verified_weight_kg": receipt.verified_weight_kg,
        "recommendation": req.recommendation,
        "verification_hash": receipt.verification_hash,
    }

    pdf_bytes = PDFService.generate_handover_receipt(receipt_data)
    response = make_response(pdf_bytes)
    response.headers["Content-Type"] = "application/pdf"
    response.headers["Content-Disposition"] = f"attachment; filename=Receipt_{receipt.receipt_code}.pdf"
    return response


@ewaste_bp.route("/requests/<request_id>/certificate", methods=["GET"])
@jwt_required()
def download_recycling_certificate(request_id):
    cert = ProcessingCertificate.query.filter_by(request_id=request_id).first()
    if not cert:
        return jsonify({"error": "Certificate not yet issued. Processing must be finalized by partner facility."}), 404

    req = cert.request
    partner = cert.partner

    # Fetch material recoveries
    processing_rec = req.partner.shipments.first()  # or direct link
    cert_data = {
        "certificate_number": cert.certificate_number,
        "request_code": req.request_code,
        "partner_name": partner.organization_name,
        "cpcb_license": partner.cpcb_license_number or "TS-SPCB-2026-EW-5412",
        "total_weight_kg": cert.total_weight_kg,
        "carbon_offset_kg": req.carbon_offset_kg or (cert.total_weight_kg * 2.8),
        "digital_signature_hash": cert.digital_signature_hash,
    }

    pdf_bytes = PDFService.generate_processing_certificate(cert_data)
    response = make_response(pdf_bytes)
    response.headers["Content-Type"] = "application/pdf"
    response.headers["Content-Disposition"] = f"attachment; filename=Certificate_{cert.certificate_number}.pdf"
    return response
