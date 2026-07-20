import { UsersTable } from '@/components/admin/UsersTable';

export const metadata = { title: 'Usuarios - Admin' };

export default function UsuariosPage() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-heading font-extrabold text-text-primary">Usuarios App</h1>
        <p className="text-text-muted mt-1">Usuarios registrados en la aplicación móvil.</p>
      </header>
      <UsersTable />
    </div>
  );
}
