"""
Tests for authentication endpoints.
Covers: registration, login, invalid login, JWT, role validation.
"""
import pytest
from fastapi.testclient import TestClient
from .conftest import auth_headers


def test_health_check(client: TestClient):
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["service"] == "bloodlink-backend"


def test_register_patient(client: TestClient):
    resp = client.post("/api/auth/register", json={
        "name": "Reg Patient",
        "email": "regpatient@test.com",
        "phone": "+91 90000 11111",
        "city": "Bengaluru",
        "role": "patient",
        "blood_group": "O+",
        "password": "RegPass@1",
        "confirm_password": "RegPass@1",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["success"] is True
    assert data["user"]["role"] == "patient"
    assert "access_token" in data


def test_register_donor(client: TestClient):
    resp = client.post("/api/auth/register", json={
        "name": "Reg Donor",
        "email": "regdonor@test.com",
        "phone": "+91 90000 22222",
        "city": "Mysuru",
        "role": "donor",
        "blood_group": "A+",
        "password": "RegPass@1",
        "confirm_password": "RegPass@1",
    })
    assert resp.status_code == 201
    assert resp.json()["user"]["role"] == "donor"


def test_register_duplicate_email(client: TestClient):
    body = {
        "name": "Dup User",
        "email": "dupuser@test.com",
        "phone": "+91 90000 33333",
        "city": "Chennai",
        "role": "patient",
        "password": "RegPass@1",
    }
    client.post("/api/auth/register", json=body)
    resp = client.post("/api/auth/register", json=body)
    assert resp.status_code == 409


def test_register_admin_forbidden(client: TestClient):
    resp = client.post("/api/auth/register", json={
        "name": "Bad Admin",
        "email": "badmin@test.com",
        "phone": "+91 90000 44444",
        "city": "Delhi",
        "role": "admin",
        "password": "RegPass@1",
    })
    assert resp.status_code == 403


def test_register_weak_password(client: TestClient):
    resp = client.post("/api/auth/register", json={
        "name": "Weak Pass",
        "email": "weakpass@test.com",
        "phone": "+91 90000 55555",
        "city": "Pune",
        "role": "patient",
        "password": "password",  # no uppercase, no special char
    })
    assert resp.status_code == 422


def test_login_success(client: TestClient, patient_user):
    resp = client.post("/api/auth/login", json={
        "email": "testpatient@test.com",
        "password": "TestPass@1",
        "role": "patient",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["user"]["email"] == "testpatient@test.com"
    assert "access_token" in data


def test_login_wrong_password(client: TestClient, patient_user):
    resp = client.post("/api/auth/login", json={
        "email": "testpatient@test.com",
        "password": "WrongPass@1",
        "role": "patient",
    })
    assert resp.status_code == 401


def test_login_wrong_role(client: TestClient, patient_user):
    resp = client.post("/api/auth/login", json={
        "email": "testpatient@test.com",
        "password": "TestPass@1",
        "role": "donor",  # wrong role
    })
    assert resp.status_code == 401


def test_login_nonexistent_user(client: TestClient):
    resp = client.post("/api/auth/login", json={
        "email": "nobody@test.com",
        "password": "AnyPass@1",
        "role": "patient",
    })
    assert resp.status_code == 401


def test_get_me_authenticated(client: TestClient, patient_user):
    token = client.post("/api/auth/login", json={
        "email": "testpatient@test.com",
        "password": "TestPass@1",
        "role": "patient",
    }).json()["access_token"]

    resp = client.get("/api/auth/me", headers=auth_headers(token))
    assert resp.status_code == 200
    assert resp.json()["user"]["email"] == "testpatient@test.com"


def test_get_me_unauthenticated(client: TestClient):
    # Use a fresh client with no cookies to test unauthenticated access
    from fastapi.testclient import TestClient as FreshClient
    from app.main import app as _app
    with FreshClient(_app) as fresh:
        resp = fresh.get("/api/auth/me")
    assert resp.status_code == 401


def test_logout(client: TestClient, patient_user):
    token = client.post("/api/auth/login", json={
        "email": "testpatient@test.com",
        "password": "TestPass@1",
        "role": "patient",
    }).json()["access_token"]

    resp = client.post("/api/auth/logout", headers=auth_headers(token))
    assert resp.status_code == 200
    assert resp.json()["success"] is True
