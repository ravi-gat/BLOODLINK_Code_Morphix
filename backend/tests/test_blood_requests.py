"""
Tests for blood request creation, donor matching, and accept/decline workflow.
"""
import pytest
from fastapi.testclient import TestClient
from .conftest import auth_headers


def _login(client, email, password, role):
    resp = client.post("/api/auth/login", json={"email": email, "password": password, "role": role})
    return resp.json()["access_token"]


def test_patient_can_create_blood_request(client: TestClient, patient_user):
    token = _login(client, "testpatient@test.com", "TestPass@1", "patient")
    resp = client.post("/api/blood-requests", headers=auth_headers(token), json={
        "blood_group": "O+",
        "units_required": 2,
        "urgency": "High",
        "city": "Bengaluru",
        "hospital_name": "Test Hospital",
        "contact_number": "+91 98765 00001",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["blood_group"] == "O+"
    assert data["units_required"] == 2
    assert data["status"] in ("PENDING", "ACCEPTED", "PROCESSING", "MATCHING", "DONOR_FOUND")


def test_donor_cannot_create_blood_request(client: TestClient, donor_user):
    token = _login(client, "testdonor@test.com", "TestPass@1", "donor")
    resp = client.post("/api/blood-requests", headers=auth_headers(token), json={
        "blood_group": "O+",
        "units_required": 1,
        "urgency": "High",
        "city": "Bengaluru",
    })
    assert resp.status_code == 403


def test_invalid_blood_group_rejected(client: TestClient, patient_user):
    token = _login(client, "testpatient@test.com", "TestPass@1", "patient")
    resp = client.post("/api/blood-requests", headers=auth_headers(token), json={
        "blood_group": "Z+",  # invalid
        "units_required": 1,
        "urgency": "High",
        "city": "Bengaluru",
    })
    assert resp.status_code == 400


def test_units_out_of_range_rejected(client: TestClient, patient_user):
    token = _login(client, "testpatient@test.com", "TestPass@1", "patient")
    resp = client.post("/api/blood-requests", headers=auth_headers(token), json={
        "blood_group": "O+",
        "units_required": 15,  # > 10
        "urgency": "High",
        "city": "Bengaluru",
    })
    assert resp.status_code == 422


def test_patient_can_view_their_requests(client: TestClient, patient_user):
    token = _login(client, "testpatient@test.com", "TestPass@1", "patient")
    # Create one first
    client.post("/api/blood-requests", headers=auth_headers(token), json={
        "blood_group": "O+",
        "units_required": 1,
        "urgency": "Low",
        "city": "Bengaluru",
    })
    resp = client.get("/api/blood-requests/my", headers=auth_headers(token))
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_donor_can_view_compatible_requests(client: TestClient, donor_user, patient_user):
    # Patient creates a request
    p_token = _login(client, "testpatient@test.com", "TestPass@1", "patient")
    client.post("/api/blood-requests", headers=auth_headers(p_token), json={
        "blood_group": "O+",
        "units_required": 1,
        "urgency": "High",
        "city": "Bengaluru",
    })
    # Donor views requests
    d_token = _login(client, "testdonor@test.com", "TestPass@1", "donor")
    resp = client.get("/api/donors/requests", headers=auth_headers(d_token))
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_donor_accept_request(client: TestClient, donor_user, patient_user):
    # Create a request as patient
    p_token = _login(client, "testpatient@test.com", "TestPass@1", "patient")
    req_resp = client.post("/api/blood-requests", headers=auth_headers(p_token), json={
        "blood_group": "O+",
        "units_required": 1,
        "urgency": "High",
        "city": "Bengaluru",
    })
    request_id = req_resp.json()["id"]

    # Donor accepts
    d_token = _login(client, "testdonor@test.com", "TestPass@1", "donor")
    resp = client.post(f"/api/donors/requests/{request_id}/accept", headers=auth_headers(d_token))
    assert resp.status_code == 200
    assert resp.json()["success"] is True


def test_donor_decline_request(client: TestClient, donor_user, patient_user):
    p_token = _login(client, "testpatient@test.com", "TestPass@1", "patient")
    req_resp = client.post("/api/blood-requests", headers=auth_headers(p_token), json={
        "blood_group": "O+",
        "units_required": 1,
        "urgency": "Moderate",
        "city": "Bengaluru",
    })
    request_id = req_resp.json()["id"]

    d_token = _login(client, "testdonor@test.com", "TestPass@1", "donor")
    resp = client.post(f"/api/donors/requests/{request_id}/decline", headers=auth_headers(d_token))
    assert resp.status_code == 200
    assert resp.json()["success"] is True
