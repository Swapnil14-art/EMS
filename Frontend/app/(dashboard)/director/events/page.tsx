'use client';
import { RoleEventDashboard } from '@/components/events/RoleEventDashboard';

export default function DirectorEventsPage() {
  return (
    <RoleEventDashboard 
      title="All Campus Events" 
      subtitle="View all events occurring across the university." 
      manageOnly={false} 
    />
  );
}
