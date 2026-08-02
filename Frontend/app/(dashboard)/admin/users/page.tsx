'use client';
import { useState, useEffect } from 'react';
import { Plus, Search, RefreshCw, UserCheck, UserX, Edit2, Trash2, Shield, Users, Filter, CheckSquare, Square } from 'lucide-react';
import { userService, departmentService } from '@/lib/services';
import { Button, Input, Select, Modal, Alert, Pagination, EmptyState, Spinner } from '@/components/ui';
import { RoleBadge } from '@/components/shared/StatusBadge';
import { ROLE_LABELS } from '@/lib/utils';
import type { User, UserRole } from '@/types';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const ROLES: { value: string; label: string }[] = [
  { value: '', label: 'All Roles' },
  { value: 'director', label: 'Director' },
  { value: 'associate_dean', label: 'Associate Dean' },
  { value: 'club_coordinator', label: 'Club Coordinator' },
  { value: 'student', label: 'Student' },
  { value: 'additional', label: 'Additional' },
];

const YEARS = [
  { value: '', label: 'All Years' },
  { value: 'Y1', label: 'Y1 (1st Year)' },
  { value: 'Y2', label: 'Y2 (2nd Year)' },
  { value: 'Y3', label: 'Y3 (3rd Year)' },
  { value: 'Y4', label: 'Y4 (4th Year)' },
  { value: 'Alumni', label: 'Alumni' },
];

const createSchema = z.object({
  name: z.string().min(2, 'Full name is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email address').endsWith('@nmims.in', 'Must be @nmims.in email'),
  role: z.string().min(1, 'Role selection is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  department_id: z.coerce.number({ invalid_type_error: 'School selection is required' }).min(1, 'School selection is required'),
});
type CreateForm = z.infer<typeof createSchema>;

const editSchema = z.object({
  name: z.string().min(2, 'Name required').optional(),
  email: z.string().email().endsWith('@nmims.in', 'Must be @nmims.in').optional(),
  role: z.string().optional(),
  new_password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  department_id: z.coerce.number().optional().nullable().transform(v => v === 0 ? null : v),
});
type EditForm = z.infer<typeof editSchema>;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [deactivateUser, setDeactivateUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Bulk manage state
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkStudents, setBulkStudents] = useState<User[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkSelected, setBulkSelected] = useState<Set<number>>(new Set());
  const [bulkYear, setBulkYear] = useState('');
  const [bulkBranch, setBulkBranch] = useState('');
  const [bulkCourse, setBulkCourse] = useState('');
  const [bulkSearch, setBulkSearch] = useState('');
  const [bulkAction, setBulkAction] = useState<'deactivate' | 'delete' | null>(null);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
  });

  const { register: registerEdit, handleSubmit: handleEditSubmit, reset: resetEdit, formState: { errors: editErrors } } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await userService.list({ role: roleFilter || undefined, page });
      setUsers(res.data || []);
      setTotal(res.total || 0);
    } catch { setUsers([]); }
    finally { setLoading(false); }
  };

  const [deptOptions, setDeptOptions] = useState<{value: string; label: string}[]>([]);

  useEffect(() => {
    departmentService.list().then(depts => {
      const arr = Array.isArray(depts) ? depts : [];
      setDeptOptions(arr.map((d: any) => ({ value: String(d.id), label: `${d.name} (${d.code})` })));
    }).catch(() => {});
  }, []);

  useEffect(() => { fetchUsers(); }, [roleFilter, page]);

  const handleCreate = async (data: CreateForm) => {
    setSubmitting(true);
    try {
      await userService.createDirect(data);
      toast.success('User created successfully');
      setCreateOpen(false);
      reset();
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.response?.data?.message || 'Failed to create user');
    } finally { setSubmitting(false); }
  };

  const openEdit = (u: User) => {
    setEditingUser(u);
    resetEdit({
      name: u.name || '',
      email: u.email,
      role: u.role,
      department_id: u.department_id || undefined,
      new_password: ''
    });
    setEditOpen(true);
  };

  const submitEdit = async (data: EditForm) => {
    if (!editingUser) return;
    setSubmitting(true);
    try {
      const payload = { ...data };
      if (!payload.new_password) delete payload.new_password;
      await userService.adminUpdate(editingUser.id, payload);
      toast.success('User updated successfully');
      setEditOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.response?.data?.message || 'Failed to update user');
    } finally { setSubmitting(false); }
  };

  const handleDeactivate = async () => {
    if (!deactivateUser) return;
    setSubmitting(true);
    try {
      await userService.deactivate(deactivateUser.id);
      toast.success('User deactivated');
      setDeactivateUser(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed');
    } finally { setSubmitting(false); }
  };

  const handleDeleteUser = async () => {
    if (!deleteUser) return;
    setSubmitting(true);
    try {
      await userService.delete(deleteUser.id);
      toast.success(`User ${deleteUser.email} permanently deleted`);
      setDeleteUser(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.response?.data?.message || 'Failed to delete user');
    } finally { setSubmitting(false); }
  };

  // ─── Bulk manage helpers ────────────────────────────────────────────────────

  const fetchBulkStudents = async () => {
    setBulkLoading(true);
    try {
      // Fetch ALL students (large page)
      const res = await userService.list({ role: 'student', size: 500 });
      setBulkStudents(res.data || []);
    } catch { setBulkStudents([]); }
    finally { setBulkLoading(false); }
  };

  const openBulkPanel = () => {
    setBulkOpen(true);
    setBulkSelected(new Set());
    setBulkYear('');
    setBulkBranch('');
    setBulkCourse('');
    setBulkSearch('');
    fetchBulkStudents();
  };

  const filteredBulkStudents = bulkStudents.filter(s => {
    if (bulkYear && s.year_of_study !== bulkYear) return false;
    if (bulkBranch && (!s.branch || !s.branch.toLowerCase().includes(bulkBranch.toLowerCase()))) return false;
    if (bulkCourse && (!s.course || !s.course.toLowerCase().includes(bulkCourse.toLowerCase()))) return false;
    if (bulkSearch) {
      const q = bulkSearch.toLowerCase();
      if (!s.name?.toLowerCase().includes(q) && !s.email.toLowerCase().includes(q) && !(s.sap_id || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const toggleBulkSelect = (id: number) => {
    setBulkSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (bulkSelected.size === filteredBulkStudents.length) {
      setBulkSelected(new Set());
    } else {
      setBulkSelected(new Set(filteredBulkStudents.map(s => s.id)));
    }
  };

  const initBulkAction = (action: 'deactivate' | 'delete') => {
    if (bulkSelected.size === 0) {
      toast.error('Select at least one student');
      return;
    }
    setBulkAction(action);
    setBulkConfirmOpen(true);
  };

  const executeBulkAction = async () => {
    if (!bulkAction || bulkSelected.size === 0) return;
    setBulkSubmitting(true);
    try {
      const ids = Array.from(bulkSelected);
      if (bulkAction === 'deactivate') {
        await userService.bulkAction({ user_ids: ids, action: 'deactivate' });
        toast.success(`${ids.length} student(s) deactivated`);
      } else {
        await userService.bulkAction({ user_ids: ids, action: 'delete' });
        toast.success(`${ids.length} student(s) permanently deleted`);
      }
      setBulkConfirmOpen(false);
      setBulkSelected(new Set());
      fetchBulkStudents();
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.response?.data?.message || 'Bulk action failed');
    } finally { setBulkSubmitting(false); }
  };

  // Unique filters from data
  const uniqueBranches = Array.from(new Set(bulkStudents.map(s => s.branch).filter((b): b is string => !!b)));
  const uniqueCourses = Array.from(new Set(bulkStudents.map(s => s.course).filter((c): c is string => !!c)));

  const filtered = users.filter(u =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Create and manage all {total} accounts</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={<Users className="w-4 h-4" />} onClick={openBulkPanel}>
            <span className="hidden sm:inline">Bulk Manage Students</span>
            <span className="sm:hidden">Bulk Manage</span>
          </Button>
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>
            <span className="hidden sm:inline">Create User</span>
            <span className="sm:hidden">Create</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <Input placeholder="Search name or email…" leftIcon={<Search className="w-4 h-4" />}
          value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <Select options={ROLES} value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} aria-label="Filter by user role" className="w-40" />
        <Button variant="secondary" icon={<RefreshCw className="w-4 h-4" />} onClick={fetchUsers}>Refresh</Button>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table className="ems-table">
          <thead>
            <tr>
              <th>Name</th><th>Email</th><th>Role</th><th>School</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}><td colSpan={6}><div className="skeleton h-4 rounded w-full" /></td></tr>
              ))
            ) : filtered?.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-[var(--text-muted)]">No users found</td></tr>
            ) : filtered?.map(u => (
              <tr key={u.id}>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-[var(--card-bg)] text-[rgb(var(--color-primary))] rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {(u.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">{u.name || '—'}</span>
                    {u.force_password_change && (
                      <span className="badge bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] text-[10px]">Temp pwd</span>
                    )}
                  </div>
                </td>
                <td className="text-[var(--text-secondary)] text-xs">{u.email}</td>
                <td><RoleBadge role={u.role} /></td>
                <td className="text-[var(--text-secondary)] text-xs">{u.department?.name || '—'}</td>
                <td>
                  <span className={`badge ${u.is_active ? 'bg-[var(--status-success-bg)] text-[var(--status-success-text)]' : 'bg-[var(--surface-subtle)] text-[var(--text-secondary)]'}`}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(u)}
                      className="p-1.5 text-[var(--text-muted)] hover:text-[var(--status-info-text)] hover:bg-[var(--status-info-bg)] rounded-lg transition-colors" title="Edit User">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {u.is_active ? (
                      <button onClick={() => setDeactivateUser(u)}
                        className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-danger)] hover:bg-[var(--status-danger-bg)] rounded-lg transition-colors" title="Deactivate">
                        <UserX className="w-4 h-4" />
                      </button>
                    ) : (
                      <button onClick={async () => { await userService.activate(u.id); fetchUsers(); toast.success('User activated'); }}
                        className="p-1.5 text-[var(--text-muted)] hover:text-[var(--status-success-text)] hover:bg-[var(--status-success-bg)] rounded-lg transition-colors" title="Activate">
                        <UserCheck className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => setDeleteUser(u)}
                      className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-danger)] hover:bg-[var(--status-danger-bg)] rounded-lg transition-colors" title="Delete permanently">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} total={total} perPage={20} onChange={setPage} />

      {/* Create User Modal */}
      <Modal open={createOpen} onClose={() => { setCreateOpen(false); reset(); }} title="Create New User"
        footer={<>
          <Button variant="secondary" onClick={() => { setCreateOpen(false); reset(); }}>Cancel</Button>
          <Button loading={submitting} onClick={handleSubmit(handleCreate)}>Create User</Button>
        </>}>
        <div className="space-y-4">
          <Alert type="info">
            <span>This will immediately create the user. They can log in using the email and password you set here.</span>
          </Alert>
          <Input label="Full Name *" placeholder="Firstname Lastname" error={errors.name?.message} {...register('name')} />
          <Input label="Email *" type="email" placeholder="user@nmims.in" error={errors.email?.message} {...register('email')} />
          <Input label="Password *" type="text" placeholder="Type password here..." error={errors.password?.message} {...register('password')} />
          <Select label="Role *" options={ROLES.filter(r => r.value)} placeholder="Select role..."
            error={errors.role?.message} {...register('role')} />
          <Select label="School *" options={deptOptions} placeholder="Select school..."
            error={errors.department_id?.message} {...register('department_id')} />
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal open={editOpen} onClose={() => { setEditOpen(false); setEditingUser(null); }} title="Edit User"
        footer={<>
          <Button variant="secondary" onClick={() => { setEditOpen(false); setEditingUser(null); }}>Cancel</Button>
          <Button loading={submitting} onClick={handleEditSubmit(submitEdit)}>Save Changes</Button>
        </>}>
        <div className="space-y-4">
          <Input label="Full Name" placeholder="Firstname Lastname" error={editErrors.name?.message} {...registerEdit('name')} />
          <Input label="Email" type="email" error={editErrors.email?.message} {...registerEdit('email')} />
          
          <div className="space-y-1">
            <Input label="Set New Password" type="text" placeholder="Leave blank to keep current password" error={editErrors.new_password?.message} {...registerEdit('new_password')} />
            <p className="text-xs text-[var(--text-muted)]">Current passwords are securely hashed and cannot be viewed. Type here to overwrite with a new password.</p>
          </div>

          <Select label="Role" options={ROLES.filter(r => r.value)} error={editErrors.role?.message} {...registerEdit('role')} />
          <Select label="School" options={deptOptions} placeholder="Select school..." error={editErrors.department_id?.message} {...registerEdit('department_id')} />
        </div>
      </Modal>

      {/* Deactivate confirm */}
      <Modal open={!!deactivateUser} onClose={() => setDeactivateUser(null)} title="Deactivate User"
        footer={<>
          <Button variant="secondary" onClick={() => setDeactivateUser(null)}>Cancel</Button>
          <Button variant="danger" loading={submitting} onClick={handleDeactivate}>Deactivate</Button>
        </>}>
        <div className="space-y-3">
          <p className="text-sm text-[var(--text-secondary)]">
            Are you sure you want to deactivate <strong>{deactivateUser?.name}</strong>?
            They will not be able to log in until reactivated.
          </p>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteUser} onClose={() => setDeleteUser(null)} title="⚠️ Permanently Delete User"
        footer={<>
          <Button variant="secondary" onClick={() => setDeleteUser(null)}>Cancel</Button>
          <Button variant="danger" loading={submitting} onClick={handleDeleteUser}>Delete Permanently</Button>
        </>}>
        <div className="space-y-3">
          <Alert type="warning">
            <span><strong>This action cannot be undone.</strong> The user account, all associated data, and event history will be permanently removed.</span>
          </Alert>
          <p className="text-sm text-[var(--text-secondary)]">
            Are you sure you want to permanently delete <strong>{deleteUser?.name || deleteUser?.email}</strong>?
          </p>
        </div>
      </Modal>

      {/* ─── Bulk Manage Students Modal ──────────────────────────────────────── */}
      <Modal open={bulkOpen} onClose={() => setBulkOpen(false)} title="📋 Bulk Manage Students" size="lg"
        footer={
          bulkSelected.size > 0 ? (
            <>
              <span className="text-sm font-semibold text-[var(--text-primary)] mr-auto">{bulkSelected.size} student(s) selected</span>
              <Button variant="secondary" onClick={() => initBulkAction('deactivate')} icon={<UserX className="w-4 h-4"/>}>Deactivate Selected</Button>
              <Button variant="danger" onClick={() => initBulkAction('delete')} icon={<Trash2 className="w-4 h-4"/>}>Delete Selected</Button>
            </>
          ) : (
            <Button variant="secondary" onClick={() => setBulkOpen(false)}>Close</Button>
          )
        }>
        <div className="space-y-4">
          <Alert type="info">
            <span>Filter and select students below. Only accounts with role = <strong>student</strong> are shown.</span>
          </Alert>

          {/* Filters row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Select options={YEARS} value={bulkYear} onChange={e => setBulkYear(e.target.value)} />
            <Select
              options={[{ value: '', label: 'All Branches' }, ...uniqueBranches.map(b => ({ value: b!, label: b! }))]}
              value={bulkBranch}
              onChange={e => setBulkBranch(e.target.value)}
            />
            <Select
              options={[{ value: '', label: 'All Courses' }, ...uniqueCourses.map(c => ({ value: c!, label: c! }))]}
              value={bulkCourse}
              onChange={e => setBulkCourse(e.target.value)}
            />
            <Input placeholder="Search name/email…" value={bulkSearch} onChange={e => setBulkSearch(e.target.value)}
              leftIcon={<Search className="w-3.5 h-3.5"/>}
            />
          </div>

          {/* Select All bar */}
          <div className="flex items-center justify-between bg-[var(--page-bg)] rounded-xl px-4 py-2.5">
            <button onClick={toggleSelectAll} className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)] hover:text-[rgb(var(--color-primary))] transition-colors">
              {bulkSelected.size === filteredBulkStudents.length && filteredBulkStudents.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-[rgb(var(--color-primary))]" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              Select All ({filteredBulkStudents.length})
            </button>
            <span className="text-xs text-[var(--text-muted)]">{bulkSelected.size} selected</span>
          </div>

          {/* Student list */}
          <div className="max-h-72 overflow-y-auto border border-[var(--card-border)] rounded-xl divide-y divide-[var(--card-border)]">
            {bulkLoading ? (
              <div className="flex items-center justify-center py-12"><Spinner /></div>
            ) : filteredBulkStudents.length === 0 ? (
              <p className="text-center text-sm text-[var(--text-muted)] py-8">No students match filters</p>
            ) : filteredBulkStudents.map(s => (
              <label key={s.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--page-bg)] transition-colors cursor-pointer">
                <input type="checkbox" checked={bulkSelected.has(s.id)} onChange={() => toggleBulkSelect(s.id)}
                  className="w-4 h-4 rounded border-[var(--input-border)] text-[rgb(var(--color-primary))] focus:ring-[var(--input-focus-ring)]" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-[var(--text-primary)] truncate">{s.name || '—'}</p>
                  <p className="text-xs text-[var(--text-muted)]">{s.email} {s.sap_id ? `· ${s.sap_id}` : ''}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {s.year_of_study && <span className="badge bg-[var(--status-info-bg)] text-[var(--status-info-text)] text-[10px]">{s.year_of_study}</span>}
                  {s.branch && <span className="badge bg-[var(--status-info-bg)] text-[var(--status-info-text)] text-[10px]">{s.branch}</span>}
                  <span className={`badge text-[10px] ${s.is_active ? 'bg-[var(--status-success-bg)] text-[var(--status-success-text)]' : 'bg-[var(--surface-subtle)] text-[var(--text-secondary)]'}`}>
                    {s.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>
      </Modal>

      {/* Bulk action confirmation */}
      <Modal open={bulkConfirmOpen} onClose={() => setBulkConfirmOpen(false)}
        title={bulkAction === 'delete' ? '⚠️ Confirm Bulk Delete' : 'Confirm Bulk Deactivate'}
        footer={<>
          <Button variant="secondary" onClick={() => setBulkConfirmOpen(false)}>Cancel</Button>
          <Button variant="danger" loading={bulkSubmitting} onClick={executeBulkAction}>
            {bulkAction === 'delete' ? `Delete ${bulkSelected.size} Student(s)` : `Deactivate ${bulkSelected.size} Student(s)`}
          </Button>
        </>}>
        <div className="space-y-3">
          {bulkAction === 'delete' ? (
            <Alert type="warning">
              <span><strong>This action cannot be undone.</strong> All {bulkSelected.size} selected student accounts will be permanently removed from the database.</span>
            </Alert>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">
              You are about to deactivate <strong>{bulkSelected.size}</strong> student account(s). They will not be able to log in until reactivated.
            </p>
          )}
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Affected users: {bulkSelected.size}
          </p>
        </div>
      </Modal>
    </div>
  );
}
