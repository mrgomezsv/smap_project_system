import { EventForm } from '@/components/admin/EventForm';

export const metadata = { title: 'Crear evento - Admin' };

export default function NuevoEventoPage() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-heading font-extrabold text-text-primary">Nuevo evento</h1>
        <p className="text-text-muted mt-1">Programa un nuevo evento público.</p>
      </header>
      <EventForm mode="create" />
    </div>
  );
}
