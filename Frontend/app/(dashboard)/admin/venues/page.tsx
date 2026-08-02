'use client';
import { useState, useEffect } from 'react';
import { Plus, MapPin, Users, Edit2, Trash2 } from 'lucide-react';
import { venueService } from '@/lib/services';
import { Button, Input, Modal, Toggle, EmptyState } from '@/components/ui';
import type { Venue } from '@/types';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  name: z.string().min(2, 'Venue name required'),
  location: z.string().optional(),
  max_capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
  aliases: z.string().optional(),
  parent_id: z.union([z.number(), z.string()]).optional().nullable().transform(v => v === '' ? null : v ? Number(v) : null),
  is_active: z.boolean(),
});
type FormData = z.infer<typeof schema>;

export default function AdminVenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editVenue, setEditVenue] = useState<Venue | null>(null);
  const [deleteVenue, setDeleteVenue] = useState<Venue | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { is_active: true, max_capacity: 1 },
  });

  const fetchVenues = async () => {
    setLoading(true);
    try {
      const res = await venueService.list();
      setVenues(res.data || []);
    } catch { setVenues([]); } finally { setLoading(false); }
  };

  useEffect(() => { fetchVenues(); }, []);

  const openEdit = (venue: Venue) => {
    setEditVenue(venue);
    reset({ name: venue.name, location: venue.location || '', max_capacity: venue.max_capacity, aliases: venue.aliases || '', parent_id: venue.parent_id || null, is_active: venue.is_active });
    setCreateOpen(true);
  };

  const handleSubmitForm = async (data: FormData) => {
    setSubmitting(true);
    try {
      if (editVenue) {
        await venueService.update(editVenue.id, data as any);
        toast.success('Venue updated');
      } else {
        await venueService.create(data as any);
        toast.success('Venue created');
      }
      setCreateOpen(false);
      setEditVenue(null);
      reset({ is_active: true, max_capacity: 1, parent_id: null });
      fetchVenues();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.response?.data?.message || 'Failed');
    } finally { setSubmitting(false); }
  };

  const handleDeleteVenue = async () => {
    if (!deleteVenue) return;
    setSubmitting(true);
    try {
      await venueService.delete(deleteVenue.id);
      toast.success('Venue deleted');
      setDeleteVenue(null);
      fetchVenues();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.response?.data?.message || 'Failed to delete venue');
    } finally { setSubmitting(false); }
  };

  const [expandedParentId, setExpandedParentId] = useState<number | null>(null);

  const parentVenues = venues?.filter(v => !v.parent_id) || [];
  const getChildVenues = (parentId: number) => venues?.filter(v => v.parent_id === parentId) || [];

  const VenueCard = ({ venue, isChild = false }: { venue: Venue, isChild?: boolean }) => {
    const childVenues = isChild ? [] : getChildVenues(venue.id);
    const isExpanded = expandedParentId === venue.id;

    return (
      <div className="flex flex-col gap-2">
        <div className={`card-hover p-5 ${isChild ? 'border-l-4 border-l-indigo-400 bg-[var(--surface-subtle)]' : ''}`}>
          <div className="flex items-start justify-between mb-3">
            <div className={`w-10 h-10 ${isChild ? 'bg-[var(--status-info-bg)]' : 'bg-[var(--card-bg)]'} rounded-2xl flex items-center justify-center`}>
              <MapPin className={`w-5 h-5 ${isChild ? 'text-[var(--status-info-text)]' : 'text-[rgb(var(--color-primary))]'}`} />
            </div>
            <div className="flex items-center gap-2">
              <span className={`badge ${venue.is_active ? 'bg-[var(--status-success-bg)] text-[var(--status-success-text)]' : 'bg-muted text-[var(--text-muted)]'}`}>
                {venue.is_active ? 'Active' : 'Inactive'}
              </span>
              <button onClick={() => openEdit(venue)} className="p-1.5 text-[var(--text-muted)] hover:text-[rgb(var(--color-primary))] hover:bg-[var(--card-bg)] rounded-lg transition-colors" title="Edit">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setDeleteVenue(venue)} 
                className="p-1.5 text-[var(--text-muted)] hover:text-[var(--status-danger-text)] hover:bg-[var(--status-danger-bg)] rounded-lg transition-colors" title="Delete">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <h3 className="font-display font-bold text-[var(--text-primary)] mb-1">
            {venue.name} {isChild && <span className="text-[10px] font-medium text-[var(--status-info-text)] ml-1 bg-[var(--status-info-bg)] px-1.5 py-0.5 rounded">Child</span>}
          </h3>
          {venue.location && <p className="text-xs text-[var(--text-muted)] mb-2">{venue.location}</p>}
          <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
            <Users className="w-3.5 h-3.5" /> Max {venue.max_capacity} concurrent event(s)
          </div>
          {venue.aliases && <p className="text-xs text-[var(--text-muted)] mt-1">Aliases: {venue.aliases}</p>}
          
          {!isChild && childVenues.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[var(--border-color)]">
              <button 
                onClick={() => setExpandedParentId(isExpanded ? null : venue.id)}
                className="w-full text-xs font-semibold text-[var(--status-info-text)] bg-[var(--status-info-bg)] hover:bg-[var(--status-info-bg)] py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                {isExpanded ? 'Hide Children' : `Show ${childVenues.length} Children`}
              </button>
            </div>
          )}
        </div>
        
        {isExpanded && !isChild && childVenues.length > 0 && (
          <div className="pl-6 space-y-2 animate-fade-in relative before:absolute before:left-[19px] before:top-0 before:bottom-6 before:w-px before:bg-[var(--status-info-bg)]">
            {childVenues.map(child => (
              <div key={child.id} className="relative">
                <div className="absolute -left-6 top-6 w-5 h-px bg-[var(--status-info-bg)]" />
                <VenueCard venue={child} isChild={true} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div><h1 className="page-title">Venue Management</h1><p className="page-subtitle">{venues?.length} campus venues</p></div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => { setEditVenue(null); reset({ is_active: true, max_capacity: 1, parent_id: null }); setCreateOpen(true); }}>
          Add Venue
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
        {loading ? Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card p-5 space-y-3"><div className="skeleton h-5 w-2/3 rounded" /><div className="skeleton h-3 w-1/2 rounded" /></div>
        )) : parentVenues?.length === 0 ? (
          <div className="col-span-full"><EmptyState icon={<MapPin />} title="No venues yet"
            action={<Button onClick={() => setCreateOpen(true)}>Add First Venue</Button>} /></div>
        ) : parentVenues?.map(venue => (
          <div key={venue.id} className="block">
            <VenueCard venue={venue} />
          </div>
        ))}
      </div>

      <Modal open={createOpen} onClose={() => { setCreateOpen(false); setEditVenue(null); }}
        title={editVenue ? 'Edit Venue' : 'Add New Venue'}
        footer={<>
          <Button variant="secondary" onClick={() => { setCreateOpen(false); setEditVenue(null); }}>Cancel</Button>
          <Button loading={submitting} onClick={handleSubmit(handleSubmitForm)}>{editVenue ? 'Save Changes' : 'Create Venue'}</Button>
        </>}>
        <div className="space-y-4">
          <Input label="Venue Name" placeholder="e.g. Central Auditorium" error={errors.name?.message} {...register('name')} />
          <Input label="Location / Description" placeholder="e.g. Block A, Ground Floor" {...register('location')} />
          <Input label="Max Concurrent Events" type="number" min="1" error={errors.max_capacity?.message} {...register('max_capacity')} hint="How many events can use this venue simultaneously" />
          <Input label="Aliases (comma-separated)" placeholder="e.g. Audi, Main Hall" {...register('aliases')} hint="Used for fuzzy-matching custom venue names" />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[var(--text-primary)]">Parent Venue (Optional)</label>
            <select
              className="px-3 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm focus:border-[rgb(var(--color-primary))] focus:ring-1 focus:ring-[rgb(var(--color-primary))] outline-none transition-all placeholder:text-[var(--text-muted)] w-full"
              {...register('parent_id')}
            >
              <option value="">No Parent (Top Level)</option>
              {venues?.filter(v => !editVenue || v.id !== editVenue.id).map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
            <span className="text-xs text-[var(--text-muted)]">Select a parent venue to create a nested hierarchy.</span>
            {errors.parent_id?.message && <span className="text-xs text-[var(--status-danger-text)]">{String(errors.parent_id.message)}</span>}
          </div>
          <Controller name="is_active" control={control} render={({ field }) => (
            <Toggle checked={field.value} onChange={field.onChange} label="Venue is active and bookable" />
          )} />
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteVenue} onClose={() => setDeleteVenue(null)} title="⚠️ Delete Venue"
        footer={<>
          <Button variant="secondary" onClick={() => setDeleteVenue(null)}>Cancel</Button>
          <Button variant="danger" loading={submitting} onClick={handleDeleteVenue}>Delete</Button>
        </>}>
        <div className="space-y-3">
          <p className="text-sm text-[var(--text-secondary)]">
            Are you sure you want to permanently delete <strong>{deleteVenue?.name}</strong>?
          </p>
          <p className="text-sm font-semibold text-[var(--status-danger-text)]">
            Note: Venues with existing events or nested child venues cannot be deleted directly.
          </p>
        </div>
      </Modal>
    </div>
  );
}
