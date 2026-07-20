import { PushForm } from '@/components/admin/PushForm';

export const metadata = { title: 'Notificaciones - Admin' };

export default function NotificacionesPage() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-heading font-extrabold text-text-primary">
          Push Notifications
        </h1>
        <p className="text-text-muted mt-1">
          Envía notificaciones a los usuarios de la app móvil.
        </p>
      </header>
      <PushForm />
    </div>
  );
}
