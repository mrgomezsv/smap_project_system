import { SudoActions } from '@/components/admin/SudoActions';

export const metadata = { title: 'Sudo Admin' };

export default function SudoPage() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-heading font-extrabold text-text-primary">Sudo Admin</h1>
        <p className="text-text-muted mt-1">Acciones avanzadas y destructivas. Solo superusuarios.</p>
      </header>
      <SudoActions />
    </div>
  );
}
