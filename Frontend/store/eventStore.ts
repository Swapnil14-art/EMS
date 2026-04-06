import { create } from 'zustand';
import type { Event, EventStatus } from '@/types';

interface EventFilters {
  status?: EventStatus;
  type?: string;
  department?: string;
  search?: string;
  page: number;
  size: number;
}

interface EventStore {
  events: Event[];
  currentEvent: Event | null;
  total: number;
  filters: EventFilters;
  isLoading: boolean;

  setEvents: (events: Event[], total: number) => void;
  setCurrentEvent: (event: Event | null) => void;
  setFilters: (filters: Partial<EventFilters>) => void;
  setLoading: (loading: boolean) => void;
  updateEvent: (id: number, updates: Partial<Event>) => void;
  reset: () => void;
}

const DEFAULT_FILTERS: EventFilters = {
  page: 1,
  size: 20,
};

export const useEventStore = create<EventStore>((set) => ({
  events: [],
  currentEvent: null,
  total: 0,
  filters: DEFAULT_FILTERS,
  isLoading: false,

  setEvents: (events, total) => set({ events, total }),
  setCurrentEvent: (event) => set({ currentEvent: event }),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters, page: 1 } })),
  setLoading: (isLoading) => set({ isLoading }),
  updateEvent: (id, updates) =>
    set((state) => ({
      events: state.events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
      currentEvent:
        state.currentEvent?.id === id
          ? { ...state.currentEvent, ...updates }
          : state.currentEvent,
    })),
  reset: () => set({ events: [], total: 0, filters: DEFAULT_FILTERS }),
}));
