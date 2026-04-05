'use client';
import { useState, useEffect } from 'react';
import { Plus, Search, Users, Edit2, BookOpen } from 'lucide-react';
import { clubService, departmentService } from '@/lib/services';
import { Button, Input, Select, Modal, EmptyState, Pagination } from '@/components/ui';
import type { Club } from '@/types';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  name: z.string().min(2, 'Club name required'),
  department_id: z.coerce.number().min(1, 'Department required'),
  description: z.string().optional(),
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

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

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
  }, [page]);

  const handleCreate = async (data: FormData) => {
    setSubmitting(true);
    try {
      await clubService.create(data as any);
      toast.success('Club created');
      setCreateOpen(false);
      reset();
      fetchClubs();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed');
    } finally { setSubmitting(false); }
  };

  const filtered = clubs.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div><h1 className="page-title">Club Management</h1><p className="page-subtitle">{total} clubs across all departments</p></div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>Create Club</Button>
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
          <div key={club.id} className="card-hover p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-[var(--card-bg)] rounded-2xl flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-[rgb(var(--color-primary))]" />
              </div>
              <span className={`badge ${club.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-[var(--text-muted)]'}`}>
                {club.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <h3 className="font-display font-bold text-[var(--text-primary)] mb-1">{club.name}</h3>
            <p className="text-xs text-[var(--text-muted)] mb-2">{club.department?.name || 'Unknown dept'}</p>
            {club.coordinator && (
              <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                <Users className="w-3 h-3" /> {club.coordinator?.name || '—'}
              </p>
            )}
            {club.description && <p className="text-xs text-[var(--text-muted)] mt-2 line-clamp-2">{club.description}</p>}
          </div>
        ))}
      </div>
      <Pagination page={page} total={total} perPage={20} onChange={setPage} />

      <Modal open={createOpen} onClose={() => { setCreateOpen(false); reset(); }} title="Create Club"
        footer={<>
          <Button variant="secondary" onClick={() => { setCreateOpen(false); reset(); }}>Cancel</Button>
          <Button loading={submitting} onClick={handleSubmit(handleCreate)}>Create</Button>
        </>}>
        <div className="space-y-4">
          <Input label="Club Name" placeholder="e.g. Robotics Club" error={errors.name?.message} {...register('name')} />
          <Select label="Department" options={deptOptions} placeholder="Select department" error={errors.department_id?.message} {...register('department_id')} />
          <Input label="Description (optional)" placeholder="Brief description…" {...register('description')} />
        </div>
      </Modal>
    </div>
  );
}
