import { SuccessView } from '@/components/checkout/SuccessView';

interface PageProps {
  searchParams: { qr?: string };
}

export default function CheckoutSuccessPage({ searchParams }: PageProps) {
  const qr = searchParams.qr;

  if (!qr) {
    return (
      <div className="card text-center py-12">
        <div className="text-6xl mb-4">⚠</div>
        <h1 className="text-2xl font-heading font-extrabold text-text-primary">
          Falta el código QR
        </h1>
        <p className="text-text-muted mt-2">
          No se proporcionó un código de waiver. Inicia el proceso desde el inicio.
        </p>
        <a href="/checkout" className="btn btn-primary mt-6">
          Ir al checkout
        </a>
      </div>
    );
  }

  return <SuccessView qrCode={qr} />;
}
