# 📘 EMS Backend — API Reference

> **Base URL:** `http://localhost:8000`
> **Auth:** All endpoints (except signup, login, reset-password) require `Authorization: Bearer <JWT>` header.

---

## Roles

| Role | Description |
|------|-------------|
| `super_admin` | Full system access — manages users, departments, clubs, venues, and all events |
| `director` | Final approver for events; views system-wide dashboard |
| `associate_dean` | First-level approver for events in their department |
| `club_coordinator` | Creates and manages events for their assigned club |
| `student` | Views approved events, registers for events |

---

## 🔐 Authentication (`/auth`)

### `POST /auth/signup`
**Access:** Public
**Description:** Register a new student account. A temporary password is emailed to the provided NMIMS address.

```json
{
  "email": "student@nmims.in"
}
```

---

### `POST /auth/login`
**Access:** Public
**Description:** Authenticate with email and password. Returns JWT access + refresh tokens.

```json
{
  "email": "user@nmims.in",
  "password": "your_password"
}
```

**Response:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "require_password_change": false,
  "require_profile_completion": false
}
```

---

### `POST /auth/change-password`
**Access:** Any authenticated user
**Description:** Change password (mandatory on first login to replace the temporary password).

```json
{
  "current_password": "old_password",
  "new_password": "new_password_min_8_chars"
}
```

---

### `POST /auth/reset-password`
**Access:** Public
**Description:** Request a password reset. A new temporary password is emailed if the account exists.

```json
{
  "email": "user@nmims.in"
}
```

---

### `POST /auth/complete-profile`
**Access:** Any authenticated user (must have changed temp password first)
**Description:** Complete user profile after first login. Optionally request club coordinator role.

```json
{
  "name": "Adarsh Sharma",
  "department_id": 1,
  "branch": "Computer Science",
  "year_of_study": "Y3",
  "course": "B.Tech",
  "sap_id": "70412300123",
  "phone_number": "9876543210",
  "is_club_coordinator_requested": false,
  "club_name": null
}
```

---

### `POST /auth/refresh`
**Access:** Any (with valid refresh token)
**Description:** Get a new access token using a refresh token.

```json
{
  "refresh_token": "eyJ..."
}
```

---

### `POST /auth/logout`
**Access:** Any authenticated user
**Description:** Log out the current session (client-side token invalidation).

_No request body required._

---

### `GET /auth/me`
**Access:** Any authenticated user
**Description:** Get the current authenticated user's profile info.

**Response:**
```json
{
  "id": 1,
  "email": "user@nmims.in",
  "name": "Adarsh Sharma",
  "role": "student",
  "department_id": 1,
  "club_id": null,
  "status": "active",
  "is_first_login": false,
  "sap_id": "70412300123",
  "extra_permissions": []
}
```

---

## 👥 Users (`/users`)

### `GET /users/`
**Access:** `super_admin`
**Description:** List all users with optional filters and pagination.

| Query Param | Type | Description |
|-------------|------|-------------|
| `page` | int | Page number (default: 1) |
| `size` | int | Page size 1–100 (default: 20) |
| `role` | string? | Filter by role |
| `status` | string? | Filter by `active` / `inactive` |
| `department_id` | int? | Filter by department |

---

### `GET /users/search`
**Access:** `super_admin`, `director`, `associate_dean`, `club_coordinator`
**Description:** Search users by email (useful for adding event coordinators).

| Query Param | Type | Description |
|-------------|------|-------------|
| `email` | string | Search term (min 3 chars) |

---

### `GET /users/{user_id}`
**Access:** `super_admin`
**Description:** Get a specific user's details by ID.

---

### `POST /users/pre-approve`
**Access:** `super_admin`
**Description:** Pre-approve a user so they receive the correct role on first login/signup.

```json
{
  "email": "coordinator@nmims.in",
  "role": "club_coordinator",
  "department_id": 1,
  "club_id": 2
}
```

---

### `PATCH /users/{user_id}/activate`
**Access:** `super_admin`
**Description:** Reactivate a deactivated user account.

_No request body required._

---

### `PATCH /users/{user_id}/deactivate`
**Access:** `super_admin`
**Description:** Deactivate a user (prevents login). Cannot deactivate yourself.

_No request body required._

---

### `DELETE /users/{user_id}`
**Access:** `super_admin`
**Description:** Permanently delete a user. Cannot delete yourself.

_No request body required._

---

### `POST /users/bulk-deactivate`
**Access:** `super_admin`
**Description:** Deactivate all active users of a specific year of study (e.g., graduating batch).

```json
{
  "year_of_study": "Y4"
}
```

---

### `POST /users/bulk-delete`
**Access:** `super_admin`
**Description:** Permanently delete all users of a specific year of study.

```json
{
  "year_of_study": "Alumni"
}
```

---

## 🏛️ Departments (`/departments`)

### `GET /departments/`
**Access:** Any authenticated user
**Description:** List all departments ordered by name.

---

### `GET /departments/{dept_id}`
**Access:** Any authenticated user
**Description:** Get a specific department's details.

---

### `POST /departments/`
**Access:** `super_admin`
**Description:** Create a new department.

```json
{
  "name": "Computer Science",
  "code": "CS"
}
```

---

### `PATCH /departments/{dept_id}`
**Access:** `super_admin`
**Description:** Update a department's name or code.

```json
{
  "name": "Computer Science & Engineering",
  "code": "CSE"
}
```

---

## 🎭 Clubs (`/clubs`)

### `GET /clubs/`
**Access:** Any authenticated user
**Description:** List all clubs with optional filters.

| Query Param | Type | Description |
|-------------|------|-------------|
| `department_id` | int? | Filter by department |
| `active_only` | bool | Only active clubs (default: true) |

---

### `GET /clubs/{club_id}`
**Access:** Any authenticated user
**Description:** Get a specific club's details.

---

### `POST /clubs/`
**Access:** `super_admin`
**Description:** Create a new club under a department.

```json
{
  "name": "Coding Club",
  "description": "Competitive programming and hackathons",
  "department_id": 1,
  "coordinator_id": 5
}
```

---

### `PATCH /clubs/{club_id}`
**Access:** `super_admin`
**Description:** Update a club's details.

```json
{
  "name": "Updated Club Name",
  "description": "New description",
  "department_id": 2,
  "coordinator_id": 7,
  "is_active": true
}
```

---

### `PATCH /clubs/{club_id}/deactivate`
**Access:** `super_admin`
**Description:** Deactivate a club (soft delete).

_No request body required._

---

## 📍 Venues (`/venues`)

### `GET /venues/`
**Access:** Any authenticated user
**Description:** List all venues with optional filters.

| Query Param | Type | Description |
|-------------|------|-------------|
| `active_only` | bool | Only active venues (default: true) |
| `department_id` | int? | Filter by department |

---

### `GET /venues/calendar`
**Access:** Any authenticated user
**Description:** Day-view calendar showing all events at each venue on a given date.

| Query Param | Type | Description |
|-------------|------|-------------|
| `date` | string | Date in `YYYY-MM-DD` format |

---

### `GET /venues/clash-check`
**Access:** `super_admin`, `director`, `associate_dean`, `club_coordinator`
**Description:** Check if a venue has scheduling conflicts for a given time range.

| Query Param | Type | Description |
|-------------|------|-------------|
| `venue_id` | int? | Venue ID to check |
| `venue_custom` | string? | Custom venue name |
| `start_datetime` | datetime | Start of time range |
| `end_datetime` | datetime | End of time range |
| `exclude_event_id` | int? | Event ID to exclude from check |

---

### `GET /venues/{venue_id}`
**Access:** Any authenticated user
**Description:** Get a specific venue's details.

---

### `POST /venues/`
**Access:** `super_admin`
**Description:** Create a new venue.

```json
{
  "name": "Auditorium A",
  "location": "Main Building, Ground Floor",
  "max_capacity": 500,
  "aliases": "Main Hall, Audi-A",
  "department_id": 1
}
```

---

### `PATCH /venues/{venue_id}`
**Access:** `super_admin`, `associate_dean`
**Description:** Update venue details.

```json
{
  "name": "Updated Venue Name",
  "location": "New Location",
  "max_capacity": 600,
  "aliases": "New Alias",
  "department_id": 2,
  "is_active": true
}
```

---

## 📅 Events (`/events`)

### `GET /events/`
**Access:** Any authenticated user (role-based filtering applied)
**Description:** List events with filters. Students only see approved/ongoing/completed/archived events for their department or college-wide. Coordinators see their own events. Admins/directors see all.

| Query Param | Type | Description |
|-------------|------|-------------|
| `status` | string? | Filter by status (`draft`, `pending_associate_dean`, `pending_coordinator_parallel`, `pending_director`, `suggested_changes`, `approved`, `rejected`, `ongoing`, `completed`, `cancelled`, `archived`) |
| `club_id` | int? | Filter by club |
| `department_id` | int? | Filter by department |
| `from_date` | datetime? | Events starting after this date |
| `to_date` | datetime? | Events ending before this date |
| `search` | string? | Search by event title |
| `my_events` | bool | Only events created by current user (default: false) |
| `page` | int | Page number (default: 1) |
| `size` | int | Page size 1–100 (default: 20) |

---

### `GET /events/{event_id}`
**Access:** Any authenticated user (role-based visibility)
**Description:** Get full event details including links, sponsors, collaborating clubs, and (for staff) internal documents and coordinators.

---

### `POST /events/`
**Access:** `club_coordinator`, `super_admin`
**Description:** Create a new event as a draft.

```json
{
  "title": "Annual Tech Fest 2026",
  "event_type": "technical",
  "school_department": "School of Technology",
  "event_incharge_name": "Dr. Sharma",
  "event_incharge_contact": "9876543210",
  "target_audience": "college_wide",
  "is_club_event": true,
  "club_id": 1,
  "is_collaborative": false,
  "collaborating_club_ids": [],
  "is_sponsored": false,
  "event_date": "2026-05-15",
  "start_time": "10:00",
  "end_time": "17:00",
  "registration_deadline": "2026-05-14T23:59:00Z",
  "venue_id": 1,
  "venue_custom": null,
  "venue_type": "indoor",
  "seating_arrangement": "theater",
  "seating_other_detail": null,
  "tables_required": "10",
  "chairs_required": "200",
  "podium_setup": true,
  "podium_details": "Main stage",
  "decoration": true,
  "decoration_details": "Tech theme banners",
  "it_projector": true,
  "it_audio": true,
  "it_audio_details": "PA system with 4 mics",
  "it_wifi": true,
  "it_laptop": false,
  "it_laptop_details": null,
  "it_other": null,
  "food_items": true,
  "food_details": "Lunch boxes",
  "beverage_items": true,
  "beverage_details": "Tea, Coffee, Water",
  "pax_count": 200,
  "food_service_time": "13:00",
  "transport": false,
  "transport_details": null,
  "security": true,
  "security_details": "2 guards at entrance",
  "printing": true,
  "printing_details": "100 posters, 500 pamphlets",
  "volunteers": true,
  "volunteers_details": "20 student volunteers",
  "other_requirements": null,
  "budget": 50000.00,
  "comments": "Flagship annual event"
}
```

---

### `PATCH /events/{event_id}`
**Access:** Event creator, `super_admin`
**Description:** Update event details. Resets approval status if event is in review. Cannot edit after event has started (only links can be edited via `/links` endpoints).

```json
{
  "title": "Updated Event Title",
  "budget": 75000.00,
  "comments": "Updated comments"
}
```
_(All fields are optional — send only those you want to update.)_

---

### `POST /events/{event_id}/submit`
**Access:** `club_coordinator`, `super_admin`
**Description:** Submit a draft event for approval. Requires poster upload. Checks for venue clashes and starts the approval chain.

_No request body required._

---

### `POST /events/{event_id}/cancel`
**Access:** Event creator, `super_admin`, `director`, `associate_dean`
**Description:** Cancel an event. Notifies all registered students via email.

```json
{
  "reason": "Venue unavailable due to maintenance"
}
```

---

### `DELETE /events/{event_id}`
**Access:** `super_admin`
**Description:** Permanently delete an event from the database.

_No request body required._

---

### `POST /events/{event_id}/upload-poster`
**Access:** `club_coordinator`, `super_admin`
**Description:** Upload the event poster image (required before submission).

**Content-Type:** `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `file` | file | Poster image file |

---

### `POST /events/{event_id}/upload-participant-doc`
**Access:** `club_coordinator`, `super_admin`
**Description:** Upload a participant document (e.g., participant list template). Only visible after Director approval.

**Content-Type:** `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `file` | file | Document file |

---

### `POST /events/{event_id}/other-docs`
**Access:** `club_coordinator`, `super_admin`
**Description:** Upload additional supporting documents (max 10 per event).

**Content-Type:** `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `title` | string (query) | Document title |
| `file` | file | Document file |

---

### `DELETE /events/{event_id}/other-docs/{doc_id}`
**Access:** `club_coordinator`, `super_admin`
**Description:** Delete a supporting document from an event.

---

### `POST /events/{event_id}/documents`
**Access:** `club_coordinator`, `super_admin`, `associate_dean`, `director`
**Description:** Add an internal document (file or URL). Not visible to students.

```json
{
  "title": "Budget Breakdown",
  "url": "https://docs.google.com/spreadsheet/..."
}
```

Optionally also upload a file via `multipart/form-data`.

---

### `DELETE /events/{event_id}/documents/{doc_id}`
**Access:** `club_coordinator`, `super_admin`
**Description:** Delete an internal document.

---

### `POST /events/{event_id}/links`
**Access:** `club_coordinator`, `super_admin`
**Description:** Add a link to an event (registration, payment, gallery, etc.). Editable even after event starts.

```json
{
  "link_type": "registration",
  "url": "https://forms.google.com/...",
  "label": "Google Form Registration"
}
```

---

### `PATCH /events/{event_id}/links/{link_id}`
**Access:** `club_coordinator`, `super_admin`
**Description:** Update an existing event link.

```json
{
  "url": "https://updated-link.com",
  "label": "Updated label"
}
```

---

### `DELETE /events/{event_id}/links/{link_id}`
**Access:** `club_coordinator`, `super_admin`
**Description:** Remove a link from an event.

---

### `POST /events/{event_id}/coordinators`
**Access:** `club_coordinator`, `super_admin`
**Description:** Add a coordinator to an event (only after Director approval).

```json
{
  "user_id": 5
}
```

---

### `DELETE /events/{event_id}/coordinators/{coord_id}`
**Access:** `club_coordinator`, `super_admin`
**Description:** Remove a coordinator from an event.

---

### `GET /events/{event_id}/diff`
**Access:** `super_admin`, `director`, `associate_dean`
**Description:** View the latest edit diff for an event (shows what changed after a post-approval edit).

---

## ✅ Approvals (`/approvals`)

### `GET /approvals/pending`
**Access:** `associate_dean`, `director`, `club_coordinator`, `super_admin`
**Description:** Get events pending the current user's approval action. Returns role-appropriate pending events.

---

### `POST /approvals/{event_id}/action`
**Access:** `associate_dean`, `director`, `club_coordinator`, `super_admin`
**Description:** Take an approval action on an event. Moves the event through the approval chain.

```json
{
  "action": "approved",
  "remarks": "Looks good, approved!",
  "venue_clash_override": false,
  "venue_clash_override_reason": null
}
```

| `action` value | Description |
|-----------------|-------------|
| `approved` | Approve the event at this stage |
| `rejected` | Reject the event |
| `suggested_changes` | Send back to coordinator with change suggestions |

---

### `GET /approvals/{event_id}/history`
**Access:** `super_admin`, `director`, `associate_dean`, `club_coordinator`
**Description:** Get the full approval chain history for an event (all actions taken by all approvers).

---

## 🎟️ Registrations (`/registrations`)

### `POST /registrations/{event_id}/register`
**Access:** `student`
**Description:** Register the current student for an event. Checks event status, registration deadline, and department eligibility. Sends confirmation email.

_No request body required._

---

### `DELETE /registrations/{event_id}/cancel`
**Access:** `student`
**Description:** Cancel the current student's registration for an event.

_No request body required._

---

### `GET /registrations/{event_id}/list`
**Access:** `club_coordinator`, `associate_dean`, `director`, `super_admin`
**Description:** List all registered students for an event (with name, email, year, and registration date).

---

### `GET /registrations/my`
**Access:** `student`
**Description:** Get all events the current student is registered for.

---

### `POST /registrations/{event_id}/send-update`
**Access:** `club_coordinator`, `super_admin`, `associate_dean`, `director`
**Description:** Send a bulk email update to all registered students of an event.

| Query Param | Type | Description |
|-------------|------|-------------|
| `subject` | string | Email subject line |
| `message` | string | Email message body |

---

## 📊 Reports (`/reports`)

### `POST /reports/{event_id}/submit`
**Access:** `club_coordinator`, `super_admin`
**Description:** Submit a structured post-event report. Requires at least 1 photo upload first. Transitions event status from `completed` → `archived` and triggers docx generation.

```json
{
  "event_summary": "The event was a grand success with 150+ participants...",
  "actual_budget": 45000.00,
  "participant_count": 155,
  "outcomes": "Successfully trained students in ML fundamentals",
  "issues": "Minor AV issues in the first 30 minutes",
  "feedback": "Overall very positive feedback from attendees"
}
```

---

### `POST /reports/{event_id}/upload-photos`
**Access:** `club_coordinator`, `super_admin`
**Description:** Upload event photos for the post-event report (upload before submitting the report).

**Content-Type:** `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `files` | file[] | One or more photo files |

---

### `POST /reports/{event_id}/upload-attendance`
**Access:** `club_coordinator`, `super_admin`
**Description:** Upload the attendance sheet for an event.

**Content-Type:** `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `file` | file | Attendance document |

---

### `GET /reports/{event_id}/generate`
**Access:** `club_coordinator`, `super_admin`, `associate_dean`, `director`
**Description:** Download the auto-generated `.docx` report for an event. Regenerates if missing.

---

### `GET /reports/{event_id}`
**Access:** `club_coordinator`, `super_admin`, `associate_dean`, `director`
**Description:** Get the report metadata for an event.

---

### `POST /reports/{event_id}/upload-doc`
**Access:** `club_coordinator`, `super_admin`
**Description:** Upload a pre-made `.docx` report instead of using the structured form. Also transitions event to `archived`.

**Content-Type:** `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `file` | file | Pre-made report document |

---

## 📈 Dashboard (`/dashboard`)

### `GET /dashboard/coordinator`
**Access:** `club_coordinator`, `super_admin`
**Description:** 6-stat coordinator dashboard with event counts, participant numbers, status breakdown, type distribution, monthly trends, and top clubs.

**Response:**
```json
{
  "total_events_created": 12,
  "total_participants": 450,
  "events_by_status": { "approved": 5, "completed": 3, "draft": 4 },
  "events_by_type": { "technical": 8, "cultural": 4 },
  "events_by_month": [{ "month": "2026-01", "count": 2 }],
  "top_clubs_by_event_count": [{ "club_name": "Coding Club", "count": 8 }]
}
```

---

### `GET /dashboard/admin`
**Access:** `super_admin`, `director`
**Description:** System-wide admin dashboard with total events, registrations, user breakdown by role, event trends, and top clubs.

**Response:**
```json
{
  "total_events": 50,
  "total_registrations": 1200,
  "events_by_status": { "approved": 15, "completed": 20, "archived": 10 },
  "events_by_type": { "technical": 25, "cultural": 15, "sports": 10 },
  "users_by_role": { "student": 500, "club_coordinator": 10, "associate_dean": 5 },
  "events_by_month": [{ "month": "2026-01", "count": 5 }],
  "top_clubs_by_event_count": [{ "club_name": "Coding Club", "count": 12 }]
}
```

---

## 📁 Admin / File Serving (`/admin`)

### `GET /admin/files/{file_path}`
**Access:** Any authenticated user (role-based restrictions on internal docs)
**Description:** Serve uploaded files with access control. Internal documents and reports are restricted to staff. Prevents directory traversal attacks.

---

## 🏥 Health Check

### `GET /health`
**Access:** Public
**Description:** Check if the API is running.

**Response:**
```json
{
  "status": "ok",
  "version": "6.0.0"
}
```

---

## Event Lifecycle (Status Flow)

```
draft → pending_associate_dean → pending_director → approved → ongoing → completed → archived
                ↑                       ↑
                └── suggested_changes ──┘
                        ↓
                    (coordinator fixes & resubmits)

For collaborative events:
draft → pending_coordinator_parallel → pending_associate_dean → pending_director → approved

Any stage can lead to: rejected / cancelled
```

---

## Error Responses

All errors follow this format:

```json
{
  "detail": "Human-readable error message"
}
```

| Status Code | Meaning |
|-------------|---------|
| `400` | Bad request / Validation error |
| `401` | Unauthorized (missing or invalid token) |
| `403` | Forbidden (insufficient role/permissions) |
| `404` | Resource not found |
| `409` | Conflict (duplicate registration, venue clash) |
| `500` | Internal server error |
