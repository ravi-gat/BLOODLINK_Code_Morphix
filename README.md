<p align="center">
  <img src="public/logos/code-morphix.svg" alt="Code Morphix" width="100"/>
</p>

<h1 align="center">🩸 BloodLink</h1>

<p align="center">
  <strong>Healthcare Blood Donation & Emergency Response Platform</strong>
</p>

<p align="center">
  Connecting Patients • Donors • Hospitals • Blood Banks
</p>

<p align="center">
  <strong>Powered by Code Morphix</strong>
</p>

<p align="center">
  A modern full-stack healthcare platform for blood discovery,
  emergency response, donor matching, inventory management,
  geolocation, notifications, analytics, and role-based workflows.
</p>

---

<h2 align="center">🏆 Project Status</h2>

<p align="center">

<img src="https://img.shields.io/badge/BACKEND-FASTAPI-009688?style=for-the-badge" />
<img src="https://img.shields.io/badge/FRONTEND-REACT%20%2B%20TYPESCRIPT-61DAFB?style=for-the-badge" />
<img src="https://img.shields.io/badge/DATABASE-POSTGRESQL-336791?style=for-the-badge" />

<br/>

<img src="https://img.shields.io/badge/TESTS-92%2F92%20PASSING-4CAF50?style=for-the-badge" />
<img src="https://img.shields.io/badge/PRODUCTION%20BUILD-PASSING-4CAF50?style=for-the-badge" />
<img src="https://img.shields.io/badge/GOOGLE%20MAPS-INTEGRATED-4285F4?style=for-the-badge" />

</p>

---

## 🚀 Overview

**BloodLink** is a full-stack healthcare technology platform designed to
connect **patients, blood donors, hospitals, and blood banks** through a
centralized digital ecosystem.

The platform provides:

- 🩸 Blood discovery
- 🚨 Emergency blood requisitions
- 🤝 Donor matching
- 🏥 Hospital operations
- 🏦 Blood-bank inventory management
- 🗺️ Healthcare facility geolocation
- 🔔 Notifications
- 📊 Analytics
- 🔐 Secure authentication
- 👥 Role-based access control

<p align="center">
  <strong>Built with React • TypeScript • FastAPI • PostgreSQL</strong>
</p>

<p align="center">
  <strong>Powered by Code Morphix</strong>
</p>

---

---

## 🏆 Project Status

<p align="center">

![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge)

![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-61DAFB?style=for-the-badge)

![Database](https://img.shields.io/badge/Database-PostgreSQL-336791?style=for-the-badge)

![Tests](https://img.shields.io/badge/Tests-92%2F92%20Passing-success?style=for-the-badge)

![Build](https://img.shields.io/badge/Production%20Build-Passing-success?style=for-the-badge)

![Maps](https://img.shields.io/badge/Google%20Maps-Integrated-4285F4?style=for-the-badge)

</p>

---

# 📌 Overview

**BloodLink** is a full-stack healthcare technology platform designed to
connect **blood donors, patients, hospitals, and blood banks** through a
centralized digital ecosystem.

The platform provides a complete workflow for:

- 🩸 Blood discovery
- 🚨 Emergency blood requisitions
- 🤝 Donor matching
- 🏥 Hospital operations
- 🏦 Blood-bank inventory
- 🗺️ Healthcare facility geolocation
- 🔔 Notifications
- 📊 Analytics
- 🔐 Secure authentication
- 👥 Role-based access control

BloodLink combines a **React + TypeScript frontend**, **FastAPI backend**,
and **PostgreSQL database**, with Google Maps integration for location-based
healthcare resources.

---

# 🎯 Problem Statement

Finding compatible blood during emergencies can involve multiple disconnected
systems and manual communication between patients, donors, hospitals, and
blood banks.

BloodLink addresses this problem by creating a centralized platform where:

```text
Patient
   │
   ▼
Blood Request
   │
   ▼
Compatibility Matching
   │
   ├──────────────► Donors
   │
   ├──────────────► Hospitals
   │
   └──────────────► Blood Banks
                       │
                       ▼
                Emergency Response

The goal is to reduce delays in identifying compatible blood resources and
improve coordination between the healthcare stakeholders involved.

✨ Core Features
🔐 Secure Authentication

BloodLink currently uses email/password authentication.

Features include:

Email/password registration
Email/password login
JWT access tokens
JWT refresh tokens
HTTP-only authentication cookies
bcrypt password hashing
Email verification
Password reset
Password change
Logout
Session management
Authentication rate limiting
👥 Role-Based Platform

BloodLink supports five primary roles:

Role	Main Responsibilities
👤 Patient	Search blood, create requests, track emergencies
🩸 Donor	Manage availability, respond to requests, track donations
🏥 Hospital	Manage inventory, requests, emergency workflows
🏦 Blood Bank	Manage blood stock, expiry, collection and dispatch
🛡️ Admin	Manage users, facilities, requests, analytics and audits

All sensitive permissions are enforced at the FastAPI backend level using
role-based access control.

🩸 Blood Compatibility Explorer

BloodLink includes an interactive blood compatibility system covering all
eight ABO/Rh blood groups:

O-
O+
A-
A+
B-
B+
AB-
AB+
Universal Red Cell Donor
O-
Universal Red Cell Receiver
AB+

The compatibility explorer dynamically displays compatible donor and
recipient blood groups.

It is integrated into:

Landing page
Blood search
Emergency requisition
Blood request workflows
🚨 Emergency Blood Response

BloodLink provides dedicated emergency blood requisition workflows.

Emergency requests can contain:

Blood group
Required units
Urgency level
Facility information
Location
Request status
Donor matching information

The emergency workflow connects:

Emergency Request
       │
       ├──► Compatible Donors
       │
       ├──► Hospitals
       │
       ├──► Blood Banks
       │
       ├──► Notifications
       │
       └──► Map Resources
🗺️ Google Maps & Location Intelligence

BloodLink integrates Google Maps for healthcare resource discovery.

Map capabilities
🏥 Hospital locations
🏦 Blood-bank locations
🚨 Emergency locations
🩸 Donor location clusters
📍 Current-user geolocation
📏 Distance calculation
🔎 Nearby facilities
🩸 Blood-group filtering
🏙️ City filtering
🗂️ Facility category filtering
📌 Interactive markers
🧭 Google Maps navigation
📍 Directions
Map Categories
All Facilities
     │
     ├── Hospitals
     │
     ├── Blood Banks
     │
     └── Emergencies

Location data is retrieved from the BloodLink backend and PostgreSQL database.

🧠 Donor Health Readiness

BloodLink includes an interactive donor health-readiness assessment.

The platform evaluates parameters such as:

Hemoglobin
Blood pressure
Body weight
Donation cooldown
Recent infection history
Tattoo/piercing considerations

The interface provides:

Readiness score
Circular score visualization
Clinical readiness visualization
Interactive inputs
Immediate feedback

This feature is intended as a platform-level readiness aid and is not a
replacement for professional medical assessment.

🔎 Global Search

BloodLink provides a unified global search system.

Keyboard Shortcut
Ctrl + K

or

Cmd + K

depending on the operating system.

Searchable Resources
Donors
Hospitals
Blood Banks
Blood Requests
Emergency Requests
Facilities
Blood inventory information

Search behavior is role-aware.

📊 Role-Based Dashboards
👤 Patient Dashboard

Features:

Blood request activity
Nearby donors
Emergency requests
Request history
Notifications
Blood search
Location resources
🩸 Donor Dashboard

Features:

Donor availability
Donation requests
Donation history
Rewards
Health readiness
Nearby donation centers
Notifications
🏥 Hospital Dashboard

Features:

Blood inventory
Blood requests
Emergency requests
Appointments
Analytics
Nearby resources
Notifications
🏦 Blood Bank Dashboard

Features:

Blood inventory
Stock levels
Expiry tracking
Blood requests
Collection records
Dispatch records
Reports
Resource maps
🛡️ Admin Dashboard

Features:

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

BloodLink provides role-specific analytics.

Analytics include:

Blood request counts
Emergency request counts
Blood group distribution
Inventory levels
Donation activity
User statistics
Facility statistics
Platform activity
Expiring blood units

Blood-bank users can also access report/export workflows.

🏗️ System Architecture
                         ┌─────────────────────────┐
                         │      BLOODLINK UI       │
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
                         │       FASTAPI           │
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
                         │       POSTGRESQL        │
                         │                         │
                         │ Users                   │
                         │ Patients                │
                         │ Donors                  │
                         │ Hospitals               │
                         │ Blood Banks             │
                         │ Requests                │
                         │ Inventory               │
                         │ Donations               │
                         │ Notifications           │
                         │ Audit Logs              │
                         └────────────┬────────────┘
                                      │
                ┌─────────────────────┼─────────────────────┐
                │                     │                     │
                ▼                     ▼                     ▼
          Google Maps             Gmail SMTP          Geolocation
          & Directions            Email Service         Services
🛠️ Technology Stack
Frontend
Technology	Purpose
React	User interface
TypeScript	Type safety
Vite	Development and production build
Tailwind CSS	Styling
Zustand	State management
React Router	Routing
Recharts	Data visualization
Backend
Technology	Purpose
Python	Backend development
FastAPI	REST API
SQLAlchemy	ORM
Pydantic	Data validation
JWT	Authentication
bcrypt	Password hashing
Uvicorn	ASGI server
SlowAPI	Rate limiting
Database & Infrastructure
Technology	Purpose
PostgreSQL	Relational database
Alembic	Database migrations
Git	Version control
GitHub	Source control
External Services
Service	Purpose
Google Maps	Maps and navigation
Google Geocoding	Location services
Gmail SMTP	Email verification/reset
Browser Geolocation	User location
🗄️ Database

BloodLink uses PostgreSQL with SQLAlchemy.

The backend is mapped to the existing Prisma PostgreSQL schema.

Main entities
User
Patient
Donor
Hospital
BloodBank
BloodInventory
BloodRequest
EmergencyRequest
Donation
Notification
AuditLog
🔄 Database Migrations

Database migrations are managed using Alembic.

The project includes a migration adding:

latitude
longitude

to:

Hospital
BloodBank

These coordinates are used by the map and nearby-resource features.

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
│   ├── alembic/
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
│   ├── components/
│   │   └── shared/
│   ├── layouts/
│   ├── pages/
│   │   ├── auth/
│   │   ├── patient/
│   │   ├── donor/
│   │   ├── hospital/
│   │   ├── bloodbank/
│   │   └── admin/
│   ├── services/
│   └── stores/
│
├── package.json
├── vite.config.ts
├── .gitignore
└── README.md
⚙️ Installation
Prerequisites

Install:

Node.js
npm
Python 3.10+
PostgreSQL
Git
🔧 Backend Setup

Navigate to the backend:

cd backend

Create a virtual environment:

python -m venv .venv

Activate it:

.\.venv\Scripts\Activate.ps1

Install dependencies:

pip install -r requirements.txt
🔐 Backend Environment Variables

Create:

backend/.env

Use backend/.env.example as the template.

Example:

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

Never commit .env files, passwords, API keys, JWT secrets, or SMTP
credentials to GitHub.

🗃️ PostgreSQL Setup

Create a PostgreSQL database:

bloodlink

Configure:

DATABASE_URL=postgresql://postgres:password@localhost:5432/bloodlink

Run migrations:

alembic upgrade head
▶️ Run Backend

From the backend directory:

python -m uvicorn app.main:app --reload --port 8000

Backend:

http://localhost:8000

Health check:

http://localhost:8000/health

Swagger:

http://localhost:8000/docs

ReDoc:

http://localhost:8000/redoc
🎨 Frontend Setup

Open another terminal:

cd D:\Blood_donor_fsd

Install dependencies:

npm install

Create:

.env

Configure:

VITE_API_BASE_URL=http://localhost:8000/api
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
▶️ Run Frontend
npm run dev

Frontend:

http://localhost:5173
🧪 Testing

BloodLink includes a comprehensive automated backend test suite.

Run:

cd backend
.\.venv\Scripts\Activate.ps1
python -m pytest -q
Verified Result
92 passed
Test Coverage Includes
Authentication
Registration
Login
Email verification
Password reset
RBAC
Blood compatibility
Blood requests
Emergency requests
Donor workflows
Blood-bank workflows
Hospital workflows
Maps
Search
Notifications
Security hardening
Authentication edge cases
🏗️ Production Build

Build the frontend:

npm run build

Verified result:

✓ built successfully

The production build completed successfully after the final platform changes.

📊 Verification Summary
Component	Status
FastAPI Backend	✅ Passing
PostgreSQL	✅ Connected
SQLAlchemy Mappers	✅ Valid
Authentication	✅ Passing
RBAC	✅ Passing
Email Verification	✅ Implemented
Blood Compatibility	✅ Passing
Emergency Workflow	✅ Passing
Maps	✅ Integrated
Search	✅ Passing
Notifications	✅ Passing
Security Tests	✅ Passing
Backend Tests	✅ 92/92
Frontend Build	✅ Passing
🔌 API Overview
Authentication
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
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
GET    /api/bloodbanks/profile
PUT    /api/bloodbanks/profile
GET    /api/bloodbanks/inventory
POST   /api/bloodbanks/inventory
PUT    /api/bloodbanks/inventory/{id}
DELETE /api/bloodbanks/inventory/{id}
GET    /api/bloodbanks/reports
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
🔒 Security

BloodLink implements multiple security controls.

Authentication
JWT access tokens
JWT refresh tokens
HTTP-only cookies
Password hashing with bcrypt
Token expiration
Authorization
Backend-enforced RBAC
Role-specific API permissions
Protected routes
Sensitive action auditing
API Security
Pydantic validation
Authentication rate limiting
CORS configuration
Secure environment configuration
Audit

Sensitive platform actions are recorded through audit logs.

🧹 Repository Security

The repository intentionally excludes sensitive/generated files.

.env
.env.*
.venv/
node_modules/
dist/
.vite/
__pycache__/
*.pyc

Never commit:

Database passwords
JWT secrets
Gmail App Passwords
Google Maps API keys
Production credentials
Private certificates
🚫 Google OAuth

Google OAuth authentication has intentionally been removed from BloodLink.

Authentication currently uses:

Email + Password

Google services are used for:

Google Maps
Google Geocoding
Google Directions

This keeps authentication independent from the location infrastructure.

📸 Screenshots

Add application screenshots to:

docs/screenshots/

Recommended showcase:

docs/
└── screenshots/
    ├── landing.png
    ├── login.png
    ├── patient-dashboard.png
    ├── donor-dashboard.png
    ├── hospital-dashboard.png
    ├── bloodbank-dashboard.png
    ├── admin-dashboard.png
    ├── blood-search.png
    ├── emergency-request.png
    ├── maps.png
    ├── health-readiness.png
    ├── inventory.png
    └── analytics.png

Example:

![BloodLink Dashboard](docs/screenshots/patient-dashboard.png)
🧭 User Workflow
Patient
Register
   ↓
Verify Email
   ↓
Login
   ↓
Search Blood
   ↓
View Compatible Donors
   ↓
Create Blood Request
   ↓
Track Request
Donor
Register
   ↓
Verify Email
   ↓
Complete Profile
   ↓
Check Health Readiness
   ↓
Enable Availability
   ↓
Receive Blood Request
   ↓
Accept / Decline
   ↓
Track Donation
Emergency
Emergency Request
       ↓
Blood Group Compatibility
       ↓
Nearby Donor / Facility Search
       ↓
Donor Matching
       ↓
Hospital / Blood Bank Coordination
       ↓
Emergency Response
🧩 Engineering Principles
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
Database-Driven Platform

Operational data and platform statistics are retrieved from PostgreSQL rather
than relying on static mock statistics.

Backend-Enforced Authorization

Security decisions are enforced at the API layer instead of relying only on
frontend navigation.

Responsive Design

The platform is designed for:

Desktop
Tablet
Mobile
🚀 Deployment Architecture

A production deployment can follow this architecture:

                         INTERNET
                             │
                             ▼
                    ┌────────────────┐
                    │ HTTPS / Proxy  │
                    └───────┬────────┘
                            │
               ┌────────────┴────────────┐
               │                         │
               ▼                         ▼
       React/Vite Frontend        FastAPI Backend
                                         │
                                         ▼
                                    PostgreSQL
                                         │
                    ┌────────────────────┼─────────────────┐
                    │                    │                 │
                    ▼                    ▼                 ▼
               Google Maps           Gmail SMTP      Geolocation

Before production deployment:

Replace development secrets
Configure production CORS
Enable HTTPS
Configure secure cookies
Configure production SMTP
Restrict Google Maps API keys
Use production PostgreSQL
Configure logging and monitoring
📈 Future Roadmap

Potential future improvements include:

Real-time WebSocket notifications
Advanced donor recommendation
Blood shortage prediction
Demand forecasting
Automated inventory alerts
Hospital-to-hospital blood transfer
Advanced analytics
Mobile application
Background task processing
Production observability
Distributed caching
Multi-region deployment
🤝 Contribution

Contributions are welcome.

Development workflow
git clone <repository-url>

cd BLOODLINK_Code_Morphix

git checkout -b feature/your-feature

# Make your changes

git add .

git commit -m "feat: add your feature"

git push origin feature/your-feature

Then create a Pull Request.

🐛 Bug Reporting

When reporting a bug, include:

Description
Steps to reproduce
Expected behavior
Actual behavior
Browser/device
Console errors
Backend logs
Screenshots when applicable
📄 License

This project is currently maintained as a Code Morphix development
project.

Add the appropriate license before public production distribution.

🏢 Code Morphix
<p align="center"> <img src="public/logos/code-morphix.svg" alt="Code Morphix" width="90"/> </p> <h3 align="center">Transforming Ideas Into Innovation</h3> <p align="center"> BloodLink is powered by <strong>Code Morphix</strong>. </p>
🩸 BloodLink
<p align="center"> <strong>Connecting Blood Donors, Patients, Hospitals & Blood Banks</strong> </p> <p align="center"> Built with ❤️ using React, TypeScript, FastAPI and PostgreSQL. </p> <p align="center"> <strong>Powered by Code Morphix</strong> </p> ```
