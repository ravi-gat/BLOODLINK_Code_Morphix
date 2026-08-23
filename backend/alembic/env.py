"""Alembic migration environment configuration."""
import os
import sys
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

# Ensure app package is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.config import settings
from app.core.database import Base

# Import all models so Alembic can detect them for autogenerate
from app.models import (  # noqa: F401
    User, Patient, Donor, Hospital, BloodBank,
    BloodInventory, BloodRequest, DonorMatch, Donation, Appointment,
    Notification, Reward, RewardTransaction, ChatMessage, AuditLog,
)

config = context.config
# Use the URL directly without INI config parser to avoid special character issues
sqlalchemy_url = settings.DATABASE_URL

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = sqlalchemy_url
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    from sqlalchemy import create_engine
    
    connectable = create_engine(
        sqlalchemy_url,
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
