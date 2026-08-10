'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { api, ApiError } from '@/lib/api';
import { signOut } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, ready, getToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [verifying, setVerifying] = useState(true);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [isServerError, setIsServerError] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const checkAdminAuth = async () => {
    if (!user) return;
    try {
      setVerifying(true);
      setIsServerError(false);
      setErrorMsg(null);
      await api.get<{ ok: boolean }>('/api/auth/check-admin', { getToken });
      setAuthorized(true);
    } catch (err: unknown) {
      setAuthorized(false);
      if (err instanceof ApiError && (err.status === 403 || err.status === 401)) {
        setIsServerError(false);
        setErrorMsg(`El correo (${user?.email}) no cuenta con permisos de administrador.`);
      } else {
        setIsServerError(true);
        const codeText = err instanceof ApiError ? `(Error ${err.status})` : '';
        setErrorMsg(`No se pudo conectar con el servidor para verificar los permisos de administrador ${codeText}. Por favor reintenta en unos momentos.`);
      }
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    if (!ready) return;

    if (!user) {
      setVerifying(false);
      setAuthorized(false);
      router.replace(`/admin/signin?next=${encodeURIComponent(pathname)}`);
      return;
    }

    checkAdminAuth();
  }, [user, ready, pathname, router, getToken]);

  if (!ready || verifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface p-4 text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-semibold text-text-primary">Verificando acceso de administrador…</p>
        <p className="text-xs text-text-muted mt-1">Por favor espera un momento</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface p-4 text-center">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-semibold text-text-primary">Redirigiendo al inicio de sesión…</p>
      </div>
    );
  }

  if (authorized === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface p-4">
        <div className="card max-w-md w-full text-center p-8 border border-red-200 shadow-lg">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
            {isServerError ? '⚠️' : '🚫'}
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            {isServerError ? 'Error de Conexión' : 'Acceso Restringido'}
          </h2>
          <p className="text-sm text-text-muted mb-6">
            {errorMsg || `Tu cuenta (${user.email}) no tiene permisos para acceder al panel de administración.`}
          </p>
          <div className="flex flex-col gap-3">
            {isServerError && (
              <button
                onClick={() => checkAdminAuth()}
                className="btn btn-primary w-full"
              >
                🔄 Reintentar verificación
              </button>
            )}
            <button
              onClick={async () => {
                const auth = getFirebaseAuth();
                if (auth) await signOut(auth);
                router.push('/admin/signin');
              }}
              className={isServerError ? "btn btn-outline w-full" : "btn btn-primary w-full"}
            >
              Cerrar sesión e ingresar con otra cuenta
            </button>
            <a href="/" className="text-sm text-text-muted hover:underline">
              Volver al sitio público
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
