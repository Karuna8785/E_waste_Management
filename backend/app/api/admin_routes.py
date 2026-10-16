import io
import csv
from flask import Blueprint, request, jsonify, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app.models.base import db
from backend.app.models.user import User, UserRole, Organization
from backend.app.models.ewaste import EWasteRequest, RequestStatus, RequestStatusHistory, DeviceCategory
from backend.app.models.partner import Partner, ProcessingRecord
from backend.app.models.audit import AuditLog
from backend.app.api.auth_middleware import role_required
from backend.app.services.audit_service import AuditService

admin_bp = Blueprint("admin", __name__)

@admin_bp.route("/dashboard-kpis", methods=["GET"])
@role_required(UserRole.ADMIN, UserRole.SUPER_ADMIN)
def get_dashboard_kpis():
    total_users = User.query.count()
    total_orgs = Organization.query.count()
    total_requests = EWasteRequest.query.count()
    pending_requests = EWasteRequest.query.filter(EWasteRequest.status.in_([
        RequestStatus.SUBMITTED, RequestStatus.READY_FOR_PICKUP, RequestStatus.COLLECTOR_ASSIGNED
    ])).count()
    completed_requests = EWasteRequest.query.filter_by(status=RequestStatus.COMPLETED).count()
    
    # Weight aggregates
    total_collected_weight = db.session.query(db.func.sum(EWasteRequest.actual_weight_kg)).scalar() or 0.0
    total_estimated_weight = db.session.query(db.func.sum(EWasteRequest.estimated_weight_kg)).scalar() or 0.0
    total_processed_weight = db.session.query(db.func.sum(ProcessingRecord.weight_kg)).scalar() or 0.0
    
    # Safety flags
    open_safety_flags = EWasteRequest.query.filter_by(safety_flag=True).count()

    # Carbon offset: ~2.8 kg CO2e saved per kg recycled e-waste
    effective_weight = max(total_collected_weight, total_processed_weight)
    carbon_offset_kg = round(effective_weight * 2.8, 2)

    # Category breakdown query
    cat_counts = db.session.query(
        DeviceCategory.name, db.func.count(EWasteRequest.id)
    ).join(EWasteRequest, EWasteRequest.category_id == DeviceCategory.id, isouter=True).group_by(DeviceCategory.name).all()

    category_breakdown = [{"name": name or "Unclassified", "count": count} for name, count in cat_counts]

    # Status distribution
    status_counts = db.session.query(
        EWasteRequest.status, db.func.count(EWasteRequest.id)
    ).group_by(EWasteRequest.status).all()
    status_breakdown = [{"status": s, "count": count} for s, count in status_counts]

    return jsonify({
        "kpis": {
            "total_users": total_users,
            "total_organizations": total_orgs,
            "total_requests": total_requests,
            "pending_requests": pending_requests,
            "completed_requests": completed_requests,
            "total_collected_weight_kg": round(float(total_collected_weight), 2),
            "total_estimated_weight_kg": round(float(total_estimated_weight), 2),
            "total_processed_weight_kg": round(float(total_processed_weight), 2),
            "carbon_offset_kg": carbon_offset_kg,
            "open_safety_flags": open_safety_flags,
            "category_breakdown": category_breakdown,
            "status_breakdown": status_breakdown
        }
    }), 200


@admin_bp.route("/requests", methods=["GET"])
@role_required(UserRole.ADMIN, UserRole.SUPER_ADMIN)
def get_all_requests():
    status = request.args.get("status")
    search = request.args.get("search")
    query = EWasteRequest.query

    if status:
        query = query.filter_by(status=status)
    if search:
        query = query.filter(
            (EWasteRequest.request_code.ilike(f"%{search}%")) |
            (EWasteRequest.device_name.ilike(f"%{search}%"))
        )

    requests = query.order_by(EWasteRequest.created_at.desc()).limit(150).all()
    return jsonify({"requests": [r.to_dict() for r in requests]}), 200


@admin_bp.route("/requests/<request_id>/assign", methods=["POST"])
@role_required(UserRole.ADMIN, UserRole.SUPER_ADMIN)
def assign_collector_or_partner(request_id):
    req = EWasteRequest.query.get(request_id)
    if not req:
        return jsonify({"error": "Request not found"}), 404

    data = request.get_json() or {}
    collector_id = data.get("collector_id")
    partner_id = data.get("partner_id")

    if collector_id:
        collector = User.query.get(collector_id)
        if not collector or collector.role != UserRole.COLLECTOR:
            return jsonify({"error": "Invalid collector user ID"}), 400
        req.assigned_collector_id = collector_id
        req.status = RequestStatus.COLLECTOR_ASSIGNED

    if partner_id:
        partner = Partner.query.get(partner_id)
        if not partner:
            return jsonify({"error": "Invalid partner ID"}), 400
        req.receiving_partner_id = partner_id

    db.session.commit()
    AuditService.log_event("ADMIN_ASSIGNMENT", actor_user_id=get_jwt_identity(), target_type="ewaste_request", target_id=req.id)
    return jsonify({"message": "Assignment updated", "request": req.to_dict()}), 200


@admin_bp.route("/users", methods=["GET"])
@role_required(UserRole.ADMIN, UserRole.SUPER_ADMIN)
def get_all_users():
    users = User.query.order_by(User.created_at.desc()).limit(100).all()
    return jsonify({"users": [u.to_dict() for u in users]}), 200


@admin_bp.route("/users/<user_id>/toggle-status", methods=["POST"])
@role_required(UserRole.ADMIN, UserRole.SUPER_ADMIN)
def toggle_user_status(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    user.is_active = not user.is_active
    db.session.commit()
    return jsonify({"message": "User status updated", "user": user.to_dict()}), 200


@admin_bp.route("/partners", methods=["GET", "POST"])
@role_required(UserRole.ADMIN, UserRole.SUPER_ADMIN)
def manage_partners():
    if request.method == "GET":
        partners = Partner.query.all()
        return jsonify({"partners": [p.to_dict() for p in partners]}), 200

    data = request.get_json() or {}
    partner = Partner(
        organization_name=data.get("organization_name", "Green Recycle Facility"),
        partner_type=data.get("partner_type", "recycler"),
        cpcb_license_number=data.get("cpcb_license_number"),
        license_valid_until=data.get("license_valid_until", "2028-12-31"),
        is_verified=data.get("is_verified", True),
        contact_email=data.get("contact_email"),
        contact_phone=data.get("contact_phone"),
        facility_address=data.get("facility_address", "Industrial Area, Hyderabad"),
        city=data.get("city", "Hyderabad"),
        state=data.get("state", "Telangana"),
        monthly_capacity_metric_tons=float(data.get("monthly_capacity_metric_tons", 100.0)),
        latitude=data.get("latitude", 17.5050),
        longitude=data.get("longitude", 78.3950)
    )
    db.session.add(partner)
    db.session.commit()
    return jsonify({"message": "Partner added", "partner": partner.to_dict()}), 201


@admin_bp.route("/audit-logs", methods=["GET"])
@role_required(UserRole.ADMIN, UserRole.SUPER_ADMIN)
def get_audit_logs():
    logs = AuditLog.query.order_by(AuditLog.created_at.desc()).limit(150).all()
    return jsonify({"audit_logs": [l.to_dict() for l in logs]}), 200


@admin_bp.route("/export-csv", methods=["GET"])
@role_required(UserRole.ADMIN, UserRole.SUPER_ADMIN)
def export_requests_csv():
    requests = EWasteRequest.query.order_by(EWasteRequest.created_at.desc()).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Request Code", "Device Name", "Category", "Quantity", 
        "Estimated Weight (kg)", "Actual Weight (kg)", "Status", 
        "Recommendation", "Safety Flag", "User Name", "City", "Created At"
    ])

    for r in requests:
        writer.writerow([
            r.request_code,
            r.device_name,
            r.category.name if r.category else "Unclassified",
            r.quantity,
            r.estimated_weight_kg,
            r.actual_weight_kg or "",
            r.status,
            r.recommendation or "",
            "YES" if r.safety_flag else "NO",
            r.user.full_name if r.user else "",
            r.address.city if r.address else "",
            r.created_at.strftime("%Y-%m-%d %H:%M") if r.created_at else ""
        ])

    csv_data = output.getvalue()
    response = make_response(csv_data)
    response.headers["Content-Type"] = "text/csv"
    response.headers["Content-Disposition"] = "attachment; filename=ecocycle_all_requests.csv"
    return response
