"""
Tests for real user registration, validation rules.
Google OAuth has been removed — those tests are deleted.
"""
import pytest
from fastapi.testclient import TestClient
from .conftest import auth_headers


def test_register_real_patient(client: TestClient):
    resp = client.post("/api/auth/register", json={
        "name": "Pooja Hegde",
        "email": "pooja.patient.2026@gmail.com",
        "password": "SecurePassword@123",
        "confirm_password": "SecurePassword@123",
        "phone": "+91 98765 11111",
        "city": "Bengaluru",
        "blood_group": "A+",
        "role": "patient",
        "address": "12, MG Road, Bengaluru",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["success"] is True
    assert data["user"]["email"] == "pooja.patient.2026@gmail.com"
    assert data["user"]["role"] == "patient"
    assert data["user"]["blood_group"] == "A+"
    assert "access_token" in data
    assert "password_hash" not in data["user"]
    assert "passwordHash" not in data["user"]


def test_register_real_donor(client: TestClient):
    resp = client.post("/api/auth/register", json={
        "name": "Rohan Sharma",
        "email": "rohan.donor.2026@gmail.com",
        "password": "SecurePassword@123",
        "confirm_password": "SecurePassword@123",
        "phone": "+91 98765 22222",
        "city": "Mumbai",
        "blood_group": "O-",
        "role": "donor",
        "address": "45, Bandra West, Mumbai",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["user"]["email"] == "rohan.donor.2026@gmail.com"
    assert data["user"]["role"] == "donor"
    assert data["user"]["blood_group"] == "O-"


def test_register_real_hospital(client: TestClient):
    resp = client.post("/api/auth/register", json={
        "name": "Dr. Sunil Kumar",
        "email": "sunil.hospital.2026@gmail.com",
        "password": "SecurePassword@123",
        "confirm_password": "SecurePassword@123",
        "phone": "+91 98765 33333",
        "city": "Hyderabad",
        "role": "hospital",
        "hospital_name": "Apollo Multispeciality Hospital",
        "registration_number": "APOLLO-HYD-9988",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["user"]["email"] == "sunil.hospital.2026@gmail.com"
    assert data["user"]["role"] == "hospital"


def test_register_real_blood_bank(client: TestClient):
    resp = client.post("/api/auth/register", json={
        "name": "Kiran Rao",
        "email": "kiran.bloodbank.2026@gmail.com",
        "password": "SecurePassword@123",
        "confirm_password": "SecurePassword@123",
        "phone": "+91 98765 44444",
        "city": "Chennai",
        "role": "bloodbank",
        "blood_bank_name": "Rotary Regional Blood Centre",
        "registration_number": "ROTARY-CHN-4411",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["user"]["email"] == "kiran.bloodbank.2026@gmail.com"
    assert data["user"]["role"] == "bloodbank"


def test_duplicate_email_case_insensitive_rejected(client: TestClient):
    # Register first
    client.post("/api/auth/register", json={
        "name": "First User",
        "email": "case.test.2026@gmail.com",
        "password": "SecurePassword@123",
        "confirm_password": "SecurePassword@123",
        "phone": "+91 98765 55555",
        "city": "Pune",
        "role": "patient",
    })

    # Try duplicate with different case
    resp = client.post("/api/auth/register", json={
        "name": "Second User",
        "email": "CASE.TEST.2026@GMAIL.COM",
        "password": "SecurePassword@123",
        "confirm_password": "SecurePassword@123",
        "phone": "+91 98765 55556",
        "city": "Pune",
        "role": "patient",
    })
    assert resp.status_code == 409
    assert "already exists" in resp.json()["detail"].lower()


def test_invalid_email_format_rejected(client: TestClient):
    resp = client.post("/api/auth/register", json={
        "name": "Bad Email User",
        "email": "notanemail",
        "password": "SecurePassword@123",
        "confirm_password": "SecurePassword@123",
        "phone": "+91 98765 66666",
        "city": "Bengaluru",
        "role": "patient",
    })
    assert resp.status_code == 422


def test_short_password_rejected(client: TestClient):
    resp = client.post("/api/auth/register", json={
        "name": "Short Pass User",
        "email": "shortpass.2026@gmail.com",
        "password": "Short1!",
        "confirm_password": "Short1!",
        "phone": "+91 98765 77777",
        "city": "Bengaluru",
        "role": "patient",
    })
    assert resp.status_code == 422


def test_password_mismatch_rejected(client: TestClient):
    resp = client.post("/api/auth/register", json={
        "name": "Mismatch Pass User",
        "email": "mismatch.2026@gmail.com",
        "password": "SecurePassword@123",
        "confirm_password": "DifferentPassword@123",
        "phone": "+91 98765 88888",
        "city": "Bengaluru",
        "role": "patient",
    })
    assert resp.status_code == 422


def test_public_admin_registration_forbidden(client: TestClient):
    resp = client.post("/api/auth/register", json={
        "name": "Hacker Admin",
        "email": "hackeradmin.2026@gmail.com",
        "password": "SecurePassword@123",
        "confirm_password": "SecurePassword@123",
        "phone": "+91 98765 99999",
        "city": "Delhi",
        "role": "admin",
    })
    assert resp.status_code == 403


def test_google_endpoint_removed(client: TestClient):
    """Google OAuth endpoint must be removed — should return 404."""
    resp = client.post("/api/auth/google", json={
        "email": "google.user.2026@gmail.com",
        "name": "Google User",
        "role": "donor",
        "city": "Bengaluru",
        "blood_group": "B+",
    })
    assert resp.status_code == 404


def test_login_and_me_with_registered_user(client: TestClient):
    from app.core.security import create_verification_token
    # Register
    email = "login.test.2026@gmail.com"
    pwd = "SecurePassword@123"
    reg_resp = client.post("/api/auth/register", json={
        "name": "Login Tester",
        "email": email,
        "password": pwd,
        "confirm_password": pwd,
        "phone": "+91 98765 00000",
        "city": "Mysuru",
        "role": "patient",
    })
    assert reg_resp.status_code == 201
    user_id = reg_resp.json()["user"]["id"]

    # Verify email
    vtoken = create_verification_token(user_id, email)
    client.get(f"/api/auth/verify-email?token={vtoken}")

    # Login
    login_resp = client.post("/api/auth/login", json={
        "email": email,
        "password": pwd,
        "role": "patient",
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]

    # /api/auth/me
    me_resp = client.get("/api/auth/me", headers=auth_headers(token))
    assert me_resp.status_code == 200
    assert me_resp.json()["user"]["email"] == email

    # Logout
    logout_resp = client.post("/api/auth/logout", headers=auth_headers(token))
    assert logout_resp.status_code == 200
