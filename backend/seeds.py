import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

from backend.app import create_app
from backend.app.models.base import db, utc_now
from backend.app.models.user import User, UserRole, Organization, Address
from backend.app.models.ewaste import DeviceCategory, EWasteRequest, RequestStatus, RequestStatusHistory
from backend.app.models.ai_analysis import AIAnalysisRecord
from backend.app.models.pickup import HandoverReceipt
from backend.app.models.partner import Partner, PartnerType, Shipment, ProcessingRecord, MaterialRecoveryRecord, ProcessingCertificate
from backend.app.models.marketplace import MarketplaceListing, ListingStatus
from backend.app.models.rewards import RewardTransaction, CommunityCampaign
from backend.app.models.audit import AuditLog
from backend.app.services.audit_service import AuditService

def seed_database():
    app = create_app("development")
    with app.app_context():
        print("🌱 Creating database tables...")
        db.create_all()

        if User.query.first():
            print("Database already seeded. Skipping initial seeding.")
            return

        print("🌱 Seeding Device Categories...")
        categories_data = [
            {
                "name": "Mobile Phone",
                "name_te": "మొబైల్ ఫోన్ / స్మార్ట్‌ఫోన్",
                "description": "Smartphones, feature phones, PDAs, and mobile accessories.",
                "description_te": "స్మార్ట్‌ఫోన్లు, బటన్ ఫోన్లు మరియు మొబైల్ ఉపకరణాలు.",
                "hazard_level": "medium",
                "special_handling_instructions": "Ensure lithium battery is not punctured. Keep separate from magnetic fields.",
                "special_handling_instructions_te": "లిథియం బ్యాటరీ దెబ్బతినకుండా జాగ్రత్తపడండి.",
                "estimated_points_per_kg": 75,
                "image_url": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80"
            },
            {
                "name": "Laptop",
                "name_te": "ల్యాప్‌టాప్ కంప్యూటర్",
                "description": "Notebooks, ultrabooks, Chromebooks, and portable computing hardware.",
                "description_te": "నోట్‌బుక్‌లు, అల్ట్రాబుక్‌లు మరియు ల్యాప్‌టాప్ పరికరాలు.",
                "hazard_level": "medium",
                "special_handling_instructions": "Inspect battery swelling under trackpad. Store in padded container.",
                "special_handling_instructions_te": "ట్రాక్‌ప్యాడ్ కింద బ్యాటరీ ఉబ్బిందో లేదో గమనించండి.",
                "estimated_points_per_kg": 65,
                "image_url": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&q=80"
            },
            {
                "name": "Desktop Computer",
                "name_te": "డెస్క్‌టాప్ కంప్యూటర్ (CPU)",
                "description": "Towers, workstations, mini PCs, and server racks.",
                "description_te": "సిపియు టవర్లు, వర్క్‌స్టేషన్లు మరియు కంప్యూటర్ సిస్టమ్‌లు.",
                "hazard_level": "low",
                "special_handling_instructions": "Discharge power supply units prior to transit.",
                "special_handling_instructions_te": "రవాణాకు ముందు పవర్ సప్లైని డిశ్చార్జ్ చేయండి.",
                "estimated_points_per_kg": 45,
                "image_url": "https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=600&q=80"
            },
            {
                "name": "Monitor / Television",
                "name_te": "మానిటర్ / టెలివిజన్ (LED/LCD/CRT)",
                "description": "Computer displays, LED/LCD screens, and cathode ray tube monitors.",
                "description_te": "కంప్యూటర్ మానిటర్లు, ఎల్‌ఈడీ/ఎల్‌సీడీ టీవీ స్క్రీన్లు.",
                "hazard_level": "high",
                "special_handling_instructions": "CRITICAL: CRT glass contains toxic phosphor and lead. Do not crack screen vacuum tube.",
                "special_handling_instructions_te": "ముఖ్య గమనిక: సీఆర్టీ గ్లాస్‌లో సీసం మరియు భాస్వరం ఉంటాయి. పగలనీయకండి.",
                "estimated_points_per_kg": 40,
                "image_url": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80"
            },
            {
                "name": "Electronic Circuit Board (PCB)",
                "name_te": "ఎలక్ట్రానిక్ సర్క్యూట్ బోర్డు (PCB)",
                "description": "Motherboards, graphics cards, sound boards, RAM modules, and industrial PCBs.",
                "description_te": "మదర్‌బోర్డులు, గ్రాఫిక్స్ కార్డులు, రామ్ మరియు ప్రింటెడ్ సర్క్యూట్లు.",
                "hazard_level": "low",
                "special_handling_instructions": "High concentration of recoverable gold and palladium. Keep dry.",
                "special_handling_instructions_te": "బంగారం మరియు రాగి రికవరీకి ఉత్తమమైనవి. పొడిగా ఉంచండి.",
                "estimated_points_per_kg": 120,
                "image_url": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80"
            },
            {
                "name": "Battery or Power Bank",
                "name_te": "బ్యాటరీ / పవర్ బ్యాంక్",
                "description": "Lithium-ion batteries, laptop battery packs, UPS batteries, and external power banks.",
                "description_te": "లిథియం అయాన్ బ్యాటరీలు, యుపిఎస్ మరియు పవర్ బ్యాంకులు.",
                "hazard_level": "critical",
                "special_handling_instructions": "CRITICAL FLAMMABLE HAZARD: Store in sand/vermiculite container. Tape exposed metal terminals.",
                "special_handling_instructions_te": "తీవ్ర ప్రమాదం: ఎండలో పెట్టవద్దు, టెర్మినల్స్‌కు టేప్ వేయండి.",
                "estimated_points_per_kg": 90,
                "image_url": "https://images.unsplash.com/photo-1609592807901-389f417578be?auto=format&fit=crop&w=600&q=80"
            },
            {
                "name": "Charger or Cable",
                "name_te": "ఛార్జర్లు మరియు కేబుల్స్",
                "description": "AC power adapters, USB cables, HDMI cords, and copper power cords.",
                "description_te": "ఏసీ అడాప్టర్లు, యుఎస్‌బి వైర్లు మరియు కాపర్ కేబుల్స్.",
                "hazard_level": "low",
                "special_handling_instructions": "Bundle securely using zip-ties or rubber bands.",
                "special_handling_instructions_te": "వైర్లను సురక్షితంగా బండిల్ చేయండి.",
                "estimated_points_per_kg": 35,
                "image_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80"
            },
            {
                "name": "Printer or Scanner",
                "name_te": "ప్రింటర్ లేదా స్కానర్",
                "description": "Inkjet, laser printers, multifunction scanners, and toner mechanisms.",
                "description_te": "ఇంక్‌జెట్, లేజర్ ప్రింటర్లు మరియు స్కానింగ్ యూనిట్లు.",
                "hazard_level": "medium",
                "special_handling_instructions": "Remove toner cartridges and seal them in plastic bags to avoid fine particulate inhalation.",
                "special_handling_instructions_te": "టోనర్ కార్ట్రిడ్జ్‌లను వేరుగా ఉంచండి.",
                "estimated_points_per_kg": 30,
                "image_url": "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=600&q=80"
            }
        ]

        categories = {}
        for c in categories_data:
            cat = DeviceCategory(**c)
            db.session.add(cat)
            categories[c["name"]] = cat
        db.session.flush()

        print("🌱 Seeding Organization...")
        cbit_org = Organization(
            name="Chaitanya Bharathi Institute of Technology (CBIT)",
            org_type="college",
            registration_number="CBIT-HYD-TS-1979",
            contact_email="green-campus@cbit.ac.in",
            contact_phone="+91 40 2419 3276",
            address="Gandipet, Hyderabad",
            city="Hyderabad",
            state="Telangana"
        )
        db.session.add(cbit_org)
        db.session.flush()

        print("🌱 Seeding Users for all 5 roles...")
        # 1. Individual User
        user_citizen = User(
            email="user@ecocycle.org",
            full_name="Ananya Sharma",
            phone="+91 98490 12345",
            role=UserRole.INDIVIDUAL,
            preferred_language="en",
            eco_points_balance=320,
            is_active=True,
            is_verified=True
        )
        user_citizen.set_password("password123")
        db.session.add(user_citizen)
        db.session.flush()

        # Citizen address
        addr1 = Address(
            user_id=user_citizen.id,
            label="Home",
            street_address="Plot 42, Road No. 10, Banjara Hills",
            landmark="Near City Center Mall",
            city="Hyderabad",
            state="Telangana",
            postal_code="500034",
            latitude=17.4156,
            longitude=78.4350,
            is_default=True
        )
        db.session.add(addr1)

        # 2. Collector
        collector_user = User(
            email="collector@ecocycle.org",
            full_name="Ramesh Kumar (EcoCollector)",
            phone="+91 94401 56789",
            role=UserRole.COLLECTOR,
            preferred_language="te",
            eco_points_balance=0,
            is_active=True,
            is_verified=True
        )
        collector_user.set_password("password123")
        db.session.add(collector_user)

        # 3. Partner / Recycler
        partner_user = User(
            email="partner@ecocycle.org",
            full_name="Dr. V. Satyanarayana",
            phone="+91 98850 77112",
            role=UserRole.PARTNER,
            preferred_language="en",
            is_active=True,
            is_verified=True
        )
        partner_user.set_password("password123")
        db.session.add(partner_user)
        db.session.flush()

        # Partner facility record
        ts_recycler = Partner(
            user_id=partner_user.id,
            organization_name="Telangana Green E-Waste Dismantling & Refining Facility",
            partner_type=PartnerType.RECYCLING_FACILITY,
            cpcb_license_number="TSPCB-EW-RO-HYD-2026-0814",
            license_valid_until="2029-03-31",
            is_verified=True,
            contact_email="operations@greencycle-ts.org",
            contact_phone="+91 40 2300 4567",
            facility_address="Phase II, Industrial Development Area, Cherlapally",
            city="Hyderabad",
            state="Telangana",
            monthly_capacity_metric_tons=120.0,
            latitude=17.4580,
            longitude=78.6010
        )
        db.session.add(ts_recycler)
        db.session.flush()

        # 4. Organization Manager
        org_manager = User(
            email="org@cbit.ac.in",
            full_name="Prof. K. Venkatesh Rao",
            phone="+91 91770 33445",
            role=UserRole.ORGANIZATION_MANAGER,
            preferred_language="te",
            organization_id=cbit_org.id,
            is_active=True,
            is_verified=True
        )
        org_manager.set_password("password123")
        db.session.add(org_manager)

        # 5. Administrator
        admin_user = User(
            email="admin@ecocycle.org",
            full_name="Pooja Reddy (Operations Director)",
            phone="+91 99880 99880",
            role=UserRole.ADMIN,
            preferred_language="en",
            is_active=True,
            is_verified=True
        )
        admin_user.set_password("password123")
        db.session.add(admin_user)
        db.session.flush()

        print("🌱 Seeding Sample E-Waste Requests with realistic lifecycles...")
        # Request 1: Completed with Handover Receipt & Certificate
        req1 = EWasteRequest(
            request_code="ECO-2026-X8F9",
            user_id=user_citizen.id,
            category_id=categories["Laptop"].id,
            device_name="Lenovo ThinkPad T480",
            device_model="20L5-0010US",
            device_description="Screen powers on with backlight, internal fan functional. Upgraded to modern laptop.",
            quantity=1,
            estimated_weight_kg=1.85,
            actual_weight_kg=1.82,
            image_path="https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=600&q=80",
            status=RequestStatus.COMPLETED,
            recommendation="reuse",
            address_id=addr1.id,
            pickup_date="2026-10-12",
            pickup_time_slot="10:00 AM - 01:00 PM",
            assigned_collector_id=collector_user.id,
            receiving_partner_id=ts_recycler.id,
            final_processing_outcome="reused",
            carbon_offset_kg=5.18,
            points_awarded=100
        )
        db.session.add(req1)
        db.session.flush()

        # Handover receipt for req1
        rcpt1 = HandoverReceipt(
            receipt_code="RCPT-2026-7A8B9C",
            request_id=req1.id,
            collector_id=collector_user.id,
            user_id=user_citizen.id,
            verified_weight_kg=1.82,
            verified_item_count=1,
            signature_user="Ananya Sharma",
            signature_collector="Ramesh Kumar",
            verification_hash=HandoverReceipt.generate_hash("RCPT-2026-7A8B9C", req1.id, collector_user.id, 1.82, "2026-10-12T11:20:00"),
            notes="Item in prime condition. Packaged safely in anti-static protective bubble sleeve."
        )
        db.session.add(rcpt1)

        # Recycling certificate for req1
        cert1 = ProcessingCertificate(
            certificate_number="CERT-2026-EW-9812",
            request_id=req1.id,
            partner_id=ts_recycler.id,
            total_weight_kg=1.82,
            processing_method="Certified Refurbishment & Re-entry",
            digital_signature_hash=ProcessingCertificate.generate_cert_hash("CERT-2026-EW-9812", req1.id, ts_recycler.id, 1.82, "2026-10-14T15:30:00")
        )
        db.session.add(cert1)

        # Request 2: Scheduled / Assigned to Collector
        req2 = EWasteRequest(
            request_code="ECO-2026-K4M2",
            user_id=user_citizen.id,
            category_id=categories["Mobile Phone"].id,
            device_name="OnePlus 6 Smartphone",
            device_model="A6000",
            device_description="Cracked front AMOLED display, battery holds charge, cameras operational.",
            quantity=1,
            estimated_weight_kg=0.22,
            image_path="https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=600&q=80",
            status=RequestStatus.COLLECTOR_ASSIGNED,
            recommendation="repair",
            address_id=addr1.id,
            pickup_date="2026-10-18",
            pickup_time_slot="02:00 PM - 05:00 PM",
            assigned_collector_id=collector_user.id,
            carbon_offset_kg=0.62
        )
        db.session.add(req2)

        # Request 3: Hazardous Battery Warning (Awaiting Collection)
        req3 = EWasteRequest(
            request_code="ECO-2026-BAT7",
            user_id=user_citizen.id,
            category_id=categories["Battery or Power Bank"].id,
            device_name="Bloated External Power Bank 20000mAh",
            device_description="Casing cracked open due to battery expansion. Kept in metal biscuit box.",
            quantity=1,
            estimated_weight_kg=0.45,
            image_path="https://images.unsplash.com/photo-1609592807901-389f417578be?auto=format&fit=crop&w=600&q=80",
            status=RequestStatus.READY_FOR_PICKUP,
            safety_flag=True,
            safety_notes="CRITICAL HAZARD: Swollen lithium pouch cells. Fire-retardant kit mandatory for collection.",
            recommendation="recycle",
            address_id=addr1.id,
            pickup_date="2026-10-17",
            pickup_time_slot="09:00 AM - 12:00 PM",
            carbon_offset_kg=1.26
        )
        db.session.add(req3)

        print("🌱 Seeding Community Campaigns...")
        camp1 = CommunityCampaign(
            title="Telangana Green Campus E-Waste Marathon",
            title_te="తెలంగాణ గ్రీన్ క్యాంపస్ ఈ-వేస్ట్ మారథాన్",
            description="Inter-college collection drive across Hyderabad and Secunderabad to recover 2 metric tons of discarded campus electronics.",
            description_te="హైదరాబాద్ మరియు సికింద్రాబాద్ కళాశాలల మధ్య 2 మెట్రిక్ టన్నుల ఈ-వేస్ట్ సేకరణ ఉద్యమం.",
            organization_id=cbit_org.id,
            city="Hyderabad",
            location_name="CBIT Open Grounds, Gandipet",
            target_weight_kg=2000.0,
            collected_weight_kg=1280.5,
            bonus_points_multiplier=1.5,
            start_date="2026-10-01",
            end_date="2026-10-31",
            image_url="https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80"
        )
        db.session.add(camp1)

        print("🌱 Seeding Marketplace Listings...")
        m1 = MarketplaceListing(
            seller_partner_id=ts_recycler.id,
            title="Dell Latitude 7490 (Certified Refurbished)",
            category="Laptop",
            description="Intel Core i7-8650U, 16GB DDR4, 512GB NVMe SSD, Full HD 1080p Anti-Glare. Inspected by certified engineers. 6 Months Warranty.",
            condition_grade="Refurbished Grade A",
            price_inr=19499.0,
            warranty_months=6,
            status=ListingStatus.AVAILABLE,
            image_url="https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80"
        )
        m2 = MarketplaceListing(
            seller_partner_id=ts_recycler.id,
            title="HP EliteDisplay E243 23.8-inch IPS Monitor",
            category="Monitor",
            description="3-sided micro-edge bezel, 1920x1080 resolution, HDMI/VGA/DisplayPort. Zero dead pixels verified.",
            condition_grade="Refurbished Grade A",
            price_inr=6200.0,
            warranty_months=3,
            status=ListingStatus.AVAILABLE,
            image_url="https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80"
        )
        db.session.add(m1)
        db.session.add(m2)

        # Audit log entry
        AuditService.log_event("SYSTEM_SEED", actor_user_id=admin_user.id, target_type="system", details={"message": "System baseline demonstration data initialized successfully."})

        db.session.commit()
        print("✅ Database seeding complete! Test users and lifecycles ready.")

if __name__ == "__main__":
    seed_database()
