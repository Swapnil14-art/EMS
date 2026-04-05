# EMS Backend — SVKM's NMIMS Shirpur
### Event Management System v6.0 — FastAPI + PostgreSQL + Celery + Docker

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend Framework | FastAPI 0.115 |
| ORM | SQLAlchemy 2.x (async) |
| Migrations | Alembic |
| Database | PostgreSQL 16 |
| Auth | Microsoft SSO (Azure AD / Entra ID) + backend JWT |
| Cache / Queue Broker | Redis 7 |
| Async Tasks | Celery 5 + Celery Beat |
| SMTP | College SMTP (smtp.nmims.in) |
| ASGI Server | Uvicorn |
| Reverse Proxy | Nginx 1.25 |
| Containers | Docker + Docker Compose |
| Report Generation | python-docx |

---

## Quick Start

```bash
# EMS Backend Setup Commands

This guide contains every terminal command necessary to initialize, set up, and manage your EMS Backend system using Docker. 

## 1. Starting the Infrastructure
Launch all services defined in `docker-compose.yml` (PostgreSQL, Redis, FastAPI backend, Celery workers, and Nginx).

```bash
# Start all containers in detached mode
docker compose up -d

# Check the status of all containers
docker compose ps

# View real-time logs for all services
docker compose logs -f

# View real-time logs for a specific service (e.g., backend)
docker compose logs -f backend
```

## 2. Database Initialization
Normally, when the backend container starts, it might apply migrations automatically. If you need to apply migrations manually or check their status:

```bash
# Check current database migration state
docker exec -it ems_backend alembic current

# Apply all available database migrations (create tables)
docker exec -it ems_backend alembic upgrade head

# Generate a new migration script after changing SQLAlchemy models
docker exec -it ems_backend alembic revision --autogenerate -m "describe_changes_here"

# Access the PostgreSQL database directly
docker exec -it ems_db psql -U ems_user -d ems_db
```
> [!TIP]
> Inside the `psql` interactive prompt, you can type `\dt` to list all tables, and `\q` to quit and return to your terminal.

## 3. Seeding Initial Data
To populate the database with required initial records like the Super Admin.

```bash
# Run the super admin seeding script
docker exec -it ems_backend python seed_super_admin.py
```

## 4. API Testing
You can test if the server is up and verify endpoints.

```bash
# Check documentation accessibility on Windows PowerShell
Invoke-WebRequest -Uri http://localhost:8000/docs -UseBasicParsing

# On Linux/macOS
curl -I http://localhost:8000/docs
```

## 5. Teardown & Maintenance
When you need to stop the system or clean up data.

```bash
# Stop all containers
docker compose stop

# Stop and remove all containers, networks, and default volumes
docker compose down

# Stop and remove everything AND destroy the database data volume
# WARNING: This will permanently delete all data in the database!
docker compose down -v
```

## 6. Accessing Container Shells
If you need to enter a container to debug or run internal commands.

```bash
# Open an interactive bash/sh shell inside the backend container
docker exec -it ems_backend /bin/sh
```

# 1. Clone and setup environment
git clone <repo>
cd ems-backend
cp .env.example .env
# Edit .env — fill in Azure AD credentials, SMTP, secrets

# 2. Build and start all services
docker compose up -d --build

# 3. Run database migrations
docker exec ems_backend alembic upgrade head

# 4. Create the first super_admin (run once)
docker exec ems_backend python seed_super_admin.py

# 5. Verify services
docker compose ps
docker logs ems_celery_worker
docker logs ems_celery_beat
```

---

## Project Structure

```
ems-backend/
├── app/
│   ├── main.py                  # FastAPI app factory + router registration
│   ├── config.py                # Settings via pydantic-settings
│   ├── database.py              # Async SQLAlchemy engine + session
│   ├── dependencies.py          # get_current_user, require_roles
│   │
│   ├── auth/
│   │   ├── router.py            # /auth/login /callback /refresh /logout /me
│   │   ├── microsoft.py         # Azure AD OIDC token validation
│   │   ├── jwt_handler.py       # create/decode access + refresh tokens
│   │   └── schemas.py           # TokenResponse, UserInfo
│   │
│   ├── models/                  # SQLAlchemy ORM (18 tables)
│   │   ├── department.py
│   │   ├── user.py              # User + PreApprovedUser
│   │   ├── club.py
│   │   ├── venue.py
│   │   ├── event.py             # Event + 7 sub-models
│   │   ├── event_approval.py
│   │   ├── event_registration.py
│   │   ├── event_report.py
│   │   └── email_notification.py
│   │
│   ├── schemas/                 # Pydantic request/response schemas
│   │
│   ├── routers/                 # API route handlers
│   │   ├── users.py
│   │   ├── departments.py
│   │   ├── clubs.py
│   │   ├── venues.py
│   │   ├── events.py            # Full event lifecycle
│   │   ├── approvals.py         # Approval workflow
│   │   ├── registrations.py     # Student registrations
│   │   ├── reports.py           # Post-event reports + docx
│   │   ├── dashboard.py         # Coordinator + admin stats
│   │   └── admin.py             # File serving
│   │
│   ├── services/
│   │   ├── approval_service.py  # Core approval workflow logic
│   │   ├── venue_clash_service.py
│   │   ├── email_service.py     # Email trigger functions
│   │   ├── storage_service.py   # File upload/delete
│   │   └── report_service.py    # python-docx report generation
│   │
│   ├── tasks/                   # Celery tasks
│   │   ├── celery_app.py        # Celery + Beat config
│   │   ├── status_transitions.py # approved→ongoing→completed (every 2 min)
│   │   ├── email_tasks.py       # Async email sending with retry
│   │   └── report_tasks.py      # Async docx generation
│   │
│   └── utils/
│       ├── permissions.py       # can_edit_event, can_cancel_event, etc.
│       └── diff.py              # Event snapshot + diff computation
│
├── alembic/                     # Database migrations
├── storage/                     # Uploaded files (volume-mounted)
├── .env.example
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
└── seed_super_admin.py
```

---

## API Overview

| Module | Base Path | Key Endpoints |
|---|---|---|
| Auth | `/auth` | login, callback, refresh, logout, me |
| Users | `/users` | CRUD, pre-approve, bulk-deactivate |
| Departments | `/departments` | list, create, update |
| Clubs | `/clubs` | list, create, update, deactivate |
| Venues | `/venues` | list, create, update, calendar, clash-check |
| Events | `/events` | full lifecycle — create, edit, submit, cancel |
| Approvals | `/approvals` | pending queue, approve/reject/suggest |
| Registrations | `/registrations` | register, cancel, list, bulk email |
| Reports | `/reports` | submit, photos, attendance, generate docx |
| Dashboard | `/dashboard` | coordinator stats, admin stats |
| Files | `/admin/files` | role-gated file serving |

### Interactive Docs
Available at `http://localhost:8000/docs` when `DEBUG=true`.

---

## User Roles

| Role | Scope | Capabilities |
|---|---|---|
| `super_admin` | Global | Full system control |
| `director` | Global | Final event approver |
| `associate_dean` | Department | Department-level approver |
| `club_coordinator` | Club/Dept | Create and manage events |
| `student` | Department | View + register for events |

---

## Event Status Flow

```
draft
  └─► pending_coordinator_parallel  (collaborative events)
        └─► pending_associate_dean
  └─► pending_associate_dean         (single-club events)
        └─► pending_director
              └─► approved
                    └─► ongoing       (Celery Beat: start_datetime reached)
                          └─► completed (Celery Beat: end_datetime reached)
                                └─► archived  (on report submission)

Any stage → rejected / suggested_changes / cancelled
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in:

- `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET` — from Azure portal
- `JWT_SECRET`, `JWT_REFRESH_SECRET` — random 32+ char strings
- `SMTP_PASSWORD` — college SMTP credentials
- `DATABASE_URL` / `DATABASE_URL_SYNC` — auto-filled for Docker

---

## Migration Commands

```bash
# Generate new migration
docker exec ems_backend alembic revision --autogenerate -m "description"

# Apply all migrations
docker exec ems_backend alembic upgrade head

# Rollback one step
docker exec ems_backend alembic downgrade -1
```

---

## Next.js Frontend Connection

Set in your Next.js `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_AZURE_REDIRECT_URI=http://localhost:8000/auth/callback
```

Auth flow: Login button → `GET /auth/login` → redirect to Microsoft → Microsoft redirects to `/auth/callback` → backend issues JWT → redirects to frontend `/auth/callback?access_token=...&refresh_token=...`

---

*EMS Backend v6.0 — SVKM's NMIMS Shirpur Campus*


Here is a breakdown of all the top-level scripts and files we've touched or created during our testing, grouped by their purpose.

Core Database Scripts (Keep these)
These scripts are useful to keep around should you ever tear down your Docker containers and need to start fresh:

seed_super_admin.py (Codebase Original)

What it does: Inserts the fundamental admin@nmims.in account into your system.
Recommendation: Keep. You'll need this anytime you wipe your database block and reinstall.
seed_test_users.py (Created for Realistic Testing)

What it does: Immediately registers the dummy accounts (Test Coordinator, Associate Dean, and Director) and bypasses email verification workflows so you can quickly get into testing.
Recommendation: Keep for dev/local environments, but strip it out when migrating to production.
Troubleshooting Scripts (Safe to Delete)

update_super_admin.py
What it does: A script I created to forcefully reset the password for admin@nmims.in and bypass the is_first_login requirement since we couldn't click an email verification link.
Recommendation: Delete. Now that you know the Super Admin password is Admin@123 and the login is successfully verified, this script serves no purpose.

API & Workflow Testing Scripts (Safe to Delete)
These were written strictly as one-off automation scripts so we didn't have to test inside Swagger or Postman manually. Now that the system is fully verified, these are clutter.

test_api.ps1
What it does: Blasts endpoints with mocked data to make sure your core controllers (Users, Events, Clubs, Departments) didn't crash.
Recommendation: Delete.

test_workflow.ps1
What it does: The initial script where we forced the backend to let super_admin submit events and approve them all by themselves.
Recommendation: Delete.

test_realistic_workflow.ps1
What it does: The advanced test where we used three different test accounts (Coordinator, Dean, Director) simulating a full flow.
Recommendation: Delete.
Garbage/Output Logs (Safe to Delete)

workflow_results.txt & realistic_workflow_results.txt
What they are: Just text files we piped the output of the PowerShell scripts into so I could read the results without flooding the system buffers.
Recommendation: Delete.