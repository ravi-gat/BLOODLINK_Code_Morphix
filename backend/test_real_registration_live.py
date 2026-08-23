"""
Live PostgreSQL Real User Registration & Google Auth Verification Script.
Tests creating genuine user accounts in PostgreSQL and validates database tables.
"""
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.user import User
from app.models.profiles import Patient, Donor, Hospital, BloodBank
import uuid

client = TestClient(app)
db = SessionLocal()

tag = str(uuid.uuid4())[:6]
test_patient_email = f"real.patient.{tag}@gmail.com"
test_donor_email = f"real.donor.{tag}@gmail.com"
test_hospital_email = f"real.hospital.{tag}@gmail.com"
test_bb_email = f"real.bloodbank.{tag}@gmail.com"
test_google_email = f"real.google.{tag}@gmail.com"

print(f"Testing Real Registration with dynamic unique email tag: {tag}")
print("=" * 75)

# 1. Real Patient Registration
print("1. Registering Real Patient...")
r1 = client.post("/api/auth/register", json={
    "name": "Dr. Ananya Murthy",
    "email": test_patient_email,
    "password": "SecurePassword@123",
    "confirm_password": "SecurePassword@123",
    "phone": "+91 98888 11111",
    "city": "Bengaluru",
    "blood_group": "B+",
    "role": "patient",
    "address": "77, 4th Block, Koramangala",
})
assert r1.status_code == 201, f"Failed: {r1.text}"
user1_data = r1.json()["user"]
p_db = db.query(Patient).filter(Patient.user_id == user1_data["id"]).first()
assert p_db is not None, "Patient profile not found in DB!"
assert p_db.city == "Bengaluru"
print(f"   [OK] Patient registered: {user1_data['name']} ({test_patient_email}), ID: {user1_data['id']}, DB Profile: {p_db.id}")

# 2. Real Donor Registration
print("\n2. Registering Real Donor...")
r2 = client.post("/api/auth/register", json={
    "name": "Vikram Seth",
    "email": test_donor_email,
    "password": "SecurePassword@123",
    "confirm_password": "SecurePassword@123",
    "phone": "+91 98888 22222",
    "city": "Bengaluru",
    "blood_group": "O-",
    "role": "donor",
    "address": "12, Indiranagar, Bengaluru",
})
assert r2.status_code == 201, f"Failed: {r2.text}"
user2_data = r2.json()["user"]
d_db = db.query(Donor).filter(Donor.user_id == user2_data["id"]).first()
assert d_db is not None, "Donor profile not found in DB!"
assert d_db.availability_status is True
print(f"   [OK] Donor registered: {user2_data['name']} ({test_donor_email}), Availability: {d_db.availability_status}")

# 3. Real Hospital Registration
print("\n3. Registering Real Hospital...")
r3 = client.post("/api/auth/register", json={
    "name": "Fortis Hospital Admin",
    "email": test_hospital_email,
    "password": "SecurePassword@123",
    "confirm_password": "SecurePassword@123",
    "phone": "+91 98888 33333",
    "city": "Bengaluru",
    "role": "hospital",
    "hospital_name": "Fortis Hospital Cunningham Road",
    "registration_number": f"FORTIS-REG-{tag}",
    "address": "14, Cunningham Road",
})
assert r3.status_code == 201, f"Failed: {r3.text}"
user3_data = r3.json()["user"]
h_db = db.query(Hospital).filter(Hospital.user_id == user3_data["id"]).first()
assert h_db is not None, "Hospital profile not found in DB!"
assert h_db.hospital_name == "Fortis Hospital Cunningham Road"
print(f"   [OK] Hospital registered: {h_db.hospital_name}, RegNum: {h_db.registration_number}")

# 4. Real Blood Bank Registration
print("\n4. Registering Real Blood Bank...")
r4 = client.post("/api/auth/register", json={
    "name": "Lions Blood Bank Officer",
    "email": test_bb_email,
    "password": "SecurePassword@123",
    "confirm_password": "SecurePassword@123",
    "phone": "+91 98888 44444",
    "city": "Bengaluru",
    "role": "bloodbank",
    "blood_bank_name": "Lions Central Blood Bank",
    "registration_number": f"LIONS-LIC-{tag}",
})
assert r4.status_code == 201, f"Failed: {r4.text}"
user4_data = r4.json()["user"]
bb_db = db.query(BloodBank).filter(BloodBank.user_id == user4_data["id"]).first()
assert bb_db is not None, "BloodBank profile not found in DB!"
print(f"   [OK] Blood Bank registered: {bb_db.name}, RegNum: {bb_db.registration_number}")

# 5. Duplicate Email Case-Insensitive Check
print("\n5. Testing Duplicate Email rejection...")
r5 = client.post("/api/auth/register", json={
    "name": "Duplicate Try",
    "email": test_patient_email.upper(),
    "password": "SecurePassword@123",
    "confirm_password": "SecurePassword@123",
    "phone": "+91 98888 55555",
    "city": "Bengaluru",
    "role": "patient",
})
assert r5.status_code == 409, f"Expected 409, got {r5.status_code}"
print(f"   [OK] Duplicate email rejected cleanly: {r5.json()['detail']}")

# 6. Google Auth & Collision Handling
print("\n6. Testing Google Registration...")
r6 = client.post("/api/auth/google", json={
    "email": test_google_email,
    "name": "Google Tester",
    "role": "donor",
    "city": "Bengaluru",
    "blood_group": "AB+",
})
assert r6.status_code == 200
g_user = r6.json()["user"]
print(f"   [OK] Google user created: {g_user['name']} ({g_user['email']})")

print("\n7. Testing Google Login collision with existing email...")
r7 = client.post("/api/auth/google", json={
    "email": test_patient_email.upper(),
    "name": "Existing User Via Google",
})
assert r7.status_code == 200
assert r7.json()["user"]["id"] == user1_data["id"]
print(f"   [OK] Successfully authenticated existing user without creating duplicate row!")

# 8. Clean Login with New Account
print("\n8. Testing Login with New Patient Account...")
r8 = client.post("/api/auth/login", json={
    "email": test_patient_email,
    "password": "SecurePassword@123",
    "role": "patient",
})
assert r8.status_code == 200
token = r8.json()["access_token"]
print(f"   [OK] Login successful, received JWT access token")

# 9. Verify /api/auth/me
print("\n9. Testing /api/auth/me...")
r9 = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
assert r9.status_code == 200
assert r9.json()["user"]["email"] == test_patient_email
print(f"   [OK] Current user verified: {r9.json()['user']['name']}")

db.close()
print("=" * 75)
print("[SUCCESS] ALL LIVE POSTGRESQL REGISTRATION & AUTH TESTS PASSED!")
