"""
Tests for emergency requests workflow and endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from .conftest import auth_headers


def _login(client, email, password, role):
    resp = client.post("/api/auth/login", json={"email": email, "password": password, "role": role})
    assert resp.status_code == 200, f"Login failed for {email}: {resp.json()}"
    return resp.json()["access_token"]


def test_patient_can_create_emergency_request(client: TestClient, patient_user):
    token = _login(client, "testpatient@test.com", "TestPass@1", "patient")
    resp = client.post("/api/emergency-requests", headers=auth_headers(token), json={
        "blood_group": "O+",
        "units_required": 3,
        "urgency": "Critical",
        "city": "Bengaluru",
        "notes": "Emergency surgery",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["blood_group"] == "O+"
    assert data["units_required"] == 3
    assert data["city"] == "Bengaluru"
    assert data["status"] in ("ACTIVE", "PENDING")


def test_invalid_blood_group_in_emergency_rejected(client: TestClient, patient_user):
    token = _login(client, "testpatient@test.com", "TestPass@1", "patient")
    resp = client.post("/api/emergency-requests", headers=auth_headers(token), json={
        "blood_group": "INVALID+",
        "units_required": 2,
        "city": "Bengaluru",
    })
    assert resp.status_code == 400


def test_donor_cannot_raise_emergency_request(client: TestClient, donor_user):
    token = _login(client, "testdonor@test.com", "TestPass@1", "donor")
    resp = client.post("/api/emergency-requests", headers=auth_headers(token), json={
        "blood_group": "A+",
        "units_required": 2,
        "city": "Bengaluru",
    })
    assert resp.status_code == 403


def test_get_my_emergency_requests(client: TestClient, patient_user):
    token = _login(client, "testpatient@test.com", "TestPass@1", "patient")
    resp = client.get("/api/emergency-requests/my", headers=auth_headers(token))
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_emergency_matches(client: TestClient, patient_user, donor_user):
    token = _login(client, "testpatient@test.com", "TestPass@1", "patient")
    create_resp = client.post("/api/emergency-requests", headers=auth_headers(token), json={
        "blood_group": "O+",
        "units_required": 2,
        "urgency": "Critical",
        "city": "Bengaluru",
    })
    req_id = create_resp.json()["id"]

    resp = client.get(f"/api/emergency-requests/{req_id}/matches", headers=auth_headers(token))
    assert resp.status_code == 200
    data = resp.json()
    assert "matched_donors" in data
    assert "blood_banks_with_stock" in data


def test_cancel_emergency_request(client: TestClient, patient_user):
    token = _login(client, "testpatient@test.com", "TestPass@1", "patient")
    create_resp = client.post("/api/emergency-requests", headers=auth_headers(token), json={
        "blood_group": "O+",
        "units_required": 1,
        "urgency": "High",
        "city": "Bengaluru",
    })
    req_id = create_resp.json()["id"]

    resp = client.post(f"/api/emergency-requests/{req_id}/cancel", headers=auth_headers(token))
    assert resp.status_code == 200
    assert resp.json()["status"] == "CANCELLED"
