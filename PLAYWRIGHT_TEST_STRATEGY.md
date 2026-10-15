# EMS Playwright Test Strategy

## 1. Purpose and success criteria

This document is the single operating plan for automated browser testing of EMS.
It is intentionally scenario-led: a test must prove an observable business rule,
not merely that a route renders.

The suite is successful when it can reliably prove that:

- users can complete the workflows granted to their role and permission set;
- users cannot read or mutate data outside that access;
- event workflow, venue, registration, reporting, and system-control rules hold
  at both UI and API boundaries;
- a test run is repeatable against the seeded local or CI database; and
- failures produce enough evidence to diagnose the broken rule quickly.

This is a large product. Do **not** try to create one test for every possible
combination of field values. Use pairwise coverage for ordinary form fields and
full scenario coverage for security, approvals, registration, and irreversible
state transitions.

## 2. Test layers and execution lanes

| Lane | Scope | Mutates data | Browser coverage | When it runs |
|---|---|---:|---|---|
| `smoke` | health, login, critical public pages, navigation | No | Chromium | every PR |
| `api-contract` | authentication, validation, authorization, response shapes | Controlled | API request context | every PR |
| `rbac` | route and API denial/allow matrix | No | Chromium | every PR |
| `workflow` | create → approve → register → report scenarios | Yes, isolated | Chromium | every PR |
| `regression` | full CRUD and edge cases for each feature | Yes, isolated | Chromium | nightly / release |
| `a11y` | critical page accessibility scans | No | Chromium | every PR; full nightly |
| `visual` | stable public/auth/admin visual baselines | No | Chromium | nightly / intentional UI change |
| `cross-browser` | critical smoke and workflows | Yes, isolated | Chromium, Firefox, WebKit | nightly / release |
| `mobile` | public, auth, registration, navigation | No or isolated | Pixel 5, iPhone 13 | nightly / release |

`npm run test` must remain a fast Chromium gate. Do not run all browsers,
screenshots, or the crawler as part of the default PR path.

## 3. Non-negotiable rules and restrictions

1. **Never run destructive tests against a shared, staging, or production DB.**
   Playwright must use a dedicated database with `TEST_MODE=true` and a distinct
   storage root.
2. **Never rely on a production-like email/SMS service.** Mock or inspect the
   local email task/outbox. A test may assert a notification record, not deliver
   to a real person.
3. **Every test owns the records it mutates.** Create data using a unique run
   prefix (for example `PW-${workerIndex}-${timestamp}`) and delete it through a
   test-only cleanup endpoint or a direct database fixture.
4. **Never use `waitForTimeout` as synchronization for business actions.** Wait
   for a response, URL change, toast, row, or explicit event status instead.
5. **Use accessible locators first:** `getByRole`, `getByLabel`, `getByText`
   with exact intent, then `data-testid`. Do not select by CSS layout classes,
   nth-child, generated IDs, or visible icon-only markup.
6. **Keep browser tests independent.** They may run in any order and in
   parallel. One scenario must never depend on another scenario's event.
7. **Assert the business effect, not only success text.** After saving a
   permission, reload or query the API and prove it persisted.
8. **Do not test implementation details.** Tests should not assert Zustand
   internals, React component names, SQL statements, or exact Tailwind classes.
9. **Freeze or control time for time-sensitive tests.** Registration and status
   transition tests must create dates relative to a test clock, never hard-code
   calendar dates.
10. **Keep test credentials in test-only configuration.** Do not put passwords
    in user-facing docs, screenshots, traces, or browser logs.
11. **Reset global settings in `afterEach`/fixture teardown.** In particular:
    `disable_student_registration`, `disable_role_signup`, and `force_login`.
12. **Any new feature must add or update:** one positive scenario, one denied
    scenario, data fixture changes if applicable, and a row in this document's
    coverage matrix.

## 4. Test data contract

Run before Playwright:

```bash
docker compose exec backend alembic upgrade head
docker compose exec backend python seed_all_test_data.py
```

The seed suite is idempotent and establishes stable read-only fixture accounts
and `[TEST]` event scenarios. Mutation tests must create their own records; do
not edit shared seeded events because parallel tests would race.

### 4.1 Seeded account matrix

All fixture accounts use the test password configured for the test environment.

| Key | Account purpose | Required state |
|---|---|---|
| `admin` | super-admin governance and setup | active |
| `director` | final approval | active |
| `dean` | departmental approval | Engineering |
| `coordinator` | event creation/reporting | Google DSC / Engineering |
| `student` | eligible in-campus registration | Engineering |
| `additional.viewer` | ordinary read-only Additional user | view events/details |
| `additional.manager` | delegated permission manager | manage permissions |
| `additional.none` | Additional user denied all access | no permissions |
| `additional.full` | every ordinary dynamic permission | no coordinator type |
| `student.coordinator` | Additional student coordinator | type `student`, Registration permission |
| `faculty.coordinator` | Additional faculty coordinator | type `Faculty`, Registration plus report preset |

Extend `tests/global-setup.ts` and `tests/fixtures/base.fixture.ts` with all
accounts above before implementing their browser scenarios. The role fixtures
must create separate browser contexts; a storage state must never be reused for
a different role.

### 4.2 Seeded event matrix

The event seed script owns named `[TEST]` events for read-only tests.

| Scenario | Primary assertion |
|---|---|
| Student Registration Open | student/student coordinator can register |
| Faculty Registration Open | only faculty coordinator can register |
| Student and Faculty Registration Open | both coordinator types and visitor flow work |
| Registration Not Yet Open | registration is rejected before start |
| Registration Closed | registration is rejected after deadline |
| Draft Event | non-public event remains private |
| Associate Dean Approval Pending | dean queue and decision controls |
| Collaborative Approval Pending | parallel coordinator approval behavior |
| Director Approval Pending | director queue and decision controls |
| Completed Standard Report | standard report visibility/submission rules |
| Archived RnD Report | R&D report visibility/submission rules |
| Suggested Changes / Rejected / Cancelled | terminal and rework states are visible correctly |

## 5. Required test architecture

```text
tests/
  api/                 # request-context contract and permission tests
  e2e/
    auth/
    public/
    admin/
    approvals/
    events/
    registrations/
    reports/
    additional/
    shared/
  accessibility/
  visual/
  health/
  fixtures/
    auth.fixture.ts
    data.fixture.ts    # create/cleanup isolated entities
    role.fixture.ts
  helpers/
    api.ts             # typed API client, no raw fetch in specs
    dates.ts           # test-clock/date factory
    selectors.ts       # semantic test IDs where roles are insufficient
    assertions.ts
  .auth/               # generated, gitignored
  .results/            # generated, gitignored
```

### 5.1 Fixture responsibilities

- `auth.fixture.ts`: API login and a fresh browser context per account.
- `data.fixture.ts`: creates unique departments/clubs/events/users when needed,
  records all IDs, and removes them in teardown.
- `api.ts`: wraps authenticated API calls and fails with request/response detail.
- `dates.ts`: supplies valid relative ranges: future event, open registration,
  not-yet-open registration, closed registration, ongoing, completed.
- `selectors.ts`: centralizes only deliberate `data-testid` selectors.

Add `data-testid` only when an accessible name cannot be stable. Test IDs must
describe intent (`event-submit`, `permission-registration`) rather than design
or implementation (`blue-button-2`).

## 6. Coverage partitions and scenarios

### A. Authentication, profile, and session

- valid login for every account type reaches the correct dashboard;
- invalid credentials, inactive users, expired/invalid tokens, and unauthenticated
  requests are denied safely;
- password change and first-login/profile completion gates prevent protected use;
- signup validates NMIMS domains, duplicate email behavior, disabled-signup flag,
  and malformed input;
- forgot-password has neutral account-discovery messaging;
- logout clears session and protected route reload redirects to login;
- refresh-token failure returns a clean login state, not an error loop.

### B. Public experience

- landing page, event browse/search/filter, event details, calendar, and About;
- public users see only approved/ongoing/completed/archived events;
- draft, pending, rejected, and cancelled events are not exposed publicly;
- visitor registration appears only when the event and registration window allow it;
- responsive navigation and registration on mobile viewports.

### C. Authorization and visibility

Test both the page and direct API endpoint. UI hiding is not authorization.

- each fixed role's dashboard and navigation allow-list;
- direct navigation to every protected route returns redirect/403 as appropriate;
- API reads/writes return 401 unauthenticated, 403 unauthorized, and avoid data
  leakage in errors;
- departmental event visibility, college-wide visibility, collaborating-club
  visibility, and internal-document restrictions;
- Additional role with no permissions is denied; viewer gets only read access;
  full-permission user gets the documented dynamic access.

### D. Users, departments, clubs, venues, and system controls

- admin CRUD validation, search, filters, activation/deactivation, password reset,
  and role changes;
- duplicate names/codes/emails, required fields, inactive club/venue behavior;
- nested venue creation, capacity, aliases, and venue availability;
- venue collision including the one-hour buffer, capacity boundary, and required
  override justification;
- global toggles block the intended workflow and are restored in teardown.

### E. Event lifecycle and approval workflow

One full isolated workflow is mandatory:

1. coordinator creates a valid draft with a unique title;
2. validates required field errors and a budget-breakdown mismatch separately;
3. uploads only permitted fixture files and rejects invalid type/size input;
4. submits event and verifies queue/status;
5. applies the appropriate approval chain (single department, college-wide,
   collaborative, and multi-department as separate scenarios);
6. confirms rejection and suggested changes stop progression;
7. edits a pending/suggested event and verifies approval history reset where the
   business rule requires it;
8. confirms status/date transitions and cancellation behavior;
9. verifies the audit/diff history is visible only to allowed roles.

### F. Registration

Every registration test must prove server enforcement by calling the API or
reloading after the UI action.

| Actor | Event audience | Expected result |
|---|---|---|
| Student | student enabled + department eligible | can register/cancel, only once |
| Student | faculty-only | denied |
| Student coordinator | student enabled + Registration permission | can register/cancel |
| Student coordinator | faculty-only | denied |
| Faculty coordinator | faculty enabled + Registration permission | can register/cancel |
| Faculty coordinator | student-only | denied |
| Additional without Registration | either audience | denied |
| Either coordinator | no type selected | denied |
| Visitor | outside-campus enabled + open window | can register; duplicate email rejected |
| Any actor | closed/not-open/global-disabled/ineligible/status not approved | denied with useful message |

Also cover registration list/export access: event creator and allowed coordinators
can view/export; unrelated accounts cannot.

### G. Additional permissions and coordinator type

- catalog contains every supported permission including Registration;
- admin can grant/revoke/save the complete set; non-admin manager cannot grant
  `manage_permissions`;
- Student/Faculty checkboxes are mutually exclusive; clearing selection persists
  `null`;
- selecting Student applies its preset; selecting Faculty adds its four report/
  status permissions; individual permissions remain editable;
- save/reload/API verification prove `coordinator_type` and permissions persist;
- navigation and endpoints change after a new login/session refresh.

### H. Reports, R&D, documents, and notifications

- standard report and R&D report routes enforce the correct event type and
  completed/archived state;
- required photos/flier/attendance validation; generated document download;
- Additional report permissions separately cover view, submit, and R&D variants;
- internal documents remain inaccessible to students/public users;
- notification/email-log entry is recorded using mocked/local delivery;
- test file uploads use small committed fixture files only, never user uploads.

### I. Quality attributes

- accessibility: keyboard navigation, form labels/errors, focus management,
  dialog semantics, and no critical axe violations on all critical paths;
- visual: public landing, login, dashboards, permission manager, event details,
  registration card—freeze data/time/theme before screenshot;
- resilience: API 401/403/422/500 presentation, offline/API unavailable state,
  and refresh redirect;
- pagination/search/sort: at least one boundary and empty state per list page.

## 7. Scenario design rules

### Required assertions per scenario

Each workflow spec should contain:

1. setup through the data fixture/API;
2. an action through the browser unless it is explicitly API-contract coverage;
3. a UI assertion visible to the actor;
4. an API/database-observable assertion of persisted state; and
5. teardown restoring all created records/global flags.

### Positive, negative, and boundary cases

For each business rule add:

- **positive:** permitted actor and valid data;
- **negative:** prohibited role/permission/state;
- **boundary:** first/last allowed time, zero/one/max capacity, empty/maximum
  list, duplicate registration, or equivalent domain edge.

Use the existing `EDGE_CASE_INPUTS` only for deliberately selected validation and
security tests. Do not paste every malicious string into every form; that creates
slow, low-signal tests.

## 8. Parallelism and isolation

- Read-only tests may be fully parallel.
- Mutation specs use a worker-specific namespace and must not modify seeded
  `[TEST]` records.
- Tests that touch global configuration are serial within their describe block
  and restore the previous config in `finally`.
- Approval scenarios create unique clubs/events, avoiding shared queues.
- Browser storage states are read-only templates. Never write a shared auth JSON
  while tests run.
- Retry only transient UI/network failures. A retry must not duplicate server
  mutations: create data through idempotency keys or cleanup-aware API helpers.

## 9. Reliability and evidence policy

- Keep existing trace-on-first-retry, failure screenshot, and failure video.
- Attach API request/response bodies (with secrets redacted) to failing workflow
  tests.
- Fail on unhandled page exceptions and unexpected 5xx responses; permit only
  documented expected 401/403/422 responses in the relevant test.
- Prefer response waits, e.g. `page.waitForResponse` for a known mutation, then
  assert the reloaded data. Do not use network-idle as the only success signal.
- Each regression bug gets a focused test first, then the fix.
- Quarantine a flaky test only with an issue/reference, owner, expiry date, and
  a replacement plan. Quarantine is not a permanent green result.

## 10. CI gate and rollout plan

### Phase 1 — make the suite trustworthy

1. Add all seeded Additional/coordinator accounts to global auth setup.
2. Add isolated API/data fixtures and cleanup utilities.
3. Convert existing route-load tests into stable smoke tests using semantic
   assertions; remove arbitrary waits.
4. Add API authorization matrix tests before more browser mutations.

### Phase 2 — protect highest-risk workflows

1. Implement the full single-club approval workflow.
2. Implement registration matrix, including both coordinator types.
3. Implement permission-manager persistence and denial tests.
4. Implement venue-clash and system-control reset tests.

### Phase 3 — broaden safely

1. Add reports, R&D, uploads, document authorization, and exports.
2. Add collaborative/multi-department approval scenarios.
3. Add accessibility and visual baselines for stable pages.
4. Run critical scenarios on Firefox/WebKit and mobile.

### Merge requirements

| Change type | Required tests |
|---|---|
| UI-only | affected smoke + accessibility check; visual update if baseline page |
| API/schema/migration | API contract + affected workflow + seed update if needed |
| Role/permission | allow and deny tests at UI and API boundary |
| Event/approval/registration | focused workflow + boundary case |
| Global control | focused test plus teardown proof |
| Bug fix | regression test reproducing the original failure |

## 11. Definition of done for a Playwright spec

A spec is complete only when it:

- has a clear business-rule name;
- uses stable fixtures and no shared mutable seeded record;
- contains positive and relevant denied/boundary coverage;
- passes locally twice in a row and in CI;
- produces useful trace/screenshot/API context on failure;
- leaves the database and global settings clean; and
- is listed in the relevant coverage partition above.
