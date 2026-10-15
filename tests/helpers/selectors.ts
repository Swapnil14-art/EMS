/**
 * Semantic test-ID selectors.
 *
 * Only deliberate data-testid attributes that cannot be addressed via
 * accessible roles/labels. Each key describes INTENT, not design.
 *
 * §5.1 helpers/selectors.ts — PLAYWRIGHT_TEST_STRATEGY.md
 */
import { Page, Locator } from '@playwright/test';

// ─── Event form ───────────────────────────────────────────────────────────────
export const sel = {
  // Event lifecycle
  eventSubmitBtn:        '[data-testid="event-submit"]',
  eventSaveDraftBtn:     '[data-testid="event-save-draft"]',
  eventStatusBadge:      '[data-testid="event-status"]',
  eventTitleInput:       '[data-testid="event-title"]',
  eventBudgetTotal:      '[data-testid="event-budget-total"]',
  eventAuditHistory:     '[data-testid="event-audit-history"]',
  eventDiffViewer:       '[data-testid="event-diff"]',

  // Approval
  approveBtn:            '[data-testid="approve-btn"]',
  rejectBtn:             '[data-testid="reject-btn"]',
  suggestChangesBtn:     '[data-testid="suggest-changes-btn"]',
  approvalComment:       '[data-testid="approval-comment"]',

  // Registration
  registerBtn:           '[data-testid="register-btn"]',
  cancelRegistrationBtn: '[data-testid="cancel-registration-btn"]',
  registrationStatus:    '[data-testid="registration-status"]',
  visitorRegistrationForm: '[data-testid="visitor-registration-form"]',

  // Permissions (Additional role)
  permissionRegistration: '[data-testid="permission-registration"]',
  permissionViewEvents:   '[data-testid="permission-view-events"]',
  permissionManage:       '[data-testid="permission-manage-permissions"]',
  coordinatorTypeStudent: '[data-testid="coordinator-type-student"]',
  coordinatorTypeFaculty: '[data-testid="coordinator-type-faculty"]',
  permissionSaveBtn:      '[data-testid="permission-save"]',

  // System controls
  toggleDisableStudentReg: '[data-testid="toggle-disable-student-registration"]',
  toggleDisableRoleSignup: '[data-testid="toggle-disable-role-signup"]',
  toggleForceLogin:        '[data-testid="toggle-force-login"]',

  // Venue
  venueAvailabilityGrid:   '[data-testid="venue-availability"]',
  venueClashWarning:       '[data-testid="venue-clash-warning"]',

  // Report
  reportSubmitBtn:         '[data-testid="report-submit"]',
  reportDownloadBtn:       '[data-testid="report-download"]',
} as const;

// ─── Convenience locator factories ────────────────────────────────────────────

export function eventStatus(page: Page): Locator {
  return page.locator(sel.eventStatusBadge).first();
}

export function approveButton(page: Page): Locator {
  return page
    .locator(sel.approveBtn)
    .or(page.getByRole('button', { name: /approve/i }))
    .first();
}

export function rejectButton(page: Page): Locator {
  return page
    .locator(sel.rejectBtn)
    .or(page.getByRole('button', { name: /reject/i }))
    .first();
}

export function registerButton(page: Page): Locator {
  return page
    .locator(sel.registerBtn)
    .or(page.getByRole('button', { name: /register/i }))
    .first();
}

export function cancelRegistrationButton(page: Page): Locator {
  return page
    .locator(sel.cancelRegistrationBtn)
    .or(page.getByRole('button', { name: /cancel registration/i }))
    .first();
}
