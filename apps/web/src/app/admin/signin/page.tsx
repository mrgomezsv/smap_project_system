import { Suspense } from 'react';
import Link from 'next/link';
import { LoginForm } from '@/components/admin/LoginForm';

export const metadata = {
  title: 'Iniciar sesión - Kidsfun Admin',
  description: 'Acceso al panel de administración de Kidsfun.',
};

export default function SigninPage() {
  return (
    <div className="min-h-screen flex bg-surface">
      {/* Split layout - solo en desktop */}
      <aside className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-primary to-primary-700 text-white p-12">
        <div>
          <Link href="/" className="font-display text-3xl text-brand-yellow">
            Kidsfun
          </Link>
          <p className="text-sm text-white/60 mt-1">Panel de Administración</p>
        </div>
        <div className="max-w-md">
          <h1 className="text-4xl font-heading font-extrabold mb-4">
            Bienvenido al panel de control
          </h1>
          <p className="text-white/80 text-lg">
            Gestiona productos, eventos, waivers, chats y notificaciones desde un solo
            lugar.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4 text-sm">
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-2xl mb-1">📊</div>
              <p className="font-semibold">Métricas en vivo</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-2xl mb-1">🔔</div>
              <p className="font-semibold">Push notifications</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-2xl mb-1">📋</div>
              <p className="font-semibold">Gestión de waivers</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-2xl mb-1">💬</div>
              <p className="font-semibold">Chat con clientes</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-white/40">
          © {new Date().getFullYear()} Kidsfun y Fiestas Infantiles
        </p>
      </aside>

      {/* Formulario */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="font-display text-3xl text-primary">
              Kidsfun
            </Link>
            <p className="text-sm text-text-muted mt-1">Panel de Administración</p>
          </div>
          <div className="card">
            <h2 className="text-2xl font-heading font-extrabold text-text-primary mb-1">
              Iniciar sesión
            </h2>
            <p className="text-sm text-text-muted mb-6">
              Usa tu cuenta de Google o email corporativo.
            </p>
            <Suspense fallback={<div className="h-48 animate-pulse bg-gray-100 rounded-xl" />}>
              <LoginForm />
            </Suspense>
          </div>
          <p className="text-xs text-text-muted text-center mt-6">
            <Link href="/" className="hover:text-primary">
              ← Volver al sitio público
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
