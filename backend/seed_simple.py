#!/usr/bin/env python3
"""
Simplified BloodLink Database Seed Script.
Creates only demo accounts.
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from uuid import uuid4
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User
from app.models.profiles import Patient, Donor, Hospital, BloodBank
from app.models.enums import UserRole, UserStatus, BloodGroup
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def seed():
    db = SessionLocal()
    try:
        logger.info("Creating demo user accounts...")
        
        # Admin
        admin = db.query(User).filter(User.email == "admin@bloodlink.demo").first()
        if not admin:
            admin = User(
                id=str(uuid4()),
                full_name="BloodLink Admin",
                email="admin@bloodlink.demo",
                phone="+91 80000 10001",
                password_hash=hash_password("Admin@123"),
                role=UserRole.ADMIN,
                status=UserStatus.ACTIVE,
            )
            db.add(admin)
            db.flush()
            logger.info("✓ Admin account created")
        
        # Patient
        patient_user = db.query(User).filter(User.email == "patient@bloodlink.demo").first()
        if not patient_user:
            patient_user = User(
                id=str(uuid4()),
                full_name="Ananya Iyer",
                email="patient@bloodlink.demo",
                phone="+91 98765 10482",
                password_hash=hash_password("Patient@123"),
                role=UserRole.PATIENT,
                status=UserStatus.ACTIVE,
            )
            db.add(patient_user)
            db.flush()
            
            patient = Patient(
                id=str(uuid4()),
                user_id=patient_user.id,
                blood_group=BloodGroup.O_POS,
                city="Bengaluru",
            )
            db.add(patient)
            logger.info("✓ Patient account created")
        
        # Donor
        donor_user = db.query(User).filter(User.email == "donor@bloodlink.demo").first()
        if not donor_user:
            donor_user = User(
                id=str(uuid4()),
                full_name="Rahul Kumar",
                email="donor@bloodlink.demo",
                phone="+91 98765 10483",
                password_hash=hash_password("Donor@123"),
                role=UserRole.DONOR,
                status=UserStatus.ACTIVE,
            )
            db.add(donor_user)
            db.flush()
            
            donor = Donor(
                id=str(uuid4()),
                user_id=donor_user.id,
                blood_group=BloodGroup.A_POS,
                city="Bengaluru",
                availability_status=True,
            )
            db.add(donor)
            logger.info("✓ Donor account created")
        
        # Hospital
        hospital_user = db.query(User).filter(User.email == "hospital@bloodlink.demo").first()
        if not hospital_user:
            hospital_user = User(
                id=str(uuid4()),
                full_name="Apollo Hospitals",
                email="hospital@bloodlink.demo",
                phone="+91 80000 10002",
                password_hash=hash_password("Hospital@123"),
                role=UserRole.HOSPITAL,
                status=UserStatus.ACTIVE,
            )
            db.add(hospital_user)
            db.flush()
            
            hospital = Hospital(
                id=str(uuid4()),
                user_id=hospital_user.id,
                hospital_name="Apollo Hospitals Bengaluru",
                registration_number="AH-BLR-001",
                city="Bengaluru",
            )
            db.add(hospital)
            logger.info("✓ Hospital account created")
        
        # Blood Bank
        bloodbank_user = db.query(User).filter(User.email == "bloodbank@bloodlink.demo").first()
        if not bloodbank_user:
            bloodbank_user = User(
                id=str(uuid4()),
                full_name="Central Blood Bank",
                email="bloodbank@bloodlink.demo",
                phone="+91 80000 10003",
                password_hash=hash_password("BloodBank@123"),
                role=UserRole.BLOOD_BANK,
                status=UserStatus.ACTIVE,
            )
            db.add(bloodbank_user)
            db.flush()
            
            bloodbank = BloodBank(
                id=str(uuid4()),
                user_id=bloodbank_user.id,
                name="Central Blood Bank Bengaluru",
                registration_number="CBB-BLR-001",
                city="Bengaluru",
            )
            db.add(bloodbank)
            logger.info("✓ Blood Bank account created")
        
        db.commit()
        logger.info("✅ BloodLink database seeded successfully!")
        _print_demo_accounts()
        
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Seed failed: {e}", exc_info=True)
        raise
    finally:
        db.close()


def _print_demo_accounts():
    logger.info("\n" + "="*60)
    logger.info("📋 DEMO ACCOUNTS (for development/testing only)")
    logger.info("="*60)
    accounts = [
        ("Admin", "admin@bloodlink.demo", "Admin@123"),
        ("Patient", "patient@bloodlink.demo", "Patient@123"),
        ("Donor", "donor@bloodlink.demo", "Donor@123"),
        ("Hospital", "hospital@bloodlink.demo", "Hospital@123"),
        ("Blood Bank", "bloodbank@bloodlink.demo", "BloodBank@123"),
    ]
    for role, email, password in accounts:
        logger.info(f"  {role:12} | Email: {email:30} | Password: {password}")
    logger.info("="*60)


if __name__ == "__main__":
    seed()
