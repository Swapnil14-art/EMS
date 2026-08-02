# EMS — Event Management System
### SVKM's NMIMS Shirpur Campus | Enterprise Full-Stack Web Application

---

## System Overview

The **Event Management System (EMS)** is a multi-role web platform designed for SVKM's NMIMS Shirpur Campus to streamline event proposals, multi-tier approval workflows, venue scheduling, student registrations, post-event reporting, and administrative governance.

### Core Highlights
- **Multi-Role Governance:** Built for 6 distinct user roles: `student`, `club_coordinator`, `associate_dean`, `director`, `super_admin`, and `additional` (granular dynamic permission roles).
- **Automated Multi-Stage Approvals:** Collaborative events require parallel coordinator approvals, followed by Department Associate Dean review and Director final signoff.
- **Conflict Prevention:** Real-time venue clash checking prevents double-booking across venues and time slots.
- **Automated Lifecycle Transitions:** Celery Beat background scheduler handles real-time status transitions (`approved` → `ongoing` → `completed`).
- **Post-Event & RnD Reporting:** Automatic Microsoft Word (`.docx`) report generation and file archival upon report submission.

---

## Tech Stack & Architecture

```
                      ┌──────────────────────────────────────────┐
                      │          Next.js 14 Frontend             │
                      │   (React + TypeScript + Tailwind + Zustand) │
                      └────────────────────┬─────────────────────┘
                                           │ HTTP / REST APIs
                                           ▼
                      ┌──────────────────────────────────────────┐
                      │              Nginx Proxy                 │
                      └────────────────────┬─────────────────────┘
                                           │
                                           ▼
                      ┌──────────────────────────────────────────┐
                      │          FastAPI Async Backend           │
                      │     (Python 3.11 + SQLAlchemy + Pydantic)│
                      └────────┬───────────────────┬─────────────┘
                               │                   │
                               ▼                   ▼
                      ┌─────────────────┐ ┌─────────────────┐
                      │  PostgreSQL 16  │ │  Redis 7 Cache  │
                      └─────────────────┘ └────────┬────────┘
                                                   │
                                                   ▼
                                          ┌─────────────────┐
                                          │  Celery Workers │
                                          │   (Tasks & Beat)│
                                          └─────────────────┘
```

| Domain | Technology |
|---|---|
| **Frontend Framework** | Next.js 14 (App Router) |
| **Frontend Stack** | React 18, TypeScript, Tailwind CSS, Zustand (persisted auth state), Lucide Icons |
| **Backend Framework** | FastAPI 0.115 (Python 3.11) |
| **ORM & Database** | SQLAlchemy 2.x (asyncpg) + PostgreSQL 16 |
| **Migrations** | Alembic |
| **Authentication** | Native JWT (Access + Refresh tokens) with BCrypt password hashing |
| **Background Processing** | Redis 7 + Celery 5 + Celery Beat scheduler |
| **Document Generation** | python-docx |
| **Proxy & Storage** | Nginx 1.25 + Volume-mounted local storage |
| **Containerization** | Docker & Docker Compose |

---

## Project Folder Structure

```
.
├── Frontend/                    # Next.js 14 Web Application
│   ├── app/                     # App router pages per role ((auth), (dashboard), etc.)
│   ├── components/              # Reusable React components & layout components
│   ├── lib/                     # API services, Axios interceptors, utilities & transformers
│   ├── store/                   # Zustand store (authStore, etc.)
│   └── types/                   # TypeScript interface definitions
│
├── ems-backend/                 # FastAPI REST API Backend
│   ├── app/
│   │   ├── auth/                # JWT auth endpoints & token handler
│   │   ├── models/              # SQLAlchemy ORM models (19 tables)
│   │   ├── schemas/             # Pydantic validation schemas
│   │   ├── routers/             # API route controllers
│   │   ├── services/            # Core business & workflow engine
│   │   ├── tasks/               # Celery async tasks & status transitions
│   │   └── utils/               # Permission logic & password hashing
│   ├── alembic/                 # Database migration scripts
│   ├── storage/                 # Volume-mounted media, posters, & generated reports
│   ├── seed_super_admin.py      # Seeder for super admin account
│   ├── seed_all_test_data.py    # Comprehensive test data seeder
│   └── README.md                # Dedicated backend documentation
│
├── nginx/                       # Nginx reverse proxy configuration
├── docker-compose.yml           # Multi-container service orchestrator
└── README.md                    # Main project documentation
```

---

## Quick Start Guide

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
- [Node.js 18+](https://nodejs.org/) (for running Frontend locally if not using Docker).

---

### Running the Stack via Docker Compose (Recommended)

```bash
# 1. Clone the repository
git clone <repo-url>
cd "4 Faculty Meeting Version"

# 2. Configure Environment Files
cp ems-backend/.env.example ems-backend/.env
cp Frontend/.env.example Frontend/.env.local  # If applicable

# 3. Build and launch all containers
docker compose up -d --build

# 4. Run Database Migrations
docker compose exec backend alembic upgrade head

# 5. Seed Super Admin Account (admin@nmims.in / Admin@123)
docker compose exec backend python seed_super_admin.py

# 6. (Optional) Seed Test Data Across Departments & Roles
docker compose exec backend python seed_all_test_data.py
```

### Accessing Running Services
- **Frontend App:** `http://localhost:3000` (or `http://localhost`)
- **Backend API:** `http://localhost:8000`
- **Interactive Swagger Docs:** `http://localhost:8000/docs`

---

## User Roles & Key Workflows

1. **Student (`student`):** Browse approved/ongoing events for their department or college-wide, register for events, cancel bookings.
2. **Club Coordinator (`club_coordinator`):** Draft events, upload posters/sponsors/documents, check venue clashes, submit for approval, upload post-event/RnD reports.
3. **Associate Dean (`associate_dean`):** Review pending department events (approve, reject, suggest changes), override venue clashes with justification, view department statistics.
4. **Director (`director`):** Final approver for all university events, access global analytics.
5. **Super Admin (`super_admin`):** Full system governance, user activation/deactivation, role assignments, department/club/venue management, system setting locks.
6. **Additional (`additional`):** Dynamic permission-based access (e.g. view events, submit/view post-event & RnD reports, grant/revoke permissions for other additional users).

---

## Documentation Index

- **Backend Architecture & Commands:** Refer to [`ems-backend/README.md`](file:///d:/Projects/EMS/Files/3%20After%20Director%20Meeting/Current/4%20Faculty%20Meeting%20Version/ems-backend/README.md)
- **API Endpoint Reference:** Refer to [`ems-backend/API_REFERENCE.md`](file:///d:/Projects/EMS/Files/3%20After%20Director%20Meeting/Current/4%20Faculty%20Meeting%20Version/ems-backend/API_REFERENCE.md)

---

*EMS — Event Management System | SVKM's NMIMS Shirpur Campus*
