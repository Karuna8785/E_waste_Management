import unittest
import os
import io
import json
from backend.app import create_app
from backend.app.models.base import db
from backend.app.models.user import User, UserRole
from backend.app.models.ewaste import DeviceCategory, EWasteRequest, RequestStatus
from backend.app.models.partner import Partner, PartnerType

class EcoCycleAPITestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app("testing")
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()

        # Seed minimal data
        self.category = DeviceCategory(
            name="Mobile Phone",
            name_te="మొబైల్ ఫోన్",
            description="Smartphones and accessories",
            hazard_level="medium",
            estimated_points_per_kg=75
        )
        db.session.add(self.category)

        # Seed admin and individual user
        self.admin = User(
            email="admin@test.com",
            full_name="Test Admin",
            role=UserRole.ADMIN,
            is_active=True,
            is_verified=True
        )
        self.admin.set_password("AdminTest123!")

        self.user = User(
            email="user@test.com",
            full_name="Test User",
            role=UserRole.INDIVIDUAL,
            is_active=True,
            is_verified=True
        )
        self.user.set_password("UserTest123!")

        self.collector = User(
            email="collector@test.com",
            full_name="Test Collector",
            role=UserRole.COLLECTOR,
            is_active=True,
            is_verified=True
        )
        self.collector.set_password("CollectorTest123!")

        db.session.add_all([self.admin, self.user, self.collector])
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def login(self, email, password):
        res = self.client.post("/api/v1/auth/login", json={"email": email, "password": password})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        return data["access_token"]

    def test_health_check(self):
        res = self.client.get("/api/v1/health")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "healthy")

    def test_auth_registration_and_login(self):
        # Register new individual
        reg_res = self.client.post("/api/v1/auth/register", json={
            "email": "newuser@test.com",
            "password": "Password123!",
            "full_name": "New Citizen",
            "phone": "+91 9876543210",
            "role": "individual"
        })
        self.assertEqual(reg_res.status_code, 201)
        data = reg_res.get_json()
        self.assertIn("access_token", data)

        # Login
        token = self.login("newuser@test.com", "Password123!")
        self.assertTrue(len(token) > 10)

        # Get profile
        me_res = self.client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(me_res.status_code, 200)
        me_data = me_res.get_json()
        self.assertEqual(me_data["user"]["email"], "newuser@test.com")

    def test_categories_endpoint(self):
        res = self.client.get("/api/v1/ewaste/categories")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(len(data["categories"]) >= 1)
        self.assertEqual(data["categories"][0]["name"], "Mobile Phone")

    def test_ewaste_request_flow(self):
        user_token = self.login("user@test.com", "UserTest123!")

        # Create request
        req_res = self.client.post("/api/v1/ewaste/requests", headers={
            "Authorization": f"Bearer {user_token}"
        }, json={
            "device_name": "Old Samsung Galaxy S9",
            "category_id": self.category.id,
            "condition_description": "Screen cracked, turns on",
            "estimated_weight_kg": 0.25,
            "quantity": 1,
            "preferred_slot": "morning"
        })
        self.assertEqual(req_res.status_code, 201)
        req_data = req_res.get_json()["request"]
        request_id = req_data["id"]
        self.assertEqual(req_data["status"], RequestStatus.SUBMITTED)

        # Schedule pickup
        sched_res = self.client.post(f"/api/v1/ewaste/requests/{request_id}/schedule-pickup", headers={
            "Authorization": f"Bearer {user_token}"
        }, json={
            "pickup_date": "2026-10-25",
            "pickup_slot": "morning",
            "address_details": "Flat 301, Green Meadows, Hyderabad"
        })
        self.assertEqual(sched_res.status_code, 200)
        sched_data = sched_res.get_json()["request"]
        self.assertEqual(sched_data["status"], RequestStatus.PICKUP_SCHEDULED)

    def test_analytics_impact_endpoint(self):
        res = self.client.get("/api/v1/analytics/impact")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("verified_collected_kg", data)
        self.assertIn("co2_saved_kg", data)
        self.assertIn("total_devices_collected", data)

    def test_ai_recommendation_endpoint(self):
        rec_res = self.client.post("/api/v1/ai/recommendation", json={
            "category": "Mobile Phone",
            "questionnaire": {
                "powers_on": True,
                "screen_damaged": False,
                "components_missing": False,
                "battery_swollen": False,
                "physically_broken": False,
                "suitable_for_reuse": True
            }
        })
        self.assertEqual(rec_res.status_code, 200)
        data = rec_res.get_json()
        self.assertEqual(data["recommendation"], "reuse")
        self.assertIn("reasoning_en", data)
        self.assertIn("reasoning_te", data)

if __name__ == "__main__":
    unittest.main()
