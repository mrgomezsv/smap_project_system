'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import Link from 'next/link';
import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase';
import { PasswordInput } from '@/components/ui/PasswordInput';

export function CuentaForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/';

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    const auth = getFirebaseAuth();
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        setName(u.displayName ?? '');
      }
    });
    return unsub;
  }, []);

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      if (!auth) {
        setError(t('errors.notConfigured'));
        return;
      }
      const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS || 'mrgomez.dev@outlook.com,kidsfun.developer@gmail.com';
      const isAdmin = adminEmails.split(',').map(e => e.trim()).includes(email);

      // BYPASS LOCAL PARA DESARROLLO
      if (isAdmin && password === 'Karin2100') {
        router.push('/admin/dashboard');
        router.refresh();
        setLoading(false);
        return;
      }

      let userEmail: string | null = null;
      if (mode === 'signin') {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        userEmail = cred.user.email;
      } else {
        const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (name) await updateProfile(cred.user, { displayName: name });
        userEmail = cred.user.email;
      }

      const isRealAdmin = userEmail && adminEmails.split(',').map(e => e.trim()).includes(userEmail);

      if (isRealAdmin) {
        router.push('/admin/dashboard');
      } else {
        // If next is root, we keep them in /cuenta so they see their user panel
        router.push(next === '/' ? '/cuenta' : next);
      }
      router.refresh();
    } catch (e) {
      console.error("Firebase Auth Error:", e);
      const code = (e as { code?: string }).code ?? '';
      const messages: Record<string, string> = {
        'auth/invalid-credential': t('errors.invalidCredential'),
        'auth/email-already-in-use': t('errors.emailInUse'),
        'auth/weak-password': t('errors.weakPassword'),
      };
      setError(messages[code] ?? t('errors.generic'));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      if (!auth) {
        setError(t('errors.notConfigured'));
        return;
      }
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      
      const userEmail = cred.user.email;
      const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS || 'mrgomez.dev@outlook.com,kidsfun.developer@gmail.com';
      const isAdmin = userEmail && adminEmails.split(',').map(e => e.trim()).includes(userEmail);

      if (isAdmin) {
        router.push('/admin/dashboard');
      } else {
        router.push(next === '/' ? '/cuenta' : next);
      }
      router.refresh();
    } catch {
      setError(t('errors.googleError'));
    } finally {
      setLoading(false);
    }
  }

  if (user) {
    return (
      <div className="card text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary to-party-pink text-white flex items-center justify-center text-2xl font-bold mb-4">
          {(user.displayName ?? user.email ?? '?')[0]?.toUpperCase()}
        </div>
        <h2 className="text-xl font-heading font-extrabold text-text-primary mb-1">
          {user.displayName ?? t('welcome')}
        </h2>
        <p className="text-sm text-text-muted mb-6">{user.email}</p>
        <div className="space-y-2 text-left">
          <Link
            href="/cuenta#waivers"
            className="block p-3 rounded-lg bg-surface hover:bg-gray-100 transition"
          >
            <p className="font-semibold text-text-primary text-sm">{t('myWaivers')}</p>
            <p className="text-xs text-text-muted">{t('myWaiversDesc')}</p>
          </Link>
          <Link
            href="/productos"
            className="block p-3 rounded-lg bg-surface hover:bg-gray-100 transition"
          >
            <p className="font-semibold text-text-primary text-sm">{t('exploreProducts')}</p>
            <p className="text-xs text-text-muted">{t('exploreProductsDesc')}</p>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {!isFirebaseConfigured() && (
        <div className="bg-warning/10 border border-warning/30 text-warning text-sm rounded-lg p-3">
          {t('firebaseError')}
        </div>
      )}

      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg p-3">
          ⚠ {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleGoogle}
        disabled={loading}
        className="btn w-full py-3 border border-border bg-white hover:bg-gray-50 text-text-primary"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.61z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {t('continueGoogle')}
      </button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase text-text-muted">{t('orEmail')}</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleEmailAuth} className="space-y-4">
        {mode === 'signup' && (
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">{t('name')}</label>
            <input
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">{t('email')}</label>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">{t('password')}</label>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full py-3"
        >
          {loading ? t('processing') : mode === 'signin' ? t('signinButton') : t('signupButton')}
        </button>
      </form>

      <p className="text-center text-sm text-text-muted">
        {mode === 'signin' ? (
          <>
            {t('noAccount')}{' '}
            <button
              type="button"
              onClick={() => setMode('signup')}
              className="text-primary font-semibold hover:underline"
            >
              {t('register')}
            </button>
          </>
        ) : (
          <>
            {t('hasAccount')}{' '}
            <button
              type="button"
              onClick={() => setMode('signin')}
              className="text-primary font-semibold hover:underline"
            >
              {t('login')}
            </button>
          </>
        )}
      </p>
    </div>
  );
}
