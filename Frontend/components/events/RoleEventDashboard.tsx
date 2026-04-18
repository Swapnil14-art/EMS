'use client';
import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { eventService } from '@/lib/services';
import { EventCard, EventCardSkeleton } from '@/components/events/EventCard';
import { Input, Pagination, EmptyState, Select } from '@/components/ui';
import type { Event } from '@/types';

interface RoleEventDashboardProps {
  title: string;
  subtitle: string;
  manageOnly: boolean;
}

export function RoleEventDashboard({ title, subtitle, manageOnly }: RoleEventDashboardProps) {
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');

  const fetchEvents = () => {
    setLoading(true);
    // Since roles are viewing and managing without specific statuses, we just list with manageOnly
    // Director/AssoDean see approved,ongoing,completed,archived.
    // If we only want to ensure it works, we leave status open but backend naturally limits.
    eventService.list({ manage_only: manageOnly, size: 2000 })
      .then(r => {
        setAllEvents(r.data || []);
      })
      .catch(() => setAllEvents([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvents();
  }, [manageOnly]);

  useEffect(() => {
    // Client-side filtering based on search and time filter
    let filtered = [...allEvents];

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(e => 
        e.title.toLowerCase().includes(q) || 
        (e.school_department || '').toLowerCase().includes(q)
      );
    }

    if (timeFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(e => {
        const d = new Date(e.start_datetime);
        if (timeFilter === 'month') {
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }
        if (timeFilter === 'year') {
          return d.getFullYear() === now.getFullYear();
        }
        if (timeFilter === 'semester') {
          const isSpringNow = now.getMonth() < 6; // Jan-Jun
          const isSpringEvent = d.getMonth() < 6;
          return d.getFullYear() === now.getFullYear() && (isSpringNow === isSpringEvent);
        }
        return true;
      });
    }

    // Local pagination
    setTotal(filtered.length);
    const startIdx = (page - 1) * 12;
    setEvents(filtered.slice(startIdx, startIdx + 12));
  }, [allEvents, search, timeFilter, page]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">{subtitle}</p>
      </div>

      <div className="card p-4 flex flex-wrap gap-4 items-center justify-between">
        <Input 
          placeholder="Search events…" 
          leftIcon={<Search className="w-4 h-4" />}
          value={search} 
          onChange={e => { setSearch(e.target.value); setPage(1); }} 
          className="max-w-xs" 
        />
        
        <div className="w-full sm:w-64">
           <Select
             options={[
               { value: 'all', label: 'All Time' },
               { value: 'month', label: 'Current Month' },
               { value: 'semester', label: 'Current Semester (Jan-May/Jul-Dec)' },
               { value: 'year', label: 'Current Year' }
             ]}
             value={timeFilter}
             onChange={e => { setTimeFilter(e.target.value); setPage(1); }}
           />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 min-h-[200px]">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <EventCardSkeleton key={i} />)
          : events.length === 0
            ? <div className="col-span-full"><EmptyState icon="📅" title="No events found" subtitle="No events match your current filters" /></div>
            : events.map(e => <EventCard key={e.id} event={e} />)}
      </div>
      
      {total > 12 && (
        <Pagination page={page} total={total} perPage={12} onChange={setPage} />
      )}
    </div>
  );
}
