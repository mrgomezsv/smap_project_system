import { Suspense } from 'react';
import { CuentaForm } from '@/components/auth/CuentaForm';

export const metadata = {
  title: 'Mi cuenta - Kidsfun',
  description: 'Inicia sesión o crea una cuenta para reservar y comentar.',
};

export default function CuentaPage() {
  return (
    <div className="bg-surface min-h-screen">
      <div className="container py-12 max-w-md">
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-text-primary">
            Mi cuenta
          </h1>
          <p className="text-text-muted mt-2">
            Inicia sesión para reservar, comentar y ver tus waivers.
          </p>
        </header>
        <Suspense fallback={<div className="card h-96 animate-pulse" />}>
          <CuentaForm />
        </Suspense>
      </div>
    </div>
  );
}
