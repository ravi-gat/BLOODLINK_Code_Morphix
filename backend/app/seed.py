"""
BloodLink Database Seed Script — DEVELOPMENT ONLY.

Creates demo accounts and sample data for local development and testing.

IMPORTANT:
  - This script must NEVER run automatically.
  - It must NEVER be executed against a production database.
  - All records are clearly identifiable as development/demo data.
  - Existing records are detected and skipped (idempotent).
  - Remove these accounts before production deployment.

Usage:
  cd backend
  python -m app.seed

Demo accounts created:
  patient@bloodlink.demo   / Patient@123
  donor@bloodlink.demo     / Donor@123
  hospital@bloodlink.demo  / Hospital@123
  bloodbank@bloodlink.demo / BloodBank@123
  admin@bloodlink.demo     / Admin@123

Only uses columns that actually exist in the live PostgreSQL schema.
Non-existent columns are intentionally omitted:
  - Donor.next_eligible_date   (not in schema)
  - Donor.health_status        (not in schema)
  - Donor.total_donations      (not in schema)
  - Donor.reward_points        (not in schema)
  - Patient.emergency_contact  (not in schema)
  - Hospital.phone             (not in schema)
  - BloodBank.phone            (not in schema)
  - BloodInventory.component_type  (not in schema)
  - BloodInventory.hospital_id     (not in schema — belongs only to BloodBank)
"""

import os
import sys
import logging
from datetime import datetime, date, timedelta, timezone
from uuid import uuid4

# Make sure parent directory is on path so `python -m app.seed` works
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User
from app.models.profiles import Patient, Donor, Hospital, BloodBank
from app.models.blood import BloodRequest, BloodInventory, Donation
from app.models.notifications import Notification
from app.models.enums import (
    UserRole, UserStatus, BloodGroup, RequestStatus,
)

logging.basicConfig(level=logging.INFO, format="%(levelname)s — %(message)s")
logger = logging.getLogger(__name__)

# Guard — refuse to run against non-development database
_ENV = os.environ.get("ENVIRONMENT", "development").lower()
if _ENV == "production":
    logger.critical("SEED SCRIPT REFUSED: ENVIRONMENT=production. Never seed a production database.")
    sys.exit(1)

_now = datetime.now(timezone.utc)


def _uid() -> str:
    return str(uuid4()).replace("-", "")


def _skip_if_exists(db, email: str) -> bool:
    return db.query(User).filter(User.email == email).first() is not None


def seed():
    logger.info("BloodLink seed script starting — DEVELOPMENT ONLY")
    db = SessionLocal()
    try:
        _seed_admin(db)
        _seed_patient(db)
        donor = _seed_donor(db)
        hospital = _seed_hospital(db)
        blood_bank = _seed_blood_bank(db)
        _seed_extra_donors(db)
        if blood_bank:
            _seed_inventory(db, blood_bank)
        if hospital:
            patient = db.query(Patient).join(User, Patient.user_id == User.id).filter(
                User.email == "patient@bloodlink.demo"
            ).first()
            if patient:
                _seed_requests(db, patient, hospital)
                if donor:
                    _seed_donations(db, donor, hospital)
        _seed_notifications(db)
        db.commit()
        logger.info("✓ Seed completed successfully.")
        _print_accounts()
    except Exception as exc:
        db.rollback()
        logger.error(f"Seed failed — rolled back: {exc}", exc_info=True)
        raise
    finally:
        db.close()


# ── Individual seeders ────────────────────────────────────────────────────────

def _seed_admin(db) -> User | None:
    email = "admin@bloodlink.demo"
    if _skip_if_exists(db, email):
        logger.info(f"  Skipping {email} (already exists)")
        return None
    u = User(
        id=_uid(), full_name="BloodLink Platform Admin", email=email,
        phone="+91 80000 10001", password_hash=hash_password("Admin@123"),
        role=UserRole.ADMIN, status=UserStatus.ACTIVE,
    )
    db.add(u)
    db.flush()
    logger.info(f"  Created admin: {email}")
    return u


def _seed_patient(db) -> Patient | None:
    email = "patient@bloodlink.demo"
    if _skip_if_exists(db, email):
        logger.info(f"  Skipping {email} (already exists)")
        return None
    u = User(
        id=_uid(), full_name="Ananya Iyer", email=email,
        phone="+91 98765 10482", password_hash=hash_password("Patient@123"),
        role=UserRole.PATIENT, status=UserStatus.ACTIVE,
    )
    db.add(u)
    db.flush()
    p = Patient(
        id=_uid(), user_id=u.id,
        blood_group=BloodGroup.O_POS,
        city="Bengaluru",
        address="12 MG Road, Bengaluru 560001",
    )
    db.add(p)
    db.flush()
    logger.info(f"  Created patient: {email}")
    return p


def _seed_donor(db) -> Donor | None:
    email = "donor@bloodlink.demo"
    if _skip_if_exists(db, email):
        logger.info(f"  Skipping {email} (already exists)")
        return None
    u = User(
        id=_uid(), full_name="Karthik Raman", email=email,
        phone="+91 99807 21645", password_hash=hash_password("Donor@123"),
        role=UserRole.DONOR, status=UserStatus.ACTIVE,
    )
    db.add(u)
    db.flush()
    # Only columns that exist: userId, bloodGroup, city, address,
    # availabilityStatus, lastDonationDate, createdAt, updatedAt
    d = Donor(
        id=_uid(), user_id=u.id,
        blood_group=BloodGroup.O_POS,
        city="Mysuru",
        address="45 Chamundi Hills Road, Mysuru 570001",
        availability_status=True,
        last_donation_date=date.today() - timedelta(days=90),
    )
    db.add(d)
    db.flush()
    logger.info(f"  Created donor: {email}")
    return d


def _seed_hospital(db) -> Hospital | None:
    email = "hospital@bloodlink.demo"
    if _skip_if_exists(db, email):
        logger.info(f"  Skipping {email} (already exists)")
        return None
    u = User(
        id=_uid(), full_name="Sanjay Memorial Hospital", email=email,
        phone="+91 80416 72390", password_hash=hash_password("Hospital@123"),
        role=UserRole.HOSPITAL, status=UserStatus.ACTIVE,
    )
    db.add(u)
    db.flush()
    # Only columns that exist: userId, hospitalName, registrationNumber,
    # city, address, latitude, longitude, createdAt, updatedAt
    h = Hospital(
        id=_uid(), user_id=u.id,
        hospital_name="Sanjay Memorial Hospital",
        registration_number="KAR-HSP-20481",
        city="Bengaluru",
        address="14 MG Road, Bengaluru 560001",
        latitude=12.9716,
        longitude=77.5946,
    )
    db.add(h)
    db.flush()
    logger.info(f"  Created hospital: {email}")
    return h


def _seed_blood_bank(db) -> BloodBank | None:
    email = "bloodbank@bloodlink.demo"
    if _skip_if_exists(db, email):
        logger.info(f"  Skipping {email} (already exists)")
        return None
    u = User(
        id=_uid(), full_name="Sahyadri Blood Centre", email=email,
        phone="+91 80882 61437", password_hash=hash_password("BloodBank@123"),
        role=UserRole.BLOOD_BANK, status=UserStatus.ACTIVE,
    )
    db.add(u)
    db.flush()
    # Only columns that exist: userId, name, registrationNumber,
    # city, address, latitude, longitude, createdAt, updatedAt
    b = BloodBank(
        id=_uid(), user_id=u.id,
        name="Sahyadri Blood Centre",
        registration_number="KAR-BB-11042",
        city="Mangaluru",
        address="7 Lighthouse Hill Rd, Mangaluru 575001",
        latitude=12.9141,
        longitude=74.8560,
    )
    db.add(b)
    db.flush()
    logger.info(f"  Created blood bank: {email}")
    return b


def _seed_extra_donors(db):
    """Create 4 additional donors with different blood groups for richer search results."""
    extras = [
        ("Meera Kulkarni", "meera@demo.bloodlink", "+91 90001 00001", "Bengaluru", BloodGroup.A_POS, 60),
        ("Vikram Shetty",  "vikram@demo.bloodlink", "+91 90001 00002", "Bengaluru", BloodGroup.O_NEG, 90),
        ("Nandini Rao",    "nandini@demo.bloodlink", "+91 90001 00003", "Mysuru",    BloodGroup.B_POS, 120),
        ("Rahul Nair",     "rahul@demo.bloodlink",   "+91 90001 00004", "Mangaluru", BloodGroup.AB_POS, 75),
    ]
    for name, email, phone, city, bg, days_since_donation in extras:
        if _skip_if_exists(db, email):
            continue
        u = User(
            id=_uid(), full_name=name, email=email, phone=phone,
            password_hash=hash_password("Donor@123"),
            role=UserRole.DONOR, status=UserStatus.ACTIVE,
        )
        db.add(u)
        db.flush()
        db.add(Donor(
            id=_uid(), user_id=u.id, blood_group=bg,
            city=city, availability_status=True,
            last_donation_date=date.today() - timedelta(days=days_since_donation),
        ))
        logger.info(f"  Created extra donor: {email}")
    db.flush()


def _seed_inventory(db, blood_bank: BloodBank):
    """Seed blood inventory for the demo blood bank."""
    existing = db.query(BloodInventory).filter(
        BloodInventory.blood_bank_id == blood_bank.id
    ).count()
    if existing > 0:
        logger.info(f"  Inventory for {blood_bank.name} already exists, skipping.")
        return

    # (blood_group, units_available, days_to_expiry)
    # Only columns that exist: id, bloodBankId, bloodGroup,
    # unitsAvailable, unitsReserved, expiryDate, updatedAt
    items = [
        (BloodGroup.O_POS,  36, 45),
        (BloodGroup.O_NEG,   7, 30),
        (BloodGroup.A_POS,  22, 60),
        (BloodGroup.A_NEG,   5, 45),
        (BloodGroup.B_POS,  18, 50),
        (BloodGroup.B_NEG,   4, 30),
        (BloodGroup.AB_POS, 12, 55),
        (BloodGroup.AB_NEG,  3, 35),
    ]
    for bg, units, days in items:
        expiry = datetime.now(timezone.utc) + timedelta(days=days)
        db.add(BloodInventory(
            id=_uid(), blood_bank_id=blood_bank.id,
            blood_group=bg, units_available=units, units_reserved=0,
            expiry_date=expiry,
        ))
    db.flush()
    logger.info(f"  Seeded inventory for {blood_bank.name}")


def _seed_requests(db, patient: Patient, hospital: Hospital):
    """Seed sample blood requests for the demo patient."""
    existing = db.query(BloodRequest).filter(
        BloodRequest.patient_id == patient.id
    ).count()
    if existing > 0:
        logger.info("  Blood requests already exist, skipping.")
        return

    # (blood_group, units, urgency_str, city, notes, status)
    # Only columns that exist: id, patientId, hospitalId, bloodGroup,
    # unitsRequired, urgency, status, city, notes, createdAt, updatedAt
    rows = [
        (BloodGroup.O_POS, 2, "Critical", "Bengaluru", "Emergency surgery", RequestStatus.FULFILLED),
        (BloodGroup.O_POS, 1, "High",     "Bengaluru", "Post-operative care", RequestStatus.FULFILLED),
        (BloodGroup.O_POS, 3, "Moderate", "Mysuru",    "Scheduled procedure", RequestStatus.CANCELLED),
        (BloodGroup.O_POS, 1, "High",     "Bengaluru", "Accident victim", RequestStatus.PENDING),
    ]
    for bg, units, urgency, city, notes, status in rows:
        db.add(BloodRequest(
            id=_uid(), patient_id=patient.id, hospital_id=hospital.id,
            blood_group=bg, units_required=units, urgency=urgency,
            status=status, city=city, notes=notes,
        ))
    db.flush()
    logger.info("  Seeded sample blood requests.")


def _seed_donations(db, donor: Donor, hospital: Hospital):
    """Seed sample donation records for the demo donor."""
    existing = db.query(Donation).filter(Donation.donor_id == donor.id).count()
    if existing > 0:
        logger.info("  Donations already exist, skipping.")
        return

    # Only columns that exist: id, donorId, bloodBankId, hospitalId,
    # bloodGroup, units, donationDate, status, createdAt
    for i, days_ago in enumerate([90, 180, 270, 360]):
        db.add(Donation(
            id=_uid(), donor_id=donor.id, hospital_id=hospital.id,
            blood_group=BloodGroup.O_POS, units=1,
            donation_date=date.today() - timedelta(days=days_ago),
            status="COMPLETED",
        ))
    db.flush()
    logger.info("  Seeded sample donations.")


def _seed_notifications(db):
    """Seed welcome notifications for demo users."""
    user_emails_messages = [
        ("patient@bloodlink.demo", "Welcome to BloodLink",
         "Your patient account is active. You can now search for donors and request blood.", "info"),
        ("donor@bloodlink.demo",   "Welcome to BloodLink",
         "Thank you for registering as a donor. Your contributions save lives.", "info"),
        ("hospital@bloodlink.demo","Account Active",
         "Your hospital account is active. Manage blood requests from your dashboard.", "info"),
        ("bloodbank@bloodlink.demo","Account Active",
         "Your blood bank account is active. Manage inventory from your dashboard.", "info"),
    ]
    for email, title, message, ntype in user_emails_messages:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            continue
        existing = db.query(Notification).filter(
            Notification.user_id == user.id,
            Notification.title == title,
        ).first()
        if existing:
            continue
        # Only columns that exist: id, userId, title, message, type, isRead, createdAt
        db.add(Notification(
            id=_uid(), user_id=user.id, title=title,
            message=message, type=ntype, is_read=False,
        ))
    db.flush()
    logger.info("  Seeded welcome notifications.")


# ── Display ───────────────────────────────────────────────────────────────────

def _print_accounts():
    print("\n" + "═" * 62)
    print("  BloodLink Demo Accounts  —  DEVELOPMENT ONLY")
    print("═" * 62)
    rows = [
        ("Patient",    "patient@bloodlink.demo",    "Patient@123"),
        ("Donor",      "donor@bloodlink.demo",      "Donor@123"),
        ("Hospital",   "hospital@bloodlink.demo",   "Hospital@123"),
        ("Blood Bank", "bloodbank@bloodlink.demo",  "BloodBank@123"),
        ("Admin",      "admin@bloodlink.demo",      "Admin@123"),
    ]
    for role, email, pwd in rows:
        print(f"  {role:<12}  {email:<36}  {pwd}")
    print("═" * 62)
    print("  Remove these accounts before production deployment.")
    print("═" * 62 + "\n")


if __name__ == "__main__":
    seed()
