'use client';
import { useState, useEffect } from 'react';
import { MapPin, Calendar, Users, Clock, Search } from 'lucide-react';
import { venueService } from '@/lib/services';
import { Input, EmptyState } from '@/components/ui';
import { SchoolDisplay } from '@/components/shared/SchoolDisplay';
import type { Venue } from '@/types';

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    venueService.list()
      .then(r => setVenues(r.data || []))
      .catch(() => setVenues([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = venues.filter(v =>
    !search || v.name.toLowerCase().includes(search.toLowerCase()) ||
    (v.location || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="page-title">Venues</h1><p className="page-subtitle">Campus venue availability — {venues?.length} venues</p></div>

      <div className="card p-4">
        <Input placeholder="Search venues…" leftIcon={<Search className="w-4 h-4" />}
          value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card p-5 space-y-3">
            <div className="skeleton h-5 w-2/3 rounded" /><div className="skeleton h-3 w-full rounded" /><div className="skeleton h-3 w-1/2 rounded" />
          </div>
        )) : filtered?.length === 0 ? (
          <div className="col-span-full">
            <EmptyState icon={<MapPin />} title="No venues found" subtitle="Try adjusting your search" />
          </div>
        ) : filtered?.map(venue => (
          <div key={venue.id} className="card-hover p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-[var(--card-bg)] rounded-2xl flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-[rgb(var(--color-primary))]" />
              </div>
              <span className={`badge ${venue.is_active ? 'bg-[var(--status-success-bg)] text-[var(--status-success-text)]' : 'bg-[var(--surface-subtle)] text-[var(--text-secondary)]'}`}>
                {venue.is_active ? 'Available' : 'Inactive'}
              </span>
            </div>
            <h3 className="font-display font-bold text-[var(--text-primary)] mb-1">{venue.name}</h3>
            {venue.location && <p className="text-xs text-[var(--text-muted)] mb-3">{venue.location}</p>}
            <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />Max {venue.max_capacity} concurrent</span>
              {venue.department?.name && (
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /><SchoolDisplay value={venue.department.name} /></span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
