from backend.app.models.base import db, generate_uuid, utc_now

class RewardTransaction(db.Model):
    __tablename__ = "reward_transactions"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    points = db.Column(db.Integer, nullable=False)  # Positive for earning, negative for redemption
    event_type = db.Column(db.String(50), nullable=False)  # handover_verified, campaign_bonus, voucher_redeemed
    reference_id = db.Column(db.String(50), nullable=True)  # request_id or voucher_code
    description = db.Column(db.String(255), nullable=False)
    description_te = db.Column(db.String(255), nullable=True)
    balance_after = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=utc_now)

    user = db.relationship("User", back_populates="reward_transactions")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "points": self.points,
            "event_type": self.event_type,
            "reference_id": self.reference_id,
            "description": self.description,
            "description_te": self.description_te,
            "balance_after": self.balance_after,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class CommunityCampaign(db.Model):
    __tablename__ = "community_campaigns"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    title = db.Column(db.String(150), nullable=False)
    title_te = db.Column(db.String(200), nullable=True)
    description = db.Column(db.Text, nullable=False)
    description_te = db.Column(db.Text, nullable=True)
    
    organization_id = db.Column(db.String(36), db.ForeignKey("organizations.id"), nullable=True)
    city = db.Column(db.String(100), default="Hyderabad")
    location_name = db.Column(db.String(150), nullable=False)
    
    target_weight_kg = db.Column(db.Float, default=500.0)
    collected_weight_kg = db.Column(db.Float, default=0.0)
    bonus_points_multiplier = db.Column(db.Float, default=1.5)
    
    start_date = db.Column(db.String(30), nullable=False)
    end_date = db.Column(db.String(30), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    image_url = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=utc_now)

    organization = db.relationship("Organization", back_populates="campaigns")
    participants = db.relationship("CampaignParticipant", back_populates="campaign", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "title_te": self.title_te,
            "description": self.description,
            "description_te": self.description_te,
            "organization_name": self.organization.name if self.organization else "EcoCycle Community",
            "city": self.city,
            "location_name": self.location_name,
            "target_weight_kg": self.target_weight_kg,
            "collected_weight_kg": self.collected_weight_kg,
            "bonus_points_multiplier": self.bonus_points_multiplier,
            "start_date": self.start_date,
            "end_date": self.end_date,
            "is_active": self.is_active,
            "image_url": self.image_url,
            "participants_count": len(self.participants),
            "progress_percentage": round((self.collected_weight_kg / self.target_weight_kg) * 100, 1) if self.target_weight_kg > 0 else 0,
        }


class CampaignParticipant(db.Model):
    __tablename__ = "campaign_participants"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    campaign_id = db.Column(db.String(36), db.ForeignKey("community_campaigns.id"), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    contributed_kg = db.Column(db.Float, default=0.0)
    registered_at = db.Column(db.DateTime, default=utc_now)

    campaign = db.relationship("CommunityCampaign", back_populates="participants")
    user = db.relationship("User")

    def to_dict(self):
        return {
            "id": self.id,
            "campaign_id": self.campaign_id,
            "user_name": self.user.full_name if self.user else None,
            "contributed_kg": self.contributed_kg,
            "registered_at": self.registered_at.isoformat() if self.registered_at else None,
        }
