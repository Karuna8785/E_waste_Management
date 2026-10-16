from backend.app.models.base import db, generate_uuid, utc_now

class AuditLog(db.Model):
    __tablename__ = "audit_logs"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    actor_user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True, index=True)
    action = db.Column(db.String(100), nullable=False, index=True)  # e.g. USER_REGISTER, REQUEST_STATUS_CHANGE, CERTIFICATE_ISSUED
    target_type = db.Column(db.String(50), nullable=True)  # e.g. ewaste_request, user, partner, shipment
    target_id = db.Column(db.String(50), nullable=True)
    details = db.Column(db.Text, nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    created_at = db.Column(db.DateTime, default=utc_now, index=True)

    actor = db.relationship("User")

    def to_dict(self):
        return {
            "id": self.id,
            "actor_user_id": self.actor_user_id,
            "actor_name": self.actor.full_name if self.actor else "System",
            "actor_role": self.actor.role if self.actor else "system",
            "action": self.action,
            "target_type": self.target_type,
            "target_id": self.target_id,
            "details": self.details,
            "ip_address": self.ip_address,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class SystemNotification(db.Model):
    __tablename__ = "system_notifications"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    title = db.Column(db.String(150), nullable=False)
    title_te = db.Column(db.String(200), nullable=True)
    message = db.Column(db.Text, nullable=False)
    message_te = db.Column(db.Text, nullable=True)
    notification_type = db.Column(db.String(30), default="info")  # info, success, warning, pickup, reward
    is_read = db.Column(db.Boolean, default=False)
    action_url = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=utc_now)

    user = db.relationship("User")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "title_te": self.title_te,
            "message": self.message,
            "message_te": self.message_te,
            "notification_type": self.notification_type,
            "is_read": self.is_read,
            "action_url": self.action_url,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Complaint(db.Model):
    __tablename__ = "complaints"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    request_id = db.Column(db.String(36), db.ForeignKey("ewaste_requests.id"), nullable=True)
    subject = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(30), default="open")  # open, under_review, resolved, dismissed
    resolution_notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=utc_now)

    user = db.relationship("User")
    request = db.relationship("EWasteRequest")

    def to_dict(self):
        return {
            "id": self.id,
            "user_name": self.user.full_name if self.user else None,
            "request_code": self.request.request_code if self.request else None,
            "subject": self.subject,
            "description": self.description,
            "status": self.status,
            "resolution_notes": self.resolution_notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class ApplicationSetting(db.Model):
    __tablename__ = "application_settings"

    key = db.Column(db.String(100), primary_key=True)
    value = db.Column(db.Text, nullable=False)
    description = db.Column(db.String(255), nullable=True)
    updated_at = db.Column(db.DateTime, default=utc_now, onupdate=utc_now)
