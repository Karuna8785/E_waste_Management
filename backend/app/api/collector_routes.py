import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app.models.base import db, utc_now
from backend.app.models.user import User, UserRole
from backend.app.models.ewaste import EWasteRequest, RequestStatus, RequestStatusHistory
from backend.app.models.partner import Partner, Shipment
from backend.app.models.pickup import HandoverReceipt, CollectorRouteStop
from backend.app.models.rewards import RewardTransaction
from backend.app.api.auth_middleware import role_required
from backend.app.services.audit_service import AuditService

collector_bp = Blueprint("collector", __name__)

@collector_bp.route("/assigned", methods=["GET"])
@collector_bp.route("/assigned-pickups", methods=["GET"])
@role_required(UserRole.COLLECTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
def get_assigned_pickups():
    user_id = get_jwt_identity()
    requests = EWasteRequest.query.filter_by(assigned_collector_id=user_id).order_by(EWasteRequest.created_at.desc()).all()
    return jsonify({"pickups": [r.to_dict() for r in requests]}), 200


@collector_bp.route("/available", methods=["GET"])
@role_required(UserRole.COLLECTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
def get_available_pickups():
    # Unassigned requests ready for collection
    requests = EWasteRequest.query.filter(
        EWasteRequest.assigned_collector_id.is_(None),
        EWasteRequest.status.in_([RequestStatus.SUBMITTED, RequestStatus.READY_FOR_PICKUP, RequestStatus.AWAITING_CONFIRMATION])
    ).order_by(EWasteRequest.created_at.desc()).all()
    return jsonify({"available_pickups": [r.to_dict() for r in requests]}), 200


@collector_bp.route("/accept/<request_id>", methods=["POST"])
@role_required(UserRole.COLLECTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
def accept_pickup(request_id):
    user_id = get_jwt_identity()
    req = EWasteRequest.query.get(request_id)
    if not req:
        return jsonify({"error": "Request not found"}), 404

    if req.assigned_collector_id and req.assigned_collector_id != user_id:
        return jsonify({"error": "Request is already assigned to another collector."}), 409

    old_status = req.status
    req.assigned_collector_id = user_id
    req.status = RequestStatus.COLLECTOR_ASSIGNED

    history = RequestStatusHistory(
        request_id=req.id,
        previous_status=old_status,
        new_status=RequestStatus.COLLECTOR_ASSIGNED,
        changed_by_user_id=user_id,
        notes="Collector accepted pickup task."
    )
    db.session.add(history)
    db.session.commit()

    AuditService.log_event("PICKUP_ACCEPTED", actor_user_id=user_id, target_type="ewaste_request", target_id=req.id)
    AuditService.send_notification(
        user_id=req.user_id,
        title="Collector Assigned",
        title_te="కలెక్టర్ కేటాయించబడ్డారు",
        message=f"An EcoCycle collector has been assigned to collect your device ({req.request_code}).",
        message_te=f"మీ పరికరం ({req.request_code}) సేకరణకు ఎకోసైకిల్ కలెక్టర్ కేటాయించబడ్డారు.",
        action_url=f"/requests/{req.id}"
    )

    return jsonify({"message": "Pickup accepted successfully", "request": req.to_dict()}), 200


@collector_bp.route("/reject/<request_id>", methods=["POST"])
@role_required(UserRole.COLLECTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
def reject_pickup(request_id):
    user_id = get_jwt_identity()
    req = EWasteRequest.query.get(request_id)
    if not req:
        return jsonify({"error": "Request not found"}), 404

    if req.assigned_collector_id != user_id:
        return jsonify({"error": "You are not assigned to this request."}), 403

    old_status = req.status
    req.assigned_collector_id = None
    req.status = RequestStatus.READY_FOR_PICKUP

    history = RequestStatusHistory(
        request_id=req.id,
        previous_status=old_status,
        new_status=RequestStatus.READY_FOR_PICKUP,
        changed_by_user_id=user_id,
        notes=request.get_json().get("reason", "Collector reassigned pickup back to pool.") if request.get_json() else "Released to pool."
    )
    db.session.add(history)
    db.session.commit()

    AuditService.log_event("PICKUP_REJECTED", actor_user_id=user_id, target_type="ewaste_request", target_id=req.id)
    return jsonify({"message": "Pickup released back to pool", "request": req.to_dict()}), 200


@collector_bp.route("/verify-handover/<request_id>", methods=["POST"])
@role_required(UserRole.COLLECTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
def verify_handover(request_id):
    collector_id = get_jwt_identity()
    collector = User.query.get(collector_id)
    req = EWasteRequest.query.get(request_id)
    if not req:
        return jsonify({"error": "Request not found"}), 404

    if req.assigned_collector_id != collector_id and collector.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        return jsonify({"error": "You are not authorized to record handover for this request."}), 403

    if req.handover_receipt:
        return jsonify({"error": "Handover receipt already exists for this request."}), 400

    data = request.get_json() or {}
    try:
        verified_weight = float(data.get("verified_weight_kg", req.estimated_weight_kg))
        item_count = int(data.get("verified_item_count", req.quantity))
    except ValueError:
        return jsonify({"error": "Invalid weight or item count format."}), 400

    # Generate unique receipt code
    receipt_code = f"RCPT-2026-{uuid.uuid4().hex[:8].upper()}"
    timestamp_str = datetime.now().isoformat()
    verification_hash = HandoverReceipt.generate_hash(receipt_code, req.id, collector_id, verified_weight, timestamp_str)

    receipt = HandoverReceipt(
        receipt_code=receipt_code,
        request_id=req.id,
        collector_id=collector_id,
        user_id=req.user_id,
        verified_weight_kg=verified_weight,
        verified_item_count=item_count,
        collection_photo_path=data.get("collection_photo_path"),
        signature_user=data.get("signature_user", req.user.full_name),
        signature_collector=collector.full_name,
        verification_hash=verification_hash,
        notes=data.get("notes")
    )
    db.session.add(receipt)

    # Update request lifecycle
    old_status = req.status
    req.status = RequestStatus.COLLECTED
    req.actual_weight_kg = verified_weight
    
    # Calculate rewards: 50 points per kg (minimum 25 points)
    earned_points = max(25, int(verified_weight * 50))
    req.points_awarded = earned_points
    req.user.eco_points_balance += earned_points

    # Record reward transaction
    reward_tx = RewardTransaction(
        user_id=req.user_id,
        points=earned_points,
        event_type="handover_verified",
        reference_id=req.request_code,
        description=f"Earned for certified handover of {req.device_name} ({verified_weight:.2f} kg)",
        description_te=f"{req.device_name} ({verified_weight:.2f} కిలోలు) సురక్షిత సేకరణ కోసం లభించిన పాయింట్లు",
        balance_after=req.user.eco_points_balance
    )
    db.session.add(reward_tx)

    # Record history
    history = RequestStatusHistory(
        request_id=req.id,
        previous_status=old_status,
        new_status=RequestStatus.COLLECTED,
        changed_by_user_id=collector_id,
        notes=f"Physical handover verified by collector {collector.full_name}. Weight: {verified_weight:.2f} kg."
    )
    db.session.add(history)
    db.session.commit()

    AuditService.log_event("HANDOVER_VERIFIED", actor_user_id=collector_id, target_type="handover_receipt", target_id=receipt.id, details={"code": receipt_code, "points": earned_points})
    AuditService.send_notification(
        user_id=req.user_id,
        title="Pickup Completed & Points Awarded!",
        title_te="పికప్ పూర్తయింది & పాయింట్లు లభించాయి!",
        message=f"Your device {req.device_name} was collected. You earned {earned_points} EcoPoints! Digital receipt {receipt_code} is now available.",
        message_te=f"మీ పరికరం {req.device_name} సేకరించబడింది. మీకు {earned_points} ఎకోపాయింట్లు లభించాయి! డిజిటల్ రసీదు సిద్ధంగా ఉంది.",
        action_url=f"/requests/{req.id}"
    )

    return jsonify({
        "message": "Handover verified successfully",
        "receipt": receipt.to_dict(),
        "request": req.to_dict(),
        "points_awarded": earned_points
    }), 201


@collector_bp.route("/partners", methods=["GET"])
@role_required(UserRole.COLLECTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
def get_eligible_partners():
    partners = Partner.query.filter_by(is_verified=True).all()
    return jsonify({"partners": [p.to_dict() for p in partners]}), 200


@collector_bp.route("/handover-to-partner", methods=["POST"])
@role_required(UserRole.COLLECTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
def handover_batch_to_partner():
    collector_id = get_jwt_identity()
    collector = User.query.get(collector_id)
    data = request.get_json() or {}
    partner_id = data.get("partner_id")
    request_ids = data.get("request_ids", [])
    vehicle_number = data.get("vehicle_number", "TS-09-EA-4122")
    notes = data.get("notes", "Batch dispatched from collector field run.")

    if not partner_id:
        # Default to first verified partner
        partner = Partner.query.filter_by(is_verified=True).first()
        if partner:
            partner_id = partner.id
        else:
            return jsonify({"error": "No verified partner facility found"}), 400

    requests_to_handover = []
    if request_ids:
        requests_to_handover = EWasteRequest.query.filter(EWasteRequest.id.in_(request_ids)).all()
    else:
        # Take all COLLECTED requests for this collector
        requests_to_handover = EWasteRequest.query.filter_by(
            assigned_collector_id=collector_id,
            status=RequestStatus.COLLECTED
        ).all()

    if not requests_to_handover:
        return jsonify({"error": "No collected items found eligible for facility handover"}), 400

    total_weight = sum([float(r.actual_weight_kg or r.estimated_weight_kg or 1.0) for r in requests_to_handover])
    shipment_code = f"SHP-2026-{uuid.uuid4().hex[:6].upper()}"

    shipment = Shipment(
        shipment_code=shipment_code,
        partner_id=partner_id,
        dispatched_by_collector_id=collector_id,
        vehicle_number=vehicle_number,
        status="in_transit",
        total_items_count=len(requests_to_handover),
        total_declared_weight_kg=round(total_weight, 2),
        actual_received_weight_kg=round(total_weight, 2)
    )
    db.session.add(shipment)
    db.session.flush()

    for r in requests_to_handover:
        r.status = RequestStatus.IN_TRANSIT
        r.receiving_partner_id = partner_id
        hist = RequestStatusHistory(
            request_id=r.id,
            previous_status=RequestStatus.COLLECTED,
            new_status=RequestStatus.IN_TRANSIT,
            changed_by_user_id=collector_id,
            notes=f"Dispatched in batch {shipment_code} to partner facility."
        )
        db.session.add(hist)

    db.session.commit()
    AuditService.log_event("SHIPMENT_DISPATCHED", actor_user_id=collector_id, target_type="shipment", target_id=shipment.id, details={"code": shipment_code, "weight": total_weight})

    return jsonify({
        "message": f"Successfully created shipment manifest {shipment_code} with {len(requests_to_handover)} items.",
        "shipment": shipment.to_dict(),
        "total_items": len(requests_to_handover),
        "total_weight_kg": total_weight
    }), 201
