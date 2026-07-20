import { notFound } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { EventForm } from '@/components/admin/EventForm';
import type { Event } from '@/lib/types';

interface PageProps {
  params: { id: string };
}

export default async function EditarEventoPage({ params }: PageProps) {
  let event: Event;
  try {
    event = await api.get<Event>(`/api/events/${params.id}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-heading font-extrabold text-text-primary">Editar evento</h1>
        <p className="text-text-muted mt-1 truncate">{event.title}</p>
      </header>
      <EventForm mode="edit" initial={event} />
    </div>
  );
}
