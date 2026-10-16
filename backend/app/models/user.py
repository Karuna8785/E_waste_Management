from werkzeug.security import generate_password_hash, check_password_hash
from backend.app.models.base import db, generate_uuid, utc_now

class UserRole:
    INDIVIDUAL = "individual"
    ORGANIZATION_MANAGER = "organization_manager"
    COLLECTOR = "collector"
    PARTNER = "partner"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"

    ALL_ROLES = [INDIVIDUAL, ORGANIZATION_MANAGER, COLLECTOR, PARTNER, ADMIN, SUPER_ADMIN]


class Organization(db.Model):
    __tablename__ = "organizations"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(150), nullable=False)
    org_type = db.Column(db.String(50), default="college")  # college, office, enterprise, ngo
    registration_number = db.Column(db.String(100), unique=True, nullable=True)
    contact_email = db.Column(db.String(120), nullable=False)
    contact_phone = db.Column(db.String(30), nullable=True)
    address = db.Column(db.String(255), nullable=True)
    city = db.Column(db.String(100), default="Hyderabad")
    state = db.Column(db.String(100), default="Telangana")
    created_at = db.Column(db.DateTime, default=utc_now)

    # Relationships
    members = db.relationship("User", back_populates="organization", lazy="dynamic")
    campaigns = db.relationship("CommunityCampaign", back_populates="organization", lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "org_type": self.org_type,
            "registration_number": self.registration_number,
            "contact_email": self.contact_email,
            "contact_phone": self.contact_phone,
            "address": self.address,
            "city": self.city,
            "state": self.state,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(30), nullable=True)
    role = db.Column(db.String(30), nullable=False, default=UserRole.INDIVIDUAL, index=True)
    preferred_language = db.Column(db.String(10), default="en")  # 'en' or 'te'
    is_active = db.Column(db.Boolean, default=True)
    is_verified = db.Column(db.Boolean, default=False)
    eco_points_balance = db.Column(db.Integer, default=0)
    
    # Organization link (if organization_manager or employee)
    organization_id = db.Column(db.String(36), db.ForeignKey("organizations.id"), nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=utc_now)
    updated_at = db.Column(db.DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    organization = db.relationship("Organization", back_populates="members")
    addresses = db.relationship("Address", back_populates="user", cascade="all, delete-orphan", lazy="dynamic")
    ewaste_requests = db.relationship("EWasteRequest", foreign_keys="EWasteRequest.user_id", back_populates="user", lazy="dynamic")
    assigned_pickups = db.relationship("EWasteRequest", foreign_keys="EWasteRequest.assigned_collector_id", back_populates="collector", lazy="dynamic")
    reward_transactions = db.relationship("RewardTransaction", back_populates="user", lazy="dynamic")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self, include_sensitive=False):
        data = {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "phone": self.phone,
            "role": self.role,
            "preferred_language": self.preferred_language,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "eco_points_balance": self.eco_points_balance,
            "organization_id": self.organization_id,
            "organization_name": self.organization.name if self.organization else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        return data


class Address(db.Model):
    __tablename__ = "addresses"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    label = db.Column(db.String(50), default="Home")  # Home, Office, Campus, Warehouse
    street_address = db.Column(db.String(255), nullable=False)
    landmark = db.Column(db.String(150), nullable=True)
    city = db.Column(db.String(100), nullable=False, default="Hyderabad")
    state = db.Column(db.String(100), nullable=False, default="Telangana")
    postal_code = db.Column(db.String(20), nullable=False)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    is_default = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=utc_now)

    user = db.relationship("User", back_populates="addresses")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "label": self.label,
            "street_address": self.street_address,
            "landmark": self.landmark,
            "city": self.city,
            "state": self.state,
            "postal_code": self.postal_code,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "is_default": self.is_default,
        }
