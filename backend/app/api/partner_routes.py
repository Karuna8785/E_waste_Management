import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app.models.base import db, utc_now
from backend.app.models.user import User, UserRole
from backend.app.models.ewaste import EWasteRequest, RequestStatus, RequestStatusHistory
from backend.app.models.partner import Partner, Shipment, ProcessingRecord, MaterialRecoveryRecord, ProcessingCertificate
from backend.app.api.auth_middleware import role_required
from backend.app.services.audit_service import AuditService

partner_bp = Blueprint("partner", __name__)

@partner_bp.route("/requests", methods=["GET"])
@role_required(UserRole.PARTNER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
def get_facility_requests():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    partner = Partner.query.filter_by(user_id=user_id).first()
    
    if not partner and user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        return jsonify({"error": "No partner facility linked to this account."}), 404

    query = EWasteRequest.query
    if partner:
        query = query.filter_by(receiving_partner_id=partner.id)
    
    status_filter = request.args.get("status")
    if status_filter:
        query = query.filter_by(status=status_filter)
        
    requests = query.order_by(EWasteRequest.created_at.desc()).limit(100).all()
    return jsonify({"requests": [r.to_dict() for r in requests]}), 200


@partner_bp.route("/process-request/<request_id>", methods=["POST"])
@role_required(UserRole.PARTNER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
def process_request(request_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    partner = Partner.query.filter_by(user_id=user_id).first()
    req = EWasteRequest.query.get(request_id)

    if not req:
        return jsonify({"error": "Request not found"}), 404

    data = request.get_json() or {}
    outcome = data.get("outcome", "recycled")  # reused, repaired, recycled, haz_neutralized
    notes = data.get("inspection_notes", "Verified and scientifically processed at authorized facility.")
    weight = float(data.get("weight_kg", req.actual_weight_kg or req.estimated_weight_kg))

    # Link partner if not already set
    if partner and not req.receiving_partner_id:
        req.receiving_partner_id = partner.id

    # Check for existing shipment or create container shipment
    shipment = Shipment.query.filter_by(partner_id=req.receiving_partner_id).first()
    if not shipment:
        shipment = Shipment(
            shipment_code=f"SHP-2026-{uuid.uuid4().hex[:6].upper()}",
            partner_id=req.receiving_partner_id or partner.id,
            dispatched_by_collector_id=req.assigned_collector_id or user.id,
            status="received",
            total_items_count=1,
            total_declared_weight_kg=weight,
            actual_received_weight_kg=weight,
            received_at=utc_now()
        )
        db.session.add(shipment)
        db.session.flush()

    # Record Processing Record
    proc_rec = ProcessingRecord.query.filter_by(request_id=req.id).first()
    if not proc_rec:
        proc_rec = ProcessingRecord(
            shipment_id=shipment.id,
            request_id=req.id,
            inspection_notes=notes,
            outcome=outcome,
            weight_kg=weight,
            inspector_name=user.full_name
        )
        db.session.add(proc_rec)
        db.session.flush()

    # Record material recoveries if provided
    materials = data.get("material_recoveries", [])
    if materials:
        for m in materials:
            rec = MaterialRecoveryRecord(
                processing_record_id=proc_rec.id,
                material_type=m.get("material_type", "copper"),
                quantity=float(m.get("quantity", 0.0)),
                unit=m.get("unit", "kg")
            )
            db.session.add(rec)

    # Update request lifecycle
    old_status = req.status
    req.status = RequestStatus.COMPLETED
    req.final_processing_outcome = outcome
    req.completed_at = utc_now()

    history = RequestStatusHistory(
        request_id=req.id,
        previous_status=old_status,
        new_status=RequestStatus.COMPLETED,
        changed_by_user_id=user.id,
        notes=f"Final processing completed: {outcome}. Inspection notes: {notes}"
    )
    db.session.add(history)
    db.session.commit()

    AuditService.log_event("REQUEST_PROCESSED", actor_user_id=user.id, target_type="processing_record", target_id=proc_rec.id, details={"outcome": outcome, "weight": weight})
    AuditService.send_notification(
        user_id=req.user_id,
        title="Processing Complete!",
        title_te="ప్రాసెసింగ్ పూర్తయింది!",
        message=f"Your device {req.device_name} has been successfully processed ({outcome}) by our authorized recycling partner.",
        message_te=f"మీ పరికరం {req.device_name} అధికారిక భాగస్వామి ద్వారా విజయవంతంగా ప్రాసెస్ చేయబడింది ({outcome}).",
        action_url=f"/requests/{req.id}"
    )

    return jsonify({
        "message": "Processing record created successfully",
        "processing_record": proc_rec.to_dict(),
        "request": req.to_dict()
    }), 201


@partner_bp.route("/issue-certificate/<request_id>", methods=["POST"])
@role_required(UserRole.PARTNER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
def issue_certificate(request_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    partner = Partner.query.filter_by(user_id=user_id).first()
    req = EWasteRequest.query.get(request_id)

    if not req:
        return jsonify({"error": "Request not found"}), 404

    existing_cert = ProcessingCertificate.query.filter_by(request_id=req.id).first()
    if existing_cert:
        return jsonify({"message": "Certificate already issued", "certificate": existing_cert.to_dict()}), 200

    partner_id = partner.id if partner else req.receiving_partner_id
    if not partner_id:
        partner_obj = Partner.query.first()
        partner_id = partner_obj.id if partner_obj else None

    cert_number = f"CERT-2026-EW-{uuid.uuid4().hex[:8].upper()}"
    weight = req.actual_weight_kg or req.estimated_weight_kg or 1.0
    timestamp_str = datetime.now().isoformat()
    sig_hash = ProcessingCertificate.generate_cert_hash(cert_number, req.id, partner_id or "PARTNER", weight, timestamp_str)

    cert = ProcessingCertificate(
        certificate_number=cert_number,
        request_id=req.id,
        partner_id=partner_id,
        total_weight_kg=weight,
        processing_method=req.final_processing_outcome or "Scientific Dismantling & Material Extraction",
        digital_signature_hash=sig_hash
    )
    db.session.add(cert)
    db.session.commit()

    AuditService.log_event("CERTIFICATE_ISSUED", actor_user_id=user.id, target_type="processing_certificate", target_id=cert.id, details={"cert_number": cert_number})
    AuditService.send_notification(
        user_id=req.user_id,
        title="Green Recycling Certificate Issued!",
        title_te="గ్రీన్ రీసైక్లింగ్ సర్టిఫికేట్ జారీ చేయబడింది!",
        message=f"Official certificate {cert_number} has been issued for your e-waste contribution. You can download the verified PDF.",
        message_te=f"మీ ఈ-వేస్ట్ విరాళం కోసం అధికారిక సర్టిఫికేట్ {cert_number} జారీ చేయబడింది. మీరు ధృవీకరించిన PDFని డౌన్‌లోడ్ చేసుకోవచ్చు.",
        action_url=f"/requests/{req.id}"
    )

    return jsonify({"message": "Certificate issued successfully", "certificate": cert.to_dict()}), 201


@partner_bp.route("/stats", methods=["GET"])
@role_required(UserRole.PARTNER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
def get_partner_stats():
    user_id = get_jwt_identity()
    partner = Partner.query.filter_by(user_id=user_id).first()
    
    # Aggregate actual stats
    total_processed = ProcessingRecord.query.count()
    total_certs = ProcessingCertificate.query.count()
    total_weight = db.session.query(db.func.sum(ProcessingRecord.weight_kg)).scalar() or 0.0

    return jsonify({
        "stats": {
            "total_processed_records": total_processed,
            "total_certificates_issued": total_certs,
            "total_weight_processed_kg": round(float(total_weight), 2),
            "partner_details": partner.to_dict() if partner else None
        }
    }), 200


@partner_bp.route("/shipments", methods=["GET"])
@role_required(UserRole.PARTNER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
def get_partner_shipments():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    partner = Partner.query.filter_by(user_id=user_id).first()

    query = Shipment.query
    if partner:
        query = query.filter_by(partner_id=partner.id)
    
    shipments = query.order_by(Shipment.created_at.desc()).all()
    return jsonify({"shipments": [s.to_dict() for s in shipments]}), 200


@partner_bp.route("/shipments/<shipment_id>/receive", methods=["POST"])
@role_required(UserRole.PARTNER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
def receive_partner_shipment(shipment_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    shipment = Shipment.query.get(shipment_id)
    if not shipment:
        return jsonify({"error": "Shipment not found"}), 404

    data = request.get_json() or {}
    status = data.get("status", "received")  # received or rejected
    actual_weight = float(data.get("actual_received_weight_kg", shipment.total_declared_weight_kg))
    notes = data.get("receiving_notes", "Shipment verified and admitted to facility quarantine & intake bay.")

    shipment.status = status
    shipment.actual_received_weight_kg = actual_weight
    shipment.received_at = utc_now()
    shipment.receiving_notes = notes

    # Update associated ewaste requests
    requests = EWasteRequest.query.filter_by(receiving_partner_id=shipment.partner_id, status=RequestStatus.IN_TRANSIT).all()
    for req in requests:
        req.status = RequestStatus.RECEIVED_AT_FACILITY
        hist = RequestStatusHistory(
            request_id=req.id,
            previous_status=RequestStatus.IN_TRANSIT,
            new_status=RequestStatus.RECEIVED_AT_FACILITY,
            changed_by_user_id=user.id,
            notes=f"Admitted at facility bay. Declared weight: {req.actual_weight_kg or req.estimated_weight_kg} kg."
        )
        db.session.add(hist)

    db.session.commit()
    AuditService.log_event("SHIPMENT_RECEIVED", actor_user_id=user.id, target_type="shipment", target_id=shipment.id, details={"status": status, "weight": actual_weight})

    return jsonify({
        "message": f"Shipment {shipment.shipment_code} updated to {status}",
        "shipment": shipment.to_dict()
    }), 200


@partner_bp.route("/certificates", methods=["GET"])
@role_required(UserRole.PARTNER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
def get_issued_certificates():
    user_id = get_jwt_identity()
    partner = Partner.query.filter_by(user_id=user_id).first()

    query = ProcessingCertificate.query
    if partner:
        query = query.filter_by(partner_id=partner.id)

    certs = query.order_by(ProcessingCertificate.issued_at.desc()).limit(100).all()
    return jsonify({"certificates": [c.to_dict() for c in certs]}), 200
