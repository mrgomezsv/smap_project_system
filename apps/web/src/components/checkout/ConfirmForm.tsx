'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useCheckout } from './CheckoutProvider';
import { useAuth } from '@/components/auth/AuthProvider';
import { api, ApiError } from '@/lib/api';
import type { Waiver } from '@/lib/types';

export function ConfirmForm() {
  const router = useRouter();
  const { data, reset } = useCheckout();
  const { getToken, user, ready } = useAuth();
  const t = useTranslations('checkout');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();

  const isEmpty = !data.titular.name;
  const needsAuth = ready && !user;

  useEffect(() => {
    if (needsAuth && !isEmpty) {
      sessionStorage.setItem('checkout_intent', '1');
    }
  }, [needsAuth, isEmpty]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isEmpty) return;

    if (needsAuth) {
      router.push(`/cuenta?next=${encodeURIComponent(pathname)}`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        setError(t('authRequired'));
        setSubmitting(false);
        return;
      }

      const result = await api.post<{ qrCode: string; waiver: Waiver }>(
        '/api/v2/waiver',
        {
          userName: data.titular.name,
          userEmail: data.titular.email,
          userPhone: data.titular.phone?.trim() || undefined,
          relatives: data.familiares,
        },
        { token },
      );

      reset();
      router.push(`/checkout/success?qr=${result.qrCode}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('errorGeneric'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-6">
      <header>
        <h1 className="text-2xl font-heading font-extrabold text-text-primary">
          {t('confirm')}
        </h1>
        <p className="text-sm text-text-muted mt-1">{t('confirmSubtitle')}</p>
      </header>

      {isEmpty && (
        <div className="bg-warning/10 border border-warning/30 text-warning text-sm rounded-lg p-4">
          ⚠ {t('emptyData')}{' '}
          <Link href="/checkout" className="underline font-medium">
            {t('back')}
          </Link>
        </div>
      )}

      {needsAuth && !isEmpty && (
        <div className="bg-info/10 border border-info/30 text-info text-sm rounded-lg p-4">
          <p className="font-semibold mb-1">🔐 {t('authRequired')}</p>
          <p>
            {t('authRequiredHint')}{' '}
            <Link
              href={`/cuenta?next=${encodeURIComponent(pathname)}`}
              className="underline font-semibold"
            >
              {t('loginCta')}
            </Link>{' '}
            {t('toContinue')}.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg p-4">
          ✕ {error}
        </div>
      )}

      {/* Titular */}
      <section>
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">
          {t('titular')}
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-text-muted">{t('name')}</dt>
            <dd className="font-semibold text-text-primary mt-0.5">
              {data.titular.name || '—'}
            </dd>
          </div>
          <div>
            <dt className="text-text-muted">{t('email')}</dt>
            <dd className="font-semibold text-text-primary mt-0.5">
              {data.titular.email || '—'}
            </dd>
          </div>
          <div>
            <dt className="text-text-muted">{t('phone')}</dt>
            <dd className="font-semibold text-text-primary mt-0.5">
              {data.titular.phone || '—'}
            </dd>
          </div>
        </dl>
      </section>

      {/* Familiares */}
      <section>
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">
          {t('companions')} ({data.familiares.length})
        </h2>
        {data.familiares.length === 0 ? (
          <p className="text-sm text-text-muted">{t('noCompanions')}</p>
        ) : (
          <ul className="divide-y divide-border border border-border rounded-xl">
            {data.familiares.map((f, i) => (
              <li key={i} className="flex items-center justify-between p-3 text-sm">
                <span className="font-medium text-text-primary">
                  {f.name || <span className="text-text-muted italic">—</span>}
                </span>
                <span className="text-text-muted">
                  {f.age} {t('yearsOld')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex justify-between pt-2">
        <button
          type="button"
          onClick={() => router.push('/checkout/waiver')}
          className="btn btn-ghost"
          disabled={submitting}
        >
          {t('back')}
        </button>
        <button
          type="submit"
          className="btn btn-primary px-8 py-3 disabled:opacity-50"
          disabled={isEmpty || submitting}
        >
          {submitting
            ? t('generating')
            : needsAuth
              ? t('loginToContinue')
              : t('generate')}
        </button>
      </div>
    </form>
  );
}
