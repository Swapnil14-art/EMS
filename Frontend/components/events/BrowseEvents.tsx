'use client';
import { useEffect, useState } from 'react';
import { Search, FlaskConical } from 'lucide-react';
import { EventCard, EventCardSkeleton } from '@/components/events/EventCard';
import { Input, Tabs, Pagination, EmptyState } from '@/components/ui';
import { useDebouncedValue, useEventList, useEventStatusCounts } from '@/lib/event-queries';

const STATUS_TABS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'past', label: 'Past' },
];
const PAGE_SIZE = 12;

interface BrowseEventsProps { hideHeader?: boolean; title?: string; subtitle?: string; }

export function BrowseEvents({ hideHeader, title = 'Browse Events', subtitle = "Discover what's happening on campus" }: BrowseEventsProps) {
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState('upcoming');
  const [search, setSearch] = useState('');
  const [isRndOnly, setIsRndOnly] = useState(false);
  const debouncedSearch = useDebouncedValue(search);
  const { data, isLoading } = useEventList({ status: tab, search: debouncedSearch || undefined, is_rnd: isRndOnly ? true : undefined, page, size: PAGE_SIZE });
  const counts = useEventStatusCounts(debouncedSearch);

  useEffect(() => setPage(1), [tab, debouncedSearch, isRndOnly]);
  const tabsWithCounts = STATUS_TABS.map(item => ({ ...item, label: `${item.label} (${counts[item.value as keyof typeof counts]})` }));

  const emptySubtitle = debouncedSearch
    ? "No eligible events match your search query. Try a different keyword!"
    : tab === 'upcoming'
    ? "No eligible upcoming events scheduled right now for your department or college-wide."
    : tab === 'ongoing'
    ? "No eligible events are currently ongoing."
    : "No past eligible events found.";

  return <div className="space-y-6 animate-fade-in">
    {!hideHeader && <div><h1 className="page-title">{title}</h1><p className="page-subtitle">{subtitle}</p></div>}
    <div className="card p-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3 flex-1">
        <Input placeholder="Search events…" leftIcon={<Search className="w-4 h-4" />} value={search} onChange={event => setSearch(event.target.value)} className="max-w-xs" />
        <Tabs tabs={tabsWithCounts} active={tab} onChange={setTab} />
      </div>
      <button
        type="button"
        onClick={() => setIsRndOnly(!isRndOnly)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
          isRndOnly
            ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
            : 'bg-[var(--card-bg)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-purple-400'
        }`}
      >
        <FlaskConical className="w-3.5 h-3.5" />
        <span>R&D Events Only</span>
      </button>
    </div>
    <div className="grid min-h-[200px] grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {isLoading ? Array.from({ length: 8 }).map((_, index) => <EventCardSkeleton key={index} />) : data?.data.length ? data.data.map(event => <EventCard key={event.id} event={event} />) : <div className="col-span-full"><EmptyState icon="📭" title="No events found" subtitle={emptySubtitle} /></div>}
    </div>
    <Pagination page={page} total={data?.total ?? 0} perPage={PAGE_SIZE} onChange={setPage} />
  </div>;
}
