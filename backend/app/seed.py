"""
BloodLink Database Seed Script.

Creates demo accounts and sample data for development/testing.
Run with: python -m app.seed

DEMO ACCOUNTS (development only):
  patient@bloodlink.demo   / Patient@123
  donor@bloodlink.demo     / Donor@123
  hospital@bloodlink.demo  / Hospital@123
  bloodbank@bloodlink.demo / BloodBank@123
  admin@bloodlink.demo     / Admin@123

These accounts are clearly identified as demo/development data.
Remove or change credentials before deploying to production.
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from datetime import date, timedelta
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User
from app.models.profiles import Patient, Donor, Hospital, BloodBank
from app.models.blood import BloodRequest, BloodInventory, Donation, Appointment
from app.models.notifications import Notification, Reward, RewardTransaction
from app.models.enums import (
    UserRole, UserStatus, BloodGroup, RequestStatus, UrgencyLevel,
    VerificationStatus, NotificationType, ComponentType, DonationStatus
)
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def seed():
    db = SessionLocal()
    try:
        _seed_users(db)
        _seed_sample_donors(db)
        _seed_inventory(db)
        _seed_requests(db)
        _seed_donations(db)
        _seed_notifications(db)
        db.commit()
        logger.info("✓ BloodLink seed data created successfully.")
        _print_demo_accounts()
    except Exception as e:
        db.rollback()
        logger.error(f"Seed failed: {e}", exc_info=True)
        raise
    finally:
        db.close()


def _upsert_user(db, email, full_name, phone, role, password, city, blood_group=None) -> User:
    """Create or update a demo user."""
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        existing.full_name = full_name
        existing.phone = phone
        existing.password_hash = hash_password(password)
        existing.status = UserStatus.ACTIVE
        existing.is_verified = True
        db.flush()
        return existing

    user = User(
        full_name=full_name,
        email=email,
        phone=phone,
        password_hash=hash_password(password),
        role=role,
        status=UserStatus.ACTIVE,
        is_verified=True,
    )
    db.add(user)
    db.flush()
    return user


def _seed_users(db):
    logger.info("Creating demo user accounts...")

    # ── Admin ─────────────────────────────────────────────────────────────────
    admin = _upsert_user(
        db, "admin@bloodlink.demo",
        "BloodLink Platform Admin", "+91 80000 10001",
        UserRole.ADMIN, "Admin@123", "Bengaluru"
    )

    # ── Patient ───────────────────────────────────────────────────────────────
    patient_user = _upsert_user(
        db, "patient@bloodlink.demo",
        "Ananya Iyer", "+91 98765 10482",
        UserRole.PATIENT, "Patient@123", "Bengaluru", BloodGroup.O_POS
    )
    patient = db.query(Patient).filter(Patient.user_id == patient_user.id).first()
    if not patient:
        patient = Patient(
            user_id=patient_user.id,
            blood_group=BloodGroup.O_POS,
            city="Bengaluru",
            emergency_contact="+91 98765 10483",
        )
        db.add(patient)
        db.flush()

    # ── Donor ─────────────────────────────────────────────────────────────────
    donor_user = _upsert_user(
        db, "donor@bloodlink.demo",
        "Karthik Raman", "+91 99807 21645",
        UserRole.DONOR, "Donor@123", "Mysuru", BloodGroup.O_POS
    )
    donor = db.query(Donor).filter(Donor.user_id == donor_user.id).first()
    if not donor:
        donor = Donor(
            user_id=donor_user.id,
            blood_group=BloodGroup.O_POS,
            city="Mysuru",
            availability=True,
            last_donation_date=date.today() - timedelta(days=90),
            next_eligible_date=date.today() - timedelta(days=34),
            health_status="Good",
            verification_status=VerificationStatus.VERIFIED,
            total_donations=8,
            reward_points=820,
        )
        db.add(donor)
        db.flush()
        reward = Reward(donor_id=donor.id, points=820, level="Silver")
        db.add(reward)
        db.flush()
        # Sample reward transactions
        for pts, reason in [(100, "First donation bonus"), (200, "3rd donation milestone"),
                             (150, "Emergency response"), (200, "5th donation milestone"),
                             (170, "Regular donation")]:
            db.add(RewardTransaction(reward_id=reward.id, type="earned", points=pts,
                                     reason=reason, balance_after=sum([100,200,150,200,170][:idx+1]))
                   for idx, (pts, reason) in enumerate([(100,"First donation bonus"),(200,"3rd donation milestone"),
                                                         (150,"Emergency response"),(200,"5th donation milestone"),
                                                         (170,"Regular donation")])).__next__() if False else None
        # Simple approach
        running = 0
        for pts, reason in [(100, "First donation bonus"), (200, "3rd donation milestone"),
                             (150, "Emergency response"), (200, "5th donation milestone"),
                             (170, "Regular donation")]:
            running += pts
            db.add(RewardTransaction(reward_id=reward.id, type="earned", points=pts,
                                     reason=reason, balance_after=running))

    # ── Hospital ──────────────────────────────────────────────────────────────
    hospital_user = _upsert_user(
        db, "hospital@bloodlink.demo",
        "Sanjay Memorial Hospital", "+91 80416 72390",
        UserRole.HOSPITAL, "Hospital@123", "Bengaluru"
    )
    hospital = db.query(Hospital).filter(Hospital.user_id == hospital_user.id).first()
    if not hospital:
        hospital = Hospital(
            user_id=hospital_user.id,
            hospital_name="Sanjay Memorial Hospital",
            registration_number="KAR-HSP-20481",
            city="Bengaluru",
            address="14 MG Road, Bengaluru 560001",
            phone="+91 80416 72390",
            verification_status=VerificationStatus.VERIFIED,
        )
        db.add(hospital)
        db.flush()

    # ── Blood Bank ────────────────────────────────────────────────────────────
    bb_user = _upsert_user(
        db, "bloodbank@bloodlink.demo",
        "Sahyadri Blood Centre", "+91 80882 61437",
        UserRole.BLOOD_BANK, "BloodBank@123", "Mangaluru"
    )
    blood_bank = db.query(BloodBank).filter(BloodBank.user_id == bb_user.id).first()
    if not blood_bank:
        blood_bank = BloodBank(
            user_id=bb_user.id,
            bank_name="Sahyadri Blood Centre",
            registration_number="KAR-BB-11042",
            city="Mangaluru",
            address="7 Lighthouse Hill Rd, Mangaluru 575001",
            phone="+91 80882 61437",
            verification_status=VerificationStatus.VERIFIED,
        )
        db.add(blood_bank)
        db.flush()

    logger.info("✓ Demo accounts created.")


def _seed_sample_donors(db):
    """Create additional sample donors with varied blood groups."""
    logger.info("Creating sample donors...")
    sample_donors = [
        ("Meera Kulkarni", "meera.kulkarni@demo.bloodlink", "+91 90001 00001", "Bengaluru", BloodGroup.A_POS, 5),
        ("Farhan Siddiqui", "farhan.siddiqui@demo.bloodlink", "+91 90001 00002", "Mysuru", BloodGroup.B_NEG, 3),
        ("Nandini Rao", "nandini.rao@demo.bloodlink", "+91 90001 00003", "Mangaluru", BloodGroup.AB_POS, 7),
        ("Vikram Shetty", "vikram.shetty@demo.bloodlink", "+91 90001 00004", "Bengaluru", BloodGroup.O_NEG, 12),
        ("Divya Krishnamurthy", "divya.k@demo.bloodlink", "+91 90001 00005", "Chennai", BloodGroup.A_NEG, 4),
        ("Rahul Nair", "rahul.nair@demo.bloodlink", "+91 90001 00006", "Hyderabad", BloodGroup.B_POS, 9),
        ("Priya Menon", "priya.menon@demo.bloodlink", "+91 90001 00007", "Pune", BloodGroup.O_POS, 6),
        ("Arun Subramaniam", "arun.s@demo.bloodlink", "+91 90001 00008", "Mumbai", BloodGroup.AB_NEG, 2),
    ]

    for name, email, phone, city, bg, donations in sample_donors:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            continue

        user = User(
            full_name=name,
            email=email,
            phone=phone,
            password_hash=hash_password("Donor@123"),
            role=UserRole.DONOR,
            status=UserStatus.ACTIVE,
            is_verified=True,
        )
        db.add(user)
        db.flush()

        last_donation = date.today() - timedelta(days=60 + donations * 5)
        d = Donor(
            user_id=user.id,
            blood_group=bg,
            city=city,
            availability=True,
            last_donation_date=last_donation,
            next_eligible_date=last_donation + timedelta(days=56),
            health_status="Good",
            verification_status=VerificationStatus.VERIFIED,
            total_donations=donations,
            reward_points=donations * 100,
        )
        db.add(d)
        db.flush()
        db.add(Reward(donor_id=d.id, points=d.reward_points, level="Bronze"))

    db.flush()
    logger.info("✓ Sample donors created.")


def _seed_inventory(db):
    """Create sample blood inventory for the demo blood bank and hospital."""
    logger.info("Creating sample inventory...")

    # Blood bank inventory
    blood_bank = db.query(BloodBank).filter(
        BloodBank.registration_number == "KAR-BB-11042"
    ).first()

    if blood_bank:
        existing_count = db.query(BloodInventory).filter(
            BloodInventory.blood_bank_id == blood_bank.id
        ).count()
        if existing_count == 0:
            inventory_data = [
                (BloodGroup.O_POS, 36, 45),
                (BloodGroup.O_NEG, 7, 30),
                (BloodGroup.A_POS, 22, 60),
                (BloodGroup.A_NEG, 5, 45),
                (BloodGroup.B_POS, 18, 50),
                (BloodGroup.B_NEG, 4, 30),
                (BloodGroup.AB_POS, 12, 55),
                (BloodGroup.AB_NEG, 3, 35),
            ]
            for bg, units, days_to_expiry in inventory_data:
                db.add(BloodInventory(
                    blood_bank_id=blood_bank.id,
                    blood_group=bg,
                    component_type=ComponentType.WHOLE_BLOOD,
                    units_available=units,
                    expiry_date=date.today() + timedelta(days=days_to_expiry),
                ))

    # Hospital inventory
    hospital = db.query(Hospital).filter(
        Hospital.registration_number == "KAR-HSP-20481"
    ).first()
    if hospital:
        existing_count = db.query(BloodInventory).filter(
            BloodInventory.hospital_id == hospital.id
        ).count()
        if existing_count == 0:
            h_inventory = [
                (BloodGroup.O_POS, 8, 20),
                (BloodGroup.A_POS, 6, 25),
                (BloodGroup.B_POS, 4, 20),
                (BloodGroup.AB_POS, 2, 30),
                (BloodGroup.O_NEG, 2, 15),
            ]
            for bg, units, days_to_expiry in h_inventory:
                db.add(BloodInventory(
                    hospital_id=hospital.id,
                    blood_group=bg,
                    component_type=ComponentType.WHOLE_BLOOD,
                    units_available=units,
                    expiry_date=date.today() + timedelta(days=days_to_expiry),
                ))

    db.flush()
    logger.info("✓ Sample inventory created.")


def _seed_requests(db):
    """Create sample blood requests."""
    logger.info("Creating sample blood requests...")

    patient = db.query(Patient).join(User, Patient.user_id == User.id).filter(
        User.email == "patient@bloodlink.demo"
    ).first()

    if not patient:
        return

    existing = db.query(BloodRequest).filter(BloodRequest.patient_id == patient.id).count()
    if existing > 0:
        logger.info("  Requests already exist, skipping.")
        return

    requests_data = [
        (BloodGroup.O_POS, 2, UrgencyLevel.CRITICAL, "Bengaluru", "Emergency Surgery", RequestStatus.COMPLETED),
        (BloodGroup.O_POS, 1, UrgencyLevel.HIGH, "Bengaluru", "Post-operative care", RequestStatus.COMPLETED),
        (BloodGroup.O_POS, 3, UrgencyLevel.MODERATE, "Mysuru", "Scheduled procedure", RequestStatus.CANCELLED),
        (BloodGroup.O_POS, 1, UrgencyLevel.HIGH, "Bengaluru", "Accident victim", RequestStatus.PENDING),
    ]

    for bg, units, urgency, city, notes, status in requests_data:
        db.add(BloodRequest(
            patient_id=patient.id,
            blood_group=bg,
            units_required=units,
            urgency=urgency,
            city=city,
            status=status,
            medical_notes=notes,
            contact_number="+91 98765 10482",
            patient_name=patient.user.full_name if patient.user else "Ananya Iyer",
        ))

    db.flush()
    logger.info("✓ Sample blood requests created.")


def _seed_donations(db):
    """Create sample donation records for the demo donor."""
    logger.info("Creating sample donations...")

    donor = db.query(Donor).join(User, Donor.user_id == User.id).filter(
        User.email == "donor@bloodlink.demo"
    ).first()

    if not donor:
        return

    existing = db.query(Donation).filter(Donation.donor_id == donor.id).count()
    if existing > 0:
        logger.info("  Donations already exist, skipping.")
        return

    hospital = db.query(Hospital).filter(
        Hospital.registration_number == "KAR-HSP-20481"
    ).first()

    donations_data = [
        (date.today() - timedelta(days=90), BloodGroup.O_POS, 1, DonationStatus.COMPLETED),
        (date.today() - timedelta(days=180), BloodGroup.O_POS, 1, DonationStatus.COMPLETED),
        (date.today() - timedelta(days=270), BloodGroup.O_POS, 1, DonationStatus.COMPLETED),
        (date.today() - timedelta(days=360), BloodGroup.O_POS, 1, DonationStatus.COMPLETED),
    ]

    for don_date, bg, units, status in donations_data:
        db.add(Donation(
            donor_id=donor.id,
            hospital_id=hospital.id if hospital else None,
            blood_group=bg,
            units=units,
            component_type=ComponentType.WHOLE_BLOOD,
            donation_date=don_date,
            status=status,
        ))

    db.flush()
    logger.info("✓ Sample donations created.")


def _seed_notifications(db):
    """Create sample notifications for demo users."""
    logger.info("Creating sample notifications...")

    users = {
        u.email: u
        for u in db.query(User).filter(User.email.in_([
            "patient@bloodlink.demo", "donor@bloodlink.demo",
            "hospital@bloodlink.demo", "bloodbank@bloodlink.demo", "admin@bloodlink.demo"
        ])).all()
    }

    notifs = [
        ("patient@bloodlink.demo", "Welcome to BloodLink", "Your patient account has been set up. You can now request blood donations.", NotificationType.INFO),
        ("patient@bloodlink.demo", "Request Fulfilled", "Your blood request has been fulfilled. Thank you for using BloodLink.", NotificationType.MATCH),
        ("donor@bloodlink.demo", "Welcome to BloodLink", "Thank you for registering as a donor. Your contribution saves lives.", NotificationType.INFO),
        ("donor@bloodlink.demo", "Eligible to Donate", "You are now eligible to donate blood again. Check for nearby requests.", NotificationType.REMINDER),
        ("donor@bloodlink.demo", "Points Earned", "You earned 100 reward points for your last donation.", NotificationType.REWARD),
        ("hospital@bloodlink.demo", "Account Verified", "Your hospital account has been verified by the BloodLink team.", NotificationType.APPROVAL),
        ("bloodbank@bloodlink.demo", "Account Verified", "Your blood bank account has been verified by the BloodLink team.", NotificationType.APPROVAL),
        ("admin@bloodlink.demo", "New Hospital Registration", "Sanjay Memorial Hospital has submitted a registration request.", NotificationType.SYSTEM),
    ]

    existing_count = db.query(Notification).count()
    if existing_count > 0:
        logger.info("  Notifications already exist, skipping.")
        return

    for email, title, message, ntype in notifs:
        user = users.get(email)
        if user:
            db.add(Notification(user_id=user.id, title=title, message=message, type=ntype))

    db.flush()
    logger.info("✓ Sample notifications created.")


def _print_demo_accounts():
    print("\n" + "=" * 60)
    print("  BloodLink Demo Accounts (DEVELOPMENT ONLY)")
    print("=" * 60)
    accounts = [
        ("Patient",    "patient@bloodlink.demo",    "Patient@123"),
        ("Donor",      "donor@bloodlink.demo",      "Donor@123"),
        ("Hospital",   "hospital@bloodlink.demo",   "Hospital@123"),
        ("Blood Bank", "bloodbank@bloodlink.demo",  "BloodBank@123"),
        ("Admin",      "admin@bloodlink.demo",      "Admin@123"),
    ]
    for role, email, pwd in accounts:
        print(f"  {role:<12} {email:<35} {pwd}")
    print("=" * 60)
    print("  Remove these accounts before production deployment.")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    seed()
