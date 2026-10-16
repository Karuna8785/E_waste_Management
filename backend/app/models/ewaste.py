import json
from backend.app.models.base import db, generate_uuid, utc_now

class RequestStatus:
    DRAFT = "draft"
    SUBMITTED = "submitted"
    ANALYZING = "analyzing"
    AWAITING_CONFIRMATION = "awaiting_confirmation"
    READY_FOR_PICKUP = "ready_for_pickup"
    COLLECTOR_ASSIGNED = "collector_assigned"
    PICKUP_SCHEDULED = "pickup_scheduled"
    COLLECTED = "collected"
    IN_TRANSIT = "in_transit"
    RECEIVED_AT_FACILITY = "received_at_facility"
    UNDER_INSPECTION = "under_inspection"
    PROCESSING_REUSE = "processing_reuse"
    PROCESSING_REPAIR = "processing_repair"
    PROCESSING_RECYCLING = "processing_recycling"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    REJECTED = "rejected"

    ALL_STATUSES = [
        DRAFT, SUBMITTED, ANALYZING, AWAITING_CONFIRMATION, READY_FOR_PICKUP,
        COLLECTOR_ASSIGNED, PICKUP_SCHEDULED, COLLECTED, IN_TRANSIT,
        RECEIVED_AT_FACILITY, UNDER_INSPECTION, PROCESSING_REUSE,
        PROCESSING_REPAIR, PROCESSING_RECYCLING, COMPLETED, CANCELLED, REJECTED
    ]


class DeviceCategory(db.Model):
    __tablename__ = "device_categories"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(100), unique=True, nullable=False)
    name_te = db.Column(db.String(150), nullable=True)  # Telugu name
    description = db.Column(db.Text, nullable=True)
    description_te = db.Column(db.Text, nullable=True)
    hazard_level = db.Column(db.String(30), default="low")  # low, medium, high, critical
    special_handling_instructions = db.Column(db.Text, nullable=True)
    special_handling_instructions_te = db.Column(db.Text, nullable=True)
    estimated_points_per_kg = db.Column(db.Integer, default=50)
    image_url = db.Column(db.String(255), nullable=True)

    requests = db.relationship("EWasteRequest", back_populates="category", lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "name_te": self.name_te,
            "description": self.description,
            "description_te": self.description_te,
            "hazard_level": self.hazard_level,
            "special_handling_instructions": self.special_handling_instructions,
            "special_handling_instructions_te": self.special_handling_instructions_te,
            "estimated_points_per_kg": self.estimated_points_per_kg,
            "image_url": self.image_url,
        }


class EWasteRequest(db.Model):
    __tablename__ = "ewaste_requests"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    request_code = db.Column(db.String(30), unique=True, nullable=False, index=True)  # e.g. ECO-2026-X8F9
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    category_id = db.Column(db.String(36), db.ForeignKey("device_categories.id"), nullable=True)
    organization_id = db.Column(db.String(36), db.ForeignKey("organizations.id"), nullable=True)
    
    # Device specifics
    device_name = db.Column(db.String(150), nullable=False)
    device_model = db.Column(db.String(100), nullable=True)
    device_description = db.Column(db.Text, nullable=True)
    quantity = db.Column(db.Integer, default=1, nullable=False)
    estimated_weight_kg = db.Column(db.Float, default=1.0)
    actual_weight_kg = db.Column(db.Float, nullable=True)
    
    # Media & AI
    image_path = db.Column(db.String(255), nullable=True)
    
    # Lifecycle
    status = db.Column(db.String(40), default=RequestStatus.SUBMITTED, nullable=False, index=True)
    safety_flag = db.Column(db.Boolean, default=False)
    safety_notes = db.Column(db.Text, nullable=True)
    recommendation = db.Column(db.String(40), nullable=True)  # reuse, repair, recycle, inspect
    
    # Pickup details
    address_id = db.Column(db.String(36), db.ForeignKey("addresses.id"), nullable=True)
    pickup_date = db.Column(db.String(30), nullable=True)
    pickup_time_slot = db.Column(db.String(50), nullable=True)
    assigned_collector_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True, index=True)
    receiving_partner_id = db.Column(db.String(36), db.ForeignKey("partners.id"), nullable=True, index=True)
    
    # Outcomes
    final_processing_outcome = db.Column(db.String(100), nullable=True)
    carbon_offset_kg = db.Column(db.Float, default=0.0)
    points_awarded = db.Column(db.Integer, default=0)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=utc_now)
    updated_at = db.Column(db.DateTime, default=utc_now, onupdate=utc_now)
    completed_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    user = db.relationship("User", foreign_keys=[user_id], back_populates="ewaste_requests")
    collector = db.relationship("User", foreign_keys=[assigned_collector_id], back_populates="assigned_pickups")
    category = db.relationship("DeviceCategory", back_populates="requests")
    address = db.relationship("Address")
    partner = db.relationship("Partner", back_populates="assigned_requests")
    ai_analysis = db.relationship("AIAnalysisRecord", back_populates="request", uselist=False, cascade="all, delete-orphan")
    status_history = db.relationship("RequestStatusHistory", back_populates="request", cascade="all, delete-orphan", order_by="RequestStatusHistory.created_at.desc()")
    handover_receipt = db.relationship("HandoverReceipt", back_populates="request", uselist=False)

    def to_dict(self):
        return {
            "id": self.id,
            "request_code": self.request_code,
            "user_id": self.user_id,
            "user_name": self.user.full_name if self.user else None,
            "user_phone": self.user.phone if self.user else None,
            "category_id": self.category_id,
            "category_name": self.category.name if self.category else "Unclassified",
            "category_name_te": self.category.name_te if self.category else None,
            "device_name": self.device_name,
            "device_model": self.device_model,
            "device_description": self.device_description,
            "quantity": self.quantity,
            "estimated_weight_kg": self.estimated_weight_kg,
            "actual_weight_kg": self.actual_weight_kg,
            "image_path": self.image_path,
            "status": self.status,
            "safety_flag": self.safety_flag,
            "safety_notes": self.safety_notes,
            "recommendation": self.recommendation,
            "pickup_date": self.pickup_date,
            "pickup_time_slot": self.pickup_time_slot,
            "address": self.address.to_dict() if self.address else None,
            "assigned_collector_id": self.assigned_collector_id,
            "collector_name": self.collector.full_name if self.collector else None,
            "receiving_partner_id": self.receiving_partner_id,
            "partner_name": self.partner.organization_name if self.partner else None,
            "final_processing_outcome": self.final_processing_outcome,
            "carbon_offset_kg": self.carbon_offset_kg,
            "points_awarded": self.points_awarded,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "has_receipt": bool(self.handover_receipt),
        }


class RequestStatusHistory(db.Model):
    __tablename__ = "request_status_history"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    request_id = db.Column(db.String(36), db.ForeignKey("ewaste_requests.id"), nullable=False, index=True)
    previous_status = db.Column(db.String(40), nullable=True)
    new_status = db.Column(db.String(40), nullable=False)
    changed_by_user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=utc_now)

    request = db.relationship("EWasteRequest", back_populates="status_history")
    changed_by = db.relationship("User")

    def to_dict(self):
        return {
            "id": self.id,
            "request_id": self.request_id,
            "previous_status": self.previous_status,
            "new_status": self.new_status,
            "changed_by": self.changed_by.full_name if self.changed_by else "System",
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
