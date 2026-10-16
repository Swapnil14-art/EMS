'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  AlertCircle, CalendarDays, Filter, ChevronLeft, ChevronRight, 
  ChevronDown, Clock, MapPin, ExternalLink, X, RotateCcw
} from 'lucide-react';
import { eventService, clubService, departmentService } from '@/lib/services';
import type { Club, Department } from '@/types';
import { getSchoolInfo } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

interface EventCalendarProps {
  isPublic?: boolean;
}

type CalendarEvent = {
  id: string;
  title?: string;
  start?: string;
  end?: string;
  color?: string;
  status?: string;
  department?: string;
  venue?: string;
  [key: string]: unknown;
};

interface HoveredEventData {
  id: string;
  title: string;
  venue: string;
  start?: string;
  end?: string;
  status?: string;
  department?: string;
  color?: string;
}

// Exactly two alternating colors for all event bars
const EVENT_COLOR_GREEN = '#10b981'; // Green
const EVENT_COLOR_BLUE = '#2563eb';  // Blue

export default function EventCalendar({ isPublic = false }: EventCalendarProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isRestrictedCalendar = user?.role === 'student' || (isPublic && !user);
  const detailsSectionRef = useRef<HTMLDivElement>(null);
  
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state (hidden by default)
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedClub, setSelectedClub] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Date and month state
  const [today] = useState(() => new Date());
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // Desktop hover card state
  const [hoveredEvent, setHoveredEvent] = useState<HoveredEventData | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number; placeAbove: boolean } | null>(null);

  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);

  const activeFilterCount = (selectedDept !== 'all' ? 1 : 0) +
    (selectedClub !== 'all' ? 1 : 0) +
    (selectedStatus !== 'all' ? 1 : 0);

  // Fetch filter dropdown options
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [deptRes, clubRes] = await Promise.all([
          departmentService.list(),
          clubService.list()
        ]);
        const dRes = deptRes as any;
        const cRes = clubRes as any;
        setDepartments(Array.isArray(dRes) ? dRes : dRes?.data || []);
        setClubs(Array.isArray(cRes) ? cRes : cRes?.data || []);
      } catch (err) {
        console.error('Failed to load filter options', err);
      }
    };
    fetchDropdowns();
  }, []);

  // Fetch events when date range or filters change
  useEffect(() => {
    if (!dateRange) return;

    const fetchCalendarEvents = async () => {
      setLoading(true);
      try {
        const params: any = {
          start_date: dateRange.start.toISOString(),
          end_date: dateRange.end.toISOString()
        };

        if (selectedDept !== 'all') params.department = selectedDept;
        if (selectedClub !== 'all') params.club_id = selectedClub;
        if (selectedStatus !== 'all') params.status = selectedStatus;

        const data = await eventService.getCalendar(params);
        const calendarEvents = Array.isArray(data) ? data : (data?.data || []);
        setEvents(calendarEvents
          .filter((event: CalendarEvent) => event?.id != null && event?.start)
          .map((event: CalendarEvent) => {
            const rawVenue = (event.venue as string) || '';
            const venue = rawVenue && rawVenue !== 'TBA' && rawVenue !== 'Venue TBA'
              ? rawVenue
              : 'Venue not decided';

            return {
              ...event,
              id: String(event.id),
              title: event.title?.trim() || 'Untitled event',
              venue,
            };
          }));
        setError(null);
      } catch (err) {
        console.error('Failed to fetch calendar events', err);
        setEvents([]);
        setError('The event schedule could not be loaded. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCalendarEvents();
  }, [dateRange, selectedDept, selectedClub, selectedStatus, isPublic, user?.role]);

  // Assign consistent alternating Green and Blue colors to all events
  const processedEvents = useMemo(() => {
    const sorted = [...events].sort((a, b) => {
      const aTime = a.start ? new Date(a.start).getTime() : 0;
      const bTime = b.start ? new Date(b.start).getTime() : 0;
      if (aTime !== bTime) return aTime - bTime;
      return String(a.id).localeCompare(String(b.id));
    });

    return sorted.map((ev, index) => ({
      ...ev,
      barColor: index % 2 === 0 ? EVENT_COLOR_GREEN : EVENT_COLOR_BLUE,
    }));
  }, [events]);

  // Monthly grid calculations
  const calendarGridDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const firstDayWeekday = firstDayOfMonth.getDay();
    
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    const days: { date: Date; isCurrentMonth: boolean }[] = [];
    
    // Previous month filler days
    for (let i = firstDayWeekday - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }
    
    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        date: new Date(year, month, d),
        isCurrentMonth: true,
      });
    }
    
    // Next month filler days to complete rows (multiple of 7)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      days.push({
        date: new Date(year, month + 1, d),
        isCurrentMonth: false,
      });
    }
    
    return days;
  }, [currentMonth]);

  // Group grid days into 7-day weeks for row layout
  const weeks = useMemo(() => {
    const result: { date: Date; isCurrentMonth: boolean }[][] = [];
    for (let i = 0; i < calendarGridDays.length; i += 7) {
      result.push(calendarGridDays.slice(i, i + 7));
    }
    return result;
  }, [calendarGridDays]);

  // Keep dateRange synced for calendar queries
  useEffect(() => {
    if (calendarGridDays.length === 0) return;
    const start = new Date(calendarGridDays[0].date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(calendarGridDays[calendarGridDays.length - 1].date);
    end.setHours(23, 59, 59, 999);
    
    setDateRange((prev) => {
      if (prev && prev.start.getTime() === start.getTime() && prev.end.getTime() === end.getTime()) {
        return prev;
      }
      return { start, end };
    });
  }, [calendarGridDays]);

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const getEventsForDate = (date: Date) => {
    return processedEvents.filter((e) => {
      if (!e.start) return false;
      const evStart = new Date(e.start);
      if (isSameDay(evStart, date)) return true;
      if (e.end) {
        const evEnd = new Date(e.end);
        const startDay = new Date(evStart.getFullYear(), evStart.getMonth(), evStart.getDate());
        const endDay = new Date(evEnd.getFullYear(), evEnd.getMonth(), evEnd.getDate());
        const currentDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        return currentDay >= startDay && currentDay <= endDay;
      }
      return false;
    });
  };

  const selectedDateEvents = useMemo(() => {
    return getEventsForDate(selectedDate);
  }, [processedEvents, selectedDate]);

  // Calculate continuous multi-day bar layouts for a 7-day week
  const getWeekEventLayouts = (weekDays: { date: Date; isCurrentMonth: boolean }[]) => {
    if (weekDays.length !== 7) return [];

    const weekStart = new Date(weekDays[0].date);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekDays[6].date);
    weekEnd.setHours(23, 59, 59, 999);

    // 1. Filter events overlapping this week
    const weekEvents = processedEvents.filter((e) => {
      if (!e.start) return false;
      const evStart = new Date(e.start);
      const evEnd = e.end ? new Date(e.end) : evStart;
      return evStart <= weekEnd && evEnd >= weekStart;
    });

    // 2. Sort by start date, then duration descending
    weekEvents.sort((a, b) => {
      const aStart = new Date(a.start!).getTime();
      const bStart = new Date(b.start!).getTime();
      if (aStart !== bStart) return aStart - bStart;

      const aEnd = a.end ? new Date(a.end).getTime() : aStart;
      const bEnd = b.end ? new Date(b.end).getTime() : bStart;
      return (bEnd - bStart) - (aEnd - aStart);
    });

    // 3. Assign slots
    const slotOccupied: boolean[][] = [];
    const layouts: {
      event: typeof processedEvents[0];
      startCol: number;
      endCol: number;
      slotIndex: number;
      continuesPrior: boolean;
      continuesNext: boolean;
    }[] = [];

    for (const ev of weekEvents) {
      const evStart = new Date(ev.start!);
      const evEnd = ev.end ? new Date(ev.end) : evStart;

      let startCol = 0;
      let continuesPrior = false;
      if (evStart < weekStart) {
        startCol = 0;
        continuesPrior = true;
      } else {
        const idx = weekDays.findIndex((d) => isSameDay(d.date, evStart));
        startCol = idx >= 0 ? idx : 0;
      }

      let endCol = 6;
      let continuesNext = false;
      if (evEnd > weekEnd) {
        endCol = 6;
        continuesNext = true;
      } else {
        const idx = weekDays.findIndex((d) => isSameDay(d.date, evEnd));
        endCol = idx >= 0 ? idx : 6;
      }

      if (endCol < startCol) endCol = startCol;

      // Find lowest non-colliding slot
      let slot = 0;
      while (true) {
        if (!slotOccupied[slot]) slotOccupied[slot] = new Array(7).fill(false);
        let collision = false;
        for (let c = startCol; c <= endCol; c++) {
          if (slotOccupied[slot][c]) {
            collision = true;
            break;
          }
        }
        if (!collision) break;
        slot++;
      }

      for (let c = startCol; c <= endCol; c++) {
        slotOccupied[slot][c] = true;
      }

      layouts.push({
        event: ev,
        startCol,
        endCol,
        slotIndex: slot,
        continuesPrior,
        continuesNext,
      });
    }

    return layouts;
  };

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleGoToToday = () => {
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(now);
  };

  const handleResetFilters = () => {
    setSelectedDept('all');
    setSelectedClub('all');
    setSelectedStatus('all');
  };

  const getDisplayStatusText = (status = 'scheduled') => {
    switch (status) {
      case 'upcoming': return 'Upcoming';
      case 'ongoing': return 'Ongoing';
      case 'past': return 'Past';
      case 'approved': return 'Approved';
      case 'pending_associate_dean': return 'Pending (Assoc. Dean)';
      case 'pending_coordinator_parallel': return 'Pending (Clubs)';
      case 'pending_director': return 'Pending (Director)';
      case 'suggested_changes': return 'Suggested Changes';
      default: return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
    }
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDateHeader = (date: Date) => {
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleBarClick = (e: React.MouseEvent, event: typeof processedEvents[0], targetDate: Date) => {
    e.stopPropagation();
    setSelectedDate(targetDate);
    setExpandedEventId(event.id);
    // Smoothly focus/scroll to the details section below
    setTimeout(() => {
      detailsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  };

  return (
    <div className="bg-white rounded-2xl shadow-card p-3 sm:p-5 border border-[var(--card-border)]">
      {/* Header and Controls */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-display font-bold text-[var(--text-primary)]">
              Event Calendar
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
              All campus events across schools, departments, and clubs.
            </p>
          </div>
          
          {/* Filter Toggle Button */}
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-danger)] transition-colors"
                title="Reset all filters"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-sm ${
                isFilterOpen || activeFilterCount > 0
                  ? 'border-[rgb(var(--color-primary))] bg-[var(--brand-soft)] text-[rgb(var(--color-primary))]'
                  : 'border-[var(--card-border)] bg-[var(--surface-bg)] text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
              }`}
              aria-expanded={isFilterOpen}
              aria-label="Toggle calendar filters"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[rgb(var(--color-primary))] text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Collapsible Filter Panel (Hidden by default, no emojis) */}
        {isFilterOpen && (
          <div className="p-3 bg-[var(--surface-subtle)] rounded-xl border border-[var(--card-border)] animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* School / Department Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                  School / Department
                </label>
                <select
                  className="input-field py-1.5 px-2.5 text-xs w-full bg-[var(--surface-bg)] border border-[var(--card-border)] rounded-lg"
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  aria-label="Filter events by school or department"
                >
                  <option value="all">All Schools & Departments</option>
                  {departments.map((d) => {
                    const info = getSchoolInfo(d.code);
                    return <option key={d.id} value={d.name}>{info ? info.abbreviation : d.name}</option>;
                  })}
                </select>
              </div>

              {/* Club Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                  Club
                </label>
                <select
                  className="input-field py-1.5 px-2.5 text-xs w-full bg-[var(--surface-bg)] border border-[var(--card-border)] rounded-lg"
                  value={selectedClub}
                  onChange={(e) => setSelectedClub(e.target.value)}
                  aria-label="Filter events by club"
                >
                  <option value="all">All Clubs</option>
                  {clubs.map((c) => (
                    <option key={c.id} value={c.id.toString()}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                  Status
                </label>
                {isRestrictedCalendar ? (
                  <select
                    className="input-field py-1.5 px-2.5 text-xs w-full bg-[var(--surface-bg)] border border-[var(--card-border)] rounded-lg"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    aria-label="Filter events by status"
                  >
                    <option value="all">All Upcoming & Ongoing</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                  </select>
                ) : (
                  <select
                    className="input-field py-1.5 px-2.5 text-xs w-full bg-[var(--surface-bg)] border border-[var(--card-border)] rounded-lg"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    aria-label="Filter events by status"
                  >
                    <option value="all">All Statuses</option>
                    <option value="approved">Approved</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                  </select>
                )}
              </div>
            </div>

            {/* Clear Filter action */}
            {activeFilterCount > 0 && (
              <div className="mt-2.5 pt-2 border-t border-[var(--border-subtle)] flex sm:hidden justify-end">
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 text-xs text-[var(--text-danger)] font-medium"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Calendar View Container (Clean Matrix Grid for Mobile & Desktop) */}
      <div className="calendar-container rounded-xl border border-[var(--card-border)] bg-[var(--surface-bg)] relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full border-3 border-[var(--border-strong)] border-t-[rgb(var(--color-primary))] animate-spin" />
              <p className="text-xs font-semibold text-[var(--text-secondary)]">Loading calendar...</p>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="p-3 m-3 flex items-center gap-2 rounded-xl border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] text-xs text-[var(--text-danger)]">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {/* Month Navigation Toolbar */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-[var(--card-border)] bg-[var(--surface-subtle)]">
          <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
            {currentMonth.toLocaleDateString([], { month: 'long', year: 'numeric' })}
          </h3>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              onClick={handlePrevMonth}
              aria-label="Previous month"
              className="p-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--surface-bg)] text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] active:scale-95 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleGoToToday}
              aria-label="Go to today"
              className="px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-lg border border-[var(--card-border)] bg-[var(--surface-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-95 transition-all"
            >
              Today
            </button>
            <button
              onClick={handleNextMonth}
              aria-label="Next month"
              className="p-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--surface-bg)] text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] active:scale-95 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Weekday Column Headers */}
        <div className="grid grid-cols-7 border-b border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-center py-1 sm:py-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
            <div 
              key={idx} 
              className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${
                idx === 0 ? 'text-[var(--text-danger)] opacity-85' : 'text-[var(--text-secondary)]'
              }`}
            >
              <span className="sm:hidden">{day.charAt(0)}</span>
              <span className="hidden sm:inline">{day}</span>
            </div>
          ))}
        </div>

        {/* Monthly Matrix Grid with Thin Divider Partitions */}
        <div className="border-l border-t border-[var(--border-subtle)] bg-[var(--surface-bg)]">
          {weeks.map((weekDays, weekIdx) => {
            const weekLayouts = getWeekEventLayouts(weekDays);
            const visibleLayouts = weekLayouts.filter((l) => l.slotIndex < 5);
            const maxVisibleSlot = visibleLayouts.reduce((max, l) => Math.max(max, l.slotIndex), -1);
            const hasAnyOverflow = weekDays.some((day) => getEventsForDate(day.date).length > 5);

            return (
              <div key={weekIdx} className="border-b border-[var(--border-subtle)] relative">
                {/* Full-height day column backgrounds (Continuous cell highlight for today) */}
                <div className="absolute inset-0 grid grid-cols-7 pointer-events-none">
                  {weekDays.map((cell, colIdx) => {
                    const isToday = isSameDay(cell.date, today);
                    return (
                      <div 
                        key={colIdx} 
                        className={`border-r border-[var(--border-subtle)] ${
                          isToday ? 'sm:bg-[#edf2f7] sm:dark:bg-slate-800/60 sm:shadow-[inset_0_0_0_2px_rgb(18,47,83)]' : ''
                        }`} 
                      />
                    );
                  })}
                </div>

                {/* Date Numbers Row */}
                <div className="grid grid-cols-7 relative">
                  {weekDays.map((cell, dayIdx) => {
                    const isToday = isSameDay(cell.date, today);
                    const isSelected = isSameDay(cell.date, selectedDate);

                    return (
                      <button
                        key={dayIdx}
                        onClick={() => {
                          setSelectedDate(cell.date);
                          if (!cell.isCurrentMonth) {
                            setCurrentMonth(new Date(cell.date.getFullYear(), cell.date.getMonth(), 1));
                          }
                        }}
                        className={`flex flex-col items-center justify-start pt-1.5 pb-1 transition-colors relative group min-h-[30px] sm:min-h-[36px] ${
                          isToday 
                            ? '' 
                            : isSelected 
                            ? 'bg-[var(--brand-soft)]/50' 
                            : 'hover:bg-[var(--surface-subtle)]'
                        }`}
                      >
                        {/* Date Number Badge */}
                        <span
                          className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-xs sm:text-sm transition-all ${
                            isToday
                              ? 'bg-[rgb(var(--color-primary))] text-white font-bold shadow-sm'
                              : isSelected
                              ? 'ring-2 ring-[rgb(var(--color-primary))] bg-[var(--brand-soft)] text-[var(--text-primary)] font-bold'
                              : cell.isCurrentMonth
                              ? 'text-[var(--text-primary)] font-medium'
                              : 'text-[var(--text-muted)] opacity-35 font-normal'
                          }`}
                        >
                          {cell.date.getDate()}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Continuous Horizontal Event Bars Container (No text inside cells by default) */}
                <div 
                  className="grid grid-cols-7 relative pb-1 pt-0.5"
                  style={{
                    gridTemplateRows: `repeat(${Math.max(1, maxVisibleSlot + 1) + (hasAnyOverflow ? 1 : 0)}, minmax(6px, auto))`,
                  }}
                >

                  {/* Multi-Day Continuous Event Bars (Alternating Green & Blue) */}
                  {visibleLayouts.map((layout) => {
                    const barColor = layout.event.barColor;
                    const representativeDate = weekDays[layout.startCol]?.date || selectedDate;

                    return (
                      <div
                        key={`${layout.event.id}-${weekIdx}-${layout.startCol}`}
                        onClick={(e) => handleBarClick(e, layout.event, representativeDate)}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const placeAbove = rect.top > 160;
                          setHoverPosition({
                            x: Math.max(12, Math.min(window.innerWidth - 275, rect.left)),
                            y: placeAbove ? rect.top - 6 : rect.bottom + 6,
                            placeAbove
                          });
                          setHoveredEvent({
                            id: layout.event.id,
                            title: layout.event.title || 'Untitled event',
                            venue: layout.event.venue || 'Venue not decided',
                            start: layout.event.start,
                            end: layout.event.end,
                            status: layout.event.status,
                            department: layout.event.department,
                            color: barColor
                          });
                        }}
                        onMouseLeave={() => {
                          setHoveredEvent(null);
                          setHoverPosition(null);
                        }}
                        style={{
                          gridColumnStart: layout.startCol + 1,
                          gridColumnEnd: layout.endCol + 2,
                          gridRowStart: layout.slotIndex + 1,
                          backgroundColor: barColor,
                          borderTopLeftRadius: layout.continuesPrior ? 0 : 3,
                          borderBottomLeftRadius: layout.continuesPrior ? 0 : 3,
                          borderTopRightRadius: layout.continuesNext ? 0 : 3,
                          borderBottomRightRadius: layout.continuesNext ? 0 : 3,
                        }}
                        className="h-[5px] sm:h-[6px] my-[1.5px] mx-[1px] transition-all hover:brightness-110 active:scale-[0.99] cursor-pointer shadow-xs z-10"
                        title=""
                      />
                    );
                  })}

                  {/* '+N more' Overflow Indicator (Max 5 bars per day) */}
                  {hasAnyOverflow && weekDays.map((cell, colIdx) => {
                    const dayEvents = getEventsForDate(cell.date);
                    if (dayEvents.length <= 5) return null;
                    const overflowCount = dayEvents.length - 5;

                    return (
                      <div
                        key={colIdx}
                        style={{
                          gridColumnStart: colIdx + 1,
                          gridRowStart: maxVisibleSlot + 2,
                        }}
                        onClick={() => {
                          setSelectedDate(cell.date);
                          setTimeout(() => {
                            detailsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                          }, 50);
                        }}
                        className="text-center py-0.5 cursor-pointer z-10"
                      >
                        <span className="text-[8px] sm:text-[9px] font-bold text-[rgb(var(--color-primary))] bg-blue-50/95 dark:bg-blue-950/80 rounded px-1.5 py-0.2 shadow-xs hover:bg-blue-100 transition-colors">
                          +{overflowCount} more
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Date Events List Below Calendar (Inline Expansion) */}
        <div ref={detailsSectionRef} className="border-t border-[var(--card-border)] bg-[var(--surface-subtle)] p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                {formatDateHeader(selectedDate)}
              </h3>
              {isSameDay(selectedDate, today) && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[rgb(var(--color-primary))] text-white">
                  Today
                </span>
              )}
            </div>
            <span className="text-xs text-[var(--text-muted)] font-medium">
              {selectedDateEvents.length === 1 ? '1 event' : `${selectedDateEvents.length} events`}
            </span>
          </div>

          {selectedDateEvents.length > 0 ? (
            <div className="space-y-2.5">
              {selectedDateEvents.map((event) => {
                const isExpanded = expandedEventId === event.id;
                const venue = event.venue && event.venue !== 'TBA' && event.venue !== 'Venue TBA'
                  ? event.venue
                  : 'Venue not decided';
                const dept = event.department || 'Campus Event';

                return (
                  <div
                    key={event.id}
                    className="rounded-xl border border-[var(--card-border)] bg-[var(--surface-bg)] shadow-xs overflow-hidden transition-all"
                  >
                    <div
                      onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                      className="p-3 cursor-pointer hover:bg-[var(--surface-subtle)] transition-colors flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        {/* Left accent bar matching the event's alternating color */}
                        <span
                          className="w-1.5 self-stretch rounded-full flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: event.barColor }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-semibold text-xs sm:text-sm text-[var(--text-primary)] truncate">
                              {event.title}
                            </span>
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                              style={{
                                backgroundColor: `${event.barColor}18`,
                                color: event.barColor
                              }}
                            >
                              {getDisplayStatusText(event.status)}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] flex-wrap">
                            {event.start && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-[var(--text-muted)] flex-shrink-0" />
                                {formatTime(event.start)}
                                {event.end && ` - ${formatTime(event.end)}`}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-[var(--text-muted)] flex-shrink-0" />
                              <span className="truncate max-w-[200px]">{venue}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        aria-label={isExpanded ? 'Collapse event details' : 'Expand event details'}
                        className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    </div>

                    {/* Inline Expanded Information & View Full Details Button */}
                    {isExpanded && (
                      <div className="px-4 pb-3.5 pt-2 border-t border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-xs space-y-3 animate-fadeIn">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-[var(--text-muted)] block text-[11px] mb-0.5">Organising School / Department:</span>
                            <span className="font-medium text-[var(--text-primary)]">{dept}</span>
                          </div>
                          <div>
                            <span className="text-[var(--text-muted)] block text-[11px] mb-0.5">Assigned Venue:</span>
                            <span className="font-medium text-[var(--text-primary)]">{venue}</span>
                          </div>
                          {event.start && (
                            <div>
                              <span className="text-[var(--text-muted)] block text-[11px] mb-0.5">Schedule:</span>
                              <span className="font-medium text-[var(--text-primary)]">
                                {formatTime(event.start)} {event.end && `to ${formatTime(event.end)}`}
                              </span>
                            </div>
                          )}
                          <div>
                            <span className="text-[var(--text-muted)] block text-[11px] mb-0.5">Status:</span>
                            <span className="font-medium text-[var(--text-primary)]">{getDisplayStatusText(event.status)}</span>
                          </div>
                        </div>

                        <div className="pt-2 flex items-center justify-between border-t border-[var(--border-subtle)]">
                          <button
                            type="button"
                            onClick={() => setExpandedEventId(null)}
                            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                          >
                            Collapse
                          </button>
                          <button
                            type="button"
                            onClick={() => router.push(`/events/${event.id}`)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[rgb(var(--color-primary))] text-white text-xs font-semibold hover:opacity-95 active:scale-95 transition-all shadow-sm"
                          >
                            <span>View Full Details</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-5 text-center text-xs text-[var(--text-muted)]">
              No events scheduled for this date.
            </div>
          )}
        </div>
      </div>

      {/* Floating Hover Card Preview (Desktop/Laptop Hover Interaction) */}
      {hoveredEvent && hoverPosition && (
        <div 
          className="fixed z-50 pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95"
          style={{
            left: `${hoverPosition.x}px`,
            top: `${hoverPosition.y}px`,
            transform: hoverPosition.placeAbove ? 'translateY(-100%)' : 'translateY(0)',
          }}
        >
          <div className="bg-white border border-[var(--card-border)] rounded-xl shadow-xl p-3 w-64 text-xs space-y-1.5 backdrop-blur-md">
            <div className="flex items-start justify-between gap-1.5">
              <h4 className="font-bold text-[var(--text-primary)] text-xs line-clamp-2">
                {hoveredEvent.title}
              </h4>
              <span 
                className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5"
                style={{ backgroundColor: hoveredEvent.color }}
              />
            </div>

            <div className="space-y-1 text-[11px] text-[var(--text-secondary)] border-t border-[var(--border-subtle)] pt-1.5">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[var(--text-muted)] flex-shrink-0" />
                <span className="truncate">{hoveredEvent.venue}</span>
              </div>
              {hoveredEvent.start && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[var(--text-muted)] flex-shrink-0" />
                  <span>
                    {formatTime(hoveredEvent.start)}
                    {hoveredEvent.end && ` - ${formatTime(hoveredEvent.end)}`}
                  </span>
                </div>
              )}
            </div>

            <div className="text-[9px] text-[var(--text-muted)] font-medium text-right pt-0.5">
              Click bar to expand details below
            </div>
          </div>
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <div className="mt-3 rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-4 text-center">
          <CalendarDays className="w-5 h-5 mx-auto mb-1.5 text-[var(--text-muted)]" />
          <p className="text-xs font-semibold text-[var(--text-secondary)]">No events in this date range</p>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Try changing month or adjusting filter options.</p>
        </div>
      )}
    </div>
  );
}
