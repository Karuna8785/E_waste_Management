import json
from backend.app.models.base import db, generate_uuid, utc_now

class RecommendationType:
    REUSE = "reuse"
    REPAIR = "repair"
    RECYCLE = "recycle"
    MANUAL_INSPECTION = "inspect"


class AIAnalysisRecord(db.Model):
    __tablename__ = "ai_analysis_records"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    request_id = db.Column(db.String(36), db.ForeignKey("ewaste_requests.id"), nullable=True, unique=True, index=True)
    image_filename = db.Column(db.String(255), nullable=False)
    model_version = db.Column(db.String(50), default="EcoCycle-Vision-v1.4")
    
    # Classification results
    predicted_category = db.Column(db.String(100), nullable=False)
    confidence = db.Column(db.Float, nullable=False)
    secondary_predictions_json = db.Column(db.Text, nullable=True)  # JSON array of alternative classes and probs
    
    # Visual defect indicators detected by CV
    has_cracked_screen = db.Column(db.Boolean, default=False)
    has_swollen_battery = db.Column(db.Boolean, default=False)
    has_burn_or_corrosion = db.Column(db.Boolean, default=False)
    has_missing_casing = db.Column(db.Boolean, default=False)
    is_disassembled = db.Column(db.Boolean, default=False)
    
    # User questionnaire answers
    answers_json = db.Column(db.Text, nullable=True)  # JSON dictionary of questionnaire answers
    
    # Final AI Recommendation
    recommendation = db.Column(db.String(40), nullable=False, default=RecommendationType.MANUAL_INSPECTION)
    reasoning_en = db.Column(db.Text, nullable=False)
    reasoning_te = db.Column(db.Text, nullable=False)
    
    # Estimated recoverable materials (percentage estimates)
    estimated_materials_json = db.Column(db.Text, nullable=True)
    
    # Metadata
    is_user_corrected = db.Column(db.Boolean, default=False)
    corrected_category = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=utc_now)

    request = db.relationship("EWasteRequest", back_populates="ai_analysis")

    def get_secondary_predictions(self):
        if self.secondary_predictions_json:
            try:
                return json.loads(self.secondary_predictions_json)
            except Exception:
                return []
        return []

    def get_answers(self):
        if self.answers_json:
            try:
                return json.loads(self.answers_json)
            except Exception:
                return {}
        return {}

    def get_estimated_materials(self):
        if self.estimated_materials_json:
            try:
                return json.loads(self.estimated_materials_json)
            except Exception:
                return {}
        return {}

    def to_dict(self):
        return {
            "id": self.id,
            "request_id": self.request_id,
            "image_filename": self.image_filename,
            "model_version": self.model_version,
            "predicted_category": self.predicted_category,
            "confidence": self.confidence,
            "secondary_predictions": self.get_secondary_predictions(),
            "visual_flags": {
                "has_cracked_screen": self.has_cracked_screen,
                "has_swollen_battery": self.has_swollen_battery,
                "has_burn_or_corrosion": self.has_burn_or_corrosion,
                "has_missing_casing": self.has_missing_casing,
                "is_disassembled": self.is_disassembled,
            },
            "answers": self.get_answers(),
            "recommendation": self.recommendation,
            "reasoning_en": self.reasoning_en,
            "reasoning_te": self.reasoning_te,
            "estimated_materials": self.get_estimated_materials(),
            "is_user_corrected": self.is_user_corrected,
            "corrected_category": self.corrected_category,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
