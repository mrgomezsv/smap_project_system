import { ChatsView } from '@/components/admin/ChatsView';

export const metadata = { title: 'Chats - Admin' };

export default function ChatsPage() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-heading font-extrabold text-text-primary">Chats</h1>
        <p className="text-text-muted mt-1">Conversaciones con clientes desde la app y web.</p>
      </header>
      <ChatsView />
    </div>
  );
}
