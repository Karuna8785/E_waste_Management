from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app.models.base import db
from backend.app.models.user import User
from backend.app.models.marketplace import MarketplaceListing, ListingStatus, ListingInquiry

marketplace_bp = Blueprint("marketplace", __name__)

@marketplace_bp.route("/listings", methods=["GET"])
def get_listings():
    category = request.args.get("category")
    condition = request.args.get("condition")
    query = MarketplaceListing.query.filter_by(status=ListingStatus.AVAILABLE)

    if category:
        query = query.filter(MarketplaceListing.category.ilike(f"%{category}%"))
    if condition:
        query = query.filter_by(condition_grade=condition)

    listings = query.order_by(MarketplaceListing.created_at.desc()).all()
    return jsonify({"listings": [l.to_dict() for l in listings]}), 200


@marketplace_bp.route("/listings/<listing_id>", methods=["GET"])
def get_listing_detail(listing_id):
    listing = MarketplaceListing.query.get(listing_id)
    if not listing:
        return jsonify({"error": "Listing not found"}), 404

    listing.views_count += 1
    db.session.commit()
    return jsonify({"listing": listing.to_dict()}), 200


@marketplace_bp.route("/listings/<listing_id>/inquire", methods=["POST"])
@jwt_required()
def submit_inquiry(listing_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    listing = MarketplaceListing.query.get(listing_id)
    if not listing:
        return jsonify({"error": "Listing not found"}), 404

    data = request.get_json() or {}
    message = (data.get("message") or "").strip()
    if not message:
        return jsonify({"error": "Message is required"}), 400

    inquiry = ListingInquiry(
        listing_id=listing.id,
        user_id=user.id,
        message=message,
        buyer_phone=data.get("phone", user.phone)
    )
    db.session.add(inquiry)
    db.session.commit()

    return jsonify({"message": "Inquiry submitted to seller", "inquiry": inquiry.to_dict()}), 201
