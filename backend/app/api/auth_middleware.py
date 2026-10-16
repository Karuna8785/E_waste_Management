from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from backend.app.models.user import User, UserRole

def get_current_user():
    """
    Retrieves current User object from JWT identity.
    """
    verify_jwt_in_request()
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    return user

def role_required(*allowed_roles):
    """
    Decorator that checks if authenticated user has one of the required roles.
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            if not user or not user.is_active:
                return jsonify({"error": "User account inactive or not found"}), 403
            
            # Super admin has universal access
            if user.role == UserRole.SUPER_ADMIN or user.role in allowed_roles:
                return fn(*args, **kwargs)
            
            return jsonify({
                "error": "Forbidden: Insufficient privileges",
                "required_roles": list(allowed_roles),
                "your_role": user.role
            }), 403
        return wrapper
    return decorator
