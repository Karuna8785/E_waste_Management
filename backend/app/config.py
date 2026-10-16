import os
from datetime import timedelta

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "ecocycle-ai-dev-secret-key-3.14-secure-2026")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "ecocycle-ai-jwt-secret-key-2026-v1")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=1)
    
    # Database
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'ecocycle.db')}")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Uploads
    UPLOAD_FOLDER = os.environ.get("UPLOAD_FOLDER", os.path.join(BASE_DIR, "uploads"))
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max limit
    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
    
    # AI Configuration
    AI_CONFIDENCE_THRESHOLD = float(os.environ.get("AI_CONFIDENCE_THRESHOLD", 0.65))
    AI_MODEL_VERSION = "EcoCycle-Vision-v1.4"
    
    # Rate Limiting
    RATELIMIT_DEFAULT = "200 per day; 50 per hour"
    RATELIMIT_STORAGE_URI = "memory://"


class DevelopmentConfig(Config):
    DEBUG = True


class TestingConfig(Config):
    TESTING = True
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    JWT_SECRET_KEY = "test-jwt-secret-key-32-bytes-minimum-length-for-hmac-sha256"
    SECRET_KEY = "test-secret-key-32-bytes-minimum-length-for-hmac-sha256"


class ProductionConfig(Config):
    DEBUG = False
    TESTING = False
    # In production, require environment variables
    SECRET_KEY = os.environ.get("SECRET_KEY")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY")


config_by_name = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}
