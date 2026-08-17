from sqlalchemy import create_engine, inspect
from app.core.config import settings
engine = create_engine(settings.DATABASE_URL)
insp = inspect(engine)

tables = ['User','Patient','Donor','Hospital','BloodBank','BloodInventory',
          'BloodRequest','EmergencyRequest','Donation','Notification','AuditLog']

for tbl in tables:
    fks = insp.get_foreign_keys(tbl)
    for fk in fks:
        cc = fk['constrained_columns']
        rt = fk['referred_table']
        rc = fk['referred_columns']
        print(f"{tbl}.{cc} -> {rt}.{rc}")

# Also get enum types
from sqlalchemy import text
with engine.connect() as conn:
    rows = conn.execute(text(
        "SELECT typname, enumlabel FROM pg_enum e "
        "JOIN pg_type t ON e.enumtypid = t.oid "
        "ORDER BY typname, e.enumsortorder"
    )).fetchall()
    enum_map = {}
    for typname, label in rows:
        enum_map.setdefault(typname, []).append(label)
    for k, v in enum_map.items():
        print(f"ENUM {k}: {v}")
