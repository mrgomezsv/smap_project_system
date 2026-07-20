import Link from 'next/link';

interface PageProps {
  searchParams: { qr?: string };
}

export default function CheckoutSuccessPage({ searchParams }: PageProps) {
  const qr = searchParams.qr;
  return (
    <div className="card text-center py-12">
      <div className="text-6xl mb-4">🎉</div>
      <h1 className="text-2xl font-heading font-extrabold text-text-primary">
        ¡Waiver generado!
      </h1>
      <p className="text-text-muted mt-2">
        {qr ? (
          <>
            Tu código QR es: <code className="font-bold text-primary">{qr}</code>
          </>
        ) : (
          'Pronto verás tu QR aquí.'
        )}
      </p>
      <p className="text-xs text-text-muted mt-6">
        (Vista previa — la descarga de PDF y QR real se agregarán en el siguiente commit)
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/" className="btn btn-outline">
          Volver al inicio
        </Link>
        <Link href="/eventos" className="btn btn-primary">
          Ver más eventos
        </Link>
      </div>
    </div>
  );
}
