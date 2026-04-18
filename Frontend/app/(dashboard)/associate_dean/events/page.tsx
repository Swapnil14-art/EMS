'use client';
import { RoleEventDashboard } from '@/components/events/RoleEventDashboard';

export default function AssociateDeanEventsPage() {
  return (
    <RoleEventDashboard 
      title="School Events" 
      subtitle="View all events within your designated school." 
      manageOnly={true} 
    />
  );
}
