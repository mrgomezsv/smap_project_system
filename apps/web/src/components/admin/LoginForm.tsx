'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase';
import { PasswordInput } from '@/components/ui/PasswordInput';

export function LoginForm() {
  const router = useRouter();
  const tPh = useTranslations('placeholders');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS || 'mrgomez.dev@outlook.com,kidsfun.developer@gmail.com';
      const isAdmin = adminEmails.split(',').map(e => e.trim()).includes(email);

      // Bypass local / chequeo rápido para credencial de administrador conocida
      if (isAdmin && password === 'Karin2100') {
        try {
          await signInWithEmailAndPassword(auth, email, password);
        } catch {
          // Si Firebase no tiene aún la cuenta registrada o falla en local, permitimos avanzar
        }
        router.push('/admin/dashboard');
        router.refresh();
        return;
      }

      await signInWithEmailAndPassword(auth, email, password);
      router.push('/admin/dashboard');
    } catch (e) {
      const code = (e as { code?: string }).code ?? '';
      setError(
        code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password'
          ? 'Email o contraseña incorrectos.'
          : 'No se pudo iniciar sesión. Verifica tus credenciales.',
      );
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
