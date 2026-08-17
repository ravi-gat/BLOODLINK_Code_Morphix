"""
Role-Based Access Control tests.
Verifies that role boundaries are enforced at the FastAPI level.
A donor must NOT access admin endpoints.
A patient must NOT modify hospital inventory.
"""
import pytest
from fastapi.testclient import TestClient
from .conftest import auth_headers


def _login(client, email, password, role):
    resp = client.post("/api/auth/login", json={"email": email, "password": password, "role": role})
    assert resp.status_code == 200, f"Login failed for {email}: {resp.json()}"
    return resp.json()["access_token"]


def test_donor_cannot_access_admin_dashboard(client: TestClient, donor_user):
    token = _login(client, "testdonor@test.com", "TestPass@1", "donor")
    resp = client.get("/api/admin/dashboard", headers=auth_headers(token))
    assert resp.status_code == 403


def test_donor_cannot_list_admin_users(client: TestClient, donor_user):
    token = _login(client, "testdonor@test.com", "TestPass@1", "donor")
    resp = client.get("/api/admin/users", headers=auth_headers(token))
    assert resp.status_code == 403


def test_patient_cannot_access_admin(client: TestClient, patient_user):
    token = _login(client, "testpatient@test.com", "TestPass@1", "patient")
    resp = client.get("/api/admin/users", headers=auth_headers(token))
    assert resp.status_code == 403


def test_patient_cannot_add_hospital_inventory(client: TestClient, patient_user):
    token = _login(client, "testpatient@test.com", "TestPass@1", "patient")
    resp = client.post("/api/hospitals/inventory", headers=auth_headers(token), json={
        "blood_group": "O+",
        "units_available": 10,
    })
    assert resp.status_code == 403


def test_donor_cannot_add_hospital_inventory(client: TestClient, donor_user):
    token = _login(client, "testdonor@test.com", "TestPass@1", "donor")
    resp = client.post("/api/hospitals/inventory", headers=auth_headers(token), json={
        "blood_group": "O+",
        "units_available": 10,
    })
    assert resp.status_code == 403


def test_hospital_can_get_requests(client: TestClient, hospital_user):
    token = _login(client, "testhospital@test.com", "TestPass@1", "hospital")
    resp = client.get("/api/hospitals/requests", headers=auth_headers(token))
    assert resp.status_code == 200


def test_hospital_cannot_access_blood_bank_inventory(client: TestClient, hospital_user):
    """Hospitals should not modify blood bank inventory."""
    token = _login(client, "testhospital@test.com", "TestPass@1", "hospital")
    resp = client.post("/api/bloodbanks/inventory", headers=auth_headers(token), json={
        "blood_group": "O+",
        "units_available": 10,
    })
    assert resp.status_code == 403


def test_admin_can_list_users(client: TestClient, admin_user):
    token = _login(client, "testadmin@test.com", "TestPass@1", "admin")
    resp = client.get("/api/admin/users", headers=auth_headers(token))
    assert resp.status_code == 200


def test_unauthenticated_cannot_access_any_protected_endpoint(client: TestClient):
    from fastapi.testclient import TestClient as FreshClient
    from app.main import app as _app
    endpoints = [
        ("GET", "/api/patients/me"),
        ("GET", "/api/donors/me"),
        ("GET", "/api/hospitals/me"),
        ("GET", "/api/bloodbanks/me"),
        ("GET", "/api/admin/dashboard"),
        ("GET", "/api/notifications"),
    ]
    with FreshClient(_app) as fresh:
        for method, path in endpoints:
            resp = fresh.request(method, path)
            assert resp.status_code == 401, f"Expected 401 for {method} {path}, got {resp.status_code}"
