'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase';
import { isAdminEmail } from '@/lib/admin';

export function UserMenu() {
  const t = useTranslations('header');
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setReady(true);
      return;
    }
    const auth = getFirebaseAuth();
    if (!auth) {
      setReady(true);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
    });
    return unsub;
  }, []);

  if (!ready) return null;

  if (!user) {
    return (
      <Link
        href="/cuenta"
        className="text-sm font-medium text-primary/80 hover:text-primary transition"
      >
        {t('login')}
      </Link>
    );
  }

  const isAdmin = isAdminEmail(user.email);
  const initials = (user.displayName ?? user.email ?? '?')
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 hover:opacity-80 transition"
        aria-label="Menú de usuario"
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName ?? 'Avatar'}
            className="w-9 h-9 rounded-full border-2 border-white shadow-soft"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-party-pink text-white flex items-center justify-center font-bold text-sm border-2 border-white shadow-soft">
            {initials || 'U'}
          </div>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-large border border-border z-40 overflow-hidden">
            <div className="p-4 border-b border-border">
              <p className="font-semibold text-text-primary text-sm truncate">
                {user.displayName ?? 'Usuario'}
              </p>
              <p className="text-xs text-text-muted truncate">{user.email}</p>
            </div>
            <div className="py-1">
              {isAdmin && (
                <Link
                  href="/admin/dashboard"
                  className="block px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5 flex items-center gap-1.5"
                  onClick={() => setOpen(false)}
                >
                  🛡️ {t('adminPanel')}
                </Link>
              )}
              <Link
                href="/cuenta"
                className="block px-4 py-2 text-sm text-text-primary hover:bg-surface"
                onClick={() => setOpen(false)}
              >
                {t('account')}
              </Link>
              <Link
                href="/cuenta#waivers"
                className="block px-4 py-2 text-sm text-text-primary hover:bg-surface"
                onClick={() => setOpen(false)}
              >
                {t('waivers')}
              </Link>
            </div>
            <div className="border-t border-border py-1">
              <button
                onClick={async () => {
                  const auth = getFirebaseAuth();
                  if (auth) await signOut(auth);
                  setOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-danger hover:bg-danger/5"
              >
                {t('logout')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
