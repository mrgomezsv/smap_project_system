import { WaiversTabs } from '@/components/admin/WaiversTabs';

export const metadata = { title: 'Waivers - Admin' };

export default function WaiversPage() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-heading font-extrabold text-text-primary">Waivers</h1>
        <p className="text-text-muted mt-1">Gestiona los waivers generados y sus estados.</p>
      </header>
      <WaiversTabs />
    </div>
  );
}
