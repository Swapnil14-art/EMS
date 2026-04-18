'use client';
import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { eventService } from '@/lib/services';
import { EventCard, EventCardSkeleton } from '@/components/events/EventCard';
import { Input, Tabs, Pagination, EmptyState } from '@/components/ui';
import type { Event } from '@/types';
import { getEventTimeStatus } from '@/lib/utils';

const STATUS_TABS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'past', label: 'Past' },
];

interface BrowseEventsProps {
  hideHeader?: boolean;
  title?: string;
  subtitle?: string;
}

export function BrowseEvents({ hideHeader, title = "Browse Events", subtitle = "Discover what's happening on campus" }: BrowseEventsProps) {
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('upcoming');
  const [search, setSearch] = useState('');
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});

  const fetchAndCategorize = () => {
    setLoading(true);
    // Fetch all public events matching search text
    eventService.list({ status: 'approved,ongoing,completed,archived', search: search || undefined, size: 2000 })
      .then(r => {
        const data = r.data || [];
        setAllEvents(data);
      })
      .catch(() => setAllEvents([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAndCategorize();
  }, [search]);

  useEffect(() => {
    // Local filtering when `tab`, `page`, or `allEvents` changes
    const filtered = allEvents.filter(e => getEventTimeStatus(e.start_datetime, e.end_datetime) === tab);
    
    // Update counts
    const newCounts = { upcoming: 0, ongoing: 0, past: 0 };
    allEvents.forEach(e => {
      const s = getEventTimeStatus(e.start_datetime, e.end_datetime);
      if (s in newCounts) newCounts[s as keyof typeof newCounts]++;
    });
    setTabCounts(newCounts);

    // Local pagination
    setTotal(filtered.length);
    const startIdx = (page - 1) * 12;
    setEvents(filtered.slice(startIdx, startIdx + 12));
  }, [allEvents, tab, page]);

  const tabsWithCounts = STATUS_TABS.map(t => ({
    value: t.value,
    label: `${t.label} (${tabCounts[t.value] ?? '...'})`
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {!hideHeader && (
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">{subtitle}</p>
        </div>
      )}

      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <Input placeholder="Search events…" leftIcon={<Search className="w-4 h-4" />}
          value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <Tabs tabs={tabsWithCounts} active={tab} onChange={t => { setTab(t); setPage(1); }} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 min-h-[200px]">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <EventCardSkeleton key={i} />)
          : events?.length === 0
            ? <div className="col-span-full"><EmptyState icon="📭" title="No events found" subtitle="Try a different filter or check back later" /></div>
            : events?.map(e => <EventCard key={e.id} event={e} />)}
      </div>
      <Pagination page={page} total={total} perPage={12} onChange={setPage} />
    </div>
  );
}
