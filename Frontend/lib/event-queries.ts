'use client';

import { useEffect, useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { eventService } from '@/lib/services';

export type EventListParams = Parameters<typeof eventService.list>[0];

export function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function useEventList(params?: EventListParams) {
  return useQuery({
    queryKey: ['events', params],
    queryFn: () => eventService.list(params),
    placeholderData: previousData => previousData,
  });
}

export function useEventStatusCounts(search?: string, manageOnly = false) {
  const statuses = ['upcoming', 'ongoing', 'past'] as const;
  const queries = useQueries({
    queries: statuses.map(status => ({
      queryKey: ['event-count', status, search, manageOnly],
      queryFn: () => eventService.list({ status, search: search || undefined, manage_only: manageOnly, size: 1 }),
      staleTime: 30_000,
    })),
  });
  return Object.fromEntries(statuses.map((status, index) => [status, queries[index].data?.total ?? 0])) as Record<(typeof statuses)[number], number>;
}
