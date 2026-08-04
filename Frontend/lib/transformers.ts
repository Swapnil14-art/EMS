/**
 * Data transformation layer — maps between API responses and frontend types.
 * NEVER change UI components to match API — transform data here instead.
 */
import type { User, Event, LoginResponse } from '@/types';

// ─── User transformers ───────────────────────────────────────────────────────

/**
 * Maps an API user response to the frontend User type.
 * API returns `name`; frontend historically used `full_name`.
 * We keep `name` as the canonical field now (types updated).
 */
export function mapUserFromApi(apiUser: any): User {
  return {
    id: apiUser.id,
    name: apiUser.name || apiUser.full_name || '',
    email: apiUser.email,
    role: apiUser.role,
    department_id: apiUser.department_id ?? null,
    department: apiUser.department,
    club_id: apiUser.club_id ?? null,
    status: apiUser.status || (apiUser.is_active !== false ? 'active' : 'inactive'),
    is_first_login: apiUser.is_first_login ?? false,
    sap_id: apiUser.sap_id,
    branch: apiUser.branch,
    year_of_study: apiUser.year_of_study,
    course: apiUser.course,
    phone_number: apiUser.phone_number,
    is_club_coordinator_requested: apiUser.is_club_coordinator_requested,
    club_name: apiUser.club_name,
    extra_permissions: apiUser.extra_permissions || [],
    // Derived convenience fields
    is_active: (apiUser.status || 'active') === 'active',
    force_password_change: apiUser.is_first_login ?? apiUser.force_password_change ?? false,
    profile_completed: apiUser.profile_completed ?? !!(apiUser.name || apiUser.full_name),
    created_at: apiUser.created_at,
    updated_at: apiUser.updated_at,
  };
}

// ─── Login response transformer ──────────────────────────────────────────────

export interface ParsedLoginResponse {
  accessToken: string;
  refreshToken: string;
  requirePasswordChange: boolean;
  requireProfileCompletion: boolean;
}

/**
 * Maps the /auth/login response to a structured object.
 */
export function mapLoginResponse(res: any): ParsedLoginResponse {
  return {
    accessToken: res.access_token,
    refreshToken: res.refresh_token,
    requirePasswordChange: res.require_password_change ?? false,
    requireProfileCompletion: res.require_profile_completion ?? false,
  };
}

// ─── Event transformers ──────────────────────────────────────────────────────

/**
 * Maps API event response to frontend Event type.
 * Composes start_datetime / end_datetime from event_date + start_time / end_time if needed.
 */
export function mapEventFromApi(apiEvent: any): Event {
  let start_datetime = apiEvent.start_datetime;
  let end_datetime = apiEvent.end_datetime;

  // If API returns separate date/time fields, compose them
  if (!start_datetime && apiEvent.event_date && apiEvent.start_time) {
    start_datetime = `${apiEvent.event_date}T${apiEvent.start_time}`;
  }
  if (!end_datetime && apiEvent.event_date && apiEvent.end_time) {
    end_datetime = `${apiEvent.event_date}T${apiEvent.end_time}`;
  }

  return {
    ...apiEvent,
    start_datetime: start_datetime || '',
    end_datetime: end_datetime || '',
    // Map creator name if present
    creator: apiEvent.creator ? mapUserFromApi(apiEvent.creator) : undefined,
    // Provide the direct public URL for the poster if path exists
    poster_url: apiEvent.poster_path ? apiEvent.poster_path : undefined,
    participant_doc_url: apiEvent.participant_doc_path ? apiEvent.participant_doc_path : undefined,
  };
}

/**
 * Transforms frontend form data into API event creation/update payload.
 * Splits start_datetime into event_date + start_time + end_time.
 */
export function mapEventToApi(formData: any): any {
  const payload: any = { ...formData };

  // No splitting required anymore, the backend explicitly expects start_datetime and end_datetime.

  // Ensure venue_id is numeric or removed
  if (payload.venue_id) {
    payload.venue_id = Number(payload.venue_id) || undefined;
  }
  if (!payload.venue_id) {
    delete payload.venue_id;
  }

  // Ensure budget is a number if provided
  if ('budget' in payload) {
    if (payload.budget === undefined || payload.budget === null || payload.budget === '') {
      payload.budget = 0;
    }
  }

  // Clean up frontend-only fields that the backend schema does not accept
  delete payload.objectives;
  delete payload.status;
  delete payload.tc_accepted_at;
  delete payload.tc_accepted_by;
  delete payload.tc_version;

  return payload;
}

/**
 * Extracts the human-readable error message from an API error response.
 */
export function extractApiError(err: any, fallback = 'Something went wrong. Please try again.'): string {
  return (
    err?.response?.data?.detail ||
    err?.response?.data?.message ||
    err?.message ||
    fallback
  );
}
