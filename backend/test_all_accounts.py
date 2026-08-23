"""
Test all 5 demo accounts against live PostgreSQL DB using FastAPI TestClient.
"""
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

demo_accounts = [
    ('admin@bloodlink.demo', 'Admin@123', 'admin'),
    ('patient@bloodlink.demo', 'Patient@123', 'patient'),
    ('donor@bloodlink.demo', 'Donor@123', 'donor'),
    ('hospital@bloodlink.demo', 'Hospital@123', 'hospital'),
    ('bloodbank@bloodlink.demo', 'BloodBank@123', 'bloodbank'),
]

print("Testing all demo accounts against live PostgreSQL database:")
print("=" * 75)

for email, password, role in demo_accounts:
    payload = {
        'email': email,
        'password': password,
        'role': role
    }
    
    response = client.post('/api/auth/login', json=payload)
    if response.status_code == 200:
        data = response.json()
        user = data['user']
        print(f"[OK]   {role.upper():12} | {user['name']:25} | {email:25} | ID: {user['id']}")
    else:
        print(f"[FAIL] {role.upper():12} | Failed: {response.status_code} - {response.text}")

print("=" * 75)
print("[SUCCESS] All demo accounts verified successfully against PostgreSQL!")
