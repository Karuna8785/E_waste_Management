from backend.app.models.base import db, generate_uuid, utc_now

class ListingStatus:
    AVAILABLE = "available"
    RESERVED = "reserved"
    SOLD = "sold"
    DELISTED = "delisted"


class MarketplaceListing(db.Model):
    __tablename__ = "marketplace_listings"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    request_id = db.Column(db.String(36), db.ForeignKey("ewaste_requests.id"), nullable=True)
    seller_partner_id = db.Column(db.String(36), db.ForeignKey("partners.id"), nullable=False)
    
    title = db.Column(db.String(150), nullable=False)
    category = db.Column(db.String(80), nullable=False)
    description = db.Column(db.Text, nullable=False)
    
    # Grading & verification
    condition_grade = db.Column(db.String(30), default="Refurbished Grade A")  # Grade A, B, Open Box
    specifications = db.Column(db.Text, nullable=True)  # JSON or plain specs
    price_inr = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(30), default=ListingStatus.AVAILABLE)
    
    warranty_months = db.Column(db.Integer, default=6)
    refurbishment_notes = db.Column(db.Text, nullable=True)
    image_url = db.Column(db.String(255), nullable=True)
    
    views_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=utc_now)

    seller = db.relationship("Partner")
    request = db.relationship("EWasteRequest")
    inquiries = db.relationship("ListingInquiry", back_populates="listing", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "category": self.category,
            "description": self.description,
            "condition_grade": self.condition_grade,
            "specifications": self.specifications,
            "price_inr": self.price_inr,
            "status": self.status,
            "warranty_months": self.warranty_months,
            "refurbishment_notes": self.refurbishment_notes,
            "image_url": self.image_url,
            "seller_name": self.seller.organization_name if self.seller else None,
            "views_count": self.views_count,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class ListingInquiry(db.Model):
    __tablename__ = "listing_inquiries"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    listing_id = db.Column(db.String(36), db.ForeignKey("marketplace_listings.id"), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    message = db.Column(db.Text, nullable=False)
    buyer_phone = db.Column(db.String(30), nullable=True)
    status = db.Column(db.String(30), default="pending")  # pending, answered, closed
    created_at = db.Column(db.DateTime, default=utc_now)

    listing = db.relationship("MarketplaceListing", back_populates="inquiries")
    buyer = db.relationship("User")

    def to_dict(self):
        return {
            "id": self.id,
            "listing_id": self.listing_id,
            "buyer_name": self.buyer.full_name if self.buyer else None,
            "buyer_email": self.buyer.email if self.buyer else None,
            "buyer_phone": self.buyer_phone,
            "message": self.message,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
