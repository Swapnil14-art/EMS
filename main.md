# Master Integration Plan & Gap Analysis: EMS Application

This document outlines the detailed connection plan between the Next.js Frontend and the FastAPI Backend. Importantly, it identifies **discrepancies where the frontend is lagging behind the updated backend architecture**, strictly reflecting the current state of `ems-backend`.

---

## 1. Architectural & Protocol Reality

### 1.1 Local Volume Storage vs OCI Defaults
- **Backend Reality:** The backend has **abandoned OCI Object Storage**. All posters, documents, and reports are now stored locally in the mounted Docker volume (`/storage/`).
- **Nginx Serving:** Nginx directly serves these files via the `/storage/` endpoint (`alias /app/storage/`). 
- **Frontend Action Required:** 
  - Ensure any URL parsing utilities (like `fileService.getFileUrl()`) do not try to parse OCI Cloud Bucket URLs.
  - The frontend only needs to point media/images/documents to `http://localhost:8000/storage/` (or strictly `/storage/` since Nginx covers the reverse proxy).

### 1.2 Automated Event Status Workflow (Celery Beat)
- **Backend Reality:** The backend `celery_beat` container now handles event status transitions autonomously via `status_transitions.py`. 
  - An event moves `approved → ongoing` when `start_datetime` is reached.
  - An event moves `ongoing → completed` when `end_datetime` is reached.
- **Frontend Action Required:** 
  - Strip any manual buttons or UI elements in the frontend that allow staff or coordinators to manually toggle an event to "Ongoing" or "Completed". 
  - The frontend should purely poll or represent what the backend states.

---

## 2. Authentication Flow Finalization

### 2.1 The Azure AD vs Local JWT Conflict
- **Backend Reality:** The backend possesses dead documentation referencing an Azure AD (`NEXT_PUBLIC_AZURE_REDIRECT_URI`) flow. However, the exact router execution (`auth/router.py`) and `.env` explicitly bypass Microsoft and utilize traditional Email + Password local authentication issuing JWTs.
- **Frontend Action Required:** 
  - Do NOT implement MSAL libraries context.
  - Maintain the existing `POST /api/auth/login` and `POST /api/auth/signup` flows with the standard HTML `<form>` email and password fields. 

---

## 3. Discrepancies to Update in Frontend Services

While the `Frontend/app/(dashboard)` folders have successfully migrated to the new 5-role architecture (`admin`, `director`, `associate_dean`, `club_coordinator`, `student`), the `frontend/lib/services.ts` and core components require audits to confirm strict alignment:

### 3.1 Role Hierarchy Cleanup
Ensure all frontend authorization hooks/`uiStore.ts` logic have purged old legacy roles (`hod`, `dean`, `faculty`, `core`). The hierarchy is strictly:
1. `student` (Registers)
2. `club_coordinator` (Submits Events)
3. `associate_dean` (First Reviewer)
4. `director` (Final Approver)
5. `super_admin` (System Owner)

### 3.2 Report Generation
- **Backend Reality:** The backend automatically compiles a heavily structured `.docx` post-event document via `python-docx` through Celery when reports are filed.
- **Frontend Action Required:** Ensure the `Download Report` button on the frontend directly routes `reportService.generate(id)` into a Blob download (`responseType: 'blob'`) to handle the `.docx` natively.

### 3.3 Endpoint Alignments Check (One-by-One)
Below are the critical mappings that must be checked line-by-line in `Frontend/lib/services.ts`:

| Domain | Expected Axio Call from Frontend | Expected Payload / Notes |
|--------|----------------|--------------------------|
| **Events** | `POST /api/events/` | Expects Pydantic schema matching `EventCreate` |
| **Approvals** | `POST /api/approvals/{id}/action` | `{"action": "approved"/"rejected", "remarks": "..."}` |
| **Clash Detection** | `GET /api/venues/clash-check` | Essential hook before form submission to prevent DB rejection. |
| **Registration** | `POST /api/registrations/{id}/register` | |
| **Uploads (Poster)**| `POST /api/events/{id}/upload-poster` | **Must** use `multipart/form-data`. Handled by local disk. |
| **Reports** | `POST /api/reports/{id}/submit` | Takes parsed text blocks (outcomes, issues, feedback). |

---

## 4. Next Implementation Steps

1. Start the stack utilizing `docker compose up --build -d` in the root folder.
2. Review the frontend network tab during `login()`. Assert the JWT access token and refresh tokens are correctly retrieved and placed into `zustand` memory.
3. Conduct a targeted code sweep replacing all remaining instances of "OCI", "Azure", "Faculty", or "Dean" with references to Local Storage, Native JWTs, and the `associate_dean` role explicitly, making the frontend perfectly mirror backend reality.

---

## 5. Database Schema & Migrations

If you clone and deploy this repository onto another PC, you must apply the Alembic database migrations explicitly so dynamic tables (like `SystemConfig`) are created cleanly inside PostgreSQL:
```bash
# Step 1: Fire up the environment
docker compose up -d --build

# Step 2: Push schema upgrades into the database
docker compose exec backend alembic upgrade head
```

---

## 6. Test Data Seeding

A comprehensive seed script (`seed_all_test_data.py`) is provided to populate the database with departments, venues, clubs, and users for all roles. It is **idempotent** — safe to re-run without creating duplicates.

### 6.1 How to Run

```bash
# Make sure the stack is running first
docker compose up -d --build

# Apply migrations (if not done already)
docker compose exec backend alembic upgrade head

# Seed all test data
docker compose exec backend python seed_all_test_data.py
```

### 6.2 What Gets Created

#### Departments

| Code   | Full Name    |
|--------|-------------|
| `ENGG` | Engineering  |
| `AGRI` | Agriculture  |
| `PHRM` | Pharmacy     |

#### Venues (8 total)

| Venue                | Location                       | Dept   |
|---------------------|-------------------------------|--------|
| Main Auditorium     | Central Block, Ground Floor    | Shared |
| Seminar Hall A      | Engineering Block, 1st Floor   | ENGG   |
| Seminar Hall B      | Agriculture Block, 2nd Floor   | AGRI   |
| Open Air Theatre    | Behind Library                 | Shared |
| Computer Lab 1      | Engineering Block, 3rd Floor   | ENGG   |
| Conference Room     | Admin Block, 2nd Floor         | Shared |
| Sports Ground       | Campus East Wing               | Shared |
| Pharmacy Lab        | Pharmacy Block, Ground Floor   | PHRM   |

#### Clubs (6 total)

| Club               | Department  |
|--------------------|------------|
| Google DSC         | Engineering |
| Robotics Club      | Engineering |
| AgriInnovate       | Agriculture |
| Green Earth Society| Agriculture |
| PharmaCare Club    | Pharmacy    |
| Cultural Committee | Engineering |

#### Test User Credentials (password for ALL: `Test@123`)

| Email                    | Name              | Role               | Department  | Club          |
|--------------------------|-------------------|--------------------|-------------|---------------|
| `director@nmims.in`      | Dr. Rajesh Mehta  | `director`         | —           | —             |
| `dean.engg@nmims.in`     | Dr. Priya Sharma  | `associate_dean`   | Engineering | —             |
| `dean.agri@nmims.in`     | Dr. Anil Patil    | `associate_dean`   | Agriculture | —             |
| `dean.phrm@nmims.in`     | Dr. Kavita Desai  | `associate_dean`   | Pharmacy    | —             |
| `coord.gdsc@nmims.in`    | Amit Verma        | `club_coordinator` | Engineering | Google DSC    |
| `coord.robo@nmims.in`    | Sneha Kulkarni    | `club_coordinator` | Engineering | Robotics Club |
| `coord.agri@nmims.in`    | Rahul Joshi       | `club_coordinator` | Agriculture | AgriInnovate  |
| `coord.pharma@nmims.in`  | Neha Gupta        | `club_coordinator` | Pharmacy    | PharmaCare    |
| `student1@nmims.in`      | Arjun Nair        | `student`          | Engineering | —             |
| `student2@nmims.in`      | Pooja Reddy       | `student`          | Agriculture | —             |
| `student3@nmims.in`      | Vikram Singh      | `student`          | Pharmacy    | —             |

> **Note:** The super admin is seeded separately via `seed_super_admin.py` (email: `admin@nmims.in`, password: `Admin@123`).
