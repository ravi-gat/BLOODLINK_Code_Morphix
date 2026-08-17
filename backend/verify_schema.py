"""
Schema verification script — run once to confirm models align with the DB.
Delete after verification is complete.
"""
from app.core.database import SessionLocal
from app.models import User, Patient, BloodGroup
from app.models.enums import UserRole

db = SessionLocal()

# ── 1. Find the demo patient user ────────────────────────────────────────────
user = db.query(User).filter(User.email == "patient@bloodlink.demo").first()

if user is None:
    print("RESULT: user patient@bloodlink.demo NOT FOUND in database")
    print("  → The seed script may not have run yet against this DB.")
else:
    print(f"RESULT: User found")
    print(f"  id      = {user.id}")
    print(f"  email   = {user.email}")
    print(f"  name    = {user.full_name}")
    print(f"  role    = {user.role}")
    print(f"  status  = {user.status}")
    role_ok = user.role == UserRole.PATIENT
    print(f"  role==PATIENT? {role_ok}")

    # ── 2. Traverse the Patient profile ──────────────────────────────────────
    profile = db.query(Patient).filter(Patient.user_id == user.id).first()
    if profile is None:
        print("  Patient profile: NOT FOUND")
    else:
        print(f"  Patient profile found")
        print(f"    patient.id         = {profile.id}")
        print(f"    patient.bloodGroup = {profile.blood_group}")
        print(f"    patient.city       = {profile.city}")
        bg_ok = profile.blood_group == BloodGroup.O_POS
        city_ok = profile.city == "Bengaluru"
        print(f"    bloodGroup==O_POS? {bg_ok}")
        print(f"    city==Bengaluru?   {city_ok}")

# ── 3. Quick count of all tables ─────────────────────────────────────────────
from app.models import Donor, Hospital, BloodBank, BloodRequest, Donation
from app.models import Notification, AuditLog, BloodInventory, EmergencyRequest

counts = {
    "User":             db.query(User).count(),
    "Patient":          db.query(Patient).count(),
    "Donor":            db.query(Donor).count(),
    "Hospital":         db.query(Hospital).count(),
    "BloodBank":        db.query(BloodBank).count(),
    "BloodInventory":   db.query(BloodInventory).count(),
    "BloodRequest":     db.query(BloodRequest).count(),
    "EmergencyRequest": db.query(EmergencyRequest).count(),
    "Donation":         db.query(Donation).count(),
    "Notification":     db.query(Notification).count(),
    "AuditLog":         db.query(AuditLog).count(),
}
print("\nTable row counts:")
for table, count in counts.items():
    print(f"  {table:<20} {count}")

db.close()
print("\nAll queries completed successfully.")
