'use client';
import { useState, useEffect } from 'react';
import { Plus, Search, Users, Edit2, BookOpen, Trash2 } from 'lucide-react';
import { clubService, departmentService, userService } from '@/lib/services';
import { Button, Input, Select, Modal, EmptyState, Pagination } from '@/components/ui';
import type { Club, User } from '@/types';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  name: z.string().min(2, 'Club name required'),
  department_id: z.coerce.number().min(1, 'School required'),
  description: z.string().optional(),
  coordinator_ids: z.array(z.number()).default([]),
});
type FormData = z.infer<typeof schema>;

export default function AdminClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deptOptions, setDeptOptions] = useState<{value: string; label: string}[]>([]);
  const [allCoordinators, setAllCoordinators] = useState<User[]>([]);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [deleteClub, setDeleteClub] = useState<Club | null>(null);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { coordinator_ids: [] }
  });

  const watchedDept = watch('department_id');
  const selectedCoordinatorIds = watch('coordinator_ids') || [];

  const fetchClubs = async () => {
    setLoading(true);
    try {
      const res = await clubService.list();
      setClubs(res.data || []);
      setTotal(res.total || 0);
    } catch { setClubs([]); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchClubs();
    departmentService.list().then(depts => {
      const arr = Array.isArray(depts) ? depts : [];
      setDeptOptions(arr.map((d: any) => ({ value: String(d.id), label: `${d.name} (${d.code})` })));
    }).catch(() => {});
    
    userService.list({ role: 'club_coordinator', size: 500 }).then(res => {
      setAllCoordinators(res.data || []);
    }).catch(() => {});
  }, [page]);

  const availableCoordinators = allCoordinators.filter(u => 
    (!watchedDept || u.department_id === Number(watchedDept)) && 
    (!u.club_id || u.club_id === editingClub?.id)
  );

  const handleCreateOrUpdate = async (data: FormData) => {
    setSubmitting(true);
    try {
      if (editingClub) {
        await clubService.update(editingClub.id, data as any);
        toast.success('Club updated');
      } else {
        await clubService.create(data as any);
        toast.success('Club created');
      }
      setCreateOpen(false);
      setEditingClub(null);
      reset({ name: '', department_id: undefined, description: '', coordinator_ids: [] });
      fetchClubs();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed');
    } finally { setSubmitting(false); }
  };

  const handleDeleteClub = async () => {
    if (!deleteClub) return;
    setSubmitting(true);
    try {
      await clubService.delete(deleteClub.id);
      toast.success('Club deleted');
      setDeleteClub(null);
      fetchClubs();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.response?.data?.message || 'Failed to delete club');
    } finally { setSubmitting(false); }
  };

  const handleEdit = (club: Club) => {
    setEditingClub(club);
    reset({
      name: club.name,
      department_id: club.department_id,
      description: club.description || '',
      coordinator_ids: club.coordinators?.map(c => c.id) || []
    });
    setCreateOpen(true);
  };

  const filtered = clubs.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div><h1 className="page-title">Club Management</h1><p className="page-subtitle">{total} clubs across all schools</p></div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => {
          setEditingClub(null);
          reset({ name: '', department_id: undefined, description: '', coordinator_ids: [] });
          setCreateOpen(true);
        }}>Create Club</Button>
      </div>

      <div className="card p-4 flex gap-3">
        <Input placeholder="Search clubs…" leftIcon={<Search className="w-4 h-4" />}
          value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card p-5 space-y-3"><div className="skeleton h-5 w-2/3 rounded" /><div className="skeleton h-3 w-1/2 rounded" /></div>
        )) : filtered?.length === 0 ? (
          <div className="col-span-full"><EmptyState icon={<BookOpen />} title="No clubs found" action={<Button onClick={() => setCreateOpen(true)}>Create First Club</Button>} /></div>
        ) : filtered?.map(club => (
          <div key={club.id} className="card-hover p-5 relative">
            <div className="absolute top-4 right-4 flex gap-1">
              <button onClick={() => handleEdit(club)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => setDeleteClub(club)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-start justify-between mb-3 pr-16">
              <div className="w-10 h-10 bg-[var(--card-bg)] rounded-2xl flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-[rgb(var(--color-primary))]" />
              </div>
              <span className={`badge ${club.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-[var(--text-muted)]'}`}>
                {club.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <h3 className="font-display font-bold text-[var(--text-primary)] mb-1 pr-16">{club.name}</h3>
            <p className="text-xs text-[var(--text-muted)] mb-2">{club.department?.name || 'Unknown school'}</p>
            
            {club.coordinators && club.coordinators.length > 0 ? (
              <div className="text-xs text-[var(--text-secondary)] mt-2">
                <div className="flex items-center gap-1 font-semibold mb-1"><Users className="w-3 h-3" /> Coordinators:</div>
                <div className="flex flex-wrap gap-1">
                  {club.coordinators.map(c => (
                    <span key={c.id} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100">{c.name || c.email}</span>
                  ))}
                </div>
              </div>
            ) : club.coordinator ? (
              <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1 mt-2">
                <Users className="w-3 h-3" /> {club.coordinator?.name || '—'}
              </p>
            ) : null}

            {club.description && <p className="text-xs text-[var(--text-muted)] mt-2 line-clamp-2">{club.description}</p>}
          </div>
        ))}
      </div>
      <Pagination page={page} total={total} perPage={20} onChange={setPage} />

      <Modal open={createOpen} onClose={() => { setCreateOpen(false); setEditingClub(null); }} title={editingClub ? "Edit Club" : "Create Club"}
        footer={<>
          <Button variant="secondary" onClick={() => { setCreateOpen(false); setEditingClub(null); }}>Cancel</Button>
          <Button loading={submitting} onClick={handleSubmit(handleCreateOrUpdate)}>{editingClub ? "Save Changes" : "Create"}</Button>
        </>}>
        <div className="space-y-4">
          <Input label="Club Name" placeholder="e.g. Robotics Club" error={errors.name?.message} {...register('name')} />
          <Select label="School" options={deptOptions} placeholder="Select school" error={errors.department_id?.message} {...register('department_id')} />
          
          <div className="space-y-1.5">
            <label className="label">Assign Coordinators</label>
            {!watchedDept ? (
               <div className="text-sm text-slate-500 italic p-3 bg-slate-50 rounded-lg border border-slate-200">First select a school/department...</div>
            ) : availableCoordinators.length === 0 ? (
               <div className="text-sm text-slate-500 italic p-3 bg-slate-50 rounded-lg border border-slate-200">No free coordinators found in this school.</div>
            ) : (
              <div className="max-h-[160px] overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1">
                {availableCoordinators.map(user => {
                  const isChecked = selectedCoordinatorIds.includes(user.id);
                  return (
                    <label key={user.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${isChecked ? 'bg-blue-50 border-blue-100' : 'hover:bg-slate-50 border-transparent'} border`}>
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setValue('coordinator_ids', [...selectedCoordinatorIds, user.id]);
                          } else {
                            setValue('coordinator_ids', selectedCoordinatorIds.filter(id => id !== user.id));
                          }
                        }}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-800">{user.name || user.email}</span>
                        {user.name && <span className="text-xs text-slate-500 ml-2 block sm:inline">({user.email})</span>}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <Input label="Description (optional)" placeholder="Brief description…" {...register('description')} />
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteClub} onClose={() => setDeleteClub(null)} title="⚠️ Delete Club"
        footer={<>
          <Button variant="secondary" onClick={() => setDeleteClub(null)}>Cancel</Button>
          <Button variant="danger" loading={submitting} onClick={handleDeleteClub}>Delete</Button>
        </>}>
        <div className="space-y-3">
          <p className="text-sm text-[var(--text-secondary)]">
            Are you sure you want to permanently delete <strong>{deleteClub?.name}</strong>?
          </p>
          <p className="text-sm font-semibold text-red-600">
            Note: Clubs with existing events cannot be deleted directly.
          </p>
        </div>
      </Modal>
    </div>
  );
}
