'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { FirebaseError } from 'firebase/app';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase';
import { PasswordInput } from '@/components/ui/PasswordInput';

export function LoginForm() {
  const tPh = useTranslations('placeholders');
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') ?? '';

  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  const configured = isFirebaseConfigured();

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      if (!auth) {
        setError('Firebase no está configurado en este entorno.');
        return;
      }
      await signInWithEmailAndPassword(auth, email.trim(), password);
      window.location.href = '/admin/dashboard';
    } catch (error) {
      const code = error instanceof FirebaseError ? error.code : '';
      if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        setError('Email o contraseña incorrectos.');
      } else if (code === 'auth/operation-not-allowed') {
        setError('El acceso con email y contraseña no está habilitado en Firebase.');
      } else if (code === 'auth/invalid-api-key') {
        setError('La configuración de Firebase no es válida.');
      } else if (code === 'auth/too-many-requests') {
        setError('Demasiados intentos. Espera unos minutos antes de volver a intentar.');
      } else if (code === 'auth/user-disabled') {
        setError('Esta cuenta está deshabilitada.');
      } else if (code === 'auth/invalid-email') {
        setError('El email no es válido.');
      } else {
        setError('No se pudo iniciar sesión. Verifica la configuración de Firebase.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (!configured) {
    return (
      <div className="bg-warning/10 border border-warning/30 text-warning text-sm rounded-lg p-4">
        <strong>Firebase no configurado.</strong>
        <p className="mt-1">
          Configura las variables <code>NEXT_PUBLIC_FIREBASE_*</code> en
          <code> apps/web/.env.local</code> para habilitar el login.
        </p>
        <p className="mt-2">
          Mientras tanto, puedes ir al{' '}
          <a href="/admin/dashboard" className="underline font-semibold">
            dashboard
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg p-3">
          ⚠ {error}
        </div>
      )}

      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Email</label>
          <input
            type="email"
            className="input"
            placeholder={tPh('adminEmailExample')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Contraseña
          </label>
          <PasswordInput
            placeholder={tPh('passwordDots')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        <button type="submit" disabled={loading} className="btn btn-primary w-full py-3">
          {loading ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}
