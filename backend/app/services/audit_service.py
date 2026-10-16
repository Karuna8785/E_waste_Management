import json
from flask import request
from backend.app.models.base import db
from backend.app.models.audit import AuditLog, SystemNotification

class AuditService:
    @staticmethod
    def log_event(action: str, actor_user_id: str = None, target_type: str = None, target_id: str = None, details: dict = None):
        """
        Records an immutable audit event in the database with client IP.
        """
        try:
            ip_address = None
            if request:
                ip_address = request.headers.get("X-Forwarded-For", request.remote_addr)
                if ip_address and "," in ip_address:
                    ip_address = ip_address.split(",")[0].strip()
        except Exception:
            ip_address = "127.0.0.1"

        log_entry = AuditLog(
            actor_user_id=actor_user_id,
            action=action,
            target_type=target_type,
            target_id=str(target_id) if target_id else None,
            details=json.dumps(details) if isinstance(details, dict) else str(details or ""),
            ip_address=ip_address
        )
        db.session.add(log_entry)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()

    @staticmethod
    def send_notification(user_id: str, title: str, message: str, notification_type: str = "info", action_url: str = None, title_te: str = None, message_te: str = None):
        """
        Dispatches in-app notification with optional Telugu translations.
        """
        notif = SystemNotification(
            user_id=user_id,
            title=title,
            title_te=title_te,
            message=message,
            message_te=message_te,
            notification_type=notification_type,
            action_url=action_url,
            is_read=False
        )
        db.session.add(notif)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
