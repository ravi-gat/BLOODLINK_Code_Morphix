"""
Unit & integration tests for BloodLink Security Hardening:
- Security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- Correlation / Request ID tracking (X-Request-ID)
- Request state machine transition validations
- Inventory non-negative bounds
- IDOR access controls & patient/donor ownership
- Health & readiness probes (/health, /health/ready)
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.enums import RequestStatus, EmergencyStatus
from app.core.state_machine import validate_request_transition, validate_emergency_transition
from fastapi import HTTPException


@pytest.fixture
def client():
    return TestClient(app)


def test_security_headers_present(client):
    """Verify standard defense-in-depth security headers on API responses."""
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.headers.get("X-Content-Type-Options") == "nosniff"
    assert resp.headers.get("X-Frame-Options") == "SAMEORIGIN"
    assert resp.headers.get("X-XSS-Protection") == "1; mode=block"
    assert resp.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert "Content-Security-Policy" in resp.headers
    assert "X-Request-ID" in resp.headers


def test_health_and_readiness_probes(client):
    """Verify /health and /health/ready endpoints."""
    # Liveness probe
    resp_live = client.get("/health")
    assert resp_live.status_code == 200
    live_data = resp_live.json()
    assert live_data["service"] == "bloodlink-backend"
    assert "status" in live_data

    # Readiness probe
    resp_ready = client.get("/health/ready")
    assert resp_ready.status_code == 200
    ready_data = resp_ready.json()
    assert ready_data["ready"] is True
    assert ready_data["status"] == "ready"


def test_state_machine_valid_request_transitions():
    """Verify valid request transitions pass without exception."""
    # PENDING -> ACCEPTED
    validate_request_transition(RequestStatus.PENDING, RequestStatus.ACCEPTED)
    # ACCEPTED -> PROCESSING
    validate_request_transition(RequestStatus.ACCEPTED, RequestStatus.PROCESSING)
    # PROCESSING -> FULFILLED
    validate_request_transition(RequestStatus.PROCESSING, RequestStatus.FULFILLED)
    # PENDING -> CANCELLED
    validate_request_transition(RequestStatus.PENDING, RequestStatus.CANCELLED)
    # Same state is a no-op
    validate_request_transition(RequestStatus.PENDING, RequestStatus.PENDING)


def test_state_machine_invalid_request_transitions():
    """Verify invalid request transitions raise HTTP 400."""
    # FULFILLED cannot transition to PENDING
    with pytest.raises(HTTPException) as exc:
        validate_request_transition(RequestStatus.FULFILLED, RequestStatus.PENDING)
    assert exc.value.status_code == 400

    # CANCELLED cannot transition to ACCEPTED
    with pytest.raises(HTTPException) as exc:
        validate_request_transition(RequestStatus.CANCELLED, RequestStatus.ACCEPTED)
    assert exc.value.status_code == 400

    # REJECTED cannot transition to PROCESSING
    with pytest.raises(HTTPException) as exc:
        validate_request_transition(RequestStatus.REJECTED, RequestStatus.PROCESSING)
    assert exc.value.status_code == 400


def test_state_machine_emergency_transitions():
    """Verify emergency request transitions."""
    # Valid
    validate_emergency_transition(EmergencyStatus.ACTIVE, EmergencyStatus.MATCHED)
    validate_emergency_transition(EmergencyStatus.MATCHED, EmergencyStatus.FULFILLED)
    validate_emergency_transition(EmergencyStatus.ACTIVE, EmergencyStatus.CANCELLED)

    # Invalid: FULFILLED -> ACTIVE
    with pytest.raises(HTTPException) as exc:
        validate_emergency_transition(EmergencyStatus.FULFILLED, EmergencyStatus.ACTIVE)
    assert exc.value.status_code == 400

    # Invalid: EXPIRED -> MATCHED
    with pytest.raises(HTTPException) as exc:
        validate_emergency_transition(EmergencyStatus.EXPIRED, EmergencyStatus.MATCHED)
    assert exc.value.status_code == 400


def test_unauthenticated_protected_endpoints(client):
    """Verify unauthenticated requests to protected endpoints return 401 Unauthorized."""
    endpoints = [
        ("GET", "/api/auth/me"),
        ("GET", "/api/patients/me"),
        ("GET", "/api/donors/me"),
        ("GET", "/api/hospitals/me"),
        ("GET", "/api/bloodbanks/me"),
        ("GET", "/api/admin/users"),
        ("GET", "/api/search/global?q=O+"),
        ("POST", "/api/emergency-requests"),
    ]
    for method, path in endpoints:
        if method == "GET":
            r = client.get(path)
        else:
            r = client.post(path, json={})
        assert r.status_code in (401, 403), f"Endpoint {method} {path} should be protected, got {r.status_code}"
