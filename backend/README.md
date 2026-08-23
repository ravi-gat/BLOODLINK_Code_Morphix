# BloodLink FastAPI Backend

FastAPI, SQLAlchemy, and PostgreSQL backend for the BloodLink platform.

## Key Features

- **JWT Authentication & RBAC**: Roles: `ADMIN`, `PATIENT`, `DONOR`, `HOSPITAL`, `BLOOD_BANK`.
- **PostgreSQL Database Mapping**: Exact mapping to existing Prisma schema tables.
- **Emergency SOS Workflow**: Instant matching and donor dispatch notification engine.
- **Maps & Location Engine**: Radius searches and privacy-preserved donor distribution.
- **Inventory & Expiry Control**: Unit reservations, stock validation, and expiry tracking.
- **Audit Logging**: Immutable tracking of security and operational events.

## Commands

```bash
# Run tests
pytest -v

# Run live DB demo accounts check
python test_all_accounts.py

# Run live DB E2E integration test
python test_e2e_live.py

# Run dev server
uvicorn app.main:app --reload --port 8000
```
