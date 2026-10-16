import hashlib
from backend.app.models.base import db, generate_uuid, utc_now

class PartnerType:
    RECYCLING_FACILITY = "recycler"
    REFURBISHMENT_CENTER = "refurbisher"
    REPAIR_CENTER = "repair_center"


class Partner(db.Model):
    __tablename__ = "partners"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True)
    organization_name = db.Column(db.String(150), nullable=False)
    partner_type = db.Column(db.String(40), default=PartnerType.RECYCLING_FACILITY)
    
    # Regulatory compliance
    cpcb_license_number = db.Column(db.String(100), unique=True, nullable=True)  # Central Pollution Control Board
    license_valid_until = db.Column(db.String(20), nullable=True)
    is_verified = db.Column(db.Boolean, default=False)
    
    contact_email = db.Column(db.String(120), nullable=False)
    contact_phone = db.Column(db.String(30), nullable=False)
    facility_address = db.Column(db.String(255), nullable=False)
    city = db.Column(db.String(100), nullable=False, default="Hyderabad")
    state = db.Column(db.String(100), nullable=False, default="Telangana")
    monthly_capacity_metric_tons = db.Column(db.Float, default=50.0)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, default=utc_now)

    user = db.relationship("User")
    assigned_requests = db.relationship("EWasteRequest", back_populates="partner", lazy="dynamic")
    shipments = db.relationship("Shipment", back_populates="partner", lazy="dynamic")
    certificates = db.relationship("ProcessingCertificate", back_populates="partner", lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id,
            "organization_name": self.organization_name,
            "partner_type": self.partner_type,
            "cpcb_license_number": self.cpcb_license_number,
            "license_valid_until": self.license_valid_until,
            "is_verified": self.is_verified,
            "contact_email": self.contact_email,
            "contact_phone": self.contact_phone,
            "facility_address": self.facility_address,
            "city": self.city,
            "state": self.state,
            "monthly_capacity_metric_tons": self.monthly_capacity_metric_tons,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Shipment(db.Model):
    __tablename__ = "shipments"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    shipment_code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    partner_id = db.Column(db.String(36), db.ForeignKey("partners.id"), nullable=False)
    dispatched_by_collector_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    
    status = db.Column(db.String(40), default="in_transit")  # in_transit, received, inspected, completed
    total_items_count = db.Column(db.Integer, default=1)
    total_declared_weight_kg = db.Column(db.Float, default=0.0)
    actual_received_weight_kg = db.Column(db.Float, nullable=True)
    
    received_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=utc_now)

    partner = db.relationship("Partner", back_populates="shipments")
    collector = db.relationship("User", foreign_keys=[dispatched_by_collector_id])
    processing_records = db.relationship("ProcessingRecord", back_populates="shipment", cascade="all, delete-orphan", lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id,
            "shipment_code": self.shipment_code,
            "partner_id": self.partner_id,
            "partner_name": self.partner.organization_name if self.partner else None,
            "collector_name": self.collector.full_name if self.collector else None,
            "status": self.status,
            "total_items_count": self.total_items_count,
            "total_declared_weight_kg": self.total_declared_weight_kg,
            "actual_received_weight_kg": self.actual_received_weight_kg,
            "received_at": self.received_at.isoformat() if self.received_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class ProcessingRecord(db.Model):
    __tablename__ = "processing_records"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    shipment_id = db.Column(db.String(36), db.ForeignKey("shipments.id"), nullable=False)
    request_id = db.Column(db.String(36), db.ForeignKey("ewaste_requests.id"), nullable=False, unique=True)
    
    # Verification & classification at facility
    inspection_notes = db.Column(db.Text, nullable=True)
    outcome = db.Column(db.String(50), nullable=False)  # reused, repaired, recycled, haz_neutralized
    weight_kg = db.Column(db.Float, nullable=False)
    
    inspector_name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=utc_now)

    shipment = db.relationship("Shipment", back_populates="processing_records")
    request = db.relationship("EWasteRequest")
    material_recoveries = db.relationship("MaterialRecoveryRecord", back_populates="processing_record", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "shipment_id": self.shipment_id,
            "request_id": self.request_id,
            "request_code": self.request.request_code if self.request else None,
            "inspection_notes": self.inspection_notes,
            "outcome": self.outcome,
            "weight_kg": self.weight_kg,
            "inspector_name": self.inspector_name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "materials": [m.to_dict() for m in self.material_recoveries],
        }


class MaterialRecoveryRecord(db.Model):
    __tablename__ = "material_recovery_records"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    processing_record_id = db.Column(db.String(36), db.ForeignKey("processing_records.id"), nullable=False)
    material_type = db.Column(db.String(50), nullable=False)  # gold, copper, aluminum, steel, plastics, hazardous_lead, rare_earth
    quantity = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(20), default="grams")  # grams, kilograms
    created_at = db.Column(db.DateTime, default=utc_now)

    processing_record = db.relationship("ProcessingRecord", back_populates="material_recoveries")

    def to_dict(self):
        return {
            "id": self.id,
            "material_type": self.material_type,
            "quantity": self.quantity,
            "unit": self.unit,
        }


class ProcessingCertificate(db.Model):
    __tablename__ = "processing_certificates"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    certificate_number = db.Column(db.String(60), unique=True, nullable=False, index=True)
    request_id = db.Column(db.String(36), db.ForeignKey("ewaste_requests.id"), nullable=False, unique=True)
    partner_id = db.Column(db.String(36), db.ForeignKey("partners.id"), nullable=False)
    
    # Audit trail
    total_weight_kg = db.Column(db.Float, nullable=False)
    processing_method = db.Column(db.String(100), nullable=False)
    digital_signature_hash = db.Column(db.String(64), nullable=False)
    pdf_url = db.Column(db.String(255), nullable=True)
    issued_at = db.Column(db.DateTime, default=utc_now)

    partner = db.relationship("Partner", back_populates="certificates")
    request = db.relationship("EWasteRequest")

    @staticmethod
    def generate_cert_hash(cert_num, request_id, partner_id, weight, timestamp_str):
        raw_str = f"{cert_num}:{request_id}:{partner_id}:{weight}:{timestamp_str}"
        return hashlib.sha256(raw_str.encode("utf-8")).hexdigest()

    def to_dict(self):
        return {
            "id": self.id,
            "certificate_number": self.certificate_number,
            "request_id": self.request_id,
            "request_code": self.request.request_code if self.request else None,
            "partner_name": self.partner.organization_name if self.partner else None,
            "total_weight_kg": self.total_weight_kg,
            "processing_method": self.processing_method,
            "digital_signature_hash": self.digital_signature_hash,
            "pdf_url": self.pdf_url,
            "issued_at": self.issued_at.isoformat() if self.issued_at else None,
        }
