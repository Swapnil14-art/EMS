// ─── User & Auth ──────────────────────────────────────────────────────────────

export type UserRole =
  | 'super_admin'
  | 'director'
  | 'associate_dean'
  | 'club_coordinator'
  | 'student';

export type YearOfStudy = 'Y1' | 'Y2' | 'Y3' | 'Y4' | 'Alumni';

export interface Department {
  id: number;
  name: string;
  code: string;
}

// API mapped from /auth/me and /users endpoints
export interface User {
  id: number;
  name: string;           // API field: "name"
  email: string;
  role: UserRole;
  department_id: number | null;
  department?: Department;
  club_id: number | null;
  status: 'active' | 'inactive';
  is_first_login: boolean;
  sap_id?: string;
  // Extended profile fields (from /auth/complete-profile)
  branch?: string;
  year_of_study?: YearOfStudy;
  course?: string;
  phone_number?: string;
  is_club_coordinator_requested?: boolean;
  club_name?: string;
  // Frontend-derived convenience fields
  is_active: boolean;               // derived from status === 'active'
  force_password_change: boolean;   // derived from is_first_login or login response
  profile_completed?: boolean;      // derived from login response require_profile_completion
  created_at?: string;
  updated_at?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// API mapped from /auth/login response
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  require_password_change: boolean;
  require_profile_completion: boolean;
}

// ─── Clubs ────────────────────────────────────────────────────────────────────

export interface Club {
  id: number;
  name: string;
  description?: string;
  department_id: number;
  department?: Department;
  coordinator_id: number | null;  // API field
  coordinator?: User;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// ─── Venues ───────────────────────────────────────────────────────────────────

export interface Venue {
  id: number;
  name: string;
  location?: string;
  max_capacity: number;
  aliases?: string;
  department_id?: number;
  department?: Department;
  is_active: boolean;
}

// ─── Events ───────────────────────────────────────────────────────────────────

export type EventStatus =
  | 'draft'
  | 'pending_associate_dean'
  | 'pending_coordinator_parallel'
  | 'pending_director'
  | 'suggested_changes'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'ongoing'
  | 'completed'
  | 'archived';

export type EventType =
  | 'technical'
  | 'cultural'
  | 'sports'
  | 'seminar'
  | 'workshop'
  | 'hackathon'
  | 'awareness'
  | 'other';

export type TargetAudience =
  | 'college_wide'
  | 'engineering'
  | 'agriculture'
  | 'pharma';

export interface EventSponsor {
  id: number;
  event_id: number;
  name: string;
  logo_path?: string;
  logo_url?: string;
}

// API mapped from /approvals/{event_id}/history
export interface EventApproval {
  id: number;
  event_id: number;
  approver_id: number;
  approver?: User;
  role_at_approval: string;
  sequence_order: number;
  status: 'pending' | 'approved' | 'rejected' | 'suggested_changes';
  remarks?: string;
  venue_clash_override: boolean;
  venue_clash_override_reason?: string;
  actioned_at?: string;
  created_at: string;
}

export interface EventLink {
  id: number;
  event_id: number;
  link_type: 'registration' | 'payment' | 'oc_form' | 'gallery' | 'other';
  url: string;
  label?: string;
  created_by?: number;
  created_at: string;
}

export interface EventDocument {
  id: number;
  event_id: number;
  title: string;
  file_path?: string;
  file_url?: string;
  url?: string;
  uploaded_by: number;
  uploaded_at: string;
}

export interface EventRegistration {
  id: number;
  event_id: number;
  user_id: number;
  student_email: string;
  status: 'registered' | 'cancelled';
  registered_at: string;
}

// API mapped from /events endpoint
export interface Event {
  id: number;
  title: string;
  event_type: EventType;
  school_department: string;
  event_incharge_name: string;
  event_incharge_contact: string;
  target_audience: TargetAudience;
  is_club_event: boolean;
  club_id?: number;
  club?: Club;
  is_collaborative: boolean;
  collaborating_club_ids?: number[];
  is_sponsored: boolean;

  objectives?: string[];

  tc_accepted_at?: string;
  tc_accepted_by?: number;
  tc_version?: number;

  // API uses separate date/time fields
  event_date?: string;          // "2026-05-15"
  start_time?: string;          // "10:00"
  end_time?: string;            // "17:00"
  // Frontend convenience (composed from event_date + start/end_time)
  start_datetime: string;
  end_datetime: string;
  registration_deadline?: string;

  venue_id?: number;
  venue?: Venue;
  venue_custom?: string;
  venue_type?: string;
  seating_arrangement?: string;
  seating_other_detail?: string;
  tables_required?: string;
  chairs_required?: string;
  podium_setup?: boolean;
  podium_details?: string;
  decoration?: boolean;
  decoration_details?: string;

  // IT requirements
  it_projector?: boolean;
  it_audio?: boolean;
  it_audio_details?: string;
  it_wifi?: boolean;
  it_laptop?: boolean;
  it_laptop_details?: string;
  it_other?: string;

  // Food & beverage
  food_items?: boolean;
  food_details?: string;
  beverage_items?: boolean;
  beverage_details?: string;
  pax_count?: number;
  food_service_time?: string;

  // Logistics
  transport?: boolean;
  transport_details?: string;
  security?: boolean;
  security_details?: string;
  printing?: boolean;
  printing_details?: string;
  volunteers?: boolean;
  volunteers_details?: string;
  other_requirements?: string;

  budget?: number;
  comments?: string;

  poster_path?: string;
  poster_url?: string;
  participant_doc_path?: string;
  participant_doc_url?: string;
  report_path?: string;
  report_url?: string;

  status: EventStatus;
  created_by: number;
  creator?: User;
  current_approval_step?: number;
  edit_count?: number;
  created_at: string;
  updated_at: string;

  sponsors?: EventSponsor[];
  approvals?: EventApproval[];
  links?: EventLink[];
  registration_count?: number;
  is_registered?: boolean;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────
// API returns flat JSON — no nested { success, data } wrapper in most cases.
// The detail field is used for errors.

export interface ApiSuccess<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  detail: string;   // API error format
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  size: number;       // API uses "size", not "per_page"
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Form Types ───────────────────────────────────────────────────────────────

export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  email: string;
}

export interface ChangePasswordFormData {
  current_password: string;
  new_password: string;
}

export interface CompleteProfileFormData {
  name: string;
  department_id: number;
  branch: string;
  year_of_study: string;
  course: string;
  sap_id: string;
  phone_number: string;
  is_club_coordinator_requested?: boolean;
  club_name?: string;
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
// API mapped from /dashboard/coordinator and /dashboard/admin

export interface CoordinatorDashboardStats {
  total_events_created: number;
  total_participants: number;
  events_by_status: Record<string, number>;
  events_by_type: Record<string, number>;
  events_by_month: Array<{ month: string; count: number }>;
  top_clubs_by_event_count: Array<{ club_name: string; count: number }>;
}

export interface AdminDashboardStats {
  total_events: number;
  total_registrations: number;
  events_by_status: Record<string, number>;
  events_by_type: Record<string, number>;
  users_by_role: Record<string, number>;
  events_by_month: Array<{ month: string; count: number }>;
  top_clubs_by_event_count: Array<{ club_name: string; count: number }>;
  total_clubs: number;
  total_venues: number;
}

// Legacy type alias for backward compatibility
export type DashboardStats = AdminDashboardStats & {
  pending_approvals?: number;
  approved_events?: number;
  ongoing_events?: number;
  upcoming_events?: number;
  total_clubs?: number;
  total_users?: number;
};

// ─── Reports ──────────────────────────────────────────────────────────────────

export interface EventReport {
  event_summary: string;
  actual_budget: number;
  participant_count: number;
  outcomes: string;
  issues: string;
  feedback: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────

export interface EmailNotification {
  id: number;
  recipient: string;
  type: string;
  event_id?: number;
  sent_at: string;
  status: 'sent' | 'failed';
  error_msg?: string;
}
