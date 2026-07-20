import { MessagesInbox } from '@/components/admin/MessagesInbox';

export const metadata = { title: 'Mensajes Web - Admin' };

export default function MensajesPage() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-heading font-extrabold text-text-primary">Mensajes Web</h1>
        <p className="text-text-muted mt-1">Buzón de mensajes recibidos desde el formulario de contacto.</p>
      </header>
      <MessagesInbox />
    </div>
  );
}
