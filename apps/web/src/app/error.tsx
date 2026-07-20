'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Error capturado por error.tsx:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="text-7xl mb-4">😵</div>
        <p className="font-mono text-5xl font-extrabold text-danger mb-2">¡Error!</p>
        <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-text-primary mb-2">
          Algo salió mal
        </h1>
        <p className="text-text-muted mb-6">
          Ocurrió un error inesperado. Nuestro equipo ya fue notificado. Intenta
          recargar la página o vuelve al inicio.
        </p>
        {error.digest && (
          <p className="text-xs text-text-muted font-mono mb-6">
            ID: {error.digest}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={reset} className="btn btn-primary px-6 py-3">
            🔄 Reintentar
          </button>
          <Link href="/" className="btn btn-outline px-6 py-3">
            🏠 Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
