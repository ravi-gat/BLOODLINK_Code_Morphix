"""
Tests for authentication endpoints.

Google OAuth has been removed. Only email/password auth is supported.
Covers: registration, login, email verification, forgot/reset password,
JWT, role validation, public statistics, SMTP handling.
"""
import pytest
from fastapi.testclient import TestClient
from .conftest import auth_headers
from app.core.security import create_verification_token, create_password_reset_token


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
        "password": "password",
    })
    assert resp.status_code == 422


def test_login_success_without_role(client: TestClient, patient_user):
    resp = client.post("/api/auth/login", json={
        "email": "testpatient@test.com",
        "password": "TestPass@1",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["user"]["email"] == "testpatient@test.com"
    assert data["user"]["role"] == "patient"
    assert "access_token" in data


def test_login_wrong_password(client: TestClient, patient_user):
    resp = client.post("/api/auth/login", json={
        "email": "testpatient@test.com",
        "password": "WrongPass@1",
    })
    assert resp.status_code == 401


def test_login_nonexistent_user(client: TestClient):
    resp = client.post("/api/auth/login", json={
        "email": "nobody@test.com",
        "password": "AnyPass@1",
    })
    assert resp.status_code == 401


def test_email_verification_flow(client: TestClient):
    reg_resp = client.post("/api/auth/register", json={
        "name": "Verify Tester",
        "email": "verify.tester@test.com",
        "phone": "+91 90000 88888",
        "city": "Bengaluru",
        "role": "patient",
        "password": "TestPassword@123",
        "confirm_password": "TestPassword@123",
    })
    user_id = reg_resp.json()["user"]["id"]
    token = create_verification_token(user_id, "verify.tester@test.com")
    resp = client.get(f"/api/auth/verify-email?token={token}")
    assert resp.status_code == 200
    assert "verified" in resp.json()["message"].lower()


def test_password_reset_flow(client: TestClient):
    reg_resp = client.post("/api/auth/register", json={
        "name": "Reset Tester",
        "email": "reset.tester@test.com",
        "phone": "+91 90000 77777",
        "city": "Bengaluru",
        "role": "patient",
        "password": "InitialPass@123",
        "confirm_password": "InitialPass@123",
    })
    user_id = reg_resp.json()["user"]["id"]
    token = create_password_reset_token(user_id, "reset.tester@test.com")
    resp = client.post("/api/auth/reset-password", json={
        "token": token,
        "password": "NewSecretPass@123",
    })
    assert resp.status_code == 200
    login_resp = client.post("/api/auth/login", json={
        "email": "reset.tester@test.com",
        "password": "NewSecretPass@123",
    })
    assert login_resp.status_code == 200


# Google OAuth endpoints must no longer exist
def test_google_oauth_url_removed(client: TestClient):
    """GET /api/auth/google/url must return 404 after Google auth removal."""
    resp = client.get("/api/auth/google/url")
    assert resp.status_code == 404


def test_google_auth_endpoint_removed(client: TestClient):
    """POST /api/auth/google must return 404 after Google auth removal."""
    resp = client.post("/api/auth/google", json={"email": "test@gmail.com"})
    assert resp.status_code == 404


def test_google_onboard_endpoint_removed(client: TestClient):
    """POST /api/auth/google/onboard must return 404 after Google auth removal."""
    resp = client.post("/api/auth/google/onboard", json={
        "google_token": "fake",
        "role": "patient",
        "phone": "+91 90001 55555",
        "city": "Bengaluru",
    })
    assert resp.status_code == 404


def test_public_stats_endpoint(client: TestClient):
    resp = client.get("/api/stats/public")
    assert resp.status_code == 200
    data = resp.json()
    assert "registered_donors" in data
    assert "registered_hospitals" in data
    assert "registered_bloodbanks" in data
    assert isinstance(data["registered_donors"], int)


def test_get_me_authenticated(client: TestClient, patient_user):
    token = client.post("/api/auth/login", json={
        "email": "testpatient@test.com",
        "password": "TestPass@1",
    }).json()["access_token"]
    resp = client.get("/api/auth/me", headers=auth_headers(token))
    assert resp.status_code == 200
    assert resp.json()["user"]["email"] == "testpatient@test.com"


def test_get_me_unauthenticated(client: TestClient):
    from fastapi.testclient import TestClient as FreshClient
    from app.main import app as _app
    with FreshClient(_app) as fresh:
        resp = fresh.get("/api/auth/me")
    assert resp.status_code == 401


def test_logout(client: TestClient, patient_user):
    token = client.post("/api/auth/login", json={
        "email": "testpatient@test.com",
        "password": "TestPass@1",
    }).json()["access_token"]
    resp = client.post("/api/auth/logout", headers=auth_headers(token))
    assert resp.status_code == 200
    assert resp.json()["success"] is True


# ── Email Verification Tests ─────────────────────────────────────────────────

def test_registration_creates_pending_when_verification_required(client: TestClient, monkeypatch):
    import unittest.mock as mock
    monkeypatch.setattr("app.routers.auth.settings.REQUIRE_EMAIL_VERIFICATION", True)
    with mock.patch("app.routers.auth.send_verification_email", return_value=True):
        resp = client.post("/api/auth/register", json={
            "name": "Pending User",
            "email": "pendinguser@test.com",
            "phone": "+91 90001 11111",
            "city": "Bengaluru",
            "role": "patient",
            "password": "PendingPass@1",
        })
    assert resp.status_code == 201
    data = resp.json()
    assert data["user"]["status"] == "PENDING"
    assert data["access_token"] == ""


def test_login_blocked_for_pending_user(client: TestClient, monkeypatch):
    import unittest.mock as mock
    monkeypatch.setattr("app.routers.auth.settings.REQUIRE_EMAIL_VERIFICATION", True)
    with mock.patch("app.routers.auth.send_verification_email", return_value=True):
        client.post("/api/auth/register", json={
            "name": "Pending Login Test",
            "email": "pendinglogin@test.com",
            "phone": "+91 90001 22222",
            "city": "Bengaluru",
            "role": "patient",
            "password": "PendingPass@2",
        })
    resp = client.post("/api/auth/login", json={
        "email": "pendinglogin@test.com",
        "password": "PendingPass@2",
    })
    assert resp.status_code == 403
    assert "verify your email" in resp.json()["detail"].lower()


def test_valid_verification_token_activates_account(client: TestClient, monkeypatch):
    import unittest.mock as mock
    monkeypatch.setattr("app.routers.auth.settings.REQUIRE_EMAIL_VERIFICATION", True)
    with mock.patch("app.routers.auth.send_verification_email", return_value=True):
        reg = client.post("/api/auth/register", json={
            "name": "Token Verify",
            "email": "tokenverify@test.com",
            "phone": "+91 90001 33333",
            "city": "Bengaluru",
            "role": "donor",
            "blood_group": "A+",
            "password": "VerifyPass@1",
        })
    assert reg.status_code == 201
    user_id = reg.json()["user"]["id"]
    token = create_verification_token(user_id, "tokenverify@test.com")
    resp = client.get(f"/api/auth/verify-email?token={token}")
    assert resp.status_code == 200
    assert "verified" in resp.json()["message"].lower()
    login_resp = client.post("/api/auth/login", json={
        "email": "tokenverify@test.com",
        "password": "VerifyPass@1",
    })
    assert login_resp.status_code == 200


def test_expired_verification_token_rejected(client: TestClient):
    import time
    from jose import jwt
    from app.core.config import settings as cfg
    expired_token = jwt.encode(
        {"sub": "fake-user-id", "email": "expired@test.com",
         "type": "verify_email", "exp": int(time.time()) - 100},
        cfg.JWT_SECRET, algorithm=cfg.JWT_ALGORITHM,
    )
    resp = client.get(f"/api/auth/verify-email?token={expired_token}")
    assert resp.status_code == 400


def test_invalid_verification_token_rejected(client: TestClient):
    resp = client.get("/api/auth/verify-email?token=totally.invalid.token")
    assert resp.status_code == 400


def test_wrong_type_token_rejected(client: TestClient, patient_user):
    from app.core.security import create_access_token
    wrong = create_access_token({"sub": patient_user.id})
    resp = client.get(f"/api/auth/verify-email?token={wrong}")
    assert resp.status_code == 400


def test_already_active_user_verify_idempotent(client: TestClient, patient_user):
    token = create_verification_token(patient_user.id, patient_user.email)
    resp = client.get(f"/api/auth/verify-email?token={token}")
    assert resp.status_code == 200


def test_resend_verification_for_pending_user(client: TestClient, monkeypatch):
    import unittest.mock as mock
    monkeypatch.setattr("app.routers.auth.settings.REQUIRE_EMAIL_VERIFICATION", True)
    with mock.patch("app.routers.auth.send_verification_email", return_value=True):
        client.post("/api/auth/register", json={
            "name": "Resend Tester",
            "email": "resendtester@test.com",
            "phone": "+91 90001 44444",
            "city": "Bengaluru",
            "role": "patient",
            "password": "ResendPass@1",
        })
    with mock.patch("app.routers.auth.send_verification_email", return_value=True):
        resp = client.post("/api/auth/resend-verification", json={"email": "resendtester@test.com"})
    assert resp.status_code == 200


def test_resend_verification_unknown_email_no_leak(client: TestClient):
    resp = client.post("/api/auth/resend-verification", json={"email": "nosuchuser999@test.com"})
    assert resp.status_code == 200


def test_active_user_login_works(client: TestClient, patient_user):
    resp = client.post("/api/auth/login", json={
        "email": "testpatient@test.com",
        "password": "TestPass@1",
    })
    assert resp.status_code == 200
    assert resp.json()["user"]["status"] == "ACTIVE"


def test_email_service_not_called_with_smtp_unconfigured(monkeypatch):
    from app.services import email_service as es
    monkeypatch.setattr(es.settings, "SMTP_USERNAME", "YOUR_GMAIL_ADDRESS")
    monkeypatch.setattr(es.settings, "SMTP_PASSWORD", "YOUR_GMAIL_APP_PASSWORD")
    assert es._is_smtp_configured() is False


def test_email_service_configured_correctly(monkeypatch):
    from app.services import email_service as es
    monkeypatch.setattr(es.settings, "SMTP_USERNAME", "real-user@gmail.com")
    monkeypatch.setattr(es.settings, "SMTP_PASSWORD", "abcdefghijklmnop")
    assert es._is_smtp_configured() is True


def test_smtp_auth_failure_handled_gracefully(monkeypatch):
    import smtplib
    from app.services import email_service as es
    monkeypatch.setattr(es.settings, "SMTP_USERNAME", "real@gmail.com")
    monkeypatch.setattr(es.settings, "SMTP_PASSWORD", "validlookingpwd")
    monkeypatch.setattr(es.settings, "SMTP_FROM_EMAIL", "real@gmail.com")

    def bad_connect():
        raise smtplib.SMTPAuthenticationError(535, b"Authentication failed")
    monkeypatch.setattr(es, "_smtp_connect", bad_connect)
    result = es._send_message("user@example.com", "Test Subject", "<p>Test</p>", "Test")
    assert result is False


def test_smtp_connection_failure_handled_gracefully(monkeypatch):
    from app.services import email_service as es
    monkeypatch.setattr(es.settings, "SMTP_USERNAME", "real@gmail.com")
    monkeypatch.setattr(es.settings, "SMTP_PASSWORD", "validpwd")
    monkeypatch.setattr(es.settings, "SMTP_FROM_EMAIL", "real@gmail.com")

    def bad_connect():
        raise OSError("Connection refused")
    monkeypatch.setattr(es, "_smtp_connect", bad_connect)
    result = es._send_message("user@example.com", "Test Subject", "<p>Test</p>", "Test")
    assert result is False
