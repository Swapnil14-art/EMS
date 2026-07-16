import api from '@/lib/api';
import {
  mapUserFromApi,
  mapLoginResponse,
  mapEventFromApi,
  mapEventToApi,
} from '@/lib/transformers';
import type {
  User, Event, Club, Venue, Department,
  EventApproval, EventDocument, EventLink, EventRegistration,
  EmailNotification, CoordinatorDashboardStats, AdminDashboardStats,
  LoginFormData, ChangePasswordFormData, CompleteProfileFormData,
  EventReport, EventRndReport,
} from '@/types';

// ─── Auth ─────────────────────────────────────────────────────────────────────
// API mapped from /auth endpoints

export const authService = {
  // POST /auth/login — returns { access_token, refresh_token, ... }
  login: async (data: LoginFormData) => {
    const res = await api.post('/auth/login', {
      email: data.email,
      password: data.password,
    });
    return mapLoginResponse(res.data);
  },

  // POST /auth/signup — email-only registration
  signup: async (data: { email: string }) => {
    const res = await api.post('/auth/signup', data);
    return res.data;
  },

  // POST /auth/reset-password — request password reset
  resetPassword: async (data: { email: string }) => {
    const res = await api.post('/auth/reset-password', data);
    return res.data;
  },

  // POST /auth/change-password — change password (mandatory on first login)
  changePassword: async (data: ChangePasswordFormData) => {
    const res = await api.post('/auth/change-password', data);
    return res.data;
  },

  // POST /auth/complete-profile — complete user profile after first login
  completeProfile: async (data: CompleteProfileFormData) => {
    const res = await api.post('/auth/complete-profile', data);
    return res.data;
  },

  // GET /auth/me — get current user profile
  me: async (): Promise<User> => {
    const res = await api.get('/auth/me');
    return mapUserFromApi(res.data);
  },

  // POST /auth/refresh — get new access token
  refresh: async (refreshToken: string) => {
    const res = await api.post('/auth/refresh', { refresh_token: refreshToken });
    return res.data;
  },

  // POST /auth/logout — log out current session
  logout: async () => {
    try { await api.post('/auth/logout'); } catch {}
  },
};

// ─── Departments ──────────────────────────────────────────────────────────────
// API mapped from /departments endpoints

export const departmentService = {
  // GET /departments/ — list all schools
  list: async (): Promise<Department[]> => {
    const res = await api.get('/departments/');
    // API returns array directly
    return Array.isArray(res.data) ? res.data : (res.data?.data || res.data || []);
  },

  // GET /departments/{id}
  get: async (id: number): Promise<Department> => {
    const res = await api.get(`/departments/${id}`);
    return res.data;
  },

  // POST /departments/ — create school (super_admin only)
  create: async (data: { name: string; code: string }): Promise<Department> => {
    const res = await api.post('/departments/', data);
    return res.data;
  },

  // PATCH /departments/{id} — update school (super_admin only)
  update: async (id: number, data: Partial<{ name: string; code: string }>): Promise<Department> => {
    const res = await api.patch(`/departments/${id}`, data);
    return res.data;
  },

  // DELETE /departments/{id}
  remove: async (id: number) => {
    await api.delete(`/departments/${id}`);
  },
};

// ─── System Settings ──────────────────────────────────────────────────────────
// API mapped from /system endpoints

export const systemService = {
  getConfig: async () => {
    const res = await api.get('/system/settings');
    return res.data?.data || res.data;
  },
  getPublicConfig: async () => {
    const res = await api.get('/system/settings/public');
    return res.data;
  },
  updateConfig: async (data: { disable_student_registration?: boolean; disable_role_signup?: boolean; force_login?: boolean }) => {
    const res = await api.patch('/system/settings', data);
    return res.data?.data || res.data;
  },
};

// ─── Users ────────────────────────────────────────────────────────────────────
// API mapped from /users endpoints

export const userService = {
  // GET /users/me - get current user profile
  getMe: async (): Promise<User> => {
    const res = await api.get('/users/me');
    return mapUserFromApi(res.data);
  },

  // PATCH /users/me - update current user profile
  updateMe: async (data: Partial<User>) => {
    const res = await api.patch('/users/me', data);
    return mapUserFromApi(res.data);
  },

  // GET /users/ — list users with filters (super_admin only)
  list: async (params?: {
    role?: string;
    status?: string;
    department_id?: number;
    page?: number;
    size?: number;
  }) => {
    const res = await api.get('/users/', { params });
    const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
    const total = res.data?.total ?? data.length;
    return { data: data.map(mapUserFromApi), total };
  },

  // GET /users/search — search users by email
  search: async (email: string) => {
    const res = await api.get('/users/search', { params: { email } });
    return res.data;
  },

  // GET /users/{id}
  get: async (id: number): Promise<User> => {
    const res = await api.get(`/users/${id}`);
    return mapUserFromApi(res.data);
  },

  // POST /users/pre-approve — pre-approve a user with role (super_admin only)
  preApprove: async (data: {
    email: string;
    role: string;
    department_id?: number;
    club_id?: number;
  }) => {
    const res = await api.post('/users/pre-approve', data);
    return res.data;
  },

  // PATCH /users/{id}/activate — reactivate a user (super_admin only)
  activate: async (id: number) => {
    const res = await api.patch(`/users/${id}/activate`);
    return res.data;
  },

  // PATCH /users/{id}/deactivate — deactivate a user (super_admin only)
  deactivate: async (id: number) => {
    const res = await api.patch(`/users/${id}/deactivate`);
    return res.data;
  },

  // DELETE /users/{id} — permanently delete a user (super_admin only)
  delete: async (id: number) => {
    await api.delete(`/users/${id}`);
  },

  // POST /users/bulk-action — unified bulk management (super_admin only)
  bulkAction: async (params: { user_ids: number[]; action: 'deactivate' | 'delete' }) => {
    const res = await api.post('/users/bulk-action', params);
    return res.data;
  },

  // POST /users/ — create user explicitly (super_admin only)
  createDirect: async (data: any) => {
    const res = await api.post('/users/', data);
    return res.data;
  },

  // PATCH /users/{id} — update full user details + password (super_admin only)
  adminUpdate: async (id: number, data: any) => {
    const res = await api.patch(`/users/${id}`, data);
    return res.data;
  },
};

// ─── Clubs ────────────────────────────────────────────────────────────────────
// API mapped from /clubs endpoints

export const clubService = {
  // GET /clubs/ — list clubs with optional filters
  list: async (params?: { department_id?: number; active_only?: boolean }) => {
    const res = await api.get('/clubs/', { params });
    const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
    return { data, total: data.length };
  },

  // GET /clubs/{id}
  get: async (id: number): Promise<Club> => {
    const res = await api.get(`/clubs/${id}`);
    return res.data;
  },

  // POST /clubs/ — create a club (super_admin only)
  create: async (data: Partial<Club>) => {
    const res = await api.post('/clubs/', data);
    return res.data;
  },

  // PATCH /clubs/{id} — update a club (super_admin only)
  update: async (id: number, data: Partial<Club>) => {
    const res = await api.patch(`/clubs/${id}`, data);
    return res.data;
  },

  // PATCH /clubs/{id}/deactivate — deactivate a club (super_admin only)
  deactivate: async (id: number) => {
    const res = await api.patch(`/clubs/${id}/deactivate`);
    return res.data;
  },

  // DELETE /clubs/{id} — permanently delete a club (super_admin only)
  delete: async (id: number) => {
    await api.delete(`/clubs/${id}`);
  },
};

// ─── Events ───────────────────────────────────────────────────────────────────
// API mapped from /events endpoints

export const eventService = {
  // GET /events/ — list events with filters (role-based visibility)
  list: async (params?: {
    status?: string;
    club_id?: number;
    department_id?: number;
    from_date?: string;
    to_date?: string;
    search?: string;
    my_events?: boolean;
    manage_only?: boolean;
    page?: number;
    size?: number;
  }) => {
    const res = await api.get('/events/', { params });
    const data = res.data;
    let dataArray = [];
    if (data?.data && Array.isArray(data.data)) {
      dataArray = data.data.map(mapEventFromApi);
    } else if (Array.isArray(data)) {
      dataArray = data.map(mapEventFromApi);
    }
    return { data: dataArray, total: data?.total || dataArray.length };
  },

  // GET /events/calendar — explicit lightweight fetch for Event Calendar
  getCalendar: async (params: { start_date: string; end_date: string; department?: string; club_id?: string | number; status?: string }) => {
    const res = await api.get('/events/calendar', { params });
    return res.data;
  },

  // GET /events/{id} — full event details
  get: async (id: number): Promise<Event> => {
    const res = await api.get(`/events/${id}`);
    return mapEventFromApi(res.data?.data || res.data);
  },

  // POST /events/ — create a new event as draft
  create: async (data: any): Promise<Event> => {
    const payload = mapEventToApi(data);
    const res = await api.post('/events/', payload);
    return mapEventFromApi(res.data?.data || res.data);
  },

  // PATCH /events/{id} — update event details
  update: async (id: number, data: any): Promise<Event> => {
    const payload = mapEventToApi(data);
    const res = await api.patch(`/events/${id}`, payload);
    return mapEventFromApi(res.data?.data || res.data);
  },

  // DELETE /events/{id} — permanently delete event (super_admin only)
  delete: async (id: number) => {
    await api.delete(`/events/${id}`);
  },

  // POST /events/{id}/submit — submit draft for approval
  submit: async (id: number): Promise<Event> => {
    const res = await api.post(`/events/${id}/submit`);
    return mapEventFromApi(res.data?.data || res.data);
  },

  // POST /events/{id}/cancel — cancel an event
  cancel: async (id: number, reason: string) => {
    const res = await api.post(`/events/${id}/cancel`, { reason });
    return res.data;
  },

  // POST /events/{id}/upload-poster — upload event poster (multipart)
  uploadPoster: async (id: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    const res = await api.post(`/events/${id}/upload-poster`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // POST /events/{id}/upload-sponsor — upload event sponsor doc (multipart)
  uploadSponsorDoc: async (id: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    const res = await api.post(`/events/${id}/upload-sponsor`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // POST /events/{id}/upload-participant-doc — upload participant document
  uploadParticipantDoc: async (id: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    const res = await api.post(`/events/${id}/upload-participant-doc`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // POST /events/{id}/other-docs — upload supporting documents
  uploadOtherDoc: async (id: number, title: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    const res = await api.post(`/events/${id}/other-docs?title=${encodeURIComponent(title)}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // DELETE /events/{id}/other-docs/{doc_id}
  deleteOtherDoc: async (id: number, docId: number) => {
    await api.delete(`/events/${id}/other-docs/${docId}`);
  },

  // GET /events/{id}/diff — view edit diff
  getDiff: async (id: number) => {
    const res = await api.get(`/events/${id}/diff`);
    return res.data;
  },

  // GET /events/{id}/registrations — get detailed registrations
  getRegistrations: async (id: number) => {
    const res = await api.get(`/events/${id}/registrations`);
    return res.data;
  },

  // GET /events/{id}/registrations/export — download excel
  exportRegistrations: async (id: number) => {
    const res = await api.get(`/events/${id}/registrations/export`, {
      responseType: 'blob'
    });
    return res.data;
  },

  // POST /events/{id}/generate-report — generate and download automated report
  generateReport: async (id: number) => {
    const res = await api.post(`/events/${id}/generate-report`, {}, {
      responseType: 'blob'
    });
    return res.data;
  },

  // POST /events/{id}/admin-approve — directly approve event (super_admin only)
  adminApprove: async (id: number) => {
    const res = await api.post(`/events/${id}/admin-approve`);
    return res.data;
  },
};

// ─── Event Documents ──────────────────────────────────────────────────────────
// API mapped from /events/{id}/documents and /events/{id}/links

export const documentService = {
  // GET /events/{id}/documents — list documents
  getDocs: async (eventId: number) => {
    const res = await api.get(`/events/${eventId}/documents`);
    return Array.isArray(res.data) ? res.data : (res.data?.data || []);
  },

  // POST /events/{id}/documents — add internal document
  addDocument: async (eventId: number, data: FormData) => {
    const res = await api.post(`/events/${eventId}/documents`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  // Alias
  addDoc: async (eventId: number, data: FormData) => {
    return documentService.addDocument(eventId, data);
  },

  // DELETE /events/{id}/documents/{doc_id}
  deleteDocument: async (eventId: number, docId: number) => {
    await api.delete(`/events/${eventId}/documents/${docId}`);
  },

  // GET /events/{id}/links — list links
  getLinks: async (eventId: number) => {
    const res = await api.get(`/events/${eventId}/links`);
    return Array.isArray(res.data) ? res.data : (res.data?.data || []);
  },

  // POST /events/{id}/links — add event link
  addLink: async (eventId: number, data: Partial<EventLink>) => {
    const res = await api.post(`/events/${eventId}/links`, data);
    return res.data;
  },

  // PATCH /events/{id}/links/{link_id} — update event link
  updateLink: async (eventId: number, linkId: number, data: Partial<EventLink>) => {
    const res = await api.patch(`/events/${eventId}/links/${linkId}`, data);
    return res.data;
  },

  // DELETE /events/{id}/links/{link_id}
  deleteLink: async (eventId: number, linkId: number) => {
    await api.delete(`/events/${eventId}/links/${linkId}`);
  },
};

// Alias for components that import as resourceService
export const resourceService = documentService;

// ─── Event Coordinators ───────────────────────────────────────────────────────

export const coordinatorService = {
  // POST /events/{id}/coordinators — add a coordinator
  add: async (eventId: number, userId: number) => {
    const res = await api.post(`/events/${eventId}/coordinators`, { user_id: userId });
    return res.data;
  },

  // DELETE /events/{id}/coordinators/{coord_id}
  remove: async (eventId: number, coordId: number) => {
    await api.delete(`/events/${eventId}/coordinators/${coordId}`);
  },
};

// ─── Approvals ────────────────────────────────────────────────────────────────
// API mapped from /approvals endpoints

export const approvalService = {
  // GET /approvals/pending — events pending current user's action
  getPending: async () => {
    const res = await api.get('/approvals/pending');
    const data = res.data;
    let dataArray = [];
    if (data?.data && Array.isArray(data.data)) {
      dataArray = data.data.map(mapEventFromApi);
    } else if (Array.isArray(data)) {
      dataArray = data.map(mapEventFromApi);
    }
    return dataArray;
  },

  // POST /approvals/{event_id}/action — take approval action
  takeAction: async (eventId: number, action: 'approved' | 'rejected' | 'suggested_changes', remarks?: string, venueClashOverride?: boolean, venueClashOverrideReason?: string) => {
    const res = await api.post(`/approvals/${eventId}/action`, {
      action,
      remarks: remarks || undefined,
      venue_clash_override: venueClashOverride || false,
      venue_clash_override_reason: venueClashOverrideReason || undefined,
    });
    return res.data;
  },

  // Convenience aliases for backward compatibility
  approve: async (eventId: number, remarks?: string) => {
    return approvalService.takeAction(eventId, 'approved', remarks);
  },

  reject: async (eventId: number, remarks: string) => {
    return approvalService.takeAction(eventId, 'rejected', remarks);
  },

  suggestChanges: async (eventId: number, remarks: string) => {
    return approvalService.takeAction(eventId, 'suggested_changes', remarks);
  },

  // GET /approvals/{event_id}/history — full approval chain for an event
  getHistory: async (eventId: number): Promise<EventApproval[]> => {
    const res = await api.get(`/approvals/${eventId}/history`);
    return Array.isArray(res.data) ? res.data : (res.data?.data || []);
  },

  // Fallback for all history if needed (admin/coordinator views)
  getAllHistory: async (page = 1, size = 20): Promise<{data: EventApproval[], total: number}> => {
    try {
      const res = await api.get('/approvals/history', { params: { page, size } });
      const rawData = res.data?.data || res.data || [];
      const data = Array.isArray(rawData) ? rawData.map((item: any) => ({ ...item, status: item.action || item.status })) : [];
      return { data, total: res.data?.total || data.length };
    } catch {
      return { data: [], total: 0 };
    }
  },
};

// ─── Venues ───────────────────────────────────────────────────────────────────
// API mapped from /venues endpoints

export const venueService = {
  // GET /venues/ — list venues with optional filters
  list: async (params?: { active_only?: boolean; department_id?: number }) => {
    const res = await api.get('/venues/', { params });
    const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
    return { data, total: data.length };
  },

  // GET /venues/{id}
  get: async (id: number): Promise<Venue> => {
    const res = await api.get(`/venues/${id}`);
    return res.data;
  },

  // POST /venues/ — create venue (super_admin only)
  create: async (data: Partial<Venue>) => {
    const res = await api.post('/venues/', data);
    return res.data;
  },

  // PATCH /venues/{id} — update venue
  update: async (id: number, data: Partial<Venue>) => {
    const res = await api.patch(`/venues/${id}`, data);
    return res.data;
  },

  // DELETE /venues/{id} — permanently delete venue
  delete: async (id: number) => {
    await api.delete(`/venues/${id}`);
  },

  // GET /venues/clash-check — check venue scheduling conflicts
  checkClash: async (params: {
    venue_id?: number;
    venue_custom?: string;
    start_datetime: string;
    end_datetime: string;
    exclude_event_id?: number;
  }) => {
    const res = await api.get('/venues/clash-check', { params });
    return res.data;
  },

  // GET /venues/calendar — day-view calendar for venues
  getCalendar: async (date: string, venueId?: number) => {
    const params: any = { date };
    if (venueId) params.venue_id = venueId;
    const res = await api.get('/venues/calendar', { params });
    return res.data;
  },
};

// ─── Registrations ────────────────────────────────────────────────────────────
// API mapped from /registrations endpoints

export const registrationService = {
  // POST /registrations/{event_id}/register — register for event (student only)
  register: async (eventId: number) => {
    const res = await api.post(`/registrations/${eventId}/register`);
    return res.data;
  },

  // DELETE /registrations/{event_id}/cancel — cancel registration (student only)
  unregister: async (eventId: number) => {
    await api.delete(`/registrations/${eventId}/cancel`);
  },

  // GET /registrations/{event_id}/list — list registered students
  list: async (eventId: number): Promise<EventRegistration[]> => {
    const res = await api.get(`/registrations/${eventId}/list`);
    return Array.isArray(res.data) ? res.data : (res.data?.data || []);
  },

  // GET /registrations/my — get current student's registrations
  myRegistrations: async (): Promise<Event[]> => {
    const res = await api.get('/registrations/my');
    const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
    return data.map(mapEventFromApi);
  },

  // POST /registrations/{event_id}/send-update — send email to registered students
  sendUpdate: async (eventId: number, subject: string, message: string) => {
    const res = await api.post(`/registrations/${eventId}/send-update`, null, {
      params: { subject, message },
    });
    return res.data;
  },
};

// ─── Reports ──────────────────────────────────────────────────────────────────
// API mapped from /reports endpoints

export const reportService = {
  // POST /reports/{event_id}/submit — submit structured post-event report (JSON)
  submitReport: async (eventId: number, payload: object) => {
    const res = await api.post(`/reports/${eventId}/submit`, payload);
    return res.data;
  },

  // POST /reports/{event_id}/upload-flier — upload event flier (1 compulsory)
  uploadFlier: async (eventId: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    const res = await api.post(`/reports/${eventId}/upload-flier`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // POST /reports/{event_id}/upload-photos — upload event photos
  uploadPhotos: async (eventId: number, files: File[]) => {
    const form = new FormData();
    files.forEach(f => form.append('files', f));
    const res = await api.post(`/reports/${eventId}/upload-photos`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // POST /reports/{event_id}/upload-attendance — upload attendance sheet
  uploadAttendance: async (eventId: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    const res = await api.post(`/reports/${eventId}/upload-attendance`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // GET /reports/{event_id}/generate — download generated .docx report
  generate: async (eventId: number) => {
    const res = await api.get(`/reports/${eventId}/generate`, {
      responseType: 'blob',
    });
    return res.data;
  },

  // GET /reports/{event_id} — get report metadata
  get: async (eventId: number) => {
    const res = await api.get(`/reports/${eventId}`);
    return res.data;
  },

  // POST /reports/{event_id}/upload-doc — upload pre-made report
  uploadDoc: async (eventId: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    const res = await api.post(`/reports/${eventId}/upload-doc`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // Kept for backward compatibility
  submit: async (eventId: number, data: EventReport) => {
    const res = await api.post(`/reports/${eventId}/submit`, data);
    return res.data;
  },
};

// ─── RnD Reports ──────────────────────────────────────────────────────────────
// API mapped from /rnd-reports endpoints

export const rndReportService = {
  // POST /rnd-reports/{event_id}/submit — submit structured RnD report (JSON)
  submitReport: async (eventId: number, payload: object) => {
    const res = await api.post(`/rnd-reports/${eventId}/submit`, payload);
    return res.data;
  },

  // POST /rnd-reports/{event_id}/upload-flier — upload event flier (1 compulsory)
  uploadFlier: async (eventId: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    const res = await api.post(`/rnd-reports/${eventId}/upload-flier`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // POST /rnd-reports/{event_id}/upload-photos — upload event photos
  uploadPhotos: async (eventId: number, files: File[]) => {
    const form = new FormData();
    files.forEach(f => form.append('files', f));
    const res = await api.post(`/rnd-reports/${eventId}/upload-photos`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // POST /rnd-reports/{event_id}/upload-attendance — upload attendance sheet
  uploadAttendance: async (eventId: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    const res = await api.post(`/rnd-reports/${eventId}/upload-attendance`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // GET /rnd-reports/{event_id}/generate — download generated .docx RnD report
  generate: async (eventId: number) => {
    const res = await api.get(`/rnd-reports/${eventId}/generate`, {
      responseType: 'blob',
    });
    return res.data;
  },

  // GET /rnd-reports/{event_id} — get RnD report metadata
  get: async (eventId: number) => {
    const res = await api.get(`/rnd-reports/${eventId}`);
    return res.data;
  },

  // POST /rnd-reports/{event_id}/upload-doc — upload pre-made RnD report
  uploadDoc: async (eventId: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    const res = await api.post(`/rnd-reports/${eventId}/upload-doc`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  submit: async (eventId: number, data: EventRndReport) => {
    const res = await api.post(`/rnd-reports/${eventId}/submit`, data);
    return res.data;
  },
};

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
// API mapped from /dashboard endpoints

export const dashboardService = {
  // GET /dashboard/coordinator — coordinator dashboard stats
  getCoordinator: async (): Promise<CoordinatorDashboardStats> => {
    const res = await api.get('/dashboard/coordinator');
    return res.data;
  },

  // GET /dashboard/admin — admin/director dashboard stats
  getAdmin: async (): Promise<AdminDashboardStats> => {
    const res = await api.get('/dashboard/admin');
    return res.data;
  },

  // GET /dashboard/associate_dean — associate dean dashboard stats
  getAssociateDean: async () => {
    const res = await api.get('/dashboard/associate_dean');
    return res.data;
  },
};

// ─── Email log ────────────────────────────────────────────────────────────────
// API mapped from /notifications/email-log endpoint

export const notificationService = {
  getEmailLog: async (params?: { page?: number; size?: number }) => {
    const res = await api.get('/notifications/email-log', { params });
    return res.data;
  },
};

// ─── File serving ─────────────────────────────────────────────────────────────
// API mapped from /admin/files/{file_path}

export const fileService = {
  getFileUrl: (filePath: string) => {
    return `/api/admin/files/${filePath}`;
  },
};

// ─── Health ───────────────────────────────────────────────────────────────────

export const healthService = {
  check: async () => {
    const res = await api.get('/health');
    return res.data;
  },
};

// ─── Permission Management (Additional Role) ──────────────────────────────────

export const permissionService = {
  getCatalog: async (): Promise<{ catalog: Record<string, string> }> => {
    const res = await api.get('/permissions/catalog');
    return res.data;
  },
  listUsers: async () => {
    const res = await api.get('/permissions/users');
    return res.data;
  },
  setPermissions: async (userId: number, permissions: string[]) => {
    const res = await api.put(`/permissions/${userId}`, { permissions });
    return res.data;
  },
  grantPermissions: async (userId: number, permissions: string[]) => {
    const res = await api.post(`/permissions/${userId}/grant`, { permissions });
    return res.data;
  },
  revokePermissions: async (userId: number, permissions: string[]) => {
    const res = await api.delete(`/permissions/${userId}/revoke`, { data: { permissions } });
    return res.data;
  },
};

