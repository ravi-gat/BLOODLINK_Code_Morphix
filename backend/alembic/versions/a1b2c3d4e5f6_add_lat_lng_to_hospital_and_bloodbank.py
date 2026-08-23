"""Add latitude and longitude to Hospital and BloodBank

Revision ID: a1b2c3d4e5f6
Revises: e8da54798817
Create Date: 2026-08-22 10:00:00.000000

Adds nullable latitude/longitude columns to the Hospital and BloodBank tables
so that facilities can be geocoded and displayed on Google Maps.

The columns are nullable so that existing records are not affected.
Geocoding can populate them incrementally via the maps API or admin tools.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "e8da54798817"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Hospital — add latitude and longitude (nullable, additive only)
    op.add_column(
        "Hospital",
        sa.Column("latitude", sa.Float(), nullable=True),
    )
    op.add_column(
        "Hospital",
        sa.Column("longitude", sa.Float(), nullable=True),
    )

    # BloodBank — add latitude and longitude (nullable, additive only)
    op.add_column(
        "BloodBank",
        sa.Column("latitude", sa.Float(), nullable=True),
    )
    op.add_column(
        "BloodBank",
        sa.Column("longitude", sa.Float(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("BloodBank", "longitude")
    op.drop_column("BloodBank", "latitude")
    op.drop_column("Hospital", "longitude")
    op.drop_column("Hospital", "latitude")
