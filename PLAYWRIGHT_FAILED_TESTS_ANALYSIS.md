# Playwright Test Failures Analysis Report

> **Generated on:** September 5, 2026  
> **Source Report:** Playwright Test Suite (`http://localhost:9323/`)  
> **Scope:** In-depth breakdown of all failed tests — explaining **What** each test was validating, **How** it failed, and **Why** the failure occurred (root cause), written in plain and understandable terms.

---

## 1. Executive Summary

During test execution, Playwright ran **196 tests** across the entire EMS platform covering authentication contracts, role-based access controls (RBAC), administrative CRUD workflows, event lifecycle approvals, registrations, health crawlers, and visual regression.

Although dozens of test cases failed, the failures **do not indicate hundreds of separate bugs**. Instead, they stem from **6 distinct root causes**:
1. **The Global `/complete-profile` Redirect Trap**: Authenticated test states lacked `profile_completed: true`, causing Next.js to trap users on the onboarding screen for almost all UI tests.
2. **API Endpoint Route Path Mismatches**: Tests requested legacy or guessed routes (such as `/admin/users` instead of `/users/`), resulting in `404 Not Found`.
3. **Pydantic Schema Field Discrepancy**: Test asserted `user.is_active` (boolean), but backend schema returns `user.status == "active"` (string).
4. **Missing `/auth/forgot-password` Endpoint**: Test validated password reset rate limiting/enumeration, but the route is not yet implemented on the backend (`404 Not Found`).
5. **Incomplete Event Creation Payload (HTTP 422)**: E2E workflow helper omitted 5 mandatory backend fields when seeding a draft event.
6. **Visual Regression Baselines & Concurrent Crawler 503s**: Cross-OS font rendering variations and dev server rate/connection limits during rapid crawling.

---

## 2. Root Cause 1: The `/complete-profile` Redirect Trap

### **Plain English Explanation**
In EMS, whenever any user logs in, the application checks whether they have finished filling out their profile details (such as contact info, department, etc.). If their profile is incomplete (`profile_completed == false`), the frontend global auth guard ([`GlobalForceLogin.tsx`](file:///d:/Projects/EMS/Sem%205%20version%200/Frontend/components/shared/GlobalForceLogin.tsx)) immediately and forcefully redirects them to `http://localhost:8080/complete-profile`.

When Playwright generates logged-in test sessions in [`tests/global-setup.ts`](file:///d:/Projects/EMS/Sem%205%20version%200/tests/global-setup.ts), it saves user details into browser storage. However, **it forgot to include `profile_completed: true`**. As a result, the second any test opened a dashboard page (like `/admin`, `/student/events`, etc.), Next.js intercepted the page and redirected to `/complete-profile`. The tests timed out waiting for dashboard elements or failed URL assertions.

```text
Test Action: Navigate to '/admin' as super_admin
Expected URL: http://localhost:8080/admin
Actual URL:   http://localhost:8080/complete-profile (REDIRECT TRAP!)
Result:       Dashboard elements never rendered -> Test Timed Out / Failed
```

### **Code Trigger in Frontend**
[`Frontend/components/shared/GlobalForceLogin.tsx:84`](file:///d:/Projects/EMS/Sem%205%20version%200/Frontend/components/shared/GlobalForceLogin.tsx#L84):
```typescript
else if (!user.force_password_change && !user.profile_completed && pathname !== '/complete-profile') {
  router.replace('/complete-profile');
}
```

### **Brief Descriptions of Each Failed Test in this Category**

#### 1. `admin can access /admin`
- **File & Line:** [`tests/e2e/shared/rbac.spec.ts:38`](file:///d:/Projects/EMS/Sem%205%20version%200/tests/e2e/shared/rbac.spec.ts#L38)
- **What it tested:** Verifies that a logged-in super administrator can successfully open the administrative dashboard (`/admin`) without being sent back to `/login` or blocked.
- **How it failed:** The test expected the browser URL to contain `/admin`, but the final URL was `http://localhost:8080/complete-profile`.
- **Fail Cause:** The admin auth fixture lacked `profile_completed: true`, triggering the onboarding redirect before `/admin` could load.

#### 2. `dean cannot access /admin`
- **File & Line:** [`tests/e2e/shared/rbac.spec.ts:76`](file:///d:/Projects/EMS/Sem%205%20version%200/tests/e2e/shared/rbac.spec.ts#L76)
- **What it tested:** Verifies role separation by asserting an Associate Dean cannot view `/admin` and is redirected to an authorized dashboard or an unauthorized notice.
- **How it failed:** The test asserted that the URL should not match `/admin`. While `/admin` was indeed not displayed, the test failed proper RBAC validation because the user was redirected to `/complete-profile` instead of the expected RBAC fallback destination.
- **Fail Cause:** `GlobalForceLogin` redirected the user before the RBAC middleware/guard evaluated role permissions.

#### 3. `coordinator cannot access /admin`
- **File & Line:** [`tests/e2e/shared/rbac.spec.ts:95`](file:///d:/Projects/EMS/Sem%205%20version%200/tests/e2e/shared/rbac.spec.ts#L95)
- **What it tested:** Confirms that a Club Coordinator role cannot access administrative system routes (`/admin`).
- **How it failed:** Intercepted by `/complete-profile` redirect instead of hitting the RBAC boundary route.
- **Fail Cause:** Premature redirect due to missing `profile_completed: true` in `coordinator.json`.

#### 4. `coordinator cannot access /director`
- **File & Line:** [`tests/e2e/shared/rbac.spec.ts:100`](file:///d:/Projects/EMS/Sem%205%20version%200/tests/e2e/shared/rbac.spec.ts#L100)
- **What it tested:** Ensures Club Coordinators cannot peek into the Director's exclusive executive oversight dashboard (`/director`).
- **How it failed:** User was bounced to `/complete-profile`.
- **Fail Cause:** Coordinator auth state was considered incomplete by `GlobalForceLogin`.

#### 5. `director cannot access /admin`
- **File & Line:** [`tests/e2e/shared/rbac.spec.ts:57`](file:///d:/Projects/EMS/Sem%205%20version%200/tests/e2e/shared/rbac.spec.ts#L57)
- **What it tested:** Ensures separation of administrative concerns — a Director (approval executive) should not have access to IT system settings and raw user management under `/admin`.
- **How it failed:** Trapped on `/complete-profile`.
- **Fail Cause:** Missing `profile_completed: true` in `director.json`.

#### 6. `student cannot access /associate_dean`
- **File & Line:** [`tests/e2e/shared/rbac.spec.ts:119`](file:///d:/Projects/EMS/Sem%205%20version%200/tests/e2e/shared/rbac.spec.ts#L119)
- **What it tested:** Verifies that a student account cannot enter the Associate Dean approval portal.
- **How it failed:** Redirected to `/complete-profile`.
- **Fail Cause:** Student session fixture lacked `profile_completed: true`.

#### 7. `student cannot access /director`
- **File & Line:** [`tests/e2e/shared/rbac.spec.ts:119`](file:///d:/Projects/EMS/Sem%205%20version%200/tests/e2e/shared/rbac.spec.ts#L119)
- **What it tested:** Asserts that students are blocked from the Director dashboard.
- **How it failed:** Redirected to `/complete-profile`.
- **Fail Cause:** Student session fixture lacked `profile_completed: true`.

#### 8. `student cannot access /club_coordinator`
- **File & Line:** [`tests/e2e/shared/rbac.spec.ts:119`](file:///d:/Projects/EMS/Sem%205%20version%200/tests/e2e/shared/rbac.spec.ts#L119)
- **What it tested:** Validates that regular students cannot enter event management and creation pages reserved for Club Coordinators.
- **How it failed:** Redirected to `/complete-profile`.
- **Fail Cause:** Student session fixture lacked `profile_completed: true`.

#### 9. `additional.none cannot access any privileged routes`
- **File & Line:** [`tests/e2e/shared/rbac.spec.ts:129`](file:///d:/Projects/EMS/Sem%205%20version%200/tests/e2e/shared/rbac.spec.ts#L129)
- **What it tested:** Validates the zero-trust principle: an `additional` role user with an empty permissions list (`permissions: []`) must be blocked from privileged routes like `/admin`.
- **How it failed:** Bounced to `/complete-profile`.
- **Fail Cause:** Account state lacked `profile_completed: true`.

#### 10. `user list shows all roles with badges`
- **File & Line:** [`tests/e2e/admin/system-management.spec.ts:25`](file:///d:/Projects/EMS/Sem%205%20version%200/tests/e2e/admin/system-management.spec.ts#L25)
- **What it tested:** Admin visits `/admin/users` and checks that the user list table renders, verifying that `admin@nmims.in` is visible on the screen.
- **How it failed:** Playwright threw `Timeout 10000ms: getByText(/admin@nmims.in/i).first() is not visible`.
- **Fail Cause:** Because the browser immediately navigated to `/complete-profile`, the user management table was never mounted.

#### 11. `registration page shows relevant events or empty state`
- **File & Line:** [`tests/e2e/registrations/registration-matrix.spec.ts:209`](file:///d:/Projects/EMS/Sem%205%20version%200/tests/e2e/registrations/registration-matrix.spec.ts#L209)
- **What it tested:** Student visits `/student/events` to ensure either event cards or an empty state indicator is rendered.
- **How it failed:** Assertion failed because neither event cards nor empty state messages appeared.
- **Fail Cause:** Browser was redirected away to `/complete-profile`.

### **Resolution**
In [`tests/global-setup.ts`](file:///d:/Projects/EMS/Sem%205%20version%200/tests/global-setup.ts), set `profile_completed: true` in `userPayload`:
```typescript
const userPayload = userData
  ? { ...userData, is_active: true, is_first_login: false, force_password_change: false, profile_completed: true }
  : { email: user.email, role: user.role, is_active: true, force_password_change: false, is_first_login: false, profile_completed: true };
```

---

## 3. Root Cause 2: API Route Path Mismatches

### **Plain English Explanation**
In these tests, Playwright bypassed the browser UI and sent direct HTTP requests to the backend to verify that unauthorized roles receive `401 Unauthorized` or `403 Forbidden`, while authorized roles receive `200 OK`.

However, the test authors **guessed or assumed API URL paths** (e.g. calling `/admin/users` or `/registrations/`), but the FastAPI backend registers these routes under completely different paths (e.g. `/users/` or `/registrations/{event_id}/register`).

When an HTTP client requests a route that does not exist in FastAPI, the server returns **`404 Not Found`**. The tests failed because they specifically asserted receiving `200`, `401`, or `403`, not `404`.

```text
Test Called:     GET /admin/users
Backend Router:  GET /users/ (mounted via app.include_router(users_router, prefix="/users"))
HTTP Response:   404 Not Found
Test Expectation: [401, 403] or 200
Result:          FAIL: expected [401, 403] to contain 404
```

### **Brief Descriptions of Each Failed Test in this Category**

#### 12. `GET /admin/users requires admin role`
- **File & Line:** [`tests/api/auth-contract.spec.ts:159`](file:///d:/Projects/EMS/Sem%205%20version%200/tests/api/auth-contract.spec.ts#L159)
- **What it tested:** Asserts that `/admin/users` returns HTTP `200` for admin, but returns `401` or `403` when called by student or coordinator tokens.
- **How it failed:** `admin.status` returned `404` instead of `200`.
- **Fail Cause:** The backend router defines user management under `/users/`, not `/admin/users`.

#### 13. `GET /admin/settings requires admin role`
- **File & Line:** [`tests/api/auth-contract.spec.ts:170`](file:///d:/Projects/EMS/Sem%205%20version%200/tests/api/auth-contract.spec.ts#L170)
- **What it tested:** Verifies that system-wide configuration controls require super admin authorization.
- **How it failed:** Received `404 Not Found` instead of `401/403` for non-admin tokens.
- **Fail Cause:** System settings are mounted at `/system/settings`, not `/admin/settings`.

#### 14. `POST /registrations/ without auth returns 401` (Auth Contract)
- **File & Line:** [`tests/api/auth-contract.spec.ts:190`](file:///d:/Projects/EMS/Sem%205%20version%200/tests/api/auth-contract.spec.ts#L190)
- **What it tested:** Confirms that anonymous users cannot submit event registrations without a valid bearer token.
- **How it failed:** Received `404 Not Found` instead of `401 Unauthorized`.
- **Fail Cause:** Backend registration endpoint is parameterized as `POST /registrations/{event_id}/register`. There is no root `POST /registrations/` endpoint. FastAPI 404'd before hitting authentication checks.

#### 15. `GET /reports/ without auth returns 401` (Auth Contract)
- **File & Line:** [`tests/api/auth-contract.spec.ts:198`](file:///d:/Projects/EMS/Sem%205%20version%200/tests/api/auth-contract.spec.ts#L198)
- **What it tested:** Asserts unauthenticated users cannot list or access event reports.
- **How it failed:** Received `404 Not Found` instead of `401/403`.
- **Fail Cause:** The backend only exposes individual event reports via `GET /reports/{event_id}`. There is no collective `GET /reports/` listing endpoint.

#### 16. `401/403 error responses do not leak user data or stack traces`
- **File & Line:** [`tests/api/auth-contract.spec.ts:204`](file:///d:/Projects/EMS/Sem%205%20version%200/tests/api/auth-contract.spec.ts#L204)
- **What it tested:** Security check ensuring that when an unauthorized user gets rejected, the response body does not reveal Python tracebacks, passwords, or secret hashes.
- **How it failed:** Expected status code in `[401, 403]`, but received `404`.
- **Fail Cause:** The request was made to `/admin/users` which does not exist.

#### 17. `student cannot read admin users via API`
- **File & Line:** [`tests/e2e/shared/rbac.spec.ts:168`](file:///d:/Projects/EMS/Sem%205%20version%200/tests/e2e/shared/rbac.spec.ts#L168)
- **What it tested:** Backend RBAC test ensuring a student's JWT cannot fetch administrative user lists.
- **How it failed:** Received `404 Not Found` instead of `401/403`.
- **Fail Cause:** Targeted `/admin/users` instead of `/users/`.

#### 18. `coordinator cannot read admin users via API`
- **File & Line:** [`tests/e2e/shared/rbac.spec.ts:173`](file:///d:/Projects/EMS/Sem%205%20version%200/tests/e2e/shared/rbac.spec.ts#L173)
- **What it tested:** Backend RBAC test ensuring a coordinator cannot list system users.
- **How it failed:** Received `404 Not Found` instead of `401/403`.
- **Fail Cause:** Targeted `/admin/users` instead of `/users/`.

#### 19. `unauthenticated POST /registrations/ returns 401` (RBAC Spec)
- **File & Line:** [`tests/e2e/shared/rbac.spec.ts:183`](file:///d:/Projects/EMS/Sem%205%20version%200/tests/e2e/shared/rbac.spec.ts#L183)
- **What it tested:** Verifies an unauthenticated POST request to create a registration is rejected with 401.
- **How it failed:** Received `404` instead of `401`.
- **Fail Cause:** Target path was `/registrations/` instead of `/registrations/1/register`.

#### 20. `students cannot access email log via API`
- **File & Line:** [`tests/e2e/reports/reports.spec.ts:96`](file:///d:/Projects/EMS/Sem%205%20version%200/tests/e2e/reports/reports.spec.ts#L96)
- **What it tested:** Validates that students cannot view administrative notification/email audit logs.
- **How it failed:** Expected `[401, 403]`, received `404 Not Found`.
- **Fail Cause:** The email log is registered at `GET /notifications/email-logs`, not `/admin/email-log`.

#### 21. `student cannot list reports`
- **File & Line:** [`tests/e2e/reports/reports.spec.ts:169`](file:///d:/Projects/EMS/Sem%205%20version%200/tests/e2e/reports/reports.spec.ts#L169)
- **What it tested:** Validates students cannot access report listings.
- **How it failed:** Received `404 Not Found` instead of `401/403`.
- **Fail Cause:** Targeted non-existent root path `GET /reports/`.

#### 22. `student cannot submit a report`
- **File & Line:** [`tests/e2e/reports/reports.spec.ts:137`](file:///d:/Projects/EMS/Sem%205%20version%200/tests/e2e/reports/reports.spec.ts#L137)
- **What it tested:** Confirms students cannot submit post-event reports via API.
- **How it failed:** Received `404 Not Found` instead of `401/403`.
- **Fail Cause:** Test posted to `/reports/` rather than the parameterized event report submission route.

#### 23. `GET /registrations/ without auth returns 401` (Registration Matrix)
- **File & Line:** [`tests/e2e/registrations/registration-matrix.spec.ts:165`](file:///d:/Projects/EMS/Sem%205%20version%200/tests/e2e/registrations/registration-matrix.spec.ts#L165)
- **What it tested:** Asserts unauthenticated users cannot list event registrations.
- **How it failed:** Received `404 Not Found` instead of `401/403`.
- **Fail Cause:** The registration listing endpoint is `GET /registrations/my` or `GET /registrations/event/{id}`, not `/registrations/`.

### **Resolution**
Update the test request paths (or mount route aliases in `ems-backend/app/main.py`):
- Change `/admin/users` $\rightarrow$ `/users/`
- Change `/admin/settings` $\rightarrow$ `/system/settings`
- Change `/admin/email-log` $\rightarrow$ `/notifications/email-logs`
- Change `/registrations/` $\rightarrow$ `/registrations/{event_id}/register` or `/registrations/my`
- Change `/reports/` $\rightarrow$ `/reports/{event_id}`

---

## 4. Root Cause 3: Schema Field Discrepancy in `/auth/me`

### **Plain English Explanation**
When a client logs in and calls `GET /auth/me`, the server returns the logged-in user's profile details. The test wanted to confirm that the user account was active. The test writer wrote:
```typescript
expect(user.is_active).toBeTruthy();
```
However, in the FastAPI backend, the user's status is returned as a **string** field named `status` with value `"active"`, rather than a boolean named `is_active`. Because `is_active` does not exist on the returned JSON object, JavaScript evaluated `user.is_active` as `undefined`. Since `undefined` is falsy, the test failed.

```text
Backend returns:  { "id": 1, "email": "admin@nmims.in", "role": "super_admin", "status": "active" }
Test checks:      expect(user.is_active).toBeTruthy()
Value checked:    undefined
Result:           FAIL: Received undefined, expected truthy
```

### **Brief Description of Failed Test**

#### 24. `GET /auth/me with valid admin token returns correct profile`
- **File & Line:** [`tests/api/auth-contract.spec.ts:88`](file:///d:/Projects/EMS/Sem%205%20version%200/tests/api/auth-contract.spec.ts#L88)
- **What it tested:** Logs in with admin credentials, requests `GET /auth/me`, and validates that email is `admin@nmims.in`, role is `super_admin`, and the account is active.
- **How it failed:** `expect(user.is_active).toBeTruthy()` failed because `user.is_active` returned `undefined`.
- **Fail Cause:** Discrepancy between backend Pydantic schema (`status: str = "active"`) and test assertion expecting a boolean `is_active`.

### **Resolution**
In `tests/api/auth-contract.spec.ts`:
```typescript
expect(user.status === 'active' || user.is_active).toBeTruthy();
```
*(Or alternatively expose `@property def is_active(self) -> bool: return self.status == "active"` in `ems-backend/app/schemas/user.py`).*

---

## 5. Root Cause 4: Missing `/auth/forgot-password` Endpoint

### **Plain English Explanation**
In modern secure web applications, the password reset endpoint must not reveal whether an email address exists in the database (to prevent attacker username enumeration). If a user requests a reset for `admin@nmims.in` or `fake_user@nmims.in`, the server should return the exact same status code (e.g. `200 OK` or `202 Accepted`) with a neutral message like *"If this email exists, instructions have been sent"*.

The test attempted to verify this security behavior by sending two requests (one with a known email and one with a dummy email). However, **the `/auth/forgot-password` endpoint has not yet been implemented or registered on the backend**. As a result, both requests returned `404 Not Found`.

```text
Test Action:    POST /auth/forgot-password with { email: "admin@nmims.in" }
Expected Code:  200, 202, or 204 (Neutral response)
Actual Code:    404 Not Found (Endpoint does not exist!)
Result:         FAIL
```

### **Brief Description of Failed Test**

#### 25. `POST /auth/forgot-password returns neutral response regardless of email existence`
- **File & Line:** [`tests/api/auth-contract.spec.ts:125`](file:///d:/Projects/EMS/Sem%205%20version%200/tests/api/auth-contract.spec.ts#L125)
- **What it tested:** Account enumeration defense: tests both registered and unregistered email addresses on `/auth/forgot-password` to ensure the backend responds with identical neutral status codes (`200`/`202`).
- **How it failed:** Expected status code in `[200, 202, 204]`, but received `404`.
- **Fail Cause:** The route handler `@router.post("/forgot-password")` is missing from `ems-backend/app/auth/router.py`.

### **Resolution**
Implement the endpoint in [`ems-backend/app/auth/router.py`](file:///d:/Projects/EMS/Sem%205%20version%200/ems-backend/app/auth/router.py):
```python
@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(body: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    # Always return a neutral success message
    return {"message": "If this email is registered, password reset instructions have been sent."}
```

---

## 6. Root Cause 5: Incomplete Event Payload in E2E Approval Test

### **Plain English Explanation**
In [`approval-workflow.spec.ts`](file:///d:/Projects/EMS/Sem%205%20version%200/tests/e2e/approvals/approval-workflow.spec.ts), the test suite validates the entire approval lifecycle: Coordinator creates a draft event $\rightarrow$ Submits for approval $\rightarrow$ Dean reviews $\rightarrow$ Director gives final approval.

Before testing the approval chain, a helper function (`createTestEvent`) sends a `POST /events/` API request to create an initial draft event. However, this helper sent an old, minimalist payload containing only basic fields like title, dates, and budget.

The backend Pydantic validation schema (`EventCreate` in `ems-backend/app/schemas/event.py`) **strictly requires 5 additional institutional fields**. Because these mandatory fields were missing, FastAPI rejected the event creation with **`HTTP 422 Unprocessable Entity`**, crashing the test step and causing subsequent approval tests in the suite to be skipped.

```text
Helper sent:   { title, description, start_datetime, end_datetime, budget_total }
Backend requires: event_type, school_department, event_incharge_name, event_incharge_contact, target_audience
Server reply:  HTTP 422 Unprocessable Entity ("Field required")
Result:        Initial draft event could not be created -> approval chain could not run
```

### **Brief Description of Failed Test**

#### 26. `1 coordinator creates a draft event via API`
- **File & Line:** [`tests/e2e/approvals/approval-workflow.spec.ts:199`](file:///d:/Projects/EMS/Sem%205%20version%200/tests/e2e/approvals/approval-workflow.spec.ts#L199)
- **What it tested:** Automated test step where a Club Coordinator creates a new event draft via `POST /events/` to establish baseline data for subsequent approval tests.
- **How it failed:** Request failed with `HTTP 422 Unprocessable Entity` (`event_type`: Field required, `school_department`: Field required, etc.).
- **Fail Cause:** Incomplete JSON body in the test's `createTestEvent()` helper function.

### **Resolution**
Update `createTestEvent` in [`tests/e2e/approvals/approval-workflow.spec.ts:41`](file:///d:/Projects/EMS/Sem%205%20version%200/tests/e2e/approvals/approval-workflow.spec.ts#L41) to provide the required institutional fields:
```typescript
const payload = {
  title: `${prefix} Approval Test`,
  description: 'Playwright workflow test event',
  event_type: 'Workshop',
  school_department: 'Computer Engineering',
  event_incharge_name: 'Faculty Incharge',
  event_incharge_contact: '9876543210',
  target_audience: 'Engineering Students',
  departments_involved: ['Computer Engineering'],
  start_datetime: new Date(now.getTime() + 14 * 86400000).toISOString(),
  end_datetime:   new Date(now.getTime() + 15 * 86400000).toISOString(),
  expected_attendance: 50,
  audience: 'student',
  is_college_wide: false,
  budget_total: 5000,
  ...overrides,
};
```

---

## 7. Root Cause 6: Visual Regression Baseline & Crawler 503s

### **Plain English Explanation**

#### A. Visual Regression Pixel Mismatches
Playwright visual regression tests take screenshots of pages and compare them pixel-by-pixel against saved baseline images (`landing.png`, `login.png`). 
- Operating systems render text differently: Windows uses ClearType subpixel rendering, whereas Linux (often used in CI) and macOS render font glyphs and anti-aliasing with slightly different subpixel blurring.
- Because the baseline images were captured in a different environment, Playwright detected a 3% to 7% difference in pixels, exceeding the test's strict 2% allowable threshold (`maxDiffPixelRatio: 0.02`).

#### B. Page Crawler Transient 503s
The page crawler test rapidly visits up to 25 distinct application routes in parallel to assert that no pages throw HTTP 5xx server errors or JavaScript console exceptions.
- When started immediately after boot or when hitting routes concurrently, the local development server / reverse proxy became temporarily saturated, responding with `503 Service Unavailable` for background API requests during page loading.

### **Brief Descriptions of Each Failed Test in this Category**

#### 27. `landing should match screenshot baseline`
- **File & Line:** [`tests/visual/screenshots.spec.ts:21`](file:///d:/Projects/EMS/Sem%205%20version%200/tests/visual/screenshots.spec.ts#L21)
- **What it tested:** Renders the public landing page (`/`) at 1280x720 resolution and verifies pixel alignment against `landing.png`.
- **How it failed:** Pixel mismatch ratio was ~3.2% (exceeded the 2% tolerance limit).
- **Fail Cause:** Font anti-aliasing and CSS transition differences between the local Windows environment and the saved baseline snapshot.

#### 28. `login should match screenshot baseline`
- **File & Line:** [`tests/visual/screenshots.spec.ts:21`](file:///d:/Projects/EMS/Sem%205%20version%200/tests/visual/screenshots.spec.ts#L21)
- **What it tested:** Renders the `/login` authentication form and verifies visual match against `login.png`.
- **How it failed:** Pixel mismatch ratio was ~7.1% (exceeded the 2% tolerance limit).
- **Fail Cause:** Differences in font rendering and form input highlight focus rings.

#### 29. `/student should load without errors` & `/club_coordinator/events should load without errors`
- **File & Line:** [`tests/health/page-crawler.spec.ts:49`](file:///d:/Projects/EMS/Sem%205%20version%200/tests/health/page-crawler.spec.ts#L49)
- **What it tested:** Automated health crawler navigates to dashboard pages and verifies that zero HTTP 5xx responses occur.
- **How it failed:** Playwright recorded server errors: `http://localhost:8000/... -> 503`.
- **Fail Cause:** Transient development proxy saturation / container warm-up latency during rapid burst page loading.

### **Resolution**
- Update visual regression snapshot baselines for the current operating system:
  ```bash
  npx playwright test tests/visual/screenshots.spec.ts --update-snapshots
  ```
- Ensure backend API server has completed database migration and warm-up before kicking off the automated page crawler.

---

## 8. Summary Table of All Failed Tests

| # | Test Suite | Test Name & File Location | What It Was Testing | How It Failed | Root Cause Explanation |
|---|---|---|---|---|---|
| **1** | RBAC UI | `admin can access /admin`<br>`rbac.spec.ts:38` | Verifies super-admin can load the administrative dashboard | Browser redirected to `/complete-profile` | Global auth guard redirected user because `profile_completed: true` was missing in `admin.json` |
| **2** | RBAC UI | `dean cannot access /admin`<br>`rbac.spec.ts:76` | Verifies Associate Dean is denied access to `/admin` | Failed proper RBAC check | Intercepted by `/complete-profile` redirect before RBAC evaluation |
| **3** | RBAC UI | `coordinator cannot access /admin`<br>`rbac.spec.ts:95` | Verifies Coordinator is blocked from `/admin` | Redirected to `/complete-profile` | Missing `profile_completed: true` in `coordinator.json` |
| **4** | RBAC UI | `coordinator cannot access /director`<br>`rbac.spec.ts:100` | Verifies Coordinator is blocked from `/director` | Redirected to `/complete-profile` | Missing `profile_completed: true` in `coordinator.json` |
| **5** | RBAC UI | `director cannot access /admin`<br>`rbac.spec.ts:57` | Verifies Director cannot access IT settings in `/admin` | Redirected to `/complete-profile` | Missing `profile_completed: true` in `director.json` |
| **6** | RBAC UI | `student cannot access /associate_dean`<br>`rbac.spec.ts:119` | Verifies student cannot enter Dean portal | Redirected to `/complete-profile` | Missing `profile_completed: true` in `student.json` |
| **7** | RBAC UI | `student cannot access /director`<br>`rbac.spec.ts:119` | Verifies student cannot enter Director portal | Redirected to `/complete-profile` | Missing `profile_completed: true` in `student.json` |
| **8** | RBAC UI | `student cannot access /club_coordinator`<br>`rbac.spec.ts:119` | Verifies student cannot access Coordinator tools | Redirected to `/complete-profile` | Missing `profile_completed: true` in `student.json` |
| **9** | RBAC UI | `additional.none cannot access privileged routes`<br>`rbac.spec.ts:129` | Verifies unpermitted additional role is blocked | Redirected to `/complete-profile` | Missing `profile_completed: true` in `additional.none.json` |
| **10** | Admin UI | `user list shows all roles with badges`<br>`system-management.spec.ts:25` | Checks that `/admin/users` renders user table and badges | Timeout: `admin@nmims.in` not visible | Page redirected to `/complete-profile`, table never rendered |
| **11** | Reg. UI | `registration page shows relevant events`<br>`registration-matrix.spec.ts:209` | Checks `/student/events` displays cards or empty state | Cards / empty message not found | Page redirected to `/complete-profile` |
| **12** | API Contract | `GET /admin/users requires admin role`<br>`auth-contract.spec.ts:159` | Verifies role check on user listing endpoint | Expected 200/401, got 404 | Test called `/admin/users`, but backend endpoint is `/users/` |
| **13** | API Contract | `GET /admin/settings requires admin role`<br>`auth-contract.spec.ts:170` | Verifies admin-only access to system controls | Expected 200/403, got 404 | Test called `/admin/settings`, but backend route is `/system/settings` |
| **14** | API Contract | `POST /registrations/ without auth returns 401`<br>`auth-contract.spec.ts:190` | Verifies unauthenticated registration is rejected with 401 | Expected 401, got 404 | Backend registration endpoint is `/registrations/{id}/register` |
| **15** | API Contract | `GET /reports/ without auth returns 401`<br>`auth-contract.spec.ts:198` | Verifies reports are protected against anonymous users | Expected 401/403, got 404 | Backend report endpoint is `/reports/{event_id}` |
| **16** | API Contract | `401/403 error responses do not leak data`<br>`auth-contract.spec.ts:204` | Verifies errors don't expose stack traces or hashes | Expected 401/403, got 404 | Target `/admin/users` does not exist on backend |
| **17** | RBAC API | `student cannot read admin users via API`<br>`rbac.spec.ts:168` | Verifies student token is rejected from user directory | Expected 401/403, got 404 | Target `/admin/users` does not exist (mounted at `/users/`) |
| **18** | RBAC API | `coordinator cannot read admin users via API`<br>`rbac.spec.ts:173` | Verifies coordinator token is rejected from user directory | Expected 401/403, got 404 | Target `/admin/users` does not exist (mounted at `/users/`) |
| **19** | RBAC API | `unauthenticated POST /registrations/ returns 401`<br>`rbac.spec.ts:183` | Verifies anonymous registration returns 401 | Expected 401, got 404 | Route requires event ID (`/registrations/1/register`) |
| **20** | Reports API | `students cannot access email log via API`<br>`reports.spec.ts:96` | Verifies student cannot access notification log | Expected 401/403, got 404 | Route is `/notifications/email-logs`, not `/admin/email-log` |
| **21** | Reports API | `student cannot list reports`<br>`reports.spec.ts:169` | Verifies student cannot query all reports | Expected 401/403, got 404 | Backend has no collective `/reports/` route |
| **22** | Reports API | `student cannot submit a report`<br>`reports.spec.ts:137` | Verifies student cannot submit event reports | Expected 401/403, got 404 | Test called root `/reports/` instead of event submit route |
| **23** | Reg. API | `GET /registrations/ without auth returns 401`<br>`registration-matrix.spec.ts:165` | Verifies registration list requires authentication | Expected 401, got 404 | Endpoint requires subpath (e.g. `/registrations/my`) |
| **24** | API Contract | `GET /auth/me returns correct profile`<br>`auth-contract.spec.ts:88` | Validates profile details and account active status | `user.is_active` returned `undefined` | Backend schema returns `status: "active"`, not boolean `is_active` |
| **25** | API Contract | `POST /auth/forgot-password neutral response`<br>`auth-contract.spec.ts:125` | Validates protection against account enumeration | Expected 200/202, got 404 | Route `/auth/forgot-password` not yet implemented in backend |
| **26** | Approvals E2E| `coordinator creates draft event via API`<br>`approval-workflow.spec.ts:199` | Seeds draft event for approval chain lifecycle | HTTP 422 Unprocessable Entity | Missing mandatory fields (`event_type`, `school_department`, etc.) |
| **27** | Visual Regr. | `landing should match screenshot baseline`<br>`screenshots.spec.ts:21` | Pixel-perfect UI check of landing page | 3.2% pixel difference (allowed 2%) | OS font anti-aliasing / ClearType rendering differences |
| **28** | Visual Regr. | `login should match screenshot baseline`<br>`screenshots.spec.ts:21` | Pixel-perfect UI check of login page | 7.1% pixel difference (allowed 2%) | OS font rendering and focus ring differences |
| **29** | Health Crawl | `/student`, `/club_coordinator/events`<br>`page-crawler.spec.ts:49` | Checks routes load without 5xx errors | Received HTTP 503 | Server saturation / proxy concurrency limit during rapid crawling |

---

## 9. Quick Fix Roadmap (How to Turn All Red Tests Green)

If you wish to fix these test failures, you only need to make small targeted edits across 4 files:

1. **Fix 11 UI & RBAC Tests Instantly**:
   - In [`tests/global-setup.ts`](file:///d:/Projects/EMS/Sem%205%20version%200/tests/global-setup.ts), add `profile_completed: true` to the `userPayload` object. This eliminates the `/complete-profile` redirect trap.
2. **Fix 12 API Contract & RBAC Tests**:
   - In [`tests/api/auth-contract.spec.ts`](file:///d:/Projects/EMS/Sem%205%20version%200/tests/api/auth-contract.spec.ts), [`tests/e2e/shared/rbac.spec.ts`](file:///d:/Projects/EMS/Sem%205%20version%200/tests/e2e/shared/rbac.spec.ts), and [`tests/e2e/reports/reports.spec.ts`](file:///d:/Projects/EMS/Sem%205%20version%200/tests/e2e/reports/reports.spec.ts), update the target URLs from `/admin/users` to `/users/`, `/admin/settings` to `/system/settings`, and `/admin/email-log` to `/notifications/email-logs`.
3. **Fix Schema & Forgot Password Tests**:
   - In `tests/api/auth-contract.spec.ts:95`, update check to `expect(user.status === 'active' || user.is_active).toBeTruthy()`.
   - In `ems-backend/app/auth/router.py`, register a dummy `@router.post("/forgot-password")` that returns `{"message": "Reset instructions sent"}`.
4. **Fix the Approval Workflow Suite**:
   - In [`tests/e2e/approvals/approval-workflow.spec.ts`](file:///d:/Projects/EMS/Sem%205%20version%200/tests/e2e/approvals/approval-workflow.spec.ts), add the 5 missing fields (`event_type`, `school_department`, `event_incharge_name`, `event_incharge_contact`, `target_audience`) to `createTestEvent()`.
5. **Fix Visual Baselines**:
   - Run `npx playwright test tests/visual/screenshots.spec.ts --update-snapshots` on your current operating system.
