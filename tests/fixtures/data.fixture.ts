/**
 * Data Fixture — create/cleanup isolated entities.
 *
 * Every mutation test must create unique data with a worker-specific prefix
 * and delete it via the cleanup endpoint or direct API in teardown.
 *
 * §5.1 fixtures/data.fixture.ts — PLAYWRIGHT_TEST_STRATEGY.md
 */
import { test as base, APIRequestContext } from '@playwright/test';
import { apiCall, rawLogin, LoginResponse } from '../helpers/api';
import { testPrefix } from '../helpers/dates';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreatedEvent {
  id: number;
  title: string;
}

interface CreatedRegistration {
  id: number;
  eventId: number;
}

interface DataFixtureState {
  prefix: string;
  events: CreatedEvent[];
  registrations: CreatedRegistration[];
  /**
   * Create a test event via the coordinator account.
   * Returns the created event's id.
   */
  createEvent(request: APIRequestContext, token: string, overrides?: Record<string, unknown>): Promise<number>;
  /** Register for an event via API */
  registerForEvent(request: APIRequestContext, token: string, eventId: number): Promise<number>;
  /** Mark an event id for cleanup (if created outside the fixture). */
  trackEvent(id: number, title: string): void;
}

// ─── Fixture implementation ───────────────────────────────────────────────────

const API_URL = process.env.PLAYWRIGHT_API_URL || 'http://localhost:8000';

export const test = base.extend<{ data: DataFixtureState }>({
  data: async ({ request }, use, testInfo) => {
    const prefix = testPrefix(testInfo.workerIndex);
    const events: CreatedEvent[] = [];
    const registrations: CreatedRegistration[] = [];

    const fixture: DataFixtureState = {
      prefix,
      events,
      registrations,

      async createEvent(req, token, overrides = {}): Promise<number> {
        const now = new Date();
        const startDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
        const endDate   = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString();

        const payload = {
          title:             `${prefix} Test Event`,
          description:       'Playwright auto-generated test event',
          start_datetime:    startDate,
          end_datetime:      endDate,
          expected_attendance: 50,
          audience:          'student',
          is_college_wide:   false,
          budget_total:      1000,
          status:            'draft',
          ...overrides,
        };

        const res = await apiCall(req, 'POST', '/events/', { token, body: payload });
        if (!res.ok) {
          throw new Error(`Failed to create test event: HTTP ${res.status} — ${JSON.stringify(res.data)}`);
        }
        const event = res.data as { id: number; title: string };
        events.push({ id: event.id, title: event.title });
        return event.id;
      },

      async registerForEvent(req, token, eventId): Promise<number> {
        const res = await apiCall(req, 'POST', '/registrations/', {
          token,
          body: { event_id: eventId },
        });
        if (!res.ok && res.status !== 409) {
          throw new Error(`Failed to register for event ${eventId}: HTTP ${res.status} — ${JSON.stringify(res.data)}`);
        }
        const reg = res.data as { id?: number };
        const regId = reg?.id ?? 0;
        if (regId) registrations.push({ id: regId, eventId });
        return regId;
      },

      trackEvent(id, title) {
        events.push({ id, title });
      },
    };

    await use(fixture);

    // ── Teardown: delete all created records ──────────────────────────────────
    // Obtain admin token for cleanup
    let adminToken: string | null = null;
    try {
      const login: LoginResponse = await rawLogin('admin@nmims.in', 'Admin@123');
      adminToken = login.access_token;
    } catch {
      console.warn('⚠️  Could not obtain admin token for data fixture teardown');
    }

    if (adminToken) {
      for (const reg of registrations) {
        await apiCall(request, 'DELETE', `/registrations/${reg.id}`, { token: adminToken }).catch(() => {});
      }
      for (const event of events) {
        await apiCall(request, 'DELETE', `/events/${event.id}`, { token: adminToken }).catch(() => {});
      }
    }
  },
});

export { expect } from '@playwright/test';
