'use client';
import CreateEventForm from './CreateEventForm';

export default function EditEventForm({ basePath, eventId }: { basePath: string; eventId: number }) {
  return <CreateEventForm basePath={basePath} eventId={eventId} />;
}
