'use client';
import { useState, useEffect } from 'react';
import { Plus, Search, Building2, Trash2 } from 'lucide-react';
import { departmentService } from '@/lib/services';
import { Button, Input, Modal, EmptyState, Pagination } from '@/components/ui';
import type { Department } from '@/types';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  name: z.string().min(2, 'School name required'),
  code: z.string().min(2, 'School code required').max(10, 'Code too long'),
});
type FormData = z.infer<typeof schema>;

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await departmentService.list();
      setDepartments(res || []);
      setTotal(res?.length || 0);
    } catch { setDepartments([]); } finally { setLoading(false); }
  };

  useEffect(() => { fetchDepartments(); }, [page]);

  const handleCreate = async (data: FormData) => {
    setSubmitting(true);
    try {
      await departmentService.create(data);
      toast.success('School created');
      setCreateOpen(false);
      reset();
      fetchDepartments();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create school');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this school? This action cannot be undone.')) return;
    try {
      await departmentService.remove(id);
      toast.success('School deleted');
      fetchDepartments();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete school (it might be in use)');
    }
  };

  const filtered = departments.filter(d => 
    !search || 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div><h1 className="page-title">School Management</h1><p className="page-subtitle">{total} listed schools</p></div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>Create School</Button>
      </div>

      <div className="card p-4 flex gap-3">
        <Input placeholder="Search schools…" leftIcon={<Search className="w-4 h-4" />}
          value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card p-5 space-y-3"><div className="skeleton h-5 w-2/3 rounded" /><div className="skeleton h-3 w-1/2 rounded" /></div>
        )) : filtered?.length === 0 ? (
          <div className="col-span-full"><EmptyState icon={<Building2 />} title="No schools found" action={<Button onClick={() => setCreateOpen(true)}>Create First School</Button>} /></div>
        ) : filtered?.map(dept => (
          <div key={dept.id} className="card-hover p-5 relative">
            <button onClick={() => handleDelete(dept.id)} className="absolute top-4 right-4 p-1.5 text-[var(--text-muted)] hover:text-[var(--text-danger)] hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
            <h3 className="font-display font-bold text-[var(--text-primary)] mb-1">{dept.name}</h3>
            <p className="text-sm font-mono bg-muted text-[var(--text-muted)] px-2 py-0.5 rounded-md inline-block">{dept.code}</p>
          </div>
        ))}
      </div>
      <Pagination page={page} total={total} perPage={20} onChange={setPage} />

      <Modal open={createOpen} onClose={() => { setCreateOpen(false); reset(); }} title="Create School"
        footer={<>
          <Button variant="secondary" onClick={() => { setCreateOpen(false); reset(); }}>Cancel</Button>
          <Button loading={submitting} onClick={handleSubmit(handleCreate)}>Create</Button>
        </>}>
        <div className="space-y-4">
          <Input label="School Name" placeholder="e.g. School of Engineering" error={errors.name?.message} {...register('name')} />
          <Input label="Short Code" placeholder="e.g. ENGG" className="font-mono uppercase" error={errors.code?.message} {...register('code', { onChange: (e) => { e.target.value = e.target.value.toUpperCase(); } })} />
        </div>
      </Modal>
    </div>
  );
}
