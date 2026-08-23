"""
Tests for Map and location endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from .conftest import auth_headers


def _login(client, email, password, role):
    resp = client.post("/api/auth/login", json={"email": email, "password": password, "role": role})
    assert resp.status_code == 200
    return resp.json()["access_token"]


def test_get_map_locations(client: TestClient, patient_user):
    token = _login(client, "testpatient@test.com", "TestPass@1", "patient")
    resp = client.get("/api/maps/locations", headers=auth_headers(token))
    assert resp.status_code == 200
    data = resp.json()
    assert "hospitals" in data
    assert "blood_banks" in data
    assert "emergency_requests" in data
    assert "donor_clusters" in data


def test_get_nearby_resources(client: TestClient, patient_user):
    token = _login(client, "testpatient@test.com", "TestPass@1", "patient")
    resp = client.get(
        "/api/maps/nearby?latitude=12.9716&longitude=77.5946&radius_km=100",
        headers=auth_headers(token),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "hospitals" in data
    assert "blood_banks" in data
    assert "radius_km" in data
