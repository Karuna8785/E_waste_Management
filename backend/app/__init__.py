import os
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from backend.app.config import config_by_name
from backend.app.models.base import db

jwt = JWTManager()
limiter = Limiter(key_func=get_remote_address, default_limits=["200 per day", "50 per hour"])

def create_app(config_name="development"):
    app = Flask(__name__)
    app.config.from_object(config_by_name[config_name])

    # Ensure upload directory exists
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    limiter.init_app(app)
    
    # CORS setup allowing frontend client
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Register Blueprints
    from backend.app.api.auth_routes import auth_bp
    from backend.app.api.ai_routes import ai_bp
    from backend.app.api.ewaste_routes import ewaste_bp
    from backend.app.api.collector_routes import collector_bp
    from backend.app.api.partner_routes import partner_bp
    from backend.app.api.admin_routes import admin_bp
    from backend.app.api.organization_routes import organization_bp
    from backend.app.api.marketplace_routes import marketplace_bp
    from backend.app.api.rewards_routes import rewards_bp
    from backend.app.api.analytics_routes import analytics_bp

    app.register_blueprint(auth_bp, url_prefix="/api/v1/auth")
    app.register_blueprint(ai_bp, url_prefix="/api/v1/ai")
    app.register_blueprint(ewaste_bp, url_prefix="/api/v1/ewaste")
    app.register_blueprint(collector_bp, url_prefix="/api/v1/collector")
    app.register_blueprint(partner_bp, url_prefix="/api/v1/partner")
    app.register_blueprint(admin_bp, url_prefix="/api/v1/admin")
    app.register_blueprint(organization_bp, url_prefix="/api/v1/organization")
    app.register_blueprint(marketplace_bp, url_prefix="/api/v1/marketplace")
    app.register_blueprint(rewards_bp, url_prefix="/api/v1/rewards")
    app.register_blueprint(analytics_bp, url_prefix="/api/v1/analytics")

    # Static file serving for user uploads
    @app.route("/uploads/<path:filename>")
    def serve_upload(filename):
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

    # Health check endpoint
    @app.route("/api/v1/health")
    def health_check():
        return jsonify({
            "status": "healthy",
            "service": "EcoCycle AI API",
            "version": "1.4.0",
            "environment": config_name
        }), 200

    # Global Error Handlers
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"error": "Bad request", "details": str(e)}), 400

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"error": "Internal server error"}), 500

    return app
