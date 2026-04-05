# EMS — Event Management System
## SVKM's NMIMS MPTP, Shirpur Campus
### Master Project Document — Version 1.0
> Single source of truth for all developers, AI assistants, and stakeholders.
> Read this before writing a single line of code.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Team Roles & Responsibilities](#2-team-roles--responsibilities)
3. [Complete Tech Stack](#3-complete-tech-stack)
4. [Infrastructure — OCI Free Tier](#4-infrastructure--oci-free-tier)
5. [Architecture — Modular Design](#5-architecture--modular-design)
6. [Complete Folder Structure](#6-complete-folder-structure)
7. [Database Schema — All Tables](#7-database-schema--all-tables)
8. [Authentication Flow](#8-authentication-flow)
9. [API Design — All Endpoints](#9-api-design--all-endpoints)
10. [Module Breakdown](#10-module-breakdown)
11. [Email System](#11-email-system)
12. [File Storage — OCI Object Storage](#12-file-storage--oci-object-storage)
13. [Docker Setup](#13-docker-setup)
14. [Environment Variables](#14-environment-variables)
15. [Development Workflow](#15-development-workflow)
16. [Deployment Guide — OCI ARM](#16-deployment-guide--oci-arm)
17. [Security Checklist](#17-security-checklist)
18. [AI-Assisted Development Workflow](#18-ai-assisted-development-workflow)
19. [Business Rules — Quick Reference](#19-business-rules--quick-reference)
20. [Known Risks & Open Decisions](#20-known-risks--open-decisions)

---

## 1. Project Overview

### 1.1 What Is EMS

EMS is a centralized web platform for NMIMS College that digitizes the complete event lifecycle:
- Event proposal creation (multi-section form mirroring the physical requisition form)
- Multi-level hierarchical approval workflow
- Venue availability and clash detection
- Student discovery and registration
- Post-event report and archiving

It replaces paper-based permission letters, WhatsApp coordination, and scattered documentation.

### 1.2 College Context

| Attribute | Value |
|-----------|-------|
| College | SVKM's NMIMS MPTP, Shirpur Campus |
| Email Domain | @nmims.in (ALL accounts, enforced at API level) |
| Departments | Engineering (ENGG), Agriculture (AGRI), Pharma (PHRM) |
| Director | Single Director — approves ALL events across all departments |
| HOD/Dean | One per department |
| Database | PostgreSQL 16 |
| Target Users | 500 normal / 2500 peak |
| Version | EMS v5.0 |

### 1.3 Two Types of Events

**Club-Based Events**
Created by CORE members or Faculty Incharge under a registered club. Standard approval chain always applies.

**Non-Club / Independent Events**
Created directly by a Faculty Incharge with no club association. Faculty manually selects the approval chain (HOD, Dean are optional — Director is always required).

**Collaborative Events** — Extension of club-based events. Two or more clubs from the same department co-organize one event. All Faculty Incharges approve in parallel.

---

## 2. Team Roles & Responsibilities

### 2.1 Development Team (3 Members)

| Member | Area | Primary Responsibilities |
|--------|------|--------------------------|
| **Frontend Developer** | Next.js | Pages, components, Zustand stores, API integration, role-based UI rendering |
| **Backend Developer** | FastAPI | All API routes, business logic, authentication, Celery tasks, OCI integration |
| **Database Developer** | PostgreSQL | Schema design, Alembic migrations, query optimization, backup scripts, indexes |

### 2.2 Collaboration Points (Critical)

These are areas where all three must align before coding starts:

- **API contracts**: Backend defines request/response shapes in schemas.py → Frontend uses these exactly
- **Auth tokens**: Frontend and Backend agree on cookie vs header approach before starting
- **File upload flow**: Backend defines OCI upload endpoint → Frontend uses it
- **DB changes**: Always go through Database Developer → Alembic migration → deployed to Neon → others pull

### 2.3 System User Roles (7 Roles)

| Role | Description | Dept Scope |
|------|-------------|------------|
| `super_admin` | Full system control | College-wide |
| `director` | Final approval authority | College-wide |
| `dean` | Department institutional review | Department-specific |
| `hod` | Department head review | Department-specific |
| `faculty` | Manages clubs, first approver, can create independent events | Department-specific |
| `core` | Student organizer — creates club events, manages docs | Department-specific |
| `student` | Views events, registers, downloads participant docs | Department-specific |

> **OC (Organizing Committee) is NOT a system role.** OC members log in as regular students. The OC list is an uploaded document. Exception: For non-club events, Faculty can add event-specific CORE members post-Director approval.

---

## 3. Complete Tech Stack

### 3.1 Technology Decisions (Final)

| Layer | Technology | Version | Why |
|-------|-----------|---------|-----|
| **Frontend** | Next.js | 14+ (App Router) | SSR, file-based routing, excellent for role-based dashboards |
| **Styling** | TailwindCSS | 3.x | Rapid UI development, consistent design |
| **State Management** | Zustand | 4.x | Lightweight, simple, no boilerplate |
| **Backend** | FastAPI | 0.110+ | Fast, async, auto-docs, Python ecosystem |
| **ORM** | SQLAlchemy | 2.x | Mature, PostgreSQL-specific features |
| **Migrations** | Alembic | 1.x | Works with SQLAlchemy, handles schema versioning |
| **Database (Dev)** | Neon PostgreSQL | 16 | Free, instant, proper PostgreSQL |
| **Database (Prod)** | PostgreSQL in Docker | 16 | On OCI ARM A1, free |
| **Cache + Queue Broker** | Redis | 7.x | Rate limiting + Celery broker |
| **Async Email** | Celery | 5.x | Never block API thread for emails |
| **SMTP** | College SMTP (smtp.nmims.in) | — | Required by college |
| **Reverse Proxy** | Nginx | 1.25+ | SSL termination, static files, proxy |
| **WSGI Server** | Uvicorn | 0.29+ | Behind Nginx, runs FastAPI |
| **Containers** | Docker + Docker Compose | 25+ | All services containerized |
| **Cloud** | OCI Always Free (ARM A1) | — | Free forever for this scale |
| **File Storage** | OCI Object Storage | — | Even in development |
| **Vulnerability Scanning** | Bandit + Semgrep + Trivy | latest | Dev security checks |

### 3.2 Key Library Decisions

**Backend (Python)**
```
fastapi
uvicorn[standard]
sqlalchemy[asyncio]
alembic
asyncpg              # Async PostgreSQL driver
pydantic[email]      # Email validation + settings
python-jose[cryptography]  # JWT
passlib[bcrypt]      # Password hashing
celery[redis]        # Async task queue
redis                # Cache + rate limiting
oci                  # OCI SDK for Object Storage
python-multipart     # File upload handling
pillow               # Image compression for posters
emails               # Email composition
slowapi              # Rate limiting for FastAPI
```

**Frontend (Node)**
```
next
react
tailwindcss
zustand
axios              # HTTP client (consistent with interceptors)
react-hook-form    # Form management (complex event creation form)
zod                # Schema validation (mirrors backend Pydantic)
date-fns           # Date formatting
```

---

## 4. Infrastructure — OCI Free Tier

### 4.1 What You Get (Always Free)

| Resource | Free Allowance | Usage in EMS |
|----------|---------------|--------------|
| ARM A1 Instance | 4 OCPU + 24GB RAM | Main server — runs ALL containers |
| Block Storage | 200GB | PostgreSQL data + Docker volumes |
| Object Storage | 10GB | Posters, documents, reports |
| Load Balancer | 1 × 10 Mbps | Routes traffic to Nginx |
| Outbound Data | 10TB/month | More than enough |

> ⚠️ **ARM Provisioning Warning**: OCI ARM instances frequently show "Out of host capacity". Try regions: `us-ashburn-1`, `ap-singapore-1`, `eu-frankfurt-1`. Script a retry loop if needed. Provision this FIRST before anything else.

### 4.2 Production Infrastructure Diagram

```
Internet
    │
    ▼
OCI Load Balancer (free, 10Mbps)
    │  Port 80/443
    ▼
OCI ARM A1 Instance (Ubuntu 22.04 LTS)
4 OCPU | 24GB RAM
    │
    └── Docker Compose
         ├── Nginx (ports 80, 443)      → SSL termination
         │     ├── /api/* → FastAPI:8000
         │     └── /* → Next.js:3000
         │
         ├── Next.js (port 3000)        → Frontend
         ├── FastAPI + Uvicorn (:8000)  → Backend API
         ├── PostgreSQL 16 (:5432)      → Internal only
         ├── Redis 7 (:6379)            → Internal only
         └── Celery Worker              → No port, background tasks

OCI Object Storage Bucket
    └── /posters/
    └── /documents/
    └── /reports/
    └── /other-docs/
    └── /sponsor-logos/

OCI Block Volume (200GB)
    └── Mounted to /data/
    └── /data/postgres/    → PostgreSQL data directory
    └── /data/backups/     → pg_dump backups
```

### 4.3 OCI Security List Rules (Firewall)

```
Ingress:
- TCP 22   → Your IP only (SSH)
- TCP 80   → 0.0.0.0/0 (HTTP → redirects to HTTPS)
- TCP 443  → 0.0.0.0/0 (HTTPS)

Egress:
- All traffic → 0.0.0.0/0 (outbound allowed)

All other ports → BLOCKED
PostgreSQL and Redis ports NEVER exposed publicly.
```

### 4.4 Development Environment

Development runs identically to production on your local machine:

```
Local Machine
└── Docker Compose (same as prod)
     ├── Next.js (dev mode with hot reload)
     ├── FastAPI (dev mode with --reload)
     ├── Redis (same)
     └── Celery Worker (same)

Database → Neon PostgreSQL (cloud, free)
File Storage → OCI Object Storage (same bucket as prod, different prefix)
```

Using OCI Object Storage even in dev ensures no "works on my machine" file issues.

---

## 5. Architecture — Modular Design

### 5.1 Design Principles

- **One module = one domain**: auth, users, clubs, events, approvals, venues, documents, notifications
- **Each module is self-contained**: its own router, service, models, schemas
- **No cross-module DB imports**: modules communicate through service calls, not direct model imports
- **Business logic lives in service.py only**: routers just route, models just define structure
- **Schemas are the contract**: Pydantic schemas define exactly what goes in and out of every endpoint

### 5.2 Backend Module Map

```
backend/app/modules/
├── auth/          → Login, logout, token refresh, password change
├── users/         → CRUD for all 7 roles, bulk student management
├── clubs/         → Club CRUD, CORE member management
├── events/        → Event creation, editing, status management
├── approvals/     → Approval workflow, rejection, override
├── venues/        → Venue CRUD, clash detection, calendar
├── documents/     → File uploads, event docs, links, post-event report
└── notifications/ → Email log, Celery tasks, email triggers
```

### 5.3 Request Lifecycle

```
Client Request
    │
    ▼
Nginx (SSL termination, rate limiting headers)
    │
    ▼
FastAPI Router (router.py)
    │ → Validates JWT (dependency injection)
    │ → Checks role permission (dependency injection)
    │ → Validates request body (Pydantic schema)
    ▼
Service Layer (service.py)
    │ → Business logic
    │ → Database queries (SQLAlchemy async)
    │ → File operations (OCI SDK)
    │ → Queues email tasks (Celery)
    ▼
Database (PostgreSQL via asyncpg)
    │
    ▼
Response (Pydantic schema → JSON)
    │
    ▼
Client
```

---

## 6. Complete Folder Structure

```
ems/
├── .env.example                    # Template for all environment variables
├── .gitignore
├── README.md
├── docker-compose.yml              # Development + Production (different .env)
├── docker-compose.prod.yml         # Production overrides
│
├── nginx/
│   ├── nginx.conf                  # Main Nginx config
│   └── ssl/                        # Let's Encrypt certs (gitignored)
│
├── docs/                           # All project documentation
│   ├── PROJECT_MASTER.md           # This document
│   ├── API_REFERENCE.md            # Auto-generated from FastAPI /docs
│   ├── DB_SCHEMA.md                # Visual schema with all relationships
│   ├── DEPLOYMENT.md               # Step-by-step OCI deployment
│   └── modules/                    # Per-module AI prompt docs
│       ├── auth/
│       │   ├── SPEC.md
│       │   ├── API.md
│       │   └── PROMPT.md
│       ├── events/
│       │   ├── SPEC.md
│       │   ├── RULES.md
│       │   ├── API.md
│       │   └── PROMPT.md
│       └── [other modules — same structure]
│
├── frontend/                       # Next.js 14 App Router
│   ├── Dockerfile
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   │
│   ├── app/                        # App Router pages
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Landing / redirect to login
│   │   │
│   │   ├── (auth)/                 # Public routes (no auth required)
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── change-password/
│   │   │       └── page.tsx        # Force change on first login
│   │   │
│   │   ├── (dashboard)/            # Protected routes (auth required)
│   │   │   ├── layout.tsx          # Auth check + sidebar layout
│   │   │   │
│   │   │   ├── admin/              # super_admin pages
│   │   │   │   ├── page.tsx        # Dashboard
│   │   │   │   ├── users/
│   │   │   │   ├── departments/
│   │   │   │   ├── clubs/
│   │   │   │   ├── events/
│   │   │   │   ├── venues/
│   │   │   │   ├── email-log/
│   │   │   │   └── settings/
│   │   │   │
│   │   │   ├── director/           # director pages
│   │   │   │   ├── page.tsx
│   │   │   │   ├── pending/
│   │   │   │   ├── history/
│   │   │   │   └── venues/
│   │   │   │
│   │   │   ├── dean/               # dean pages
│   │   │   │   ├── page.tsx
│   │   │   │   ├── pending/
│   │   │   │   ├── overrides/
│   │   │   │   ├── history/
│   │   │   │   ├── events/
│   │   │   │   ├── clubs/
│   │   │   │   └── venues/
│   │   │   │
│   │   │   ├── hod/                # hod pages (same as dean structure)
│   │   │   │
│   │   │   ├── faculty/            # faculty pages
│   │   │   │   ├── page.tsx
│   │   │   │   ├── clubs/
│   │   │   │   ├── core-members/
│   │   │   │   ├── events/
│   │   │   │   ├── events/create/
│   │   │   │   ├── approve/
│   │   │   │   └── venues/
│   │   │   │
│   │   │   ├── core/               # core member pages
│   │   │   │   ├── page.tsx
│   │   │   │   ├── events/
│   │   │   │   ├── events/create/
│   │   │   │   ├── events/[id]/
│   │   │   │   ├── report/
│   │   │   │   ├── documents/
│   │   │   │   └── venues/
│   │   │   │
│   │   │   └── student/            # student pages
│   │   │       ├── page.tsx
│   │   │       ├── events/
│   │   │       ├── gallery/
│   │   │       ├── registrations/
│   │   │       └── venues/
│   │
│   ├── components/                 # Reusable components
│   │   ├── ui/                     # Base UI (Button, Input, Badge, Modal, etc.)
│   │   ├── layout/                 # Sidebar, Topbar, PageHeader
│   │   ├── events/                 # EventCard, EventTable, ApprovalChain
│   │   ├── forms/                  # EventForm, YesNoToggle, FileUpload
│   │   ├── venues/                 # VenueCalendar, VenueCard, ClashAlert
│   │   └── shared/                 # StatusBadge, RoleBadge, Timeline
│   │
│   ├── lib/                        # Utilities and configuration
│   │   ├── api.ts                  # Axios instance with interceptors
│   │   ├── auth.ts                 # Token management
│   │   └── utils.ts                # Helper functions
│   │
│   └── store/                      # Zustand stores
│       ├── authStore.ts            # User, role, tokens
│       ├── eventStore.ts           # Current event state
│       └── uiStore.ts              # Modal, sidebar, notification state
│
└── backend/                        # FastAPI application
    ├── Dockerfile
    ├── requirements.txt
    ├── alembic.ini
    ├── celery_worker.py            # Celery app entry point
    │
    ├── alembic/
    │   ├── env.py
    │   └── versions/               # Migration files (auto-generated)
    │
    └── app/
        ├── main.py                 # FastAPI app, middleware, router registration
        │
        ├── core/                   # App-wide configuration and utilities
        │   ├── config.py           # Settings via pydantic-settings (reads .env)
        │   ├── database.py         # Async SQLAlchemy session, engine
        │   ├── security.py         # JWT create/verify, password hash/verify
        │   ├── dependencies.py     # Reusable FastAPI dependencies (get_current_user, role checks)
        │   ├── oci_storage.py      # OCI Object Storage client and helpers
        │   └── exceptions.py       # Custom HTTP exceptions
        │
        ├── modules/
        │   ├── auth/
        │   │   ├── router.py
        │   │   ├── service.py
        │   │   ├── schemas.py
        │   │   └── models.py       # refresh_tokens table
        │   │
        │   ├── users/
        │   │   ├── router.py
        │   │   ├── service.py
        │   │   ├── schemas.py
        │   │   └── models.py       # users, departments tables
        │   │
        │   ├── clubs/
        │   │   ├── router.py
        │   │   ├── service.py
        │   │   ├── schemas.py
        │   │   └── models.py       # clubs, club_core_members tables
        │   │
        │   ├── events/
        │   │   ├── router.py
        │   │   ├── service.py
        │   │   ├── schemas.py
        │   │   └── models.py       # events, event_collaborating_clubs,
        │   │                       # event_sponsors, event_edit_history tables
        │   │
        │   ├── approvals/
        │   │   ├── router.py
        │   │   ├── service.py
        │   │   ├── schemas.py
        │   │   └── models.py       # event_approvals table
        │   │
        │   ├── venues/
        │   │   ├── router.py
        │   │   ├── service.py
        │   │   ├── schemas.py
        │   │   └── models.py       # venues table
        │   │
        │   ├── documents/
        │   │   ├── router.py
        │   │   ├── service.py
        │   │   ├── schemas.py
        │   │   └── models.py       # event_documents, event_other_docs,
        │   │                       # event_links, event_registrations,
        │   │                       # event_core_members tables
        │   │
        │   └── notifications/
        │       ├── router.py       # Email log endpoint only
        │       ├── service.py      # Email composition
        │       ├── schemas.py
        │       ├── models.py       # email_notifications table
        │       └── tasks.py        # Celery tasks for async email sending
        │
        └── tests/                  # Minimal tests
            ├── test_auth.py
            ├── test_events.py
            └── test_venues.py
```

---

## 7. Database Schema — All Tables

### 7.1 Table Index

| # | Table | Module | Description |
|---|-------|--------|-------------|
| 1 | `departments` | users | 3 departments |
| 2 | `users` | users | All 7 roles, single table |
| 3 | `refresh_tokens` | auth | JWT refresh token store |
| 4 | `clubs` | clubs | Department-specific clubs |
| 5 | `club_core_members` | clubs | Club ↔ CORE junction |
| 6 | `venues` | venues | College venues |
| 7 | `events` | events | Central table — all form fields |
| 8 | `event_collaborating_clubs` | events | Clubs in collaborative events |
| 9 | `event_sponsors` | events | Sponsor info per event |
| 10 | `event_approvals` | approvals | One row per approver per stage |
| 11 | `event_edit_history` | events | Snapshots for diff comparison |
| 12 | `event_links` | documents | External links per event |
| 13 | `event_documents` | documents | Post-approval internal folder |
| 14 | `event_other_docs` | documents | Proposal support docs (max 10) |
| 15 | `event_registrations` | documents | Student registrations |
| 16 | `event_core_members` | documents | Non-club event CORE (post-Director) |
| 17 | `email_notifications` | notifications | Audit log of all emails |

### 7.2 departments

```sql
CREATE TABLE departments (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(150) NOT NULL UNIQUE,  -- 'Engineering', 'Agriculture', 'Pharma'
    code        VARCHAR(10) NOT NULL UNIQUE,   -- 'ENGG', 'AGRI', 'PHRM'
    created_at  TIMESTAMP DEFAULT NOW()
);
```

### 7.3 users

```sql
CREATE TABLE users (
    id                      SERIAL PRIMARY KEY,
    full_name               VARCHAR(200) NOT NULL,
    email                   VARCHAR(255) NOT NULL UNIQUE,   -- Must end @nmims.in
    hashed_password         VARCHAR(255) NOT NULL,
    role                    VARCHAR(50) NOT NULL,            -- See role enum below
    department_id           INT REFERENCES departments(id), -- NULL for director, super_admin
    is_active               BOOLEAN DEFAULT TRUE,
    force_password_change   BOOLEAN DEFAULT TRUE,           -- TRUE on creation → forces change at first login
    year_of_study           VARCHAR(10),                    -- 'Y1','Y2','Y3','Y4','Alumni' — for student role only
    created_at              TIMESTAMP DEFAULT NOW(),
    updated_at              TIMESTAMP DEFAULT NOW()
);

-- Role enum values:
-- 'super_admin', 'director', 'dean', 'hod', 'faculty', 'core', 'student'

-- Key indexes:
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_users_year ON users(year_of_study) WHERE role = 'student';
```

### 7.4 refresh_tokens

```sql
CREATE TABLE refresh_tokens (
    id          SERIAL PRIMARY KEY,
    user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL UNIQUE,   -- bcrypt hash of the token
    expires_at  TIMESTAMP NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW(),
    revoked     BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
```

### 7.5 clubs

```sql
CREATE TABLE clubs (
    id                  SERIAL PRIMARY KEY,
    name                VARCHAR(200) NOT NULL,
    department_id       INT NOT NULL REFERENCES departments(id),
    faculty_incharge_id INT REFERENCES users(id),   -- NULL = unassigned
    is_active           BOOLEAN DEFAULT TRUE,
    description         TEXT,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_clubs_department ON clubs(department_id);
CREATE INDEX idx_clubs_faculty ON clubs(faculty_incharge_id);
```

### 7.6 club_core_members

```sql
CREATE TABLE club_core_members (
    id          SERIAL PRIMARY KEY,
    club_id     INT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    added_by    INT NOT NULL REFERENCES users(id),  -- Faculty or Super Admin who added
    added_at    TIMESTAMP DEFAULT NOW(),
    UNIQUE(club_id, user_id)
);
```

### 7.7 venues

```sql
CREATE TABLE venues (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    location        VARCHAR(255),               -- e.g. 'Central block, Ground floor'
    max_capacity    INT NOT NULL DEFAULT 1,     -- Max simultaneous events
    aliases         TEXT,                       -- Comma-separated for fuzzy matching
    department_id   INT REFERENCES departments(id),  -- NULL = shared
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);
```

### 7.8 events (Central Table)

```sql
CREATE TABLE events (
    id                      SERIAL PRIMARY KEY,

    -- Section A: Basic Information
    title                   VARCHAR(255) NOT NULL,
    event_type              VARCHAR(100) NOT NULL,  -- technical|cultural|sports|seminar|workshop|hackathon|awareness|other
    school_department       VARCHAR(150) NOT NULL,
    event_incharge_name     VARCHAR(150) NOT NULL,
    event_incharge_contact  VARCHAR(30) NOT NULL,
    target_audience         VARCHAR(100) NOT NULL,  -- college_wide|engineering|agriculture|pharma
    is_club_event           BOOLEAN DEFAULT TRUE,
    club_id                 INT REFERENCES clubs(id),  -- NULL for non-club events
    is_collaborative        BOOLEAN DEFAULT FALSE,
    is_sponsored            BOOLEAN DEFAULT FALSE,
    custom_approval_chain   JSONB,      -- Non-club events: [{role:'hod',user_id:5},{role:'dean',user_id:3}]

    -- Section B: Flow of Event
    start_datetime          TIMESTAMP NOT NULL,
    end_datetime            TIMESTAMP NOT NULL,

    -- Section C: Venue & Setup
    venue_id                INT REFERENCES venues(id),  -- NULL when custom venue
    venue_custom            VARCHAR(255),               -- Custom typed name
    venue_type              VARCHAR(100),
    seating_arrangement     VARCHAR(100),
    seating_other_detail    VARCHAR(200),
    tables_required         VARCHAR(150),
    chairs_required         VARCHAR(150),
    podium_setup            BOOLEAN DEFAULT FALSE,
    podium_details          TEXT,
    decoration              BOOLEAN DEFAULT FALSE,
    decoration_details      TEXT,

    -- Section D: IT & Technical
    it_projector            BOOLEAN DEFAULT FALSE,
    it_audio                BOOLEAN DEFAULT FALSE,
    it_audio_details        TEXT,
    it_wifi                 BOOLEAN DEFAULT FALSE,
    it_laptop               BOOLEAN DEFAULT FALSE,
    it_laptop_details       TEXT,
    it_other                TEXT,

    -- Section E: Food & Catering
    food_items              BOOLEAN DEFAULT FALSE,
    food_details            TEXT,
    beverage_items          BOOLEAN DEFAULT FALSE,
    beverage_details        TEXT,
    pax_count               INT,
    food_service_time       VARCHAR(100),

    -- Section F: Additional Requirements
    transport               BOOLEAN DEFAULT FALSE,
    transport_details       TEXT,
    security                BOOLEAN DEFAULT FALSE,
    security_details        TEXT,
    printing                BOOLEAN DEFAULT FALSE,
    printing_details        TEXT,
    volunteers              BOOLEAN DEFAULT FALSE,
    volunteers_details      TEXT,
    other_requirements      TEXT,

    -- Section G: Documents & Media
    poster_path             TEXT,       -- OCI Object Storage path
    budget                  NUMERIC(10,2),
    comments                TEXT,
    participant_doc_path    TEXT,       -- Visible to all matching students after Director approval
    report_path             TEXT,       -- Post-event report — triggers archiving on fill
    report_submitted_by     INT REFERENCES users(id),
    report_submitted_at     TIMESTAMP,

    -- Metadata
    is_sponsored            BOOLEAN DEFAULT FALSE,  -- see event_sponsors table
    created_by              INT NOT NULL REFERENCES users(id),
    responsible_faculty_id  INT REFERENCES users(id),  -- Faculty incharge for non-club events
    current_approval_step   INT DEFAULT 1,
    edit_count              INT DEFAULT 0,              -- Post-Director edit count
    last_edited_by          INT REFERENCES users(id),
    last_edited_at          TIMESTAMP,
    status                  VARCHAR(60) NOT NULL DEFAULT 'draft',
    created_at              TIMESTAMP DEFAULT NOW(),
    updated_at              TIMESTAMP DEFAULT NOW()
);

-- Status values:
-- draft | pending_faculty | pending_faculty_parallel | pending_hod |
-- pending_dean | pending_director | approved | rejected | cancelled |
-- ongoing | completed | archived

CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_club ON events(club_id);
CREATE INDEX idx_events_created_by ON events(created_by);
CREATE INDEX idx_events_venue ON events(venue_id);
CREATE INDEX idx_events_datetime ON events(start_datetime, end_datetime);
CREATE INDEX idx_events_target ON events(target_audience);
```

### 7.9 event_collaborating_clubs

```sql
CREATE TABLE event_collaborating_clubs (
    id          SERIAL PRIMARY KEY,
    event_id    INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    club_id     INT NOT NULL REFERENCES clubs(id),
    UNIQUE(event_id, club_id)
);
```

### 7.10 event_sponsors

```sql
CREATE TABLE event_sponsors (
    id          SERIAL PRIMARY KEY,
    event_id    INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    logo_path   TEXT    -- OCI Object Storage path
);
```

### 7.11 event_approvals

```sql
CREATE TABLE event_approvals (
    id                          SERIAL PRIMARY KEY,
    event_id                    INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    approver_id                 INT NOT NULL REFERENCES users(id),
    role_at_approval            VARCHAR(50) NOT NULL,   -- faculty|hod|dean|director
    sequence_order              INT NOT NULL,            -- 1=faculty,2=hod,3=dean,4=director
    is_parallel                 BOOLEAN DEFAULT FALSE,   -- TRUE for collaborative faculty approvals
    parallel_group              INT,                     -- Groups parallel approvals, NULL otherwise
    status                      VARCHAR(20) DEFAULT 'pending',  -- pending|approved|rejected
    remarks                     TEXT,                    -- Mandatory when rejected
    venue_clash_override        BOOLEAN DEFAULT FALSE,
    venue_clash_override_reason TEXT,                   -- Mandatory when override=TRUE
    actioned_at                 TIMESTAMP,
    created_at                  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_approvals_event ON event_approvals(event_id);
CREATE INDEX idx_approvals_approver ON event_approvals(approver_id);
CREATE INDEX idx_approvals_status ON event_approvals(status);
```

### 7.12 event_edit_history

```sql
CREATE TABLE event_edit_history (
    id              SERIAL PRIMARY KEY,
    event_id        INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    edited_by       INT NOT NULL REFERENCES users(id),
    edited_at       TIMESTAMP DEFAULT NOW(),
    old_snapshot    JSONB NOT NULL,     -- Complete event fields BEFORE edit
    new_snapshot    JSONB NOT NULL      -- Complete event fields AFTER edit
);
-- Diff computed at display time by comparing old_snapshot vs new_snapshot
```

### 7.13 event_links

```sql
CREATE TABLE event_links (
    id          SERIAL PRIMARY KEY,
    event_id    INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    link_type   VARCHAR(50) NOT NULL,   -- registration|payment|oc_form|gallery|other
    url         TEXT NOT NULL,
    label       VARCHAR(255),           -- e.g. 'Day 1 Photos', 'Registration Form'
    created_by  INT REFERENCES users(id),
    created_at  TIMESTAMP DEFAULT NOW()
);
```

### 7.14 event_documents

```sql
-- Post-approval internal folder (CORE + Faculty only, NOT visible to students)
CREATE TABLE event_documents (
    id          SERIAL PRIMARY KEY,
    event_id    INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,  -- e.g. 'OC Member List', 'Duty Roster'
    file_path   TEXT,                   -- OCI path (NULL if link)
    url         TEXT,                   -- External link (NULL if file)
    uploaded_by INT NOT NULL REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT NOW()
);
```

### 7.15 event_other_docs

```sql
-- Supporting docs uploaded WITH proposal (max 10, visible to approvers, NOT students)
CREATE TABLE event_other_docs (
    id          SERIAL PRIMARY KEY,
    event_id    INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    title       VARCHAR(255),
    file_path   TEXT NOT NULL,          -- OCI Object Storage path
    uploaded_by INT NOT NULL REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT NOW()
);
-- Enforce max 10 at application level (service.py), not DB level
```

### 7.16 event_registrations

```sql
CREATE TABLE event_registrations (
    id              SERIAL PRIMARY KEY,
    event_id        INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id         INT NOT NULL REFERENCES users(id),
    student_email   VARCHAR(255) NOT NULL,
    status          VARCHAR(30) DEFAULT 'registered',   -- registered|cancelled
    registered_at   TIMESTAMP DEFAULT NOW(),
    UNIQUE(event_id, student_email)     -- Prevent duplicate registration
);

CREATE INDEX idx_registrations_event ON event_registrations(event_id);
CREATE INDEX idx_registrations_user ON event_registrations(user_id);
```

### 7.17 event_core_members

```sql
-- Non-club event CORE members added by Faculty AFTER Director approval
CREATE TABLE event_core_members (
    id          SERIAL PRIMARY KEY,
    event_id    INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id     INT NOT NULL REFERENCES users(id),  -- Must be student, same dept as event
    added_by    INT NOT NULL REFERENCES users(id),  -- Faculty Incharge who added
    added_at    TIMESTAMP DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);
```

### 7.18 email_notifications

```sql
CREATE TABLE email_notifications (
    id          SERIAL PRIMARY KEY,
    recipient   TEXT NOT NULL,          -- Comma-separated if multiple
    type        VARCHAR(100) NOT NULL,  -- See email type list in Section 11
    event_id    INT REFERENCES events(id),
    sent_at     TIMESTAMP DEFAULT NOW(),
    status      VARCHAR(20) DEFAULT 'sent',  -- sent|failed
    error_msg   TEXT                    -- Error details if failed
);

CREATE INDEX idx_email_event ON email_notifications(event_id);
```

---

## 8. Authentication Flow

### 8.1 Email Format

All accounts must use `@nmims.in` domain. Enforced via:

```python
# backend/app/core/security.py
import re

NMIMS_EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._+-]+@nmims\.in$')

def validate_nmims_email(email: str) -> bool:
    return bool(NMIMS_EMAIL_REGEX.match(email))
```

> Note: The format `first_name.Last_Name123@nmims.in` is the expected naming convention but is NOT strictly enforced beyond the `@nmims.in` domain check. The regex accepts any valid email ending in @nmims.in.

### 8.2 Account Creation Flow (Super Admin Creates All Accounts)

```
Super Admin fills Create User form
    │
    ▼
POST /api/users/
    │
    ▼
Backend validates:
  - Email ends @nmims.in
  - Email doesn't already exist
  - Role + Department combination is valid
    │
    ▼
Generate random 10-char temporary password
  (uppercase + lowercase + digits, no special chars for readability)
    │
    ▼
Hash password with bcrypt (cost factor 12)
    │
    ▼
Create user record:
  - force_password_change = TRUE
  - is_active = TRUE
    │
    ▼
Queue Celery email task:
  - Send temporary password to user's @nmims.in email
  - Template: "Your EMS account has been created. Temporary password: XXXXXX"
    │
    ▼
Return success to Super Admin
```

### 8.3 Login Flow

```
User submits email + password
    │
    ▼
POST /api/auth/login
    │
    ▼
Backend validates:
  1. Email domain = @nmims.in
  2. User exists and is_active = TRUE
  3. Password matches bcrypt hash
    │
    ▼
If force_password_change = TRUE:
  → Return special response: {must_change_password: true, temp_token: "<short-lived 5min token>"}
  → Frontend redirects to /change-password page
  → User cannot access any other page until password is changed

If force_password_change = FALSE:
  → Generate access token (JWT, 15 min expiry)
  → Generate refresh token (random UUID, 7 days expiry)
  → Store refresh token hash in refresh_tokens table
  → Return: {access_token, refresh_token, user: {id, full_name, role, department_id}}
```

### 8.4 Token Strategy

```
Access Token:
  - JWT signed with SECRET_KEY
  - Expiry: 15 minutes
  - Payload: {sub: user_id, role: user_role, dept: department_id}
  - Sent in: Authorization: Bearer <token> header

Refresh Token:
  - Random UUID (not JWT)
  - Expiry: 7 days
  - Stored as bcrypt hash in refresh_tokens table
  - Sent in: HttpOnly cookie (not localStorage — prevents XSS)

Token Refresh Flow:
  - Frontend intercepts 401 response via Axios interceptor
  - Calls POST /api/auth/refresh with refresh token cookie
  - Gets new access token
  - Retries original request
  - If refresh also fails → logout
```

### 8.5 Password Change Flow (First Login)

```
User is on /change-password page with temp_token
    │
    ▼
POST /api/auth/change-password
  Body: {temp_token, new_password, confirm_password}
    │
    ▼
Validate:
  - new_password != temp_password (don't allow same as temp)
  - Length >= 8 chars
  - Confirm matches
    │
    ▼
Update hashed_password
Set force_password_change = FALSE
    │
    ▼
Issue full access token + refresh token
Redirect to dashboard
```

### 8.6 Zustand Auth Store

```typescript
// frontend/store/authStore.ts
interface AuthState {
  user: {
    id: number;
    full_name: string;
    role: UserRole;
    department_id: number | null;
  } | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user, token) => void;
  clearAuth: () => void;
}
```

### 8.7 Role-Based Page Guard

```typescript
// frontend/app/(dashboard)/layout.tsx
// On load: check Zustand auth state → if not authenticated → redirect /login
// Check user.role → redirect to /[role] base route
// Each role's directory only renders for that role
```

---

## 9. API Design — All Endpoints

### 9.1 URL Structure

```
Base URL: /api/v1/

All endpoints prefixed with /api/v1/
Frontend calls relative to base URL
```

### 9.2 Auth Endpoints

```
POST   /api/v1/auth/login              → Login, get tokens
POST   /api/v1/auth/refresh            → Refresh access token
POST   /api/v1/auth/logout             → Revoke refresh token
POST   /api/v1/auth/change-password    → Change password (first login or voluntary)
POST   /api/v1/auth/forgot-password    → Not in V1 scope — reject if asked
```

### 9.3 Users Endpoints

```
GET    /api/v1/users/                  → List users (super_admin only) — filterable by role, dept
POST   /api/v1/users/                  → Create user (super_admin only)
GET    /api/v1/users/me                → Get current user profile
GET    /api/v1/users/{id}              → Get user by ID (super_admin)
PATCH  /api/v1/users/{id}             → Edit user (super_admin)
DELETE /api/v1/users/{id}             → Soft delete (deactivate) user
POST   /api/v1/users/{id}/activate    → Reactivate user
POST   /api/v1/users/bulk-deactivate  → Bulk deactivate by year_of_study (super_admin)
POST   /api/v1/users/bulk-delete      → Bulk permanent delete by year_of_study (super_admin, extra confirm)
```

### 9.4 Clubs Endpoints

```
GET    /api/v1/clubs/                  → List clubs (filterable by dept)
POST   /api/v1/clubs/                  → Create club (super_admin)
GET    /api/v1/clubs/{id}             → Get club detail
PATCH  /api/v1/clubs/{id}             → Edit club (super_admin)
PATCH  /api/v1/clubs/{id}/incharge    → Assign/change Faculty Incharge (super_admin)
POST   /api/v1/clubs/{id}/deactivate  → Deactivate club (super_admin)

GET    /api/v1/clubs/{id}/core-members         → List CORE members
POST   /api/v1/clubs/{id}/core-members         → Add CORE member (faculty, super_admin)
DELETE /api/v1/clubs/{id}/core-members/{uid}   → Remove CORE member (faculty, super_admin)
```

### 9.5 Events Endpoints

```
GET    /api/v1/events/                 → List events (role-filtered automatically)
POST   /api/v1/events/                 → Create event (core, faculty)
GET    /api/v1/events/{id}            → Get event detail
PATCH  /api/v1/events/{id}            → Edit event (core, faculty — with re-approval logic)
DELETE /api/v1/events/{id}            → Delete draft (core, faculty — draft only)
POST   /api/v1/events/{id}/submit     → Submit draft for approval
POST   /api/v1/events/{id}/cancel     → Cancel event (multi-role, with reason)

POST   /api/v1/events/{id}/poster     → Upload poster (multipart)
POST   /api/v1/events/{id}/participant-doc  → Upload participant doc
POST   /api/v1/events/{id}/report     → Upload post-event report (triggers archiving)

GET    /api/v1/events/{id}/sponsors   → List sponsors
POST   /api/v1/events/{id}/sponsors   → Add sponsor (with logo upload)
DELETE /api/v1/events/{id}/sponsors/{sid}  → Remove sponsor

GET    /api/v1/events/{id}/collaborating-clubs  → List collaborating clubs
```

### 9.6 Approvals Endpoints

```
GET    /api/v1/approvals/pending       → Get events pending current user's approval
POST   /api/v1/approvals/{event_id}/approve  → Approve event
POST   /api/v1/approvals/{event_id}/reject   → Reject event (reason required)
GET    /api/v1/approvals/history       → Approval history for current user
GET    /api/v1/approvals/{event_id}/chain    → Get full approval chain status
```

### 9.7 Venues Endpoints

```
GET    /api/v1/venues/                 → List all active venues
POST   /api/v1/venues/                 → Create venue (super_admin, dean, hod)
GET    /api/v1/venues/{id}            → Get venue detail
PATCH  /api/v1/venues/{id}            → Edit venue (super_admin, dean, hod)
POST   /api/v1/venues/{id}/deactivate → Deactivate venue

GET    /api/v1/venues/calendar         → Venue calendar for a date range
GET    /api/v1/venues/check-clash      → Check if venue is available for given time range
  Query params: venue_id, start_datetime, end_datetime, exclude_event_id (for edits)
```

### 9.8 Documents & Links Endpoints

```
-- Event Other Docs (proposal support, max 10)
GET    /api/v1/events/{id}/other-docs       → List other docs
POST   /api/v1/events/{id}/other-docs       → Upload other doc (multipart)
DELETE /api/v1/events/{id}/other-docs/{did} → Delete other doc

-- Event Documents (internal post-approval folder)
GET    /api/v1/events/{id}/documents        → List documents (core, faculty, approvers)
POST   /api/v1/events/{id}/documents        → Add document (file or link)
DELETE /api/v1/events/{id}/documents/{did}  → Delete document

-- Event Links
GET    /api/v1/events/{id}/links            → List all links
POST   /api/v1/events/{id}/links            → Add link
PATCH  /api/v1/events/{id}/links/{lid}      → Update link
DELETE /api/v1/events/{id}/links/{lid}      → Delete link

-- Non-club event CORE members (post-Director only)
GET    /api/v1/events/{id}/core-members          → List event CORE
POST   /api/v1/events/{id}/core-members          → Add (faculty only, by email)
DELETE /api/v1/events/{id}/core-members/{uid}    → Remove
```

### 9.9 Registrations Endpoints

```
GET    /api/v1/events/{id}/registrations   → List registrations (core, faculty, approvers)
POST   /api/v1/events/{id}/register        → Register student for event
DELETE /api/v1/events/{id}/register        → Unregister
POST   /api/v1/events/{id}/email-update    → Send update email to all registered (core, faculty)
```

### 9.10 Notifications / Email Log

```
GET    /api/v1/notifications/email-log     → Email audit log (super_admin only)
```

### 9.11 Response Format (Standard)

```json
// Success
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}

// Error
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human readable message"
}

// Paginated list
{
  "success": true,
  "data": [ ... ],
  "total": 47,
  "page": 1,
  "per_page": 20
}
```

---

## 10. Module Breakdown

### 10.1 Auth Module

**Purpose**: Login, token management, password lifecycle

**Critical Business Rules**:
- `force_password_change = TRUE` blocks ALL routes until password is changed
- Access token: 15 min, JWT
- Refresh token: 7 days, stored hashed
- Rate limit login endpoint: 5 attempts per minute per IP (Redis-backed via slowapi)
- On 5 failed logins: 15-minute lockout (store in Redis, key = `login_lockout:{ip}`)
- Logout must revoke refresh token from DB

### 10.2 Users Module

**Purpose**: All user account management

**Critical Business Rules**:
- Only `super_admin` can create, edit, deactivate, permanently delete users
- `director` and `super_admin` have `department_id = NULL`
- Bulk operations filter by `year_of_study` — student role only
- Permanent delete: requires extra confirmation step (two-stage: soft delete default, hard delete is explicit)
- `hod` and `faculty` can coexist — a user can be HOD and also Faculty Incharge of a club

### 10.3 Clubs Module

**Purpose**: Club registry and CORE management

**Critical Business Rules**:
- Clubs are strictly department-specific — `department_id` is required
- Faculty Incharge can be NULL (unassigned at creation)
- One Faculty can manage multiple clubs simultaneously
- CORE members: no limit on count
- A student can be CORE in multiple clubs
- Adding a student as CORE: validate they exist in `users` table AND have role `core` or `student`
- On adding CORE: send notification email to the student

### 10.4 Events Module

**Purpose**: Event lifecycle from creation to archiving

**This is the most complex module. Read carefully.**

**Creation Rules**:
- CORE can only create club-based events for clubs they are a CORE member of
- Faculty can create club-based OR non-club independent events
- On creation: status = `draft`, no approval triggered yet
- Collaborative: requires `is_collaborative = TRUE` and at least 2 clubs in `event_collaborating_clubs`
- Sponsored: requires `is_sponsored = TRUE` and at least 1 record in `event_sponsors`

**Edit Rules** (Critical):

| Status | Who Can Edit | What | Consequence |
|--------|-------------|------|-------------|
| draft | CORE, Faculty | Everything | None |
| pending_* | CORE, Faculty | Everything | Resets approval chain to `pending_faculty` |
| approved/ongoing (before start) | CORE, Faculty | Everything | Re-approval with diff, chain restarts |
| After start_datetime | CORE, Faculty | Links only | No re-approval |
| completed/archived | super_admin only | Everything | No re-approval |

**Status Transitions (Automatic)**:
- `approved` → `ongoing`: Scheduled job checks `start_datetime`
- `ongoing` → `completed`: Scheduled job checks `end_datetime`
- `completed` → `archived`: Immediate when `report_path` is set

**Cancellation**:
- Allowed by: CORE (own events), Faculty, HOD, Dean, Director, Super Admin
- Allowed at: Any status EXCEPT `archived` and `completed`
- Two-step: intent confirmation → mandatory reason entry → final confirm
- Auto-email to all registered students with reason

### 10.5 Approvals Module

**Purpose**: The approval workflow engine

**Standard Chain (CORE creator)**:
```
pending_faculty → pending_hod → pending_dean → pending_director → approved
```

**Standard Chain (Faculty creator)**:
```
pending_hod → pending_dean → pending_director → approved
```

**Non-Club Chain** (Faculty manually selects):
- Director is always the final step
- HOD and Dean are optional, chain defined by `custom_approval_chain` JSONB

**Collaborative Chain**:
```
pending_faculty_parallel (ALL faculty must approve) → pending_hod → pending_dean → pending_director → approved
```

**Parallel Faculty Progress**:
- Track in `event_approvals` with `is_parallel=TRUE` and same `parallel_group`
- Show progress: "2 of 3 Faculty approved"
- If ANY faculty rejects → event status = `rejected`, ALL organizers notified
- If ALL faculty approve → event status = `pending_hod`

**Rejection Rules**:
- `remarks` field MANDATORY — return 400 if empty
- Status → `rejected`
- Email to Faculty Incharge + all club organizers (for collaborative: all clubs)

**Venue Override**:
- HOD or Dean can override a venue clash
- Must tick checkbox + provide written reason
- `venue_clash_override = TRUE` + `venue_clash_override_reason` stored in `event_approvals`
- All subsequent approvers see the override displayed prominently

### 10.6 Venues Module

**Purpose**: Venue registry and clash detection

**Clash Detection Logic**:

```python
# A clash exists when:
# 1. Same venue (by venue_id OR fuzzy-matched custom name)
# 2. Time ranges overlap
# 3. Number of events at that time >= max_capacity
# 4. Existing event status IN: pending_faculty, pending_faculty_parallel,
#    pending_hod, pending_dean, pending_director, approved, ongoing

def check_clash(venue_id, start_dt, end_dt, exclude_event_id=None):
    # Count events at this venue overlapping this time window
    # Overlap condition: NOT (end_dt <= existing.start OR start_dt >= existing.end)
    # If count >= venue.max_capacity → clash
```

**Custom Venue Fuzzy Matching**:
```python
# Normalize: lowercase, remove spaces/special chars
# Check against all venue names AND their aliases
# Match threshold: >= 85% similarity using difflib
```

**Clash Response to Organizer**:
- On creation (save as draft): Show clash WARNING, allow save
- On submit: Hard BLOCK — cannot submit with active clash
- Exception: If HOD/Dean has explicitly overridden → allow submit

### 10.7 Documents Module

**Purpose**: File and link management across event lifecycle

**File Upload Flow**:
```
Client → POST /api/v1/events/{id}/[endpoint] (multipart)
       → FastAPI validates file type + size
       → Compress if image (Pillow, max 1920px, 80% JPEG quality)
       → Upload to OCI Object Storage
       → Store OCI object path in DB
       → Return public/pre-signed URL
```

**File Type Rules**:

| Document Type | Allowed Types | Max Size |
|--------------|--------------|---------|
| Event Poster | jpg, png, webp | 5MB (compressed to ~500KB) |
| Sponsor Logo | jpg, png, webp | 2MB |
| Participant Doc | pdf, doc, docx, any | 20MB |
| Report | pdf, doc, docx, any | 20MB |
| Other Docs | any | 20MB each |
| Event Documents | any | 20MB each |

**Visibility Rules** (critical):

| Document | CORE | Faculty | HOD | Dean | Director | Admin | Student |
|----------|------|---------|-----|------|----------|-------|---------|
| Event Other Docs | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Event Documents (internal) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Participant Doc | — | — | — | — | — | — | ✅ after Director approval |
| Post-event Report | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Gallery Links | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### 10.8 Notifications Module

**Purpose**: All email communication, async via Celery

See Section 11 for full detail.

---

## 11. Email System

### 11.1 Architecture

```
API Request (e.g., event approved)
    │
    ▼
service.py calls: send_email_task.delay(...)   # Non-blocking
    │
    ▼
Celery picks up task from Redis queue
    │
    ▼
notifications/tasks.py composes email
    │
    ▼
Sends via SMTP (smtp.nmims.in, port 587)
    │
    ▼
Logs to email_notifications table (sent/failed)
```

### 11.2 Email Types and Triggers

| Email Type | Trigger | Recipients |
|-----------|---------|-----------|
| `account_created` | Super Admin creates account | New user |
| `password_changed` | Password changed | User |
| `event_submitted` | CORE/Faculty submits event | Next approver |
| `collaborative_faculty_approval_request` | Collaborative event submitted | ALL Faculty Incharges simultaneously |
| `event_approved_stage` | Approved at each stage | Next approver in chain |
| `event_fully_approved` | Director approves | Organizer + Faculty Incharge |
| `event_rejected` | Any approver rejects | Faculty Incharge + all organizers |
| `collaborative_faculty_rejected` | Any Faculty rejects collaborative | ALL organizers of all clubs |
| `event_cancelled` | Any authorized role cancels | All registered students |
| `student_registered` | Student registers for event | Registered student |
| `event_details_updated` | Post-Director re-edit submitted | All registered students (auto) |
| `event_details_updated_manual` | CORE hits Send Update Email | All registered students (manual) |
| `core_member_added` | Faculty adds CORE member to club | Added student |

### 11.3 Email Templates

All emails follow this structure:
```
From: noreply@nmims.in
Subject: [EMS] {Subject Line}
Body:
  - College logo / header
  - Event name + key details
  - Action taken
  - Link to EMS (login page or direct event link)
  - Footer: NMIMS EMS | Do not reply to this email
```

---

## 12. File Storage — OCI Object Storage

### 12.1 Bucket Structure

```
OCI Bucket: ems-storage (same bucket for dev and prod, different prefix)

Development prefix:  /dev/
Production prefix:   /prod/

Full paths:
  /dev/posters/event_{id}_{timestamp}.jpg
  /dev/participant-docs/event_{id}_{timestamp}.pdf
  /dev/reports/event_{id}_{timestamp}.pdf
  /dev/other-docs/event_{id}_doc_{n}_{timestamp}.pdf
  /dev/documents/event_{id}_doc_{n}_{timestamp}.pdf
  /dev/sponsor-logos/event_{id}_sponsor_{n}_{timestamp}.jpg
```

### 12.2 OCI SDK Setup (Backend)

```python
# backend/app/core/oci_storage.py
import oci
from app.core.config import settings

def get_object_storage_client():
    config = {
        "user": settings.OCI_USER_OCID,
        "key_file": settings.OCI_KEY_FILE_PATH,
        "fingerprint": settings.OCI_FINGERPRINT,
        "tenancy": settings.OCI_TENANCY_OCID,
        "region": settings.OCI_REGION
    }
    return oci.object_storage.ObjectStorageClient(config)

async def upload_file(file_bytes: bytes, object_name: str, content_type: str) -> str:
    client = get_object_storage_client()
    client.put_object(
        namespace_name=settings.OCI_NAMESPACE,
        bucket_name=settings.OCI_BUCKET_NAME,
        object_name=object_name,
        put_object_body=file_bytes,
        content_type=content_type
    )
    return object_name  # Store path in DB, generate URL on demand

def get_file_url(object_name: str) -> str:
    # Generate pre-authenticated request (PAR) or public URL
    # Pre-authenticated: time-limited, more secure
    # Return URL for frontend to fetch directly
    pass
```

### 12.3 File Security Rules

- Files are NOT publicly accessible by default
- Generate pre-signed URLs (OCI PAR) with 1-hour expiry when frontend needs to display/download
- File type validation BEFORE upload (never trust content-type header alone, check magic bytes)
- File size limits enforced at FastAPI middleware level

---

## 13. Docker Setup

### 13.1 docker-compose.yml (Development)

```yaml
version: '3.9'

services:
  frontend:
    build:
      context: ./frontend
      target: development
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost/api/v1
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
      target: development
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
    environment:
      - DATABASE_URL=${DATABASE_URL}   # Neon PostgreSQL URL in dev
      - SECRET_KEY=${SECRET_KEY}
      - REDIS_URL=redis://redis:6379/0
      - OCI_BUCKET_NAME=${OCI_BUCKET_NAME}
      - OCI_NAMESPACE=${OCI_NAMESPACE}
      - ENV=development
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    depends_on:
      - redis

  celery_worker:
    build:
      context: ./backend
      target: development
    volumes:
      - ./backend:/app
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=redis://redis:6379/0
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASSWORD=${SMTP_PASSWORD}
    command: celery -A celery_worker worker --loglevel=info
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"   # Only in dev — NEVER expose in production

  nginx:
    image: nginx:1.25-alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - frontend
      - backend
```

### 13.2 nginx.conf (Development)

```nginx
events {}

http {
  upstream frontend {
    server frontend:3000;
  }

  upstream backend {
    server backend:8000;
  }

  server {
    listen 80;

    location /api/ {
      proxy_pass http://backend;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      client_max_body_size 25M;   # For file uploads
    }

    location / {
      proxy_pass http://frontend;
      proxy_set_header Host $host;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";  # For Next.js HMR in dev
    }
  }
}
```

### 13.3 Backend Dockerfile

```dockerfile
FROM python:3.12-slim as base

WORKDIR /app
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

FROM base as development
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

FROM base as production
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
```

### 13.4 Frontend Dockerfile

```dockerfile
FROM node:20-alpine as base
WORKDIR /app
COPY package*.json .
RUN npm ci

FROM base as development
COPY . .
CMD ["npm", "run", "dev"]

FROM base as builder
COPY . .
RUN npm run build

FROM node:20-alpine as production
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
CMD ["node", "server.js"]
```

---

## 14. Environment Variables

### 14.1 Complete .env.example

```bash
# ─────────────────────────────────────────
# DATABASE
# ─────────────────────────────────────────
DATABASE_URL=postgresql+asyncpg://user:password@ep-xxx.neon.tech/ems_db?sslmode=require
# Production: postgresql+asyncpg://postgres:password@postgres:5432/ems_db

# ─────────────────────────────────────────
# SECURITY
# ─────────────────────────────────────────
SECRET_KEY=your-256-bit-random-secret-key-here     # Generate: openssl rand -hex 32
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
BCRYPT_COST_FACTOR=12

# ─────────────────────────────────────────
# REDIS
# ─────────────────────────────────────────
REDIS_URL=redis://redis:6379/0

# ─────────────────────────────────────────
# OCI OBJECT STORAGE
# ─────────────────────────────────────────
OCI_USER_OCID=ocid1.user.oc1..xxx
OCI_TENANCY_OCID=ocid1.tenancy.oc1..xxx
OCI_FINGERPRINT=xx:xx:xx:xx:xx
OCI_KEY_FILE_PATH=/app/oci_key.pem      # Mount as Docker secret/volume
OCI_REGION=ap-singapore-1
OCI_NAMESPACE=your-namespace
OCI_BUCKET_NAME=ems-storage
OCI_STORAGE_PREFIX=dev                  # Change to 'prod' in production

# ─────────────────────────────────────────
# EMAIL (SMTP)
# ─────────────────────────────────────────
SMTP_HOST=smtp.nmims.in
SMTP_PORT=587
SMTP_USER=noreply@nmims.in
SMTP_PASSWORD=your-smtp-password
EMAIL_FROM=noreply@nmims.in
EMAIL_FROM_NAME=NMIMS EMS

# ─────────────────────────────────────────
# APPLICATION
# ─────────────────────────────────────────
ENV=development                          # development | production
APP_NAME=EMS
COLLEGE_NAME=SVKM's NMIMS MPTP, Shirpur
ALLOWED_EMAIL_DOMAIN=@nmims.in
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
LOG_LEVEL=INFO

# ─────────────────────────────────────────
# FRONTEND (NEXT.JS — prefix with NEXT_PUBLIC_ for client access)
# ─────────────────────────────────────────
NEXT_PUBLIC_API_URL=http://localhost/api/v1
NEXT_PUBLIC_APP_NAME=EMS
NEXT_PUBLIC_COLLEGE_NAME=NMIMS Shirpur
```

> ⚠️ **NEVER commit .env to git.** Only commit .env.example.
> ⚠️ **OCI private key** — mount as a Docker secret or volume, never bake into image.

---

## 15. Development Workflow

### 15.1 Git Branching Strategy

```
main            → Production-ready only. Deployed to OCI via SSH.
develop         → Integration branch. All features merge here first.
feature/*       → Individual features (e.g. feature/event-creation-form)
fix/*           → Bug fixes (e.g. fix/clash-detection-edge-case)
```

**Flow**:
```
1. Branch from develop → feature/your-feature
2. Work locally with Docker Compose
3. Commit with descriptive messages: "feat(events): add collaborative club toggle"
4. Push → open PR to develop
5. Team review (even if small team — prevents bugs)
6. Merge to develop → test on develop
7. When stable → merge develop to main → deploy to OCI
```

### 15.2 Database Migration Workflow (Database Developer)

```bash
# After any model change:

# 1. Generate migration
alembic revision --autogenerate -m "add venue aliases column"

# 2. Review the generated migration file carefully
# (autogenerate is not always perfect)

# 3. Apply to Neon dev database
alembic upgrade head

# 4. Notify team: "Migration applied to Neon. Run: alembic upgrade head"

# 5. On production deploy:
alembic upgrade head   # Run inside backend container
```

### 15.3 Daily Development Flow

```bash
# Start everything
docker compose up -d

# Watch logs
docker compose logs -f backend
docker compose logs -f celery_worker

# Run migrations (if new)
docker compose exec backend alembic upgrade head

# Frontend hot reloads automatically
# Backend reloads on file change (--reload flag)

# Stop
docker compose down
```

### 15.4 Code Quality Checks (Before Every PR)

```bash
# Backend — run in backend/ directory
bandit -r app/                   # Security vulnerabilities
# Review and fix any HIGH or MEDIUM severity issues

# Frontend — run in frontend/ directory
npm audit                        # Package vulnerabilities
npm run lint                     # ESLint

# Docker image scanning (before production deploy)
trivy image ems-backend:latest
trivy image ems-frontend:latest
```

---

## 16. Deployment Guide — OCI ARM

### 16.1 First-Time Setup (One-Time)

```bash
# 1. Provision OCI ARM A1 instance
#    Shape: VM.Standard.A1.Flex
#    OCPU: 4, Memory: 24GB
#    OS: Ubuntu 22.04 LTS
#    Region: ap-singapore-1 (or try us-ashburn-1)
#    Add your SSH public key

# 2. SSH into instance
ssh ubuntu@<your-oci-ip>

# 3. Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu
newgrp docker

# 4. Install Docker Compose
sudo apt-get install docker-compose-plugin

# 5. Attach Block Volume (200GB) in OCI Console
#    Then mount it:
sudo mkfs.ext4 /dev/sdb
sudo mkdir -p /data
sudo mount /dev/sdb /data
sudo chown ubuntu:ubuntu /data
# Add to /etc/fstab for persistence on reboot

# 6. Create directory structure
mkdir -p /data/postgres /data/backups /home/ubuntu/ems

# 7. Clone repository
cd /home/ubuntu/ems
git clone https://github.com/your-org/ems.git .

# 8. Set up environment
cp .env.example .env
nano .env   # Fill in all production values

# 9. Set up SSL (Let's Encrypt)
sudo apt install certbot
sudo certbot certonly --standalone -d yourdomain.com
# Copy certs to nginx/ssl/

# 10. Start everything
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 11. Run migrations
docker compose exec backend alembic upgrade head

# 12. Create first super admin
docker compose exec backend python -c "
from app.core.database import get_db
# run create_superadmin script
"
```

### 16.2 Deployment (Every Update)

```bash
# SSH into OCI
ssh ubuntu@<your-oci-ip>

# Pull latest
cd /home/ubuntu/ems
git pull origin main

# Rebuild and restart (zero-downtime approach)
docker compose -f docker-compose.yml -f docker-compose.prod.yml build
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Run any new migrations
docker compose exec backend alembic upgrade head

# Check everything is healthy
docker compose ps
docker compose logs --tail=50 backend
```

### 16.3 Backup Script (Cron — Daily at 2 AM)

```bash
# /data/scripts/backup.sh
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="/data/backups/ems_backup_${DATE}.sql"

docker compose exec -T postgres pg_dump -U postgres ems_db > $BACKUP_FILE
gzip $BACKUP_FILE

# Keep only last 14 days of backups
find /data/backups -name "*.sql.gz" -mtime +14 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

```bash
# Add to crontab:
# crontab -e
0 2 * * * /data/scripts/backup.sh >> /data/backups/backup.log 2>&1
```

---

## 17. Security Checklist

### 17.1 Authentication & Authorization

- [ ] Email domain enforced at API level (`@nmims.in` only)
- [ ] Passwords hashed with bcrypt (cost factor 12)
- [ ] Access token expiry: 15 minutes
- [ ] Refresh token stored as hash (not plaintext)
- [ ] `force_password_change` blocks all routes until changed
- [ ] Role + department checked on every protected endpoint
- [ ] JWT payload contains minimal data (no sensitive fields)

### 17.2 API Security

- [ ] CORS restricted to known origins only
- [ ] Rate limiting: 5 login attempts/min per IP (Redis + slowapi)
- [ ] All inputs validated via Pydantic schemas
- [ ] SQL injection impossible: SQLAlchemy ORM only, no raw queries
- [ ] File upload: validate type by magic bytes, not just extension
- [ ] File size limits enforced at middleware level
- [ ] `client_max_body_size 25M` in Nginx

### 17.3 Infrastructure

- [ ] PostgreSQL and Redis ports NOT exposed publicly (Docker internal network only)
- [ ] SSH access restricted to team IPs only (OCI Security List)
- [ ] HTTPS enforced (Nginx redirects all HTTP to HTTPS)
- [ ] Let's Encrypt SSL certificate auto-renewing
- [ ] OCI key file mounted as secret (not in Docker image)
- [ ] .env files never committed to git

### 17.4 Vulnerability Scanning

Run before every production deployment:

```bash
bandit -r backend/app/ -ll    # Python — HIGH and MEDIUM only
npm audit --audit-level high   # Frontend — HIGH only
trivy image ems-backend:latest --severity HIGH,CRITICAL
trivy image ems-frontend:latest --severity HIGH,CRITICAL
semgrep --config=auto backend/ frontend/
```

---

## 18. AI-Assisted Development Workflow

### 18.1 Why This Matters

With 3 developers and AI assistance, inconsistency is the #1 risk. Different AI sessions produce different code styles, different error handling patterns, different naming conventions. The solution: give every AI session the same context.

### 18.2 Per-Module Document Structure

Before coding any module, create these files in `docs/modules/{module}/`:

```
SPEC.md      → What this module does, all business rules, edge cases
SCHEMA.md    → Which DB tables this module owns, all columns
API.md       → All endpoints, exact request/response shapes with examples
RULES.md     → Business rules extracted from the master document
PROMPT.md    → The AI prompt template for generating this module
```

### 18.3 AI Prompt Template (PROMPT.md)

Each module's PROMPT.md follows this structure:

```
# AI Prompt for {Module Name} Module

## Context
You are building a module for EMS (Event Management System) for NMIMS College.
Full project context: [Link to this master doc]

## Tech Stack
- Backend: FastAPI + SQLAlchemy 2.x (async) + Alembic + PostgreSQL
- Pattern: router.py → service.py → models.py + schemas.py
- Error handling: Custom HTTPException from app.core.exceptions
- Auth: JWT via dependency injection (get_current_user, require_role)

## This Module: {Module Name}
[Paste entire SPEC.md here]

## DB Tables Owned
[Paste SCHEMA.md here]

## Endpoints to Implement
[Paste API.md here]

## Business Rules
[Paste RULES.md here]

## Code Standards
- Async everywhere (async def, await)
- Pydantic v2 schemas with Field validators
- Return type hints on all functions
- No business logic in router.py — only in service.py
- Follow existing code structure exactly

## Generate
Generate the complete module: router.py, service.py, models.py, schemas.py
```

### 18.4 Development Order (Recommended)

Build modules in this order — each one depends on the previous:

```
1. core/              → Config, DB, security, dependencies (foundation)
2. auth/              → Login, tokens (everything needs auth)
3. users/             → User management (clubs/events need users)
4. clubs/             → Club structure (events need clubs)
5. venues/            → Venues (events need clash detection)
6. events/            → Event creation (most complex, save for last of core)
7. approvals/         → Approval workflow (built on events)
8. documents/         → Files and links (built on events)
9. notifications/     → Email (built on everything)
```

### 18.5 Team AI Usage Rules

- **Always start AI session by sharing**: this master document + the module SPEC.md
- **Never ask AI to change DB schema** without Database Developer reviewing first
- **Always run Bandit** on AI-generated Python code before merging
- **AI generates boilerplate** — humans review business logic
- **If AI output contradicts this document** — this document wins

---

## 19. Business Rules — Quick Reference

### 19.1 Approval Rules

| Rule | Detail |
|------|--------|
| Rejection reason | ALWAYS mandatory — return 400 if empty |
| Submission | Only CORE or Faculty can submit — not approvers |
| Cancellation | HOD/Dean/Director can cancel anytime mid-approval |
| Collaborative | ALL Faculty must approve before chain moves to HOD |
| Post-Director edit | ALWAYS resets chain to Faculty, regardless of who edited |
| Re-approval | Triggers side-by-side diff shown to all approvers |
| Non-club chain | Director always required — others optional |

### 19.2 Data Rules

| Rule | Detail |
|------|--------|
| Email domain | All accounts: must end @nmims.in |
| Clubs | Strictly department-specific — no cross-dept |
| Collaborative clubs | Same department only |
| Non-club CORE | Same department as event, only after Director approval |
| Venue clash check | Against pending + approved + ongoing events only (not drafts) |
| Other event docs | Maximum 10 files per event |
| Post-event report | Single file — no structured fields |
| Gallery | External Google Drive links only — no media on server |
| OC list | Uploaded document only — no DB table |

### 19.3 Visibility Rules

| Item | Visible To |
|------|-----------|
| Events | Students see only approved/ongoing/completed/archived, matching department |
| Participant doc | All matching students, immediately after Director approval |
| Event other docs | CORE, Faculty, all approvers — NOT students |
| Event documents (internal folder) | CORE, Faculty, all approvers — NOT students |
| Gallery links | Everyone |
| Approval remarks | All approvers in chain — NOT students or CORE |
| Sponsor info | Everyone who can see the event |

### 19.4 Status Rules

| Status | Student Sees | Who Can Act |
|--------|-------------|------------|
| draft | No | CORE/Faculty edit/submit/delete |
| pending_* | No | Respective approver or cancel |
| approved | Yes (as "Upcoming") | Registered students see participant doc |
| ongoing | Yes | — |
| completed | Yes | CORE/Faculty upload report |
| archived | Yes (as "Completed") | Super Admin edit only |
| rejected | No | CORE/Faculty re-edit and resubmit |
| cancelled | No | None |

---

## 20. Known Risks & Open Decisions

### 20.1 Open Technical Decisions

| Item | Status | Notes |
|------|--------|-------|
| SMTP credentials | Pending | Need from college IT dept (smtp.nmims.in) |
| OCI domain/DNS | Pending | Need domain name to configure Nginx + SSL |
| Super Admin first account | Pending | Create via CLI script on first deploy |
| Non-club event approval restrictions | Pending | Should Faculty be able to skip HOD entirely? Decide before building approvals module |
| Automatic status transitions (ongoing/completed) | Decision needed | APScheduler inside FastAPI OR Celery beat (Celery beat recommended, already have Celery) |

### 20.2 Known Risks

| Risk | Severity | Mitigation |
|------|---------|-----------|
| OCI ARM capacity unavailable | High | Try multiple regions, script retry loop, provision NOW |
| SMTP not configured in time | Medium | Use Mailtrap for development, swap SMTP config for production |
| OCI Object Storage 10GB limit | Low | Compress images aggressively, monitor usage |
| Neon DB free tier pause | Low | Neon doesn't pause on active development, monitor for 1-week inactivity |
| AI-generated inconsistent code | Medium | Follow Section 18 workflow strictly — always provide full context |
| Team of 3 coordination gaps | Medium | Backend defines API schemas first, Frontend waits for schema before building |
| Alembic migration conflicts | Medium | Only Database Developer generates migrations, team never manually edits DB |

### 20.3 V2 Features (Do Not Build in V1)

These were explicitly descoped:
- In-app push notifications
- Payment processing (links only in V1)
- Attendance tracking
- Mobile app
- QR-based check-in
- Full analytics charts (basic stats only in V1)
- Cross-department collaboration
- Event rating/feedback
- OC registration form inside EMS

---

*Document Version: 1.0*
*Last Updated: 2025*
*Maintained by: Development Team*
*Next Review: Before starting each new module*

> **Rule**: If anything in this document contradicts the UI prototype HTML or the original comprehensive doc, raise it with the team immediately. Do not assume — clarify first.
