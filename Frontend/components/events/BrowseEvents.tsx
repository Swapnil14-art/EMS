'use client';
import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { EventCard, EventCardSkeleton } from '@/components/events/EventCard';
import { Input, Tabs, Pagination, EmptyState, Select } from '@/components/ui';
import { useDebouncedValue, useEventList, useEventStatusCounts } from '@/lib/event-queries';
import { useAuthStore } from '@/store/authStore';

const DEFAULT_STATUS_TABS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'past', label: 'Past' },
];

const COORDINATOR_STATUS_TABS = [
  { value: '', label: 'All Statuses' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'past', label: 'Past' },
  { value: 'pending_associate_dean,pending_director,pending_coordinator_parallel,suggested_changes', label: 'Pending' },
  { value: 'pending_coordinator_parallel', label: 'Parallel Coordinator Pending' },
  { value: 'pending_associate_dean', label: 'Dean Pending' },
  { value: 'pending_director', label: 'Director Pending' },
  { value: 'draft', label: 'Draft' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'archived', label: 'Archived' },
  { value: 'cancelled', label: 'Cancelled' },
];

const RND_FILTER_OPTIONS = [
  { value: 'all', label: 'All Event Types' },
  { value: 'normal', label: 'Normal Events' },
  { value: 'rnd', label: 'R&D Events' },
];

const PAGE_SIZE = 12;

interface BrowseEventsProps { hideHeader?: boolean; title?: string; subtitle?: string; }

export function BrowseEvents({ hideHeader, title = 'Browse Events', subtitle = "Discover what's happening on campus" }: BrowseEventsProps) {
  const { user } = useAuthStore();
  const isCoordinatorOrStaff = Boolean(user?.role && ['club_coordinator', 'associate_dean', 'director', 'super_admin'].includes(user.role));
  const statusTabs = isCoordinatorOrStaff ? COORDINATOR_STATUS_TABS : DEFAULT_STATUS_TABS;

  const [page, setPage] = useState(1);
  const [tab, setTab] = useState(isCoordinatorOrStaff ? '' : 'upcoming');
  const [hasInitializedTab, setHasInitializedTab] = useState(false);
  const [search, setSearch] = useState('');
  const [rndFilter, setRndFilter] = useState('all');

  useEffect(() => {
    if (user && !hasInitializedTab) {
      if (['club_coordinator', 'associate_dean', 'director', 'super_admin'].includes(user.role)) {
        setTab('');
      }
      setHasInitializedTab(true);
    }
  }, [user, hasInitializedTab]);

  const debouncedSearch = useDebouncedValue(search);

  const isRndParam = rndFilter === 'rnd' ? true : rndFilter === 'normal' ? false : undefined;

  const { data, isLoading } = useEventList({
    status: tab || undefined,
    search: debouncedSearch || undefined,
    is_rnd: isRndParam,
    page,
    size: PAGE_SIZE
  });

  const defaultCounts = useEventStatusCounts(debouncedSearch);

  useEffect(() => setPage(1), [tab, debouncedSearch, rndFilter]);

  const tabsToRender = isCoordinatorOrStaff
    ? statusTabs
    : statusTabs.map(item => ({ ...item, label: `${item.label} (${defaultCounts[item.value as keyof typeof defaultCounts] ?? 0})` }));

  const emptySubtitle = debouncedSearch
    ? "No events match your search query. Try a different keyword!"
    : tab === 'upcoming'
    ? "No upcoming events scheduled right now."
    : tab === 'ongoing'
    ? "No events are currently ongoing."
    : "No events found.";

  return <div className="space-y-6 animate-fade-in">
    {!hideHeader && <div><h1 className="page-title">{title}</h1><p className="page-subtitle">{subtitle}</p></div>}
    <div className="card p-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3 flex-1">
        <Input placeholder="Search events…" leftIcon={<Search className="w-4 h-4" />} value={search} onChange={event => setSearch(event.target.value)} className="max-w-xs" />
        <Select value={rndFilter} onChange={e => setRndFilter(e.target.value)} options={RND_FILTER_OPTIONS} className="w-44 flex-shrink-0" />
        <Tabs tabs={tabsToRender} active={tab} onChange={setTab} />
      </div>
    </div>
    <div className="grid min-h-[200px] grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {isLoading ? Array.from({ length: 8 }).map((_, index) => <EventCardSkeleton key={index} />) : data?.data.length ? data.data.map(event => <EventCard key={event.id} event={event} />) : <div className="col-span-full"><EmptyState icon="📭" title="No events found" subtitle={emptySubtitle} /></div>}
    </div>
    <Pagination page={page} total={data?.total ?? 0} perPage={PAGE_SIZE} onChange={setPage} />
  </div>;
}
