# 🩸 BloodLink

### Healthcare Blood Donation & Emergency Response Platform

<p align="center">
  <strong>Connecting Patients, Donors, Hospitals & Blood Banks</strong>
</p>

<p align="center">
  <strong>Powered by Code Morphix</strong>
</p>

<p align="center">
  A full-stack healthcare technology platform for blood discovery,
  emergency requisitions, donor matching, inventory management,
  geolocation services, notifications, analytics, and role-based workflows.
</p>

---

## 📌 Project Overview

**BloodLink** is a full-stack healthcare platform designed to connect blood
donors, patients, hospitals, and blood banks through a centralized digital
ecosystem.

The platform enables users to:

- Find compatible blood donors
- Search blood availability
- Create blood requests
- Raise emergency blood requisitions
- Match donors with blood requirements
- Manage hospital blood inventory
- Manage blood-bank inventory
- Locate nearby healthcare facilities
- Track emergency resources using maps
- Receive notifications
- Manage role-specific dashboards
- Monitor analytics and operational metrics
- Maintain secure role-based access

BloodLink is built using a modern **React + TypeScript frontend**, a
**FastAPI backend**, and a **PostgreSQL database**, with Google Maps
integration for geolocation and navigation.

---

# 🏢 Powered by Code Morphix

## Code Morphix

**Transforming Ideas Into Innovation**

BloodLink is powered by **Code Morphix**, with the platform designed around
production-oriented full-stack engineering principles.

The Code Morphix identity is integrated throughout the BloodLink application,
including:

- Application header
- Dashboard layouts
- Authentication pages
- Landing page
- Sidebar branding
- Footer
- Application-wide branding components

---

# 🚀 Key Features

## 🔐 Authentication & Security

BloodLink implements secure authentication and authorization mechanisms.

### Authentication

- Email/password registration
- Email/password login
- JWT access tokens
- JWT refresh tokens
- HTTP-only authentication cookies
- Password hashing using bcrypt
- Email verification
- Password reset
- Password change
- Logout
- Session management

### Security

- Role-Based Access Control (RBAC)
- FastAPI dependency-level authorization
- Pydantic input validation
- Authentication rate limiting
- CORS configuration
- Audit logging
- Secure password hashing
- Token expiration
- Environment-based configuration
- Sensitive credentials excluded from Git

---

# 👥 User Roles

BloodLink supports multiple healthcare ecosystem roles.

## 👤 Patient

Patients can:

- Search for compatible blood
- Search nearby donors
- Create blood requests
- Create emergency requests
- Track requests
- View notifications
- View nearby healthcare resources
- Manage their profile

---

## 🩸 Donor

Donors can:

- Create donor profiles
- Manage availability
- Receive blood requests
- Accept or decline requests
- View donation history
- Track rewards
- Check donor health readiness
- Find nearby donation centers
- View nearby emergency requirements
- Manage their profile

---

## 🏥 Hospital

Hospitals can:

- Manage hospital profiles
- Manage blood inventory
- View blood requests
- Approve/reject requests
- Manage emergency transfusion workflows
- Manage appointments
- Monitor analytics
- View nearby blood resources
- Track emergency requirements

---

## 🏦 Blood Bank

Blood banks can:

- Manage blood-bank profiles
- Manage blood inventory
- Track blood groups
- Monitor stock levels
- Track expiring units
- Process requests
- Manage collection records
- Manage dispatch records
- Generate reports
- Monitor nearby emergency resources

---

## 🛡️ Administrator

Administrators can:

- Manage platform users
- Manage donors
- Manage hospitals
- Manage blood banks
- Monitor blood requests
- Monitor emergency requests
- View analytics
- View audit logs
- Monitor platform activity
- Access platform geolocation intelligence
- Manage system-level operations

---

# 🩸 Blood Management System

BloodLink supports all eight major ABO/Rh blood groups:

```text
O-
O+
A-
A+
B-
B+
AB-
AB+

The platform contains an interactive blood compatibility system that
visualizes compatible donor and recipient blood groups.

Universal Red Cell Donor
O-
Universal Red Cell Receiver
AB+

The compatibility system is integrated into:

Landing page
Blood search
Emergency requisition workflows
Blood request workflows
🚨 Emergency Blood Response

BloodLink provides dedicated emergency blood request workflows.

Emergency requests can include:

Required blood group
Required units
Urgency level
Hospital/facility information
Patient-related request information
Location information
Request status
Donor matching

The emergency workflow is connected with:

Donor matching
Notifications
Maps
Hospital workflows
Blood-bank resources
🗺️ Google Maps & Geolocation

BloodLink includes a production-oriented Google Maps integration.

Map Features
Hospital locations
Blood-bank locations
Emergency locations
Donor location clusters
Current-user geolocation
Distance calculation
Nearby facilities
Blood-group filtering
City-based filtering
Facility category filtering
Interactive markers
Information windows
Navigation
Google Maps directions
📍 Resource Map

The map system provides categories such as:

All
Hospitals
Blood Banks
Emergencies

Users can explore healthcare resources geographically.

The system obtains location information from the BloodLink backend and
PostgreSQL database.

🧭 Directions

Users can select a facility or emergency resource and open navigation
through Google Maps.

🧠 Donor Health Readiness

BloodLink includes an interactive donor health-readiness assessment.

The assessment considers parameters such as:

Hemoglobin
Blood pressure
Body weight
Donation cooldown period
Recent infection history
Tattoo/piercing considerations

The frontend provides:

Readiness score
Circular score visualization
Clinical readiness visualization
Interactive inputs
Immediate feedback

This feature is intended as a platform-level eligibility/readiness aid and
should not be treated as a substitute for professional medical assessment.

🔎 Global Search

BloodLink includes a unified global search system.

Search Access

Users can access global search using:

Ctrl + K

or:

Cmd + K

depending on the operating system.

Search Categories

The global search can work across platform entities such as:

Donors
Hospitals
Blood Banks
Blood Requests
Emergency Requests
Facilities
Blood inventory information

Search behavior is role-aware.

📊 Dashboards

BloodLink provides dedicated dashboards for every major role.

Patient Dashboard

Includes:

Blood request activity
Nearby donors
Emergency requests
Request history
Notifications
Search
Location resources
Donor Dashboard

Includes:

Donor availability
Donation requests
Donation history
Rewards
Health readiness
Nearby donation centers
Notifications
Hospital Dashboard

Includes:

Blood inventory
Blood requests
Emergency requests
Appointments
Analytics
Nearby resources
Notifications
Blood Bank Dashboard

Includes:

Blood inventory
Stock levels
Expiry tracking
Requests
Collection records
Dispatch records
Reports
Resource maps
Admin Dashboard

Includes:

Platform statistics
User management
Donor management
Hospital management
Blood-bank management
Request management
Analytics
Audit logs
Platform geolocation intelligence
🔔 Notification System

BloodLink includes a centralized notification system.

Users can:

View notifications
Mark individual notifications as read
Mark all notifications as read
Receive workflow-related updates

Notifications are integrated with important platform operations.

📈 Analytics & Reporting

Role-specific analytics are available for platform operations.

Analytics include areas such as:

Blood request counts
Emergency request counts
Blood group distribution
Inventory levels
Donation activity
User statistics
Facility statistics
Platform activity
Expiring blood units

Blood banks also support report/export workflows.

🗄️ Database

BloodLink uses:

PostgreSQL

with:

SQLAlchemy

for backend database interaction.

The backend is mapped to the existing Prisma PostgreSQL schema.

The project supports:

Users
Patients
Donors
Hospitals
Blood Banks
Blood Inventory
Blood Requests
Emergency Requests
Donations
Notifications
Audit Logs
🔄 Database Migration

Database migrations are managed using:

Alembic

The project includes a migration for facility geolocation:

latitude
longitude

for:

Hospitals
Blood Banks
🏗️ System Architecture
                         ┌─────────────────────────┐
                         │       BloodLink UI      │
                         │                         │
                         │ React + TypeScript      │
                         │ Vite + Tailwind CSS     │
                         │ Zustand + Recharts      │
                         └────────────┬────────────┘
                                      │
                                      │ REST API
                                      │ JWT
                                      ▼
                         ┌─────────────────────────┐
                         │       FastAPI API       │
                         │                         │
                         │ Authentication          │
                         │ RBAC                    │
                         │ Business Logic          │
                         │ Validation              │
                         │ Notifications           │
                         │ Maps                    │
                         │ Search                  │
                         └────────────┬────────────┘
                                      │
                                      │ SQLAlchemy
                                      ▼
                         ┌─────────────────────────┐
                         │       PostgreSQL        │
                         │                         │
                         │ Users                   │
                         │ Donors                  │
                         │ Patients                │
                         │ Hospitals               │
                         │ Blood Banks             │
                         │ Requests                │
                         │ Inventory               │
                         │ Donations               │
                         │ Notifications           │
                         │ Audit Logs              │
                         └─────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
             Google Maps         Gmail SMTP       Geolocation
             & Directions        Email Service       Services
🛠️ Technology Stack
Frontend
Technology	Purpose
React	UI framework
TypeScript	Type-safe frontend development
Vite	Development/build tooling
Tailwind CSS	UI styling
Zustand	State management
React Router	Application routing
Recharts	Analytics visualization
Backend
Technology	Purpose
Python	Backend language
FastAPI	REST API framework
SQLAlchemy	ORM
Pydantic	Validation
JWT	Authentication
bcrypt	Password hashing
Uvicorn	ASGI server
SlowAPI	Rate limiting
Database & DevOps
Technology	Purpose
PostgreSQL	Relational database
Alembic	Database migrations
Git	Version control
GitHub	Source control & collaboration
External Services
Service	Purpose
Google Maps	Maps and navigation
Google Geocoding	Location services
Gmail SMTP	Email verification/reset
Browser Geolocation	User location
📁 Project Structure
BLOODLINK_Code_Morphix/
│
├── backend/
│   │
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   └── security.py
│   │   │
│   │   ├── models/
│   │   │
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── patients.py
│   │   │   ├── donors.py
│   │   │   ├── hospitals.py
│   │   │   ├── bloodbanks.py
│   │   │   ├── admin.py
│   │   │   ├── notifications.py
│   │   │   ├── emergency_requests.py
│   │   │   ├── maps.py
│   │   │   ├── stats.py
│   │   │   └── search.py
│   │   │
│   │   ├── services/
│   │   │   └── email_service.py
│   │   │
│   │   └── main.py
│   │
│   ├── tests/
│   │
│   ├── alembic/
│   │
│   ├── requirements.txt
│   ├── .env.example
│   └── seed.py
│
├── public/
│   └── logos/
│       └── code-morphix.svg
│
├── src/
│   ├── app/
│   │
│   ├── components/
│   │   └── shared/
│   │
│   ├── layouts/
│   │
│   ├── pages/
│   │   ├── auth/
│   │   ├── patient/
│   │   ├── donor/
│   │   ├── hospital/
│   │   ├── bloodbank/
│   │   └── admin/
│   │
│   ├── services/
│   │
│   └── stores/
│
├── package.json
├── vite.config.ts
├── .gitignore
└── README.md
⚙️ Installation
Prerequisites

Install the following:

Node.js
npm
Python 3.10+
PostgreSQL
Git
🔧 Backend Setup

Navigate to the backend:

cd D:\Blood_donor_fsd\backend

Create a virtual environment:

python -m venv .venv

Activate it:

.\.venv\Scripts\Activate.ps1

Install dependencies:

pip install -r requirements.txt
🔐 Backend Environment Configuration

Create:

backend/.env

Use the example configuration:

backend/.env.example

Configure the required database, JWT, email, CORS, and Google Maps
configuration values.

Example
DATABASE_URL=postgresql://postgres:password@localhost:5432/bloodlink

JWT_SECRET=replace-with-a-secure-secret
JWT_REFRESH_SECRET=replace-with-a-secure-refresh-secret

JWT_ALGORITHM=HS256

ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

CORS_ORIGINS=["http://localhost:5173"]

BCRYPT_ROUNDS=12

ENVIRONMENT=development
DEBUG=false

FRONTEND_URL=http://localhost:5173

GOOGLE_MAPS_API_KEY=your-google-maps-api-key

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME=BloodLink Healthcare Network

REQUIRE_EMAIL_VERIFICATION=true

Never commit .env files or credentials to GitHub.

🗃️ Database Setup

Create a PostgreSQL database named:

bloodlink

Then configure:

DATABASE_URL=postgresql://postgres:password@localhost:5432/bloodlink

Run migrations if required:

alembic upgrade head
▶️ Run Backend

From:

backend/

run:

python -m uvicorn app.main:app --reload --port 8000

Backend:

http://localhost:8000

Health check:

http://localhost:8000/health

Swagger API documentation:

http://localhost:8000/docs

ReDoc:

http://localhost:8000/redoc
🎨 Frontend Setup

Open another terminal.

Navigate to:

cd D:\Blood_donor_fsd

Install dependencies:

npm install

Create/configure:

.env

Example:

VITE_API_BASE_URL=http://localhost:8000/api
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
▶️ Run Frontend
npm run dev

Frontend:

http://localhost:5173
🧪 Testing

BloodLink includes an automated backend test suite.

Run:

cd backend
.\.venv\Scripts\Activate.ps1
python -m pytest -q

Current verified result:

92 passed
🏗️ Production Build

Build the frontend:

npm run build

The production build has been successfully verified.

Example successful build:

✓ built successfully
🔍 Validation

The project has been validated across multiple areas.

Backend
FastAPI startup
PostgreSQL connectivity
SQLAlchemy mappings
Authentication
RBAC
Blood compatibility
Blood requests
Emergency workflows
Donor workflows
Blood-bank workflows
Hospital workflows
Maps
Search
Notifications
Security
Audit logging
Frontend
React compilation
TypeScript compilation
Routing
Authentication UI
Role dashboards
Maps
Search
Analytics
Responsive layouts
Code Morphix branding
Production build
📊 Current Test Status
Backend Tests
92 / 92 PASSED

Frontend Production Build
PASSED

SQLAlchemy Mapper Validation
PASSED

Python Compilation
PASSED
🔒 Security Guidelines

Before deploying to production:

Replace all development JWT secrets.
Use strong randomly generated secrets.
Configure production CORS origins.
Never commit .env.
Use HTTPS.
Use secure cookie configuration.
Configure production SMTP credentials.
Restrict Google Maps API keys by domain/API.
Rotate compromised credentials immediately.
Use a managed PostgreSQL deployment or hardened production database.
🌍 Deployment

BloodLink can be deployed using a production architecture such as:

                         Internet
                             │
                             ▼
                      ┌─────────────┐
                      │   HTTPS     │
                      │ Reverse     │
                      │ Proxy       │
                      └──────┬──────┘
                             │
               ┌─────────────┴─────────────┐
               │                           │
               ▼                           ▼
        React/Vite Frontend          FastAPI Backend
               │                           │
               │                           ▼
               │                      PostgreSQL
               │
               └──── Google Maps / SMTP

Potential deployment platforms can be selected based on production
requirements.

🧭 API Overview
Authentication
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
GET  /api/auth/verify-email
POST /api/auth/verify-email
POST /api/auth/resend-verification
POST /api/auth/forgot-password
POST /api/auth/reset-password
POST /api/auth/change-password
Patients
GET  /api/patients/profile
PUT  /api/patients/profile
POST /api/patients/blood-requests
GET  /api/patients/blood-requests
GET  /api/patients/nearby-donors
Donors
GET  /api/donors/profile
PUT  /api/donors/profile
PUT  /api/donors/availability
GET  /api/donors/requests
POST /api/donors/requests/{id}/accept
POST /api/donors/requests/{id}/decline
GET  /api/donors/donations
GET  /api/donors/rewards
Hospitals
GET  /api/hospitals/profile
PUT  /api/hospitals/profile
GET  /api/hospitals/inventory
POST /api/hospitals/inventory
GET  /api/hospitals/requests
POST /api/hospitals/requests/{id}/approve
POST /api/hospitals/requests/{id}/reject
GET  /api/hospitals/analytics
Blood Banks
GET  /api/bloodbanks/profile
PUT  /api/bloodbanks/profile
GET  /api/bloodbanks/inventory
POST /api/bloodbanks/inventory
PUT  /api/bloodbanks/inventory/{id}
DELETE /api/bloodbanks/inventory/{id}
GET  /api/bloodbanks/reports
Emergency Requests
POST /api/emergency-requests
GET  /api/emergency-requests
POST /api/emergency-requests/{id}/match
POST /api/emergency-requests/{id}/cancel
PUT  /api/emergency-requests/{id}/status
Maps
GET /api/maps/locations
GET /api/maps/hospitals
GET /api/maps/blood-banks
GET /api/maps/emergencies
GET /api/maps/nearby
GET /api/maps/reverse-geocode
GET /api/maps/directions
Notifications
GET  /api/notifications
POST /api/notifications/{id}/read
POST /api/notifications/read-all
Search
GET /api/search/global
Public Statistics
GET /api/stats/public
🧩 Important Design Principles

BloodLink follows several engineering principles:

Modular Architecture

Frontend components and backend routers are separated by responsibility.

Reusable Components

Shared components are used for:

Headers
Footers
Branding
Maps
Blood compatibility
Search
UI elements
Role-Based Security

Permissions are enforced at the backend level rather than relying only on
frontend navigation.

Database-Driven Data

Operational data is retrieved from PostgreSQL rather than relying on
hardcoded application statistics.

Responsive Design

The interface is designed for:

Desktop
Tablet
Mobile
🚫 Google OAuth

Google OAuth authentication is intentionally not part of the current
authentication system.

BloodLink currently uses:

Email + Password

for authentication.

Google services are used for:

Google Maps
Google Geocoding
Google Directions

This keeps authentication independent from the mapping infrastructure.

🧹 Repository Hygiene

The repository intentionally excludes generated and sensitive files.

Ignored files include:

.env
.env.*
.venv/
node_modules/
dist/
__pycache__/
*.pyc
.vite/

Never commit:

Database passwords
JWT secrets
Gmail App Passwords
Google Maps API keys
Production credentials
Private certificates
📱 Responsive Experience

BloodLink is designed to provide a consistent experience across:

Desktop
Tablet
Mobile

The application includes responsive:

Navigation
Dashboards
Maps
Search
Forms
Tables
Cards
Analytics
Branding
🎨 Brand Identity
BloodLink

Healthcare Blood Donation & Emergency Response Platform

BloodLink focuses on connecting the healthcare ecosystem around blood
availability and emergency response.

Code Morphix

Transforming Ideas Into Innovation

Code Morphix powers the technology and development identity behind the
BloodLink platform.

📸 Screenshots

Add screenshots of the application here.

Recommended screenshots:

Landing page
Login
Patient dashboard
Donor dashboard
Hospital dashboard
Blood Bank dashboard
Admin dashboard
Blood search
Emergency request
Google Maps resource map
Donor health readiness
Blood inventory
Analytics
Notifications

Example:

![BloodLink Landing Page](docs/screenshots/landing.png)
🏆 Project Highlights
Full-Stack
React + TypeScript
        +
FastAPI + Python
        +
PostgreSQL
Healthcare Workflows
Patient
   ↓
Blood Request
   ↓
Donor Matching
   ↓
Hospital / Blood Bank
   ↓
Emergency Response
Location Intelligence
User Location
      ↓
Nearby Facilities
      ↓
Hospitals / Blood Banks / Emergencies
      ↓
Google Maps Navigation
📈 Future Enhancements

Potential future improvements include:

Real-time WebSocket notifications
Advanced donor recommendation models
Hospital-to-hospital blood transfer workflows
Advanced demand forecasting
Blood shortage prediction
Automated expiry alerts
Mobile application
Advanced reporting
Production observability
Distributed caching
Background task processing
Advanced analytics
Multi-region deployment
🤝 Contribution

Contributions are welcome.

Development workflow
git clone <repository-url>

cd BLOODLINK_Code_Morphix

git checkout -b feature/your-feature

# Make changes

git add .

git commit -m "feat: add your feature"

git push origin feature/your-feature

Then create a Pull Request.

🐛 Bug Reporting

When reporting an issue, include:

Description
Steps to reproduce
Expected behavior
Actual behavior
Browser/device
Console errors
Backend logs
Screenshots when applicable
📄 License

This project is currently maintained as a Code Morphix development project.

Add the appropriate license before public production distribution.

👨‍💻 Project
BloodLink

Healthcare Blood Donation & Emergency Response Platform

Powered by Code Morphix

Transforming Ideas Into Innovation

<p align="center"> 🩸 <strong>BloodLink</strong> </p> <p align="center"> Connecting Blood Donors, Patients, Hospitals & Blood Banks </p> <p align="center"> <strong>Powered by Code Morphix</strong> </p> ```
