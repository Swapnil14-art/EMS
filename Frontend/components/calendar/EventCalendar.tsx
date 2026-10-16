'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
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

const STATUS_COLORS: Record<string, string> = {
  approved: '#10b981',
  upcoming: '#10b981',
  ongoing: '#2563eb',
  completed: '#64748b',
  past: '#64748b',
  draft: '#64748b',
  pending_associate_dean: '#d97706',
  pending_coordinator_parallel: '#d97706',
  pending_director: '#d97706',
  suggested_changes: '#9333ea',
  rejected: '#dc2626',
  cancelled: '#dc2626',
};

export default function EventCalendar({ isPublic = false }: EventCalendarProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const calendarRef = useRef<FullCalendar>(null);
  const isRestrictedCalendar = user?.role === 'student' || (isPublic && !user);
  
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
              color: event.color || STATUS_COLORS[event.status || ''] || '#2563eb',
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

  // Mobile monthly grid calculations
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
    
    // Next month filler days to complete rows
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      days.push({
        date: new Date(year, month + 1, d),
        isCurrentMonth: false,
      });
    }
    
    return days;
  }, [currentMonth]);

  // Keep dateRange synced for mobile calendar view
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
    return events.filter((e) => {
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
  }, [events, selectedDate]);

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    if (calendarRef.current) {
      calendarRef.current.getApi().prev();
    }
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    if (calendarRef.current) {
      calendarRef.current.getApi().next();
    }
  };

  const handleGoToToday = () => {
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(now);
    if (calendarRef.current) {
      calendarRef.current.getApi().today();
    }
  };

  const handleDatesSet = (dateInfo: any) => {
    const viewStart = dateInfo.view.currentStart;
    if (viewStart && (viewStart.getMonth() !== currentMonth.getMonth() || viewStart.getFullYear() !== currentMonth.getFullYear())) {
      setCurrentMonth(new Date(viewStart.getFullYear(), viewStart.getMonth(), 1));
    }
    setDateRange({
      start: dateInfo.start,
      end: dateInfo.end
    });
  };

  const handleEventClick = (info: any) => {
    router.push(`/events/${info.event.id}`);
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

        {/* Collapsible Filter Panel (Hidden by default) */}
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

            {/* Clear Filter mobile action */}
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

      {/* Main Calendar View Container */}
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

        {/* ── 1. MOBILE COMPACT CALENDAR (Samsung Calendar Inspired) ── */}
        <div className="block md:hidden">
          {/* Month Navigation Toolbar */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--card-border)] bg-[var(--surface-subtle)]">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              {currentMonth.toLocaleDateString([], { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                aria-label="Previous month"
                className="p-1 rounded-lg border border-[var(--card-border)] bg-[var(--surface-bg)] text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] active:scale-95 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleGoToToday}
                aria-label="Go to today"
                className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-[var(--card-border)] bg-[var(--surface-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-95 transition-all"
              >
                Today
              </button>
              <button
                onClick={handleNextMonth}
                aria-label="Next month"
                className="p-1 rounded-lg border border-[var(--card-border)] bg-[var(--surface-bg)] text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] active:scale-95 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Column Headers */}
          <div className="grid grid-cols-7 border-b border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-center py-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
              <div 
                key={idx} 
                className={`text-[10px] font-bold ${idx === 0 ? 'text-[var(--text-danger)] opacity-80' : 'text-[var(--text-muted)]'}`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Compact Monthly Matrix (~1/3 initial screen height) */}
          <div className="grid grid-cols-7 p-1 bg-[var(--surface-bg)]">
            {calendarGridDays.map((cell, idx) => {
              const isToday = isSameDay(cell.date, today);
              const isSelected = isSameDay(cell.date, selectedDate);
              const dayEvents = getEventsForDate(cell.date);
              const hasEvents = dayEvents.length > 0;

              return (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedDate(cell.date);
                    if (!cell.isCurrentMonth) {
                      setCurrentMonth(new Date(cell.date.getFullYear(), cell.date.getMonth(), 1));
                    }
                  }}
                  className="flex flex-col items-center justify-center py-1 rounded-lg transition-colors relative group min-h-[36px]"
                >
                  {/* Date Number Badge */}
                  <span
                    className={`w-6 h-6 flex items-center justify-center rounded-full text-xs transition-all ${
                      isToday
                        ? 'bg-[rgb(var(--color-primary))] text-white font-bold shadow-sm'
                        : isSelected
                        ? 'ring-2 ring-[rgb(var(--color-primary))] bg-[var(--brand-soft)] text-[var(--text-primary)] font-bold'
                        : cell.isCurrentMonth
                        ? 'text-[var(--text-primary)] font-medium group-hover:bg-[var(--surface-subtle)]'
                        : 'text-[var(--text-muted)] opacity-35 font-normal'
                    }`}
                  >
                    {cell.date.getDate()}
                  </span>

                  {/* Colored Indicator Dot(s) */}
                  <div className="h-1 flex items-center justify-center gap-0.5 mt-0.5">
                    {hasEvents && dayEvents.slice(0, 3).map((ev, evIdx) => (
                      <span
                        key={evIdx}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: ev.color || '#2563eb' }}
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Date Events List Below Calendar */}
          <div className="border-t border-[var(--card-border)] bg-[var(--surface-subtle)] p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[var(--text-primary)]">
                  {formatDateHeader(selectedDate)}
                </span>
                {isSameDay(selectedDate, today) && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[rgb(var(--color-primary))] text-white">
                    Today
                  </span>
                )}
              </div>
              <span className="text-[11px] text-[var(--text-muted)] font-medium">
                {selectedDateEvents.length === 1 ? '1 event' : `${selectedDateEvents.length} events`}
              </span>
            </div>

            {selectedDateEvents.length > 0 ? (
              <div className="space-y-2">
                {selectedDateEvents.map((event) => {
                  const isExpanded = expandedEventId === event.id;
                  const venue = event.venue && event.venue !== 'TBA' && event.venue !== 'Venue TBA'
                    ? event.venue
                    : 'Venue not decided';
                  const dept = event.department || 'Campus Event';

                  return (
                    <div
                      key={event.id}
                      className="rounded-xl border border-[var(--card-border)] bg-[var(--surface-bg)] shadow-sm overflow-hidden"
                    >
                      <div
                        onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                        className="p-2.5 cursor-pointer hover:bg-[var(--surface-subtle)] transition-colors flex items-start justify-between gap-2"
                      >
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          {/* Accent Bar */}
                          <span
                            className="w-1 self-stretch rounded-full flex-shrink-0 mt-0.5"
                            style={{ backgroundColor: event.color || '#2563eb' }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                              <span className="font-semibold text-xs text-[var(--text-primary)] truncate">
                                {event.title}
                              </span>
                              <span
                                className="px-1.5 py-0.2 rounded text-[9px] font-semibold"
                                style={{
                                  backgroundColor: `${event.color || '#2563eb'}18`,
                                  color: event.color || '#2563eb'
                                }}
                              >
                                {getDisplayStatusText(event.status)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2.5 text-[11px] text-[var(--text-secondary)] flex-wrap">
                              {event.start && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-[var(--text-muted)] flex-shrink-0" />
                                  {formatTime(event.start)}
                                  {event.end && ` - ${formatTime(event.end)}`}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-[var(--text-muted)] flex-shrink-0" />
                                <span className="truncate max-w-[130px]">{venue}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          aria-label={isExpanded ? 'Collapse event' : 'Expand event'}
                          className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        >
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>

                      {/* Expandable Details */}
                      {isExpanded && (
                        <div className="px-3 pb-2.5 pt-1 border-t border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-xs space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div>
                              <span className="text-[var(--text-muted)] block text-[10px]">Organiser:</span>
                              <span className="font-medium text-[var(--text-primary)]">{dept}</span>
                            </div>
                            <div>
                              <span className="text-[var(--text-muted)] block text-[10px]">Venue:</span>
                              <span className="font-medium text-[var(--text-primary)]">{venue}</span>
                            </div>
                          </div>
                          <div className="pt-1.5 flex justify-end">
                            <button
                              onClick={() => router.push(`/events/${event.id}`)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[rgb(var(--color-primary))] text-white text-[11px] font-semibold hover:opacity-95 active:scale-95 transition-all shadow-sm"
                            >
                              <span>View details</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-[var(--text-muted)]">
                No events scheduled for this date.
              </div>
            )}
          </div>
        </div>

        {/* ── 2. DESKTOP / TABLET MINIMALIST CALENDAR ── */}
        <div className="hidden md:block">
          <style dangerouslySetInnerHTML={{__html: `
            .fc {
              --fc-border-color: var(--border-subtle, #e2e8f0);
              --fc-button-bg-color: var(--surface-bg, #ffffff);
              --fc-button-border-color: var(--border-strong, #cbd5e1);
              --fc-button-text-color: var(--text-secondary, #334155);
              --fc-button-hover-bg-color: var(--surface-subtle, #f8fafc);
              --fc-button-hover-border-color: var(--border-strong, #cbd5e1);
              --fc-button-active-bg-color: var(--brand-soft, rgba(18, 47, 83, 0.08));
              --fc-button-active-border-color: var(--brand-primary, #122f53);
              --fc-event-border-color: transparent;
              font-family: inherit;
            }
            .fc-header-toolbar {
              padding: 0.625rem 0.875rem !important;
              margin-bottom: 0 !important;
              border-bottom: 1px solid var(--border-subtle, #e2e8f0);
              background: var(--surface-subtle, #f8fafc);
            }
            .fc-toolbar-title { 
              font-size: 1rem !important; 
              font-weight: 700 !important; 
              color: var(--text-primary); 
            }
            .fc-button-primary { 
              border-radius: 0.5rem !important; 
              font-weight: 600 !important; 
              font-size: 0.75rem !important; 
              box-shadow: none !important;
              text-transform: capitalize;
              padding: 0.25rem 0.6rem !important;
            }
            .fc-col-header-cell-cushion { 
              padding: 0.4rem 0.25rem !important; 
              font-weight: 600; 
              font-size: 0.75rem;
              color: var(--text-secondary); 
              text-transform: uppercase;
              letter-spacing: 0.03em;
            }
            .fc-daygrid-day-frame {
              min-height: 70px !important;
            }
            .fc-daygrid-day-number { 
              padding: 0.25rem 0.4rem !important; 
              font-weight: 500; 
              font-size: 0.8125rem;
              color: var(--text-secondary); 
            }
            .fc-day-other .fc-daygrid-day-number {
              color: var(--text-muted);
              opacity: 0.5;
            }
            /* Prominent Today Highlight */
            .fc-day-today {
              background-color: rgba(var(--color-primary, 18, 47, 83), 0.04) !important;
            }
            .fc-day-today .fc-daygrid-day-number {
              background-color: rgb(var(--color-primary, 18, 47, 83)) !important;
              color: #ffffff !important;
              font-weight: 700 !important;
              width: 22px !important;
              height: 22px !important;
              border-radius: 9999px !important;
              display: inline-flex !important;
              align-items: center !important;
              justify-content: center !important;
              margin: 2px !important;
              box-shadow: 0 1px 2px rgba(0,0,0,0.2) !important;
            }
            /* Clean Minimalist Event Badge */
            .fc-event { 
              border-radius: 6px;
              padding: 1px 4px;
              margin: 1px 2px !important;
              cursor: pointer; 
              transition: all 0.15s ease; 
              background: var(--surface-bg, #ffffff) !important;
              color: var(--text-primary) !important;
              box-shadow: 0 1px 2px rgba(0,0,0,0.05);
              border: 1px solid var(--border-subtle, #e2e8f0) !important;
            }
            .fc-event:hover { 
              transform: translateY(-1px); 
              box-shadow: 0 2px 4px rgba(0,0,0,0.08);
              border-color: var(--border-strong, #cbd5e1) !important;
              z-index: 10;
            }
            .fc-daygrid-event-dot { display: none; }
            .fc-popover { border-radius: 0.75rem; overflow: hidden; box-shadow: var(--shadow-card-md); }
            .fc-more-link { color: rgb(var(--color-primary, 18, 47, 83)); font-weight: 600; font-size: 0.7rem; padding: 0.1rem 0.25rem; }
          `}} />
          
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,dayGridWeek'
            }}
            events={events}
            eventClick={handleEventClick}
            datesSet={handleDatesSet}
            height="auto"
            contentHeight={540}
            fixedWeekCount={false}
            dayMaxEvents={3}
            nextDayThreshold="00:00:00"
            eventTimeFormat={{
              hour: 'numeric',
              minute: '2-digit',
              meridiem: 'short'
            }}
            displayEventTime={true}
            eventContent={(eventInfo) => {
              const dept = eventInfo.event.extendedProps.department || 'Campus event';
              const rawVenue = eventInfo.event.extendedProps.venue;
              const venue = rawVenue && rawVenue !== 'TBA' && rawVenue !== 'Venue TBA'
                ? rawVenue
                : 'Venue not decided';
              const status = eventInfo.event.extendedProps.status;

              return (
                <div 
                  className="flex items-center gap-1.5 w-full overflow-hidden text-[11px] font-medium leading-tight select-none"
                  title={`${eventInfo.event.title}\n📍 ${venue}\nStatus: ${getDisplayStatusText(status)}\nDept: ${dept}`}
                >
                  <span 
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: eventInfo.event.backgroundColor || '#2563eb' }} 
                  />
                  {eventInfo.timeText && (
                    <span className="font-semibold text-[10px] opacity-75 flex-shrink-0">
                      {eventInfo.timeText}
                    </span>
                  )}
                  <span className="truncate flex-1 text-[var(--text-primary)]">
                    {eventInfo.event.title}
                  </span>
                </div>
              );
            }}
          />
        </div>
      </div>

      {!loading && !error && events.length === 0 && (
        <div className="mt-3 rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-4 text-center">
          <CalendarDays className="w-5 h-5 mx-auto mb-1.5 text-[var(--text-muted)]" />
          <p className="text-xs font-semibold text-[var(--text-secondary)]">No events in this date range</p>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Try changing month or adjusting filter options.</p>
        </div>
      )}

      {/* Clean Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1 text-[11px]">
        <span className="font-semibold text-[var(--text-muted)] uppercase tracking-wider text-[10px]">Legend</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#10b981]" />
          <span className="text-[var(--text-secondary)]">Upcoming / Approved</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#2563eb]" />
          <span className="text-[var(--text-secondary)]">Ongoing</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#64748b]" />
          <span className="text-[var(--text-secondary)]">Completed / Past</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[rgb(var(--color-primary))] text-white text-[7px] font-bold flex items-center justify-center">●</span>
          <span className="text-[var(--text-secondary)] font-medium">Today</span>
        </div>
      </div>
    </div>
  );
}
