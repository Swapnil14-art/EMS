# EMS Backend — SVKM's NMIMS Shirpur
### Event Management System v6.0 — FastAPI + PostgreSQL + Celery + Docker

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend Framework | FastAPI 0.115 |
| ORM | SQLAlchemy 2.x (async with asyncpg) |
| Migrations | Alembic |
| Database | PostgreSQL 16 |
| Auth | Native Email + Password JWT Authentication (Access + Refresh Tokens) |
| Cache / Queue Broker | Redis 7 |
| Async Tasks | Celery 5 + Celery Beat |
| SMTP | College SMTP (smtp.nmims.in) |
| ASGI Server | Uvicorn |
| Reverse Proxy | Nginx 1.25 |
| Containers | Docker + Docker Compose |
| Report Generation | python-docx (Standard & RnD Post-Event Reports) |

---

## Quick Start

This guide contains every terminal command necessary to initialize, set up, and manage your EMS Backend system using Docker.

### 1. Environment Setup

Copy `.env.example` to `.env` and configure your environment variables:

```bash
# Clone the repository
git clone <repo-url>
cd ems-backend

# Create .env from example
cp .env.example .env
```

### 2. Starting Infrastructure with Docker

Launch all services defined in `docker-compose.yml` (PostgreSQL, Redis, FastAPI backend, Celery workers, Celery Beat, and Nginx):

```bash
# Start all containers in detached mode (building images if necessary)
docker compose up -d --build

# Check container status
docker compose ps

# Monitor real-time logs across all services
docker compose logs -f

# Monitor backend service logs specifically
docker compose logs -f backend
```

### 3. Database Initialization & Seeding

```bash
# Apply database migrations to create tables
docker compose exec backend alembic upgrade head

# Seed super admin user (admin@nmims.in / Admin@123)
docker compose exec backend python seed_super_admin.py

# (Optional) Seed realistic test data across departments, venues, clubs, and roles
docker compose exec backend python seed_all_test_data.py
```

### 4. Interactive API Documentation

Once the backend is running, open your browser to view interactive OpenAPI Swagger documentation:
- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

### 5. Maintenance & Teardown Commands

```bash
# Stop all running containers without destroying volume data
docker compose stop

# Stop and remove containers and networks
docker compose down

# Stop and purge all data volumes (WARNING: Deletes database contents permanently)
docker compose down -v
```

---

## Project Structure

```
ems-backend/
├── app/
│   ├── main.py                  # FastAPI app factory + middleware + router registration
│   ├── config.py                # App configuration via pydantic-settings
│   ├── database.py              # Async SQLAlchemy engine + sessionmaker
│   ├── dependencies.py          # get_current_user, require_roles, require_permission
│   │
│   ├── auth/
│   │   ├── router.py            # /auth/login, /signup, /refresh, /logout, /me, /change-password
│   │   ├── jwt_handler.py       # JWT access + refresh token issuance & verification
│   │   └── schemas.py           # TokenResponse, UserInfo, RefreshRequest
│   │
│   ├── models/                  # SQLAlchemy ORM Models
│   │   ├── department.py        # Department model
│   │   ├── user.py              # User + PreApprovedUser models
│   │   ├── club.py              # Club model
│   │   ├── venue.py             # Venue model
│   │   ├── event.py             # Event + collaborating clubs, sponsors, links, docs
│   │   ├── event_approval.py    # Approval workflow history model
│   │   ├── event_registration.py# Student event registration model
│   │   ├── event_report.py      # Post-event report model
│   │   ├── rnd_report.py        # RnD post-event report model
│   │   └── email_notification.py# Email notification logs
│   │
│   ├── schemas/                 # Pydantic Schemas
│   │   ├── user.py              # User schemas
│   │   ├── department.py        # Department schemas
│   │   ├── club.py              # Club schemas
│   │   ├── venue.py             # Venue schemas
│   │   ├── event.py             # Event schemas
│   │   ├── approval.py          # Approval schemas
│   │   ├── registration.py      # Registration schemas
│   │   ├── report.py            # Post-event report schemas
│   │   ├── rnd_report.py        # RnD report schemas
│   │   └── permission.py        # Dynamic permission schemas
│   │
│   ├── routers/                 # API Route Endpoints
│   │   ├── users.py             # User management
│   │   ├── departments.py       # Department management
│   │   ├── clubs.py             # Club management
│   │   ├── venues.py            # Venue management & clash checks
│   │   ├── events.py            # Full event lifecycle management
│   │   ├── approvals.py         # Multi-level approval chain
│   │   ├── registrations.py     # Student event signups & bulk email updates
│   │   ├── reports.py           # Standard post-event reports & docx compilation
│   │   ├── rnd_reports.py       # RnD reports & docx compilation
│   │   ├── permissions.py       # Dynamic permissions for additional role
│   │   ├── dashboard.py         # Coordinator & admin dashboard metrics
│   │   └── admin.py             # Authenticated file serving
│   │
│   ├── services/
│   │   ├── approval_service.py  # Core approval state machine logic
│   │   ├── venue_clash_service.py# Venue scheduling clash detection
│   │   ├── email_service.py     # Email notification formatting & triggers
│   │   ├── storage_service.py   # File upload/delete storage manager
│   │   ├── report_service.py    # Standard report docx compilation
│   │   └── rnd_report_service.py# RnD report docx compilation
│   │
│   ├── tasks/                   # Async Celery Worker Tasks
│   │   ├── celery_app.py        # Celery broker & Celery Beat schedule setup
│   │   ├── status_transitions.py# Automated status transitions (every 2 minutes)
│   │   ├── email_tasks.py       # Background email delivery with retries
│   │   └── report_tasks.py      # Background docx report rendering
│   │
│   └── utils/
│       ├── permissions.py       # Core permission utility functions
│       ├── additional_perms.py  # Dynamic permission catalog & check logic
│       ├── diff.py              # Event snapshot comparison
│       └── passwords.py         # Password hashing & verification
│
├── alembic/                     # Database migration scripts
├── storage/                     # Uploaded files and generated reports (volume-mounted)
├── .env.example
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
├── seed_super_admin.py          # Super Admin seeder script
└── seed_all_test_data.py        # Comprehensive test dataset seeder script
```

---

## API Overview

| Module | Base Path | Key Endpoints |
|---|---|---|
| Auth | `/auth` | login, signup, refresh, me, change-password, reset-password, complete-profile |
| Users | `/users` | list, search, get, pre-approve, activate, deactivate, bulk-deactivate |
| Departments | `/departments` | list, get, create, update |
| Clubs | `/clubs` | list, get, create, update, deactivate |
| Venues | `/venues` | list, get, create, update, calendar, clash-check |
| Events | `/events` | create, list, edit, submit, cancel, upload-poster, docs, links, coordinators |
| Approvals | `/approvals` | pending queue, action (approve/reject/suggest), history |
| Registrations | `/registrations` | register, cancel, list attendees, send bulk email update |
| Reports | `/reports` | submit report, upload photos, attendance, download docx |
| RnD Reports | `/rnd-reports` | submit RnD report, upload photos, attendance, download RnD docx |
| Permissions | `/permissions` | catalog, list additional users, update/grant/revoke permissions |
| Dashboard | `/dashboard` | coordinator metrics, admin system-wide metrics |
| Files | `/admin/files` | role-gated file serving |

---

## User Roles & Permission Matrix

| Role | Scope | Capabilities |
|---|---|---|
| `super_admin` | Global | Full system control, user management, global approvals & overrides |
| `director` | Global | Final event approver, system-wide analytics viewing |
| `associate_dean` | Department | First-level department event approver, venue management |
| `club_coordinator` | Club/Dept | Create, edit draft events, submit for approval, submit post-event reports |
| `student` | Department | View approved events targeted to their department/college, register |
| `additional` | Dynamic | Dynamic access control via `extra_permissions` (e.g. view events, submit/view reports, manage permissions) |

---

## Event Lifecycle & Status Flow

```
draft
  └─► pending_coordinator_parallel  (collaborative events requiring parallel coordinator approval)
        └─► pending_associate_dean
  └─► pending_associate_dean         (single-club events)
        └─► pending_director
              └─► approved
                    └─► ongoing       (Celery Beat automated check: start_datetime reached)
                          └─► completed (Celery Beat automated check: end_datetime reached)
                                └─► archived  (on post-event report submission)

Any stage in review → rejected / suggested_changes / cancelled
```

---

## Environment Variables Configuration

Copy `.env.example` to `.env` and configure key parameters:

```env
# Application Settings
ENVIRONMENT=development
DEBUG=true
SECRET_KEY=your_random_secret_key_here

# Database Configuration
POSTGRES_USER=ems_user
POSTGRES_PASSWORD=ems_password
POSTGRES_DB=ems_db
DATABASE_URL=postgresql+asyncpg://ems_user:ems_password@db:5432/ems_db

# Redis & Celery
REDIS_URL=redis://redis:6379/0

# JWT Auth Secrets
JWT_SECRET=your_jwt_secret_32_chars_min
JWT_REFRESH_SECRET=your_jwt_refresh_secret_32_chars_min
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# College SMTP Configuration
SMTP_HOST=smtp.nmims.in
SMTP_PORT=587
SMTP_USER=your_email@nmims.in
SMTP_PASSWORD=your_smtp_password
```

---

## Next.js Frontend Integration

In the Next.js `Frontend/` application (`.env.local`), specify:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Authentication Flow
1. User logs in with email and password via `POST /auth/login`.
2. Backend validates credentials and returns `access_token` and `refresh_token`.
3. Client attaches `Authorization: Bearer <access_token>` header on all subsequent API calls.
4. Client hydrates current user profile and `extra_permissions` via `GET /auth/me`.

---

*EMS Backend v6.0 — SVKM's NMIMS Shirpur Campus*