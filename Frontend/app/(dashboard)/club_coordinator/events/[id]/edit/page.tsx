'use client';
import { useParams } from 'next/navigation';
import EditEventForm from '@/components/events/EditEventForm';

export default function ClubCoordinatorEditEventPage() {
  const { id } = useParams<{ id: string }>();
  return <EditEventForm basePath="/club_coordinator" eventId={Number(id)} />;
}
