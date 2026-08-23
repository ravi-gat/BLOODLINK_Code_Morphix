# BloodLink — AI-Enabled Blood Donation & Emergency Blood Management Platform

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma-Schema-2D3748?style=flat&logo=prisma&logoColor=white)](https://www.prisma.io)
[![Tests](https://img.shields.io/badge/Tests-64%20Passed-brightgreen)](https://pytest.org)

BloodLink is a production-ready, full-stack healthcare platform designed to coordinate voluntary blood donations, manage blood bank inventories, accelerate emergency blood matching, and provide real-time location and analytics for patients, donors, hospitals, blood banks, and platform administrators.

---

## 1. Production User Registration & Authentication

BloodLink supports open public registration for all core roles with full validation and security:

### Supported Registration Roles
- **Patient**: Name, Email, Phone, City, Blood Group, Address, Password
- **Donor**: Name, Email, Phone, City, Blood Group, Address, Password (defaults to `available=True`)
- **Hospital**: Name, Email, Phone, City, Hospital Name, Registration Number, Address, Password
- **Blood Bank**: Name, Email, Phone, City, Blood Bank Name, Registration Number, Address, Password
- *(Admin accounts are protected and cannot be created via public registration)*

### Key Security & Registration Features
- **Open Email Support**: Any valid email format (Gmail, Yahoo, Outlook, custom domains, etc.).
- **Case-Insensitive Uniqueness**: Email normalization and duplicate detection (`409 Conflict: An account with this email already exists.`).
- **Atomic Transactions**: Guarantees `User` and role profile records are committed together; rolls back on any error.
- **Password Strength Rules**: Minimum 8 characters, uppercase letter, number, and special character. Hashed with bcrypt. Plaintext passwords are never stored or logged.
- **Google SSO & Collision Safety (`POST /api/auth/google`)**: If a user signs in with Google using an existing registered email, the system authenticates the account without creating duplicate records.

---

## 2. Global Branding & Identity

- **BloodLinkLogo Component** ([`src/components/shared/BloodLinkLogo.tsx`](file:///d:/Blood_donor_fsd/src/components/shared/BloodLinkLogo.tsx)): Scalable, high-resolution SVG emblem featuring an interlocking blood drop and healthcare node.
- **Favicon & Meta**: Configured SVG favicon and dynamic page titles (`BloodLink | Login`, `BloodLink | Patient Dashboard`, etc.).
- **Consistent Navigation**: Header, Sidebar, and Mobile Nav utilize responsive branding across desktop and mobile devices.

---

## 3. Seed / Development Accounts

For local development and automated testing, the following seed accounts are pre-configured:

| Role | Development Email | Password | Full Name / Entity |
|---|---|---|---|
| **Admin** | `admin@bloodlink.demo` | `Admin@123` | BloodLink Platform Admin |
| **Patient** | `patient@bloodlink.demo` | `Patient@123` | Ananya Iyer (Bengaluru, O+) |
| **Donor** | `donor@bloodlink.demo` | `Donor@123` | Karthik Raman (Bengaluru, O+) |
| **Hospital** | `hospital@bloodlink.demo` | `Hospital@123` | Sanjay Memorial Hospital |
| **Blood Bank** | `bloodbank@bloodlink.demo`| `BloodBank@123` | Sahyadri Blood Centre |

*Production users register with their own genuine email addresses via the `/register` page.*

---

## 4. End-to-End User Workflows

### 1. Patient Emergency Blood SOS Flow
1. Patient submits an Emergency Request (`POST /api/emergency-requests`).
2. AI Matching Engine ranks compatible donors in the city and identifies nearby blood banks with stock.
3. Real-time emergency notifications are dispatched to active matching donors.
4. Patient tracks live match status and hospital assignment (`GET /api/emergency-requests/{id}/matches`).

### 2. Donor Response & Donation Tracking Flow
1. Donor toggles availability (`PUT /api/donors/availability`).
2. Donor receives real-time alert for compatible requests in their region (`GET /api/donors/requests`).
3. Donor accepts a request (`POST /api/donors/requests/{id}/accept`).
4. Notification is sent to patient/hospital and donation history is recorded upon fulfillment (`GET /api/donors/donations`).

### 3. Blood Bank Inventory & Reservation Flow
1. Blood Bank manages live stock per blood group (`GET /api/bloodbanks/inventory`, `POST /api/bloodbanks/inventory`).
2. Stock is protected against negative values (`unitsAvailable >= 0`).
3. Expiry tracking identifies units expiring within 7 days (`GET /api/bloodbanks/reports`).
4. Blood bank records incoming donations and updates stock (`POST /api/bloodbanks/donations`).

### 4. Hospital Emergency Coordination Flow
1. Hospital creates emergency blood requirements (`POST /api/emergency-requests`, `POST /api/blood-requests`).
2. Hospital views blood availability across partnered blood banks (`GET /api/hospitals/inventory`).
3. Hospital tracks request status and records patient donation receipts (`POST /api/hospitals/donations`).
4. Hospital analytics provide real-time fulfillment rates and statistics (`GET /api/hospitals/analytics`).

### 5. Admin Governance & Platform Analytics
1. View and filter registered users, patients, donors, hospitals, and blood banks (`GET /api/admin/users`).
2. Activate or deactivate accounts (`PUT /api/admin/users/{id}/activate`).
3. View platform-wide live metrics (`GET /api/admin/dashboard`, `GET /api/admin/analytics`).
4. Audit trail monitoring for all critical actions without exposing sensitive credentials (`GET /api/admin/audit-logs`).

---

## 5. Running the Application Locally

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+ (database: `bloodlink`)

### 1. Backend Setup

```bash
cd backend
.venv\Scripts\activate

# Run automated tests (64 tests)
pytest -v

# Run live database verification
python test_real_registration_live.py

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```

- API Health: `http://localhost:8000/health`
- Swagger Interactive Docs: `http://localhost:8000/docs`
- ReDoc Documentation: `http://localhost:8000/redoc`

### 2. Frontend Setup

```bash
# In project root
npm install

# Build for production
npm run build

# Start development server
npm run dev
```

- Web UI: `http://localhost:5173`

---

## 6. Automated Test Verification

Run all test suites:

```bash
cd backend
pytest -v
```

**Results**: **64 passed in 20.52s**.
- `tests/test_auth.py` (13 tests)
- `tests/test_real_registration.py` (11 tests)
- `tests/test_blood_requests.py` (8 tests)
- `tests/test_bloodbanks.py` (5 tests)
- `tests/test_compatibility.py` (10 tests)
- `tests/test_emergency.py` (6 tests)
- `tests/test_maps.py` (2 tests)
- `tests/test_rbac.py` (9 tests)
