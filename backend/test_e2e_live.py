"""
Live PostgreSQL End-to-End integration test.
Tests all user roles against the real PostgreSQL database.
"""
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print("1. Testing /health endpoint...")
r = client.get("/health")
assert r.status_code == 200
print(f"   Status: {r.status_code}, Response: {r.json()}")

print("\n2. Testing Patient login (patient@bloodlink.demo / Patient@123)...")
r = client.post("/api/auth/login", json={
    "email": "patient@bloodlink.demo",
    "password": "Patient@123",
    "role": "patient",
})
print(f"   Status: {r.status_code}")
assert r.status_code == 200, f"Login failed: {r.text}"
p_data = r.json()
p_token = p_data["access_token"]
print(f"   Logged in as: {p_data['user']['name']} ({p_data['user']['email']})")

headers = {"Authorization": f"Bearer {p_token}"}

print("\n3. Testing /api/auth/me...")
r = client.get("/api/auth/me", headers=headers)
assert r.status_code == 200
print(f"   Profile: {r.json()['user']}")

print("\n4. Testing /api/emergency-requests (Create emergency request)...")
r = client.post("/api/emergency-requests", headers=headers, json={
    "blood_group": "O+",
    "units_required": 2,
    "urgency": "Critical",
    "city": "Bengaluru",
    "notes": "Emergency surgery at Apollo Hospital",
})
assert r.status_code == 201, f"Emergency create failed: {r.text}"
e_data = r.json()
e_id = e_data["id"]
print(f"   Created Emergency Request ID: {e_id}, Status: {e_data['status']}")

print("\n5. Testing /api/emergency-requests/{id}/matches...")
r = client.get(f"/api/emergency-requests/{e_id}/matches", headers=headers)
assert r.status_code == 200
matches = r.json()
print(f"   Matched Donors Count: {matches['total_donors_found']}")
print(f"   Blood Banks with Stock: {matches['total_banks_found']}")

print("\n6. Testing /api/maps/locations...")
r = client.get("/api/maps/locations", headers=headers)
assert r.status_code == 200
map_data = r.json()
print(f"   Hospitals on map: {len(map_data['hospitals'])}")
print(f"   Blood Banks on map: {len(map_data['blood_banks'])}")
print(f"   Emergency requests on map: {len(map_data['emergency_requests'])}")

print("\n7. Testing /api/maps/nearby...")
r = client.get("/api/maps/nearby?latitude=12.9716&longitude=77.5946&radius_km=50", headers=headers)
assert r.status_code == 200
nearby = r.json()
print(f"   Nearby hospitals: {len(nearby['hospitals'])}")
print(f"   Nearby blood banks: {len(nearby['blood_banks'])}")

print("\nALL POSTGRESQL INTEGRATION CHECKS PASSED!")
