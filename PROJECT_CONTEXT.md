# EMS (Event Management System) - Definitive Project Architecture & Business Logic Documentation

## 1. Executive Summary & Project Purpose

The **Event Management System (EMS)** is an enterprise academic event lifecycle management platform built specifically for **SVKM's NMIMS, Shirpur Campus**. It provides end-to-end automation for event proposal, multi-level sequential and parallel approval workflows, venue booking with collision detection, student registration management, public event visibility, document generation, and post-event auditing.

### Key Objectives
*   **Workflow Automation**: Replaces paper-based approvals with a transparent, role-based digital approval chain (Club Coordinator → Parallel Coordinator Vote → Department Associate Dean → Campus Director).
*   **Venue Clash Avoidance**: Real-time venue availability checks with capacity constraints and 1-hour time-buffer collision detection rules.
*   **Dual Event Workflows**: Full operational support for both **Standard Academic/Cultural Events** and **Research & Development (R&D) / IIC (Institution's Innovation Council) Events**.
*   **Document Generation & Archival**: Automated creation of formal `.docx` post-event compliance reports, participant export (`.xlsx`), and attendance tracking.
*   **Dynamic Granular Access Control**: Hybrid permission architecture combining fixed operational roles (Super Admin, Director, Associate Dean, Club Coordinator, Student) with an extensible `additional` role featuring dynamic permission catalogs (`extra_permissions`).

---

## 2. Technical Stack & Deployment Architecture

### Backend Architecture
*   **Framework**: FastAPI (Python 3.11+) with AsyncIO.
*   **Database ORM**: SQLAlchemy 2.0 (Async Engine via `asyncpg`) for non-blocking I/O operations.
*   **Migration Engine**: Alembic (version-controlled DB migrations).
*   **Task Queue & Scheduler**: Celery 5.4 with Redis 7 as Message Broker (`redis://redis:6379/0`) and Result Backend (`redis://redis:6379/1`). Celery Beat handles periodic status transitions every 2 minutes.
*   **Authentication & Security**: JWT (JSON Web Tokens via `python-jose`) with BCrypt password hashing, refresh token rotation, Azure AD / Microsoft SSO Integration (`msal`), and Rate Limiting (`slowapi`).
*   **Document Engines**: `python-docx` for `.docx` generation, `openpyxl` for Excel exports, `Pillow` for image optimization/validation.

### Frontend Architecture
*   **Framework**: Next.js 14 (App Router) with React 18 & TypeScript 5.
*   **Styling System**: Tailwind CSS with custom Design Tokens, Dark/Light theme dynamic variables, glassmorphism UI components, Lucide React icons.
*   **State Management**: Zustand 4 (`useAuthStore` with local storage persistence and in-memory JWT token handling).
*   **Data Fetching**: Axios 1.7 with central interceptors for silent token refresh, 401/403 error capturing, and network disconnection toasts.
*   **Calendar**: `@fullcalendar/react` (DayGrid views with public vs. internal status filtering).

### Containerization & Infrastructure (Docker Compose)
*   `ems_backend`: FastAPI app running on port 8000 (uvicorn).
*   `ems_db`: PostgreSQL 16 Alpine database container running on port 5433 (internal 5432).
*   `ems_redis`: Redis 7 Alpine container on port 6379.
*   `ems_celery_worker`: Background worker processing email dispatches & report generation (`concurrency=4`).
*   `ems_celery_beat`: Periodic task scheduler (triggers `check_and_transition_events` every 120s).
*   `ems_nginx`: Nginx 1.25 Alpine reverse proxy routing HTTP/HTTPS, serving static upload assets, and enforcing max upload payload sizes.

---

## 3. Database Schema & Data Models

The database comprises 13 primary tables with strict foreign key constraints, indexes, and cascades.

### 3.1 `users`
*   `id` (PK, Integer, Autoincrement)
*   `email` (String(255), Unique, Indexed, Lowercase)
*   `hashed_password` (String(255), Nullable)
*   `name` (String(255), Nullable)
*   `role` (String(50), Default: `'student'`) - Enum: `super_admin`, `director`, `associate_dean`, `club_coordinator`, `student`, `additional`.
*   `department_id` (FK -> `departments.id`, Nullable)
*   `club_id` (FK -> `clubs.id`, Nullable)
*   `status` (String(20), Default: `'active'`) - `active`, `inactive`.
*   `is_first_login` (Boolean, Default: `True`)
*   `sap_id` (String(50), Nullable)
*   `branch` (String(100), Nullable)
*   `year_of_study` (String(20), Nullable) - Enum: `Y1`, `Y2`, `Y3`, `Y4`, `Alumni`.
*   `course` (String(100), Nullable)
*   `phone_number` (String(20), Nullable)
*   `club_coordinator_request` (Boolean, Default: `False`)
*   `extra_permissions` (JSONB / JSON, Default: `[]`) - Array of granted permission strings for `additional` role users.
*   `created_at`, `updated_at`, `last_login_at` (Timestamps with Timezone).

### 3.2 `departments`
*   `id` (PK, Integer)
*   `name` (String(255), Unique, e.g., "School of Technology Management & Engineering")
*   `code` (String(50), Unique, e.g., "STME", "MPSTME", "SPTPS")
*   `created_at` (Timestamp)

### 3.3 `clubs`
*   `id` (PK, Integer)
*   `name` (String(255), Unique)
*   `description` (Text)
*   `department_id` (FK -> `departments.id`, Nullable - Null for College-Wide clubs)
*   `level` (String(50), Default: `'department'`) - Enum: `department`, `college_wide`.
*   `is_active` (Boolean, Default: `True`)
*   `created_at`, `updated_at` (Timestamps)

### 3.4 `venues`
*   `id` (PK, Integer)
*   `name` (String(255), Unique)
*   `location` (String(255))
*   `max_capacity` (Integer, Default: 1) - Number of simultaneous events allowed before triggering a clash.
*   `aliases` (Text) - Comma-separated list for fuzzy matching.
*   `department_id` (FK -> `departments.id`, Nullable)
*   `parent_id` (FK -> `venues.id`, Nullable) - Hierarchical nested venues.
*   `is_active` (Boolean, Default: `True`)

### 3.5 `events`
*   `id` (PK, Integer)
*   `title` (String(255))
*   `event_type` (String(50)) - `technical`, `cultural`, `sports`, `seminar`, `workshop`, `hackathon`, `awareness`, `other`.
*   `school_department` (String(255))
*   `event_incharge_name` (String(255)), `event_incharge_contact` (String(100))
*   `target_audience` (String(50)) - `college_wide`, `engineering`, `agriculture`, `pharma`, etc.
*   `is_club_event` (Boolean, Default: `True`)
*   `club_id` (FK -> `clubs.id`, Nullable)
*   `is_collaborative` (Boolean, Default: `False`)
*   `is_sponsored` (Boolean, Default: `False`)
*   `start_datetime` (Timestamp TZ), `end_datetime` (Timestamp TZ)
*   `registration_start_datetime` (Timestamp TZ, Nullable), `registration_deadline` (Timestamp TZ, Nullable)
*   `venue_id` (FK -> `venues.id`, Nullable)
*   `venue_custom` (String(255), Nullable)
*   `departments_involved` (JSON / Array of strings)
*   `seating_arrangement` (String(100)), `tables_required`, `chairs_required`, `podium_setup` (Bool), `decoration` (Bool)
*   `it_projector`, `it_audio`, `it_wifi`, `it_laptop` (Booleans)
*   `food_items`, `beverage_items` (Booleans), `pax_count` (Integer)
*   `transport`, `security`, `printing`, `volunteers` (Booleans with text detail fields)
*   `budget` (Numeric(10,2))
*   `comments` (Text)
*   `poster_path`, `participant_doc_path`, `attendance_doc_path`, `report_path` (Strings)
*   `status` (String(50), Indexed) - Enum: `draft`, `pending_associate_dean`, `pending_coordinator_parallel`, `pending_director`, `suggested_changes`, `approved`, `rejected`, `cancelled`, `ongoing`, `completed`, `archived`.
*   `is_rnd_event` (Boolean, Default: `False`)
*   `rnd_activity_theme`, `rnd_prescribed_activity`, `rnd_semester_quarter` (Strings)
*   `rnd_tentative_date` (Date)
*   `outside_campus_registration` (Boolean, Default: `False`)
*   `registration_accepted` (Boolean, Default: `False`)
*   `created_by` (FK -> `users.id`)

### 3.6 Auxiliary & Association Tables
*   `event_collaborating_clubs`: `event_id` (FK), `club_id` (FK).
*   `event_venues`: `event_id` (FK), `venue_id` (FK).
*   `event_sponsors`: `id`, `event_id` (FK), `name`, `logo_path`.
*   `event_approvals`: `id`, `event_id` (FK), `approver_id` (FK -> `users.id`), `role_at_approval`, `sequence_order` (1=Parallel Coordinator, 2=Associate Dean, 3=Director), `is_parallel` (Bool), `action` (`approved`, `rejected`, `suggested_changes`), `remarks`, `venue_clash_override` (Bool), `venue_clash_override_reason`, `actioned_at`.
*   `event_registrations`: `id`, `event_id` (FK), `student_id` (FK -> `users.id`, Nullable for visitors), `participation_type` (`in_campus`, `visitor`), `status` (`registered`, `cancelled`), `registered_at`, `visitor_name`, `visitor_email`, `visitor_phone`, `visitor_qualification`, `visitor_school_college`.
*   `event_reports` & `event_rnd_reports`: Post-event detailed metrics (budget spent, outcomes, issues, feedback, attendee breakdowns, photos, guest speakers, social media links).
*   `event_edit_history`: Audit trail for structural edits saving full JSON snapshots of `old_snapshot` and `new_snapshot`.
*   `system_settings`: Global toggle state flags (`disable_student_registration`, `disable_role_signup`, `force_login`).

---

## 4. Authentication, User Lifecycle & RBAC Model

### Role Definitions & Inherent Authorities
1.  **`super_admin`**: System administrator. Bypasses all check guards. Full access to User Management, Pre-Approvals, Venues, System Settings, and Approval Chain overrides.
2.  **`director`**: Campus Director. Ultimate approval authority for events. Receives college-wide events directly or post-Associate Dean approval. Has administrative visibility across all events.
3.  **`associate_dean`**: Departmental Dean. Reviews event proposals from clubs within their department. For collaborative events, each involved department Dean must approve.
4.  **`club_coordinator`**: Faculty/Student Club Head. Can create, edit, cancel, and submit reports for events owned by their club or where listed as a collaborator. Participates in parallel voting for collaborative proposals.
5.  **`student`**: Enrolled campus student. Can view approved/ongoing/completed events open to their department or college-wide, register/unregister, and view their registration dashboard.
6.  **`additional`**: Modular Role. Grants specific dynamic permissions defined in `extra_permissions`.

### Dynamic Permission Catalog (`additional` Role)
*   `view_events`: Browse public event directory.
*   `view_event_details`: View detailed event pages.
*   `view_event_status`: Inspect approval step and approval history.
*   `view_documents`: Download event attachment files & links.
*   `view_reports` / `view_rnd_reports`: Access generated post-event reports.
*   `submit_reports` / `submit_rnd_reports`: Upload post-event report documents and photos.
*   `manage_permissions`: Delegate & assign permissions to other `additional` users (Super Admin only can delegate `manage_permissions` itself).

---

## 5. Comprehensive Approval Chain & Workflow Engine

```
[Event Creation] 
       │
       ├── Is Collaborative? ─── YES ───► Status: pending_coordinator_parallel
       │                                            │ (All collaborating coordinators vote)
       │                                            ▼
       └── NO / Parallel Passed ────────────────────┤
                                                    │
                                  Is College-Wide Club / Event?
                                       │                      │
                                      YES                     NO
                                       │                      │
                                       ▼                      ▼
                            Status: pending_director   Status: pending_associate_dean
                                       │                      │
                                       │               (All involved Deans approve)
                                       │                      │
                                       └──────────┬───────────┘
                                                  ▼
                                       Status: pending_director
                                                  │
                                          (Director Approves)
                                                  ▼
                                           Status: approved
```

### Transition & Re-approval Business Logic
*   **Collaborative Voting**: When created, if `is_collaborative=True`, status enters `pending_coordinator_parallel`. ALL collaborating club coordinators must approve. A single rejection or "suggested_changes" vote immediately sets event status to `rejected` or `suggested_changes`.
*   **College-Wide Bypass**: Events submitted by College-Wide clubs (e.g. `department_id=None` or `level='college_wide'`) or targeting `college_wide` audience bypass the Associate Dean stage and go straight to `pending_director`.
*   **Department Dean Consensus**: Collaborative non-college-wide events require approvals from Associate Deans of **all involved departments** (creator club dept + collaborating club deans).
*   **Edits & Resubmission**: Editing core logistics of an event in `suggested_changes` or active pending state wipes past `event_approvals` records via `clear_approval_records()`, resets the workflow, and logs a snapshot in `event_edit_history`.
*   *Exception*: Changing registration start/deadline dates does NOT trigger a workflow reset or clear approval chains.

### Venue Collision & Override Logic
*   Status group `["pending_associate_dean", "pending_coordinator_parallel", "pending_director", "approved", "ongoing"]` active reservations block venue availability.
*   A **1-hour buffer** before `start_datetime` and after `end_datetime` is automatically enforced during clash detection.
*   Approvers (`associate_dean`, `director`, `super_admin`) can explicitly override venue clashes during approval by setting `venue_clash_override=True` and providing a mandatory written `venue_clash_override_reason`.

---

## 6. Student & Visitor Registration Logic

### Eligibility Rules (`is_student_eligible_for_event`)
A student is eligible to view and register for an event if:
1.  Event status is `approved` or `ongoing`.
2.  `registration_accepted=True` on the event.
3.  Target Audience match:
    *   `target_audience` is `'college_wide'`, `'all'`, or `'college'`.
    *   `target_audience` matches the student's department code (e.g., `'stme'`).
    *   Student's department code is present in `departments_involved`.

### Registration Window Enforcement
*   `now < registration_start_datetime`: Returns `400 Bad Request` ("Registration opens on DD Mon YYYY, HH:MM AM/PM").
*   `now > registration_deadline`: Returns `400 Bad Request` ("Registration deadline has passed").
*   System Override: If `disable_student_registration=True` in `SystemSettings`, all student registrations return `403 Forbidden`.

### Visitor / Outside Campus Registration
*   Events with `outside_campus_registration=True` allow external non-authenticated users to register via `/registrations/{event_id}/register-visitor`.
*   Captures `visitor_name`, `visitor_email`, `visitor_phone`, `visitor_qualification`, `visitor_school_college`.
*   Visitor records populate into `event_registrations` with `student_id=None` and `participation_type='visitor'`.

---

## 7. Research & Development (R&D) Workflow

R&D events are tailored for Ministry of Education (MoE) IIC compliance:
*   Flagged with `is_rnd_event=True`.
*   Requires additional categorization during event creation: `rnd_activity_theme`, `rnd_prescribed_activity`, `rnd_semester_quarter`, `rnd_tentative_date`.
*   Post-event compliance mandates the submission of `EventRndReport` via `/rnd-reports/{event_id}/submit`.
*   Mandates minimum 1 event photo and 1 official flier before report generation.
*   Generates custom docx format with R&D specific headers and outcomes.

---

## 8. Periodic Background Services & Celery Tasks

*   **`check_and_transition_events`** (Celery Beat, every 120 seconds):
    *   Finds `approved` events where `start_datetime <= now` ➔ updates status to `ongoing`.
    *   Finds `ongoing` events where `end_datetime <= now` ➔ updates status to `completed`.
    *   *Note*: Transition from `completed` to `archived` occurs automatically upon successful submission of post-event report (`EventReport` / `EventRndReport`).
*   **`send_bulk_email`**: Async Celery task for mass communication to registered participants.
*   **`notify_temporary_password`**, **`notify_event_submitted`**, **`notify_pending_director`**: Background email task dispatch.

---

## 9. File Management & Role-Based Asset Serving

Uploaded media and documents are stored in structured directories under `STORAGE_ROOT/events/{event_id}/`:
*   `poster/` - Public event posters.
*   `documents/` - Internal event setup notes, budgets, official sanction letters.
*   `report/photos/` & `rnd_report/photos/` - Post-event gallery images.
*   `report/flier/` - Compulsory event fliers.

### Security & Sanitization (`/admin/files/{file_path:path}`)
*   Enforces path normalization (`.lstrip('/')`, removing `'uploads/'` or `'storage/'` prefixes).
*   Prevents directory traversal (`..` inspection) and confirms real path is strictly within `STORAGE_ROOT`.
*   Role-based filtering:
    *   Path containing `/documents/` or `/other_docs/` returns `403 Forbidden` to students.
    *   Docx files in `/report/` or `/rnd_report/` are restricted to staff roles or `additional` users with `view_documents` / `view_reports`.

---

## 10. Frontend Routing & Page Map

*   `/` - Public Landing Page with Hero Carousel, Stats, Happening Now section, All Events directory, FullCalendar view.
*   `/login`, `/signup`, `/forgot-password`, `/change-password`, `/complete-profile` - Authentication views.
*   `/events/[id]` - Public Event Details view (adapts UI based on student registration status vs guest visitor status).
*   `/admin/dashboard` - Global metrics, user management, venue setup, system settings, approval logs.
*   `/director/dashboard` - Executive review dashboard and pending approvals queue.
*   `/associate_dean/dashboard` - Departmental pending approvals queue & event oversight.
*   `/club_coordinator/dashboard` - Coordinator overview, event creation form (`/events/create`), event edit form (`/events/[id]/edit`), post-event report submission modal.
*   `/student/dashboard` - Student registered events dashboard.
