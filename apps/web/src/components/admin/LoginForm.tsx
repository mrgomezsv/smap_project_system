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
      const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || 'admin@kidsfun.com,mrgomez.dev@outlook.com,kidsfun.developer@gmail.com,karenhenriquez911@gmail.com')
        .split(',')
        .map((e) => e.trim().toLowerCase());
      const isAdmin = adminEmails.includes(email.trim().toLowerCase());

      try {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } catch (err: any) {
        // Si es admin con la clave conocida pero la cuenta aún no existe en Firebase Auth, la creamos
        if (isAdmin && password === 'Karin2100') {
          const { createUserWithEmailAndPassword } = await import('firebase/auth');
          await createUserWithEmailAndPassword(auth, email.trim(), password);
        } else {
          throw err;
        }
      }

      window.location.href = '/admin/dashboard';
    } catch (e: any) {
      const code = e?.code ?? '';
      if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        setError('Email o contraseña incorrectos.');
      } else if (code === 'auth/email-already-in-use') {
        // En caso de reintento directo
        window.location.href = '/admin/dashboard';
        return;
      } else {
        setError('No se pudo iniciar sesión. Verifica tus credenciales.');
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
