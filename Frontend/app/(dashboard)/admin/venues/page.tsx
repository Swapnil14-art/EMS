'use client';
import { useState, useEffect } from 'react';
import { Plus, MapPin, Users, Edit2 } from 'lucide-react';
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
  is_active: z.boolean(),
});
type FormData = z.infer<typeof schema>;

export default function AdminVenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editVenue, setEditVenue] = useState<Venue | null>(null);
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
    reset({ name: venue.name, location: venue.location || '', max_capacity: venue.max_capacity, aliases: venue.aliases || '', is_active: venue.is_active });
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
      reset({ is_active: true, max_capacity: 1 });
      fetchVenues();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.response?.data?.message || 'Failed');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div><h1 className="page-title">Venue Management</h1><p className="page-subtitle">{venues?.length} campus venues</p></div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => { setEditVenue(null); reset({ is_active: true, max_capacity: 1 }); setCreateOpen(true); }}>
          Add Venue
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card p-5 space-y-3"><div className="skeleton h-5 w-2/3 rounded" /><div className="skeleton h-3 w-1/2 rounded" /></div>
        )) : venues?.length === 0 ? (
          <div className="col-span-full"><EmptyState icon={<MapPin />} title="No venues yet"
            action={<Button onClick={() => setCreateOpen(true)}>Add First Venue</Button>} /></div>
        ) : venues?.map(venue => (
          <div key={venue.id} className="card-hover p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-[var(--card-bg)] rounded-2xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-[rgb(var(--color-primary))]" />
              </div>
              <div className="flex items-center gap-2">
                <span className={`badge ${venue.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-[var(--text-muted)]'}`}>
                  {venue.is_active ? 'Active' : 'Inactive'}
                </span>
                <button onClick={() => openEdit(venue)} className="p-1.5 text-[var(--text-muted)] hover:text-[rgb(var(--color-primary))] hover:bg-[var(--card-bg)] rounded-lg transition-colors">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <h3 className="font-display font-bold text-[var(--text-primary)] mb-1">{venue.name}</h3>
            {venue.location && <p className="text-xs text-[var(--text-muted)] mb-2">{venue.location}</p>}
            <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
              <Users className="w-3.5 h-3.5" /> Max {venue.max_capacity} concurrent event(s)
            </div>
            {venue.aliases && <p className="text-xs text-[var(--text-muted)] mt-1">Aliases: {venue.aliases}</p>}
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
          <Controller name="is_active" control={control} render={({ field }) => (
            <Toggle checked={field.value} onChange={field.onChange} label="Venue is active and bookable" />
          )} />
        </div>
      </Modal>
    </div>
  );
}
