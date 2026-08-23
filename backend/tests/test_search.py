"""
Tests for Global Search API router.
"""
import pytest
from fastapi.testclient import TestClient
from .conftest import auth_headers


def _login(client, email, password, role):
    resp = client.post("/api/auth/login", json={"email": email, "password": password, "role": role})
    assert resp.status_code == 200
    return resp.json()["access_token"]


def test_global_search_blood_group(client: TestClient, patient_user):
    token = _login(client, "testpatient@test.com", "TestPass@1", "patient")
    resp = client.get("/api/search/global", params={"q": "O+"}, headers=auth_headers(token))
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    bg_info = data["data"]["blood_group"]
    assert bg_info is not None
    assert bg_info["blood_group"] == "O+"
    assert "can_donate_to" in bg_info
    assert "can_receive_from" in bg_info
    assert "quick_actions" in data["data"]


def test_global_search_facilities(client: TestClient, donor_user):
    token = _login(client, "testdonor@test.com", "TestPass@1", "donor")
    resp = client.get("/api/search/global?q=Bengaluru", headers=auth_headers(token))
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert "facilities" in data["data"]
    assert "requests" in data["data"]


def test_global_search_unauthorized(client: TestClient):
    client.cookies.clear()
    resp = client.get("/api/search/global?q=A+")
    assert resp.status_code == 401
