'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  type User,
} from 'firebase/auth';
import Link from 'next/link';
import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { api } from '@/lib/api';
import { isAdminEmail } from '@/lib/admin';

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

  // Estados para modal de restablecimiento de contraseña
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

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
      const isAdmin = isAdminEmail(email);

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

      const isRealAdmin = isAdminEmail(userEmail);

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

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(false);
    setResetLoading(true);
    try {
      try {
        const locale = typeof window !== 'undefined' ? (document.documentElement.lang || 'es') : 'es';
        await api.post('/api/auth/request-password-reset', { email: resetEmail, lang: locale });
      } catch {
        const auth = getFirebaseAuth();
        if (auth) {
          await sendPasswordResetEmail(auth, resetEmail);
        }
      }
      setResetSuccess(true);
    } catch (e) {
      console.error('Password reset error:', e);
      setResetError(t('errors.generic'));
    } finally {
      setResetLoading(false);
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
      const isAdmin = isAdminEmail(userEmail);

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
    const isAdmin = isAdminEmail(user.email);
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
          {isAdmin && (
            <Link
              href="/admin/dashboard"
              className="block p-3 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/20 transition"
            >
              <p className="font-semibold text-primary text-sm flex items-center gap-2">
                🛡️ {t('adminPanel')}
              </p>
              <p className="text-xs text-text-muted">{t('adminPanelDesc')}</p>
            </Link>
          )}
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
          <button
            type="button"
            onClick={async () => {
              const auth = getFirebaseAuth();
              if (auth) {
                await signOut(auth);
                router.refresh();
              }
            }}
            className="btn btn-outline border-danger text-danger hover:bg-danger/10 w-full py-3 mt-6 flex justify-center items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            {t('logout')}
          </button>
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
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-text-primary">{t('password')}</label>
            {mode === 'signin' && (
              <button
                type="button"
                onClick={() => {
                  setResetEmail(email);
                  setResetError(null);
                  setResetSuccess(false);
                  setShowResetModal(true);
                }}
                className="text-xs font-semibold text-primary hover:underline"
              >
                {t('forgotPassword')}
              </button>
            )}
          </div>
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

      {/* Modal de Restablecimiento de Contraseña */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-border relative">
            <button
              type="button"
              onClick={() => setShowResetModal(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary text-xl font-bold"
            >
              ✕
            </button>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl mb-2">
                🔑
              </div>
              <h3 className="text-xl font-heading font-extrabold text-text-primary">
                {t('forgotModalTitle')}
              </h3>
              <p className="text-xs text-text-muted mt-1">
                {t('forgotModalDesc')}
              </p>
            </div>

            {resetSuccess ? (
              <div className="space-y-4">
                <div className="p-3 bg-success/10 border border-success/30 text-success text-sm rounded-lg text-center font-medium">
                  {t('resetSentSuccess')}
                </div>
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="btn btn-primary w-full py-2.5 text-xs font-semibold"
                >
                  {t('backToLogin')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {resetError && (
                  <div className="p-3 bg-danger/10 border border-danger/30 text-danger text-xs rounded-lg">
                    ⚠ {resetError}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    {t('email')}
                  </label>
                  <input
                    type="email"
                    className="input"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    placeholder="ejemplo@correo.com"
                    autoComplete="email"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="btn btn-outline flex-1 py-2.5 text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="btn btn-primary flex-1 py-2.5 text-xs font-semibold"
                  >
                    {resetLoading ? t('processing') : t('sendResetLink')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
