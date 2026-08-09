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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;

    if (!user) {
      setVerifying(false);
      setAuthorized(false);
      router.replace(`/admin/signin?next=${encodeURIComponent(pathname)}`);
      return;
    }

    let isMounted = true;
    async function checkAdminAuth() {
      try {
        setVerifying(true);
        await api.get<{ ok: boolean }>('/api/auth/check-admin', { getToken });

        if (isMounted) {
          setAuthorized(true);
          setErrorMsg(null);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setAuthorized(false);
          if (err instanceof ApiError && (err.status === 403 || err.status === 401)) {
            setErrorMsg(`El correo (${user?.email}) no cuenta con permisos de administrador.`);
          } else {
            setErrorMsg(err instanceof ApiError ? err.message : 'No se pudo verificar el rol de administrador.');
          }
        }
      } finally {
        if (isMounted) {
          setVerifying(false);
        }
      }
    }

    checkAdminAuth();

    return () => {
      isMounted = false;
    };
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
            🚫
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2">Acceso Restringido</h2>
          <p className="text-sm text-text-muted mb-6">
            {errorMsg || `Tu cuenta (${user.email}) no tiene permisos para acceder al panel de administración.`}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={async () => {
                const auth = getFirebaseAuth();
                if (auth) await signOut(auth);
                router.push('/admin/signin');
              }}
              className="btn btn-primary w-full"
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
