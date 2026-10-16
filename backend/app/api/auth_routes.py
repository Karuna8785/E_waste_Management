from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from backend.app.models.base import db
from backend.app.models.user import User, UserRole, Address, Organization
from backend.app.services.audit_service import AuditService

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password")
    full_name = (data.get("full_name") or "").strip()
    phone = (data.get("phone") or "").strip()
    role = data.get("role", UserRole.INDIVIDUAL)
    preferred_language = data.get("preferred_language", "en")
    org_name = data.get("organization_name")

    if not email or not password or not full_name:
        return jsonify({"error": "email, password, and full_name are required"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    if role not in UserRole.ALL_ROLES:
        role = UserRole.INDIVIDUAL

    # Prevent self-registering as admin or super_admin
    if role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        role = UserRole.INDIVIDUAL

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email is already registered"}), 409

    org_id = None
    if role == UserRole.ORGANIZATION_MANAGER and org_name:
        org = Organization(
            name=org_name,
            org_type=data.get("org_type", "college"),
            contact_email=email,
            contact_phone=phone,
            city=data.get("city", "Hyderabad"),
            state=data.get("state", "Telangana")
        )
        db.session.add(org)
        db.session.flush()
        org_id = org.id

    new_user = User(
        email=email,
        full_name=full_name,
        phone=phone,
        role=role,
        preferred_language=preferred_language,
        organization_id=org_id,
        is_active=True,
        is_verified=True  # Default active for development/demo
    )
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    AuditService.log_event("USER_REGISTER", actor_user_id=new_user.id, target_type="user", target_id=new_user.id, details={"role": role})

    access_token = create_access_token(identity=new_user.id)
    return jsonify({
        "message": "User registered successfully",
        "access_token": access_token,
        "user": new_user.to_dict()
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401

    if not user.is_active:
        return jsonify({"error": "Account is inactive. Please contact support."}), 403

    access_token = create_access_token(identity=user.id)
    AuditService.log_event("USER_LOGIN", actor_user_id=user.id, target_type="user", target_id=user.id)

    return jsonify({
        "message": "Login successful",
        "access_token": access_token,
        "user": user.to_dict()
    }), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    addresses = [addr.to_dict() for addr in user.addresses]
    user_data = user.to_dict()
    user_data["addresses"] = addresses
    return jsonify({"user": user_data}), 200


@auth_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json() or {}
    if "full_name" in data:
        user.full_name = data["full_name"].strip()
    if "phone" in data:
        user.phone = data["phone"].strip()
    if "preferred_language" in data and data["preferred_language"] in ["en", "te"]:
        user.preferred_language = data["preferred_language"]

    db.session.commit()
    AuditService.log_event("USER_PROFILE_UPDATE", actor_user_id=user.id, target_type="user", target_id=user.id)
    return jsonify({"message": "Profile updated", "user": user.to_dict()}), 200


@auth_bp.route("/addresses", methods=["GET", "POST"])
@jwt_required()
def user_addresses():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    if request.method == "GET":
        addresses = [a.to_dict() for a in user.addresses]
        return jsonify({"addresses": addresses}), 200

    data = request.get_json() or {}
    street = data.get("street_address")
    city = data.get("city", "Hyderabad")
    state = data.get("state", "Telangana")
    postal_code = data.get("postal_code", "500081")

    if not street:
        return jsonify({"error": "street_address is required"}), 400

    # If first address or marked default, reset others
    is_default = data.get("is_default", False)
    if is_default or user.addresses.count() == 0:
        for a in user.addresses:
            a.is_default = False
        is_default = True

    new_addr = Address(
        user_id=user.id,
        label=data.get("label", "Home"),
        street_address=street,
        landmark=data.get("landmark"),
        city=city,
        state=state,
        postal_code=postal_code,
        latitude=data.get("latitude", 17.4435),
        longitude=data.get("longitude", 78.3772),
        is_default=is_default
    )
    db.session.add(new_addr)
    db.session.commit()

    return jsonify({"message": "Address added", "address": new_addr.to_dict()}), 201


@auth_bp.route("/notifications", methods=["GET"])
@jwt_required()
def get_notifications():
    user_id = get_jwt_identity()
    from backend.app.models.audit import SystemNotification
    notifs = SystemNotification.query.filter_by(user_id=user_id).order_by(SystemNotification.created_at.desc()).limit(20).all()
    return jsonify({"notifications": [n.to_dict() for n in notifs]}), 200
