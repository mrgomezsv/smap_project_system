import Link from 'next/link';

export default function AdminNotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-3">🔍</div>
        <p className="font-mono text-5xl font-extrabold text-primary mb-2">404</p>
        <h1 className="text-xl font-heading font-extrabold text-text-primary mb-2">
          Recurso no encontrado
        </h1>
        <p className="text-text-muted mb-6 text-sm">
          La sección que buscas no existe o no tienes permisos para acceder.
        </p>
        <Link href="/dashboard" className="btn btn-primary px-6 py-2.5">
          Ir al dashboard
        </Link>
      </div>
    </div>
  );
}
