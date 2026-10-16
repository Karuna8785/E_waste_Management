import hashlib
from backend.app.models.base import db, generate_uuid, utc_now

class HandoverReceipt(db.Model):
    __tablename__ = "handover_receipts"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    receipt_code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    request_id = db.Column(db.String(36), db.ForeignKey("ewaste_requests.id"), nullable=False, unique=True)
    collector_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    
    # Handover verification data
    verified_weight_kg = db.Column(db.Float, nullable=False)
    verified_item_count = db.Column(db.Integer, default=1, nullable=False)
    collection_photo_path = db.Column(db.String(255), nullable=True)
    signature_user = db.Column(db.String(255), nullable=True)  # Name / confirmation token
    signature_collector = db.Column(db.String(255), nullable=True)
    
    # Cryptographic integrity verification hash
    verification_hash = db.Column(db.String(64), nullable=False)
    pdf_path = db.Column(db.String(255), nullable=True)
    
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=utc_now)

    request = db.relationship("EWasteRequest", back_populates="handover_receipt")
    collector = db.relationship("User", foreign_keys=[collector_id])
    user = db.relationship("User", foreign_keys=[user_id])

    @staticmethod
    def generate_hash(receipt_code, request_id, collector_id, weight, timestamp_str):
        raw_string = f"{receipt_code}:{request_id}:{collector_id}:{weight}:{timestamp_str}"
        return hashlib.sha256(raw_string.encode("utf-8")).hexdigest()

    def to_dict(self):
        return {
            "id": self.id,
            "receipt_code": self.receipt_code,
            "request_id": self.request_id,
            "collector_id": self.collector_id,
            "collector_name": self.collector.full_name if self.collector else None,
            "user_id": self.user_id,
            "user_name": self.user.full_name if self.user else None,
            "verified_weight_kg": self.verified_weight_kg,
            "verified_item_count": self.verified_item_count,
            "collection_photo_path": self.collection_photo_path,
            "signature_user": self.signature_user,
            "signature_collector": self.signature_collector,
            "verification_hash": self.verification_hash,
            "pdf_path": self.pdf_path,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class CollectorRouteStop(db.Model):
    __tablename__ = "collector_route_stops"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    collector_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    request_id = db.Column(db.String(36), db.ForeignKey("ewaste_requests.id"), nullable=False)
    stop_sequence = db.Column(db.Integer, default=1, nullable=False)
    scheduled_date = db.Column(db.String(20), nullable=False)
    estimated_arrival_window = db.Column(db.String(50), nullable=True)
    is_completed = db.Column(db.Boolean, default=False)
    completed_at = db.Column(db.DateTime, nullable=True)

    collector = db.relationship("User", foreign_keys=[collector_id])
    request = db.relationship("EWasteRequest")

    def to_dict(self):
        return {
            "id": self.id,
            "collector_id": self.collector_id,
            "request_id": self.request_id,
            "stop_sequence": self.stop_sequence,
            "scheduled_date": self.scheduled_date,
            "estimated_arrival_window": self.estimated_arrival_window,
            "is_completed": self.is_completed,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "request": self.request.to_dict() if self.request else None,
        }
