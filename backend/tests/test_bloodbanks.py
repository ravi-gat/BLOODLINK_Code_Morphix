"""
Tests for Blood Bank inventory and donation recording workflows.
"""
import pytest
from fastapi.testclient import TestClient
from .conftest import auth_headers


def _login(client, email, password, role):
    resp = client.post("/api/auth/login", json={"email": email, "password": password, "role": role})
    assert resp.status_code == 200, f"Login failed for {email}: {resp.json()}"
    return resp.json()["access_token"]


def test_blood_bank_can_add_inventory(client: TestClient, blood_bank_user):
    token = _login(client, "testbb@test.com", "TestPass@1", "blood_bank")
    resp = client.post("/api/bloodbanks/inventory", headers=auth_headers(token), json={
        "blood_group": "O+",
        "units_available": 10,
        "expiry_date": "2026-12-31T00:00:00Z",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["blood_group"] == "O+"
    assert data["units_available"] == 10


def test_blood_bank_cannot_add_negative_units(client: TestClient, blood_bank_user):
    token = _login(client, "testbb@test.com", "TestPass@1", "blood_bank")
    resp = client.post("/api/bloodbanks/inventory", headers=auth_headers(token), json={
        "blood_group": "O+",
        "units_available": -5,
        "expiry_date": "2026-12-31T00:00:00Z",
    })
    assert resp.status_code in (400, 422)


def test_blood_bank_get_inventory(client: TestClient, blood_bank_user):
    token = _login(client, "testbb@test.com", "TestPass@1", "blood_bank")
    resp = client.get("/api/bloodbanks/inventory", headers=auth_headers(token))
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_blood_bank_get_reports(client: TestClient, blood_bank_user):
    token = _login(client, "testbb@test.com", "TestPass@1", "blood_bank")
    resp = client.get("/api/bloodbanks/reports", headers=auth_headers(token))
    assert resp.status_code == 200
    assert resp.json()["success"] is True
    assert "total_units" in resp.json()["data"]


def test_blood_bank_record_donation(client: TestClient, blood_bank_user, donor_user):
    token = _login(client, "testbb@test.com", "TestPass@1", "blood_bank")
    donor_profile_id = donor_user.donor_profile.id if donor_user.donor_profile else None
    if not donor_profile_id:
        from app.models.profiles import Donor
        from .conftest import TestingSessionLocal
        s = TestingSessionLocal()
        d = s.query(Donor).filter(Donor.user_id == donor_user.id).first()
        donor_profile_id = d.id
        s.close()

    resp = client.post("/api/bloodbanks/donations", headers=auth_headers(token), json={
        "donor_id": donor_profile_id,
        "blood_group": "A+",
        "units": 1,
        "status": "COMPLETED",
    })
    assert resp.status_code == 201
    assert resp.json()["units"] == 1
