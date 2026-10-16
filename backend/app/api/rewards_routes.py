import uuid
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app.models.base import db
from backend.app.models.user import User, Organization
from backend.app.models.rewards import RewardTransaction, CommunityCampaign
from backend.app.services.audit_service import AuditService

rewards_bp = Blueprint("rewards", __name__)

AVAILABLE_VOUCHERS = [
    {"id": "vouch_tree_01", "title": "Plant a Native Tree in Your Name", "points_cost": 200, "category": "Green Forestry", "partner": "Green Hyderabad Foundation"},
    {"id": "vouch_stat_02", "title": "Recycled Stationery Gift Hamper", "points_cost": 350, "category": "Eco Goods", "partner": "BioCraft India"},
    {"id": "vouch_disc_03", "title": "₹500 Discount on Refurbished Electronics", "points_cost": 500, "category": "Marketplace", "partner": "EcoCycle Verified Tech"},
    {"id": "vouch_solr_04", "title": "Portable Solar Power Bank Discount (40% OFF)", "points_cost": 750, "category": "Clean Tech", "partner": "SunCharge Systems"}
]

@rewards_bp.route("/ledger", methods=["GET"])
@jwt_required()
def get_user_ledger():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    txs = RewardTransaction.query.filter_by(user_id=user_id).order_by(RewardTransaction.created_at.desc()).all()
    return jsonify({
        "current_balance": user.eco_points_balance,
        "transactions": [t.to_dict() for t in txs],
        "available_vouchers": AVAILABLE_VOUCHERS
    }), 200


@rewards_bp.route("/redeem", methods=["POST"])
@jwt_required()
def redeem_voucher():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json() or {}
    voucher_id = data.get("voucher_id")
    voucher = next((v for v in AVAILABLE_VOUCHERS if v["id"] == voucher_id), None)
    if not voucher:
        return jsonify({"error": "Invalid voucher selection"}), 400

    if user.eco_points_balance < voucher["points_cost"]:
        return jsonify({
            "error": "Insufficient EcoPoints balance",
            "required": voucher["points_cost"],
            "current": user.eco_points_balance
        }), 400

    user.eco_points_balance -= voucher["points_cost"]
    coupon_code = f"ECO-REDEEM-{uuid.uuid4().hex[:6].upper()}"

    tx = RewardTransaction(
        user_id=user.id,
        points=-voucher["points_cost"],
        event_type="voucher_redeemed",
        reference_id=coupon_code,
        description=f"Redeemed: {voucher['title']} (Code: {coupon_code})",
        description_te=f"రిడీమ్ చేయబడింది: {voucher['title']} (కోడ్: {coupon_code})",
        balance_after=user.eco_points_balance
    )
    db.session.add(tx)
    db.session.commit()

    AuditService.log_event("REWARD_REDEEMED", actor_user_id=user.id, target_type="voucher", target_id=coupon_code, details={"cost": voucher["points_cost"]})
    return jsonify({
        "message": "Voucher redeemed successfully!",
        "coupon_code": coupon_code,
        "voucher": voucher,
        "new_balance": user.eco_points_balance
    }), 200


@rewards_bp.route("/leaderboard", methods=["GET"])
def get_leaderboards():
    # Top users by points
    top_users = User.query.filter(User.eco_points_balance > 0).order_by(User.eco_points_balance.desc()).limit(10).all()
    user_leaderboard = [{
        "rank": idx + 1,
        "name": u.full_name,
        "city": u.addresses.first().city if u.addresses.count() > 0 else "Hyderabad",
        "points": u.eco_points_balance
    } for idx, u in enumerate(top_users)]

    # Organizations leaderboard
    orgs = Organization.query.limit(10).all()
    org_leaderboard = [{
        "rank": idx + 1,
        "name": o.name,
        "org_type": o.org_type,
        "city": o.city,
        "total_campaigns": o.campaigns.count(),
        "total_members": o.members.count()
    } for idx, o in enumerate(orgs)]

    return jsonify({
        "individual_champions": user_leaderboard,
        "organization_leaderboard": org_leaderboard
    }), 200
