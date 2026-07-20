import { QrScanner } from '@/components/admin/QrScanner';

export const metadata = { title: 'Escanear QR - Admin' };

export default function EscanearQrPage() {
  return (
    <div>
      <QrScanner />
    </div>
  );
}
