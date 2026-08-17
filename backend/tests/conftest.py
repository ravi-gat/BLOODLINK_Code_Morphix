"""
Test configuration and fixtures.

Uses SQLite in-memory database for isolated test runs.
Fixtures are session-scoped to avoid duplicate key errors across tests.

NOTE: SQLite does not enforce PostgreSQL-specific enum types, so enums
are stored as plain strings in the test database — which is fine for
testing application logic.
"""
import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db
from app.core.security import hash_password
from app.models.user import User
from app.models.profiles import Patient, Donor, Hospital, BloodBank
# Reward is a stub — no DB table, do not add to session
from app.models.enums import UserRole, UserStatus, BloodGroup


# ---------------------------------------------------------------------------
# Test database — SQLite in-memory
# ---------------------------------------------------------------------------

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


# ---------------------------------------------------------------------------
# Schema creation
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session", autouse=True)
def create_tables():
    # Only create tables for models that are actually mapped (real tables).
    # The stubs (Reward, RewardTransaction, ChatMessage, DonorMatch, Appointment)
    # are not mapped so they have no metadata to create.
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


# ---------------------------------------------------------------------------
# Shared DB session
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------------------------
# HTTP client
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c


# ---------------------------------------------------------------------------
# User creation helper
# ---------------------------------------------------------------------------

def _uid():
    return str(uuid.uuid4()).replace("-", "")


def _get_or_create_user(
    db,
    email: str,
    full_name: str,
    phone: str,
    role: UserRole,
    city: str = "Bengaluru",
    blood_group: BloodGroup = BloodGroup.O_POS,
) -> User:
    """Return an existing test user or create it — safe to call repeatedly."""
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        return existing

    user = User(
        id=_uid(),
        full_name=full_name,
        email=email,
        phone=phone,
        password_hash=hash_password("TestPass@1"),
        role=role,
        status=UserStatus.ACTIVE,
        # NOTE: User table has no is_verified column in the real DB.
        # SQLite in tests will accept the attribute but it maps to nothing
        # real.  Omit it here to stay aligned with the actual schema.
    )
    db.add(user)
    db.flush()

    if role == UserRole.PATIENT:
        db.add(Patient(
            id=_uid(),
            user_id=user.id,
            blood_group=blood_group,
            city=city,
        ))
    elif role == UserRole.DONOR:
        db.add(Donor(
            id=_uid(),
            user_id=user.id,
            blood_group=blood_group,
            city=city,
            # DB column: availabilityStatus  (NOT 'availability')
            availability_status=True,
            # total_donations, verification_status etc. do NOT exist in DB
        ))
    elif role == UserRole.HOSPITAL:
        db.add(Hospital(
            id=_uid(),
            user_id=user.id,
            hospital_name=full_name,
            registration_number=f"TEST-H-{user.id[:8].upper()}",
            city=city,
            # phone, verification_status do NOT exist in DB
        ))
    elif role == UserRole.BLOOD_BANK:
        db.add(BloodBank(
            id=_uid(),
            user_id=user.id,
            name=full_name,                        # DB column is 'name'
            registration_number=f"TEST-BB-{user.id[:8].upper()}",
            city=city,
        ))

    db.commit()
    db.refresh(user)
    return user


# ---------------------------------------------------------------------------
# Role fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def patient_user(db):
    return _get_or_create_user(
        db, "testpatient@test.com", "Test Patient", "+91 98000 00001", UserRole.PATIENT
    )


@pytest.fixture(scope="session")
def donor_user(db):
    return _get_or_create_user(
        db, "testdonor@test.com", "Test Donor", "+91 98000 00002", UserRole.DONOR
    )


@pytest.fixture(scope="session")
def hospital_user(db):
    return _get_or_create_user(
        db, "testhospital@test.com", "Test Hospital", "+91 98000 00003", UserRole.HOSPITAL
    )


@pytest.fixture(scope="session")
def admin_user(db):
    return _get_or_create_user(
        db, "testadmin@test.com", "Test Admin", "+91 98000 00004", UserRole.ADMIN
    )


# ---------------------------------------------------------------------------
# Auth helper
# ---------------------------------------------------------------------------

def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}
