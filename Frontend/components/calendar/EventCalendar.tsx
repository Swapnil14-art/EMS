'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { AlertCircle, CalendarDays, Filter } from 'lucide-react';
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
  color?: string;
  status?: string;
  [key: string]: unknown;
};

const STATUS_COLORS: Record<string, string> = {
  approved: '#16a34a', upcoming: '#16a34a', ongoing: '#2563eb', completed: '#64748b',
  past: '#64748b', draft: '#64748b', pending_associate_dean: '#d97706',
  pending_coordinator_parallel: '#d97706', pending_director: '#d97706',
  suggested_changes: '#9333ea', rejected: '#dc2626', cancelled: '#dc2626',
};

export default function EventCalendar({ isPublic = false }: EventCalendarProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const calendarRef = useRef<FullCalendar>(null);
  const isRestrictedCalendar = user?.role === 'student' || (isPublic && !user);
  
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [departments, setDepartments] = useState<Department[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedClub, setSelectedClub] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);

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
          .map((event: CalendarEvent) => ({
            ...event,
            id: String(event.id),
            title: event.title?.trim() || 'Untitled event',
            color: event.color || STATUS_COLORS[event.status || ''] || '#2563eb',
          })));
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

  const handleDatesSet = (dateInfo: any) => {
    setDateRange({
      start: dateInfo.start,
      end: dateInfo.end
    });
  };

  const handleEventClick = (info: any) => {
    router.push(`/events/${info.event.id}`);
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

  // Extract color based on frontend dynamic resolution or backend directly
  return (
    <div className="bg-white rounded-2xl shadow-card p-4 sm:p-6 border border-[var(--card-border)]">
      {/* Header and Controls */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-display font-bold text-[var(--text-primary)]">Event Calendar</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            All campus events, across every school, department, and club.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto bg-[var(--card-bg)] p-2 rounded-xl border border-[var(--card-border)]">
          <span className="text-sm font-semibold text-[var(--text-secondary)] pl-2 flex items-center gap-1.5"><Filter className="w-3.5 h-3.5" /> Filter</span>
          
          <select
            className="input-field py-1.5 px-3 min-w-[140px] text-sm"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            aria-label="Filter events by school or department"
          >
            <option value="all">🏢 All Schools</option>
            {departments.map(d => {
              const info = getSchoolInfo(d.code);
              return <option key={d.id} value={d.name}>{info ? info.abbreviation : d.name}</option>;
            })}
          </select>

          <select
            className="input-field py-1.5 px-3 min-w-[140px] text-sm"
            value={selectedClub}
            onChange={(e) => setSelectedClub(e.target.value)}
            aria-label="Filter events by club"
          >
            <option value="all">👥 All Clubs</option>
            {clubs.map(c => <option key={c.id} value={c.id.toString()}>{c.name}</option>)}
          </select>

          {isRestrictedCalendar ? (
            <select
              className="input-field py-1.5 px-3 min-w-[140px] text-sm"
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
              className="input-field py-1.5 px-3 min-w-[140px] text-sm"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Filter events by status"
            >
              <option value="all">⚡ All Statuses</option>
              <option value="approved">✅ Approved</option>
              <option value="ongoing">🚀 Ongoing</option>
              <option value="completed">🏆 Completed</option>
            </select>
          )}
        </div>
      </div>

      {/* Calendar Area */}
      <div className="calendar-container overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--surface-bg)] relative">
        <style dangerouslySetInnerHTML={{__html: `
          .fc {
            --fc-border-color: var(--border-subtle);
            --fc-button-bg-color: var(--surface-bg);
            --fc-button-border-color: var(--border-strong);
            --fc-button-text-color: var(--text-secondary);
            --fc-button-hover-bg-color: var(--surface-subtle);
            --fc-button-hover-border-color: var(--border-strong);
            --fc-button-active-bg-color: var(--brand-soft);
            --fc-button-active-border-color: var(--brand-primary);
            --fc-event-border-color: transparent;
            --fc-today-bg-color: var(--brand-soft); 
            font-family: inherit;
          }
          .fc-header-toolbar {
            padding: 1rem 1.25rem !important;
            margin-bottom: 0 !important;
            border-bottom: 1px solid var(--border-subtle);
            background: var(--surface-subtle);
          }
          @media (max-width: 640px) {
            .fc-header-toolbar {
              flex-direction: column;
              gap: 0.5rem;
              padding: 0.75rem !important;
            }
            .fc-toolbar-chunk {
              display: flex;
              justify-content: center;
              width: 100%;
              flex-wrap: wrap;
              gap: 0.5rem;
            }
            .fc-toolbar-title { font-size: 1rem !important; }
            .fc-button-primary { padding: 0.3rem 0.55rem !important; font-size: 0.75rem !important; }
            .fc-col-header-cell-cushion { padding: 0.5rem 0.2rem !important; font-size: 0.7rem; }
            .fc-daygrid-day-number { padding: 0.35rem !important; font-size: 0.75rem; }
            .fc-event { margin: 1px 2px !important; padding: 2px 3px; }
          }
          .fc-toolbar-title { 
            font-size: 1.125rem !important; 
            font-weight: 700 !important; 
            color: var(--text-primary); 
          }
          .fc-button-primary { 
            border-radius: 0.5rem !important; 
            font-weight: 600 !important; 
            font-size: 0.8125rem !important; 
            box-shadow: var(--shadow-card); 
            text-transform: capitalize;
            padding: 0.375rem 0.75rem !important;
          }
          .fc-col-header-cell-cushion { 
            padding: 0.75rem 0.5rem !important; 
            font-weight: 600; 
            font-size: 0.875rem;
            color: var(--text-secondary); 
            text-transform: uppercase;
            letter-spacing: 0.025em;
          }
          .fc-daygrid-day-number { 
            padding: 0.5rem !important; 
            font-weight: 600; 
            font-size: 0.875rem;
            color: var(--text-secondary); 
          }
          .fc-day-other .fc-daygrid-day-number {
             color: var(--text-muted);
             font-weight: 500;
          }
          .fc-event { 
            border-radius: 8px;
            padding: 3px 6px;
            margin: 1px 4px !important;
            cursor: pointer; 
            transition: all 0.2s ease; 
            box-shadow: var(--shadow-card);
            border: none !important;
          }
          .fc-event:hover { 
            transform: translateY(-1px); 
            filter: brightness(1.05); 
            box-shadow: var(--shadow-card-md);
            z-index: 10;
          }
          .fc-daygrid-event-dot { display: none; }
          .fc-event-time { font-weight: 700 !important; margin-right: 4px; }
          .fc-event-title { font-weight: 600 !important; }
          .fc-popover { border-radius: 0.875rem; overflow: hidden; box-shadow: var(--shadow-card-md); }
          .fc-more-link { color: var(--brand-primary); font-weight: 700; padding: 0.25rem; }
          
          /* Tooltip styling */
          .event-content-wrapper {
             display: flex;
             flex-direction: column;
             overflow: hidden;
             line-height: 1.2;
             background: inherit;
          }
          .event-title {
             white-space: nowrap;
             overflow: hidden;
             text-overflow: ellipsis;
          }
          .event-venue {
             font-size: 0.65rem;
             opacity: 0.9;
             font-weight: 500;
             white-space: nowrap;
             overflow: hidden;
             text-overflow: ellipsis;
          }
        `}} />
        
        {loading && (
          <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full border-4 border-[var(--input-focus-ring)] border-t-primary animate-spin flex-shrink-0" />
              <p className="text-sm font-semibold text-[var(--text-secondary)]">Loading Calendar...</p>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="absolute inset-x-4 top-4 z-10 flex items-center gap-3 rounded-xl border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] p-3 text-sm text-[var(--text-danger)]">
            <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
          </div>
        )}
        
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek,dayGridDay'
          }}
          events={events}
          eventClick={handleEventClick}
          datesSet={handleDatesSet}
          height="auto"
          contentHeight={650}
          fixedWeekCount={false}
          dayMaxEvents={4}
          nextDayThreshold="00:00:00"
          eventTimeFormat={{
            hour: 'numeric',
            minute: '2-digit',
            meridiem: 'short'
          }}
          displayEventTime={true}
          eventContent={(eventInfo) => {
             const dept = eventInfo.event.extendedProps.department || 'Campus event';
             const venue = eventInfo.event.extendedProps.venue || 'Venue TBA';
             return (
             <div className="event-content-wrapper" title={`${eventInfo.event.title}\nVenue: ${venue}\nDept: ${dept || 'N/A'}`}>
               <div className="flex items-center gap-1 event-title text-[10px] sm:text-xs">
                 {eventInfo.timeText && <span>{eventInfo.timeText}</span>}
                 <span>{eventInfo.event.title}</span>
               </div>
               <div className="event-venue hidden sm:block mt-[1px]">
                 📍 {venue}
               </div>
               <div className="text-[9px] uppercase font-bold opacity-75 hidden sm:block mt-[1px]">
                 • {getDisplayStatusText(eventInfo.event.extendedProps.status)}
               </div>
             </div>
          )}}
        />
      </div>

      {!loading && !error && events.length === 0 && (
        <div className="mt-4 rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-5 text-center">
          <CalendarDays className="w-6 h-6 mx-auto mb-2 text-[var(--text-muted)]" />
          <p className="text-sm font-semibold text-[var(--text-secondary)]">No events in this date range</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Try another month or clear a filter to see the full campus schedule.</p>
        </div>
      )}

      {/* Legend */}
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 px-2">
         <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider hidden sm:block">Legend</span>
         <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[var(--status-success-bg)] shadow-sm" /> <span className="text-xs font-medium text-[var(--text-secondary)]">Upcoming / Approved</span></div>
         <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[var(--btn-primary-bg)] shadow-sm" /> <span className="text-xs font-medium text-[var(--text-secondary)]">Ongoing</span></div>
         <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[var(--surface-subtle)] shadow-sm" /> <span className="text-xs font-medium text-[var(--text-secondary)]">Completed / Past</span></div>
      </div>
    </div>
  );
}
