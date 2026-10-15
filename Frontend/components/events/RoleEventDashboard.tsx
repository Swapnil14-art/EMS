'use client';
import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { EventCard, EventCardSkeleton } from '@/components/events/EventCard';
import { Input, Pagination, EmptyState, Select } from '@/components/ui';
import { useDebouncedValue, useEventList } from '@/lib/event-queries';

interface RoleEventDashboardProps { title: string; subtitle: string; manageOnly: boolean; }
const PAGE_SIZE = 12;

function getDateRange(filter: string) {
  if (filter === 'all') return {};
  const now = new Date();
  const start = new Date(now.getFullYear(), filter === 'year' ? 0 : filter === 'semester' && now.getMonth() >= 6 ? 6 : now.getMonth(), 1);
  const end = filter === 'year' ? new Date(now.getFullYear() + 1, 0, 1) : filter === 'semester' ? new Date(now.getFullYear(), now.getMonth() >= 6 ? 12 : 6, 1) : new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { from_date: start.toISOString(), to_date: end.toISOString() };
}

export function RoleEventDashboard({ title, subtitle, manageOnly }: RoleEventDashboardProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const debouncedSearch = useDebouncedValue(search);
  const range = useMemo(() => getDateRange(timeFilter), [timeFilter]);
  const { data, isLoading } = useEventList({ manage_only: manageOnly, search: debouncedSearch || undefined, page, size: PAGE_SIZE, ...range });
  useEffect(() => setPage(1), [debouncedSearch, timeFilter, manageOnly]);

  return <div className="space-y-6 animate-fade-in">
    <div><h1 className="page-title">{title}</h1><p className="page-subtitle">{subtitle}</p></div>
    <div className="card flex flex-wrap items-center justify-between gap-4 p-4"><Input placeholder="Search events…" leftIcon={<Search className="w-4 h-4" />} value={search} onChange={event => setSearch(event.target.value)} className="max-w-xs" /><div className="w-full sm:w-64"><Select options={[{ value: 'all', label: 'All Time' }, { value: 'month', label: 'Current Month' }, { value: 'semester', label: 'Current Semester (Jan–Jun/Jul–Dec)' }, { value: 'year', label: 'Current Year' }]} value={timeFilter} onChange={event => setTimeFilter(event.target.value)} /></div></div>
    <div className="grid min-h-[200px] grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{isLoading ? Array.from({ length: 8 }).map((_, index) => <EventCardSkeleton key={index} />) : data?.data.length ? data.data.map(event => <EventCard key={event.id} event={event} />) : <div className="col-span-full"><EmptyState icon="📭" title="No events found" subtitle="No events match your current filters" /></div>}</div>
    <Pagination page={page} total={data?.total ?? 0} perPage={PAGE_SIZE} onChange={setPage} />
  </div>;
}
