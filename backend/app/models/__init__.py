from backend.app.models.base import db, Base, generate_uuid, utc_now
from backend.app.models.user import User, UserRole, Organization, Address
from backend.app.models.ewaste import DeviceCategory, EWasteRequest, RequestStatus, RequestStatusHistory
from backend.app.models.ai_analysis import AIAnalysisRecord, RecommendationType
from backend.app.models.pickup import HandoverReceipt, CollectorRouteStop
from backend.app.models.partner import Partner, PartnerType, Shipment, ProcessingRecord, MaterialRecoveryRecord, ProcessingCertificate
from backend.app.models.marketplace import MarketplaceListing, ListingStatus, ListingInquiry
from backend.app.models.rewards import RewardTransaction, CommunityCampaign, CampaignParticipant
from backend.app.models.audit import AuditLog, SystemNotification, Complaint, ApplicationSetting

__all__ = [
    "db",
    "Base",
    "generate_uuid",
    "utc_now",
    "User",
    "UserRole",
    "Organization",
    "Address",
    "DeviceCategory",
    "EWasteRequest",
    "RequestStatus",
    "RequestStatusHistory",
    "AIAnalysisRecord",
    "RecommendationType",
    "HandoverReceipt",
    "CollectorRouteStop",
    "Partner",
    "PartnerType",
    "Shipment",
    "ProcessingRecord",
    "MaterialRecoveryRecord",
    "ProcessingCertificate",
    "MarketplaceListing",
    "ListingStatus",
    "ListingInquiry",
    "RewardTransaction",
    "CommunityCampaign",
    "CampaignParticipant",
    "AuditLog",
    "SystemNotification",
    "Complaint",
    "ApplicationSetting",
]
