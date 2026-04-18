'use client';

import EventCalendar from '@/components/calendar/EventCalendar';

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-[var(--text-primary)]">Event Calendar</h1>
        <p className="text-sm text-[var(--text-muted)]">View scheduled events across all campus venues.</p>
      </div>
      
      <EventCalendar isPublic={false} />
    </div>
  );
}
