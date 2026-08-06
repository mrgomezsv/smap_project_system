'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { api, PUBLIC_API_URL, ApiError } from '@/lib/api';
import { useAuth } from '@/components/auth/AuthProvider';
import type { Waiver } from '@/lib/types';

interface SuccessViewProps {
  qrCode: string;
}

export function SuccessView({ qrCode }: SuccessViewProps) {
  const t = useTranslations('checkout');
  const tAccount = useTranslations('header');
  const { getToken } = useAuth();
  const router = useRouter();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [waiver, setWaiver] = useState<Waiver | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // QR visual (cliente, sin auth)
        const url = await QRCode.toDataURL(qrCode, {
          errorCorrectionLevel: 'M',
          margin: 1,
          width: 320,
        });
        if (cancelled) return;
        setQrDataUrl(url);

        // Waiver completo (con token auto-refresh vía AuthProvider)
        const token = await getToken();
        if (token) {
          const res = await api.get<{ waiver: Waiver; isValid: boolean }>(
            `/api/v2/waiver/${qrCode}`,
            { token },
          );
          if (cancelled) return;
          setWaiver(res.waiver);
        }
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 404) {
          setError(t('errors.notFound'));
        } else {
          setError(t('errors.loadFailed'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [qrCode, getToken, t]);

  const locale = useLocale();
  const pdfUrl = `${PUBLIC_API_URL}/api/v2/waiver/download/${qrCode}?lang=${locale}`;

  return (
    <div className="card text-center py-10 relative">
      <Link
        href="/cuenta"
        className="absolute top-4 left-4 p-2 text-text-muted hover:text-text-primary hover:bg-surface rounded-full transition z-10"
        title="Ir a mi cuenta"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
      </Link>
      <div className="text-6xl mb-3">🎉</div>
      <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-text-primary">
        {t('success')}
      </h1>
      <p className="text-text-muted mt-2 max-w-md mx-auto">{t('successSubtitle')}</p>

      {/* QR */}
      <div className="mt-8 flex justify-center">
        {qrDataUrl ? (
          <div className="p-4 bg-white border-2 border-border rounded-2xl shadow-medium inline-block">
            <img src={qrDataUrl} alt={`QR ${qrCode}`} className="w-64 h-64" />
          </div>
        ) : (
          <div className="w-64 h-64 bg-gray-100 rounded-2xl flex items-center justify-center text-text-muted text-sm">
            {t('generatingQr')}
          </div>
        )}
      </div>

      <p className="mt-3 font-mono text-lg font-bold text-primary tracking-wider">{qrCode}</p>

      {/* Detalles del waiver */}
      {waiver && (
        <div className="mt-6 max-w-md mx-auto text-left bg-surface rounded-xl p-4 text-sm">
          <div className="flex justify-between py-1">
            <span className="text-text-muted">{t('titular')}</span>
            <span className="font-semibold text-text-primary">{waiver.userName}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-text-muted">{t('email')}</span>
            <span className="font-semibold text-text-primary">{waiver.userEmail}</span>
          </div>
          {waiver.userPhone && (
            <div className="flex justify-between py-1">
              <span className="text-text-muted">{t('phone')}</span>
              <span className="font-semibold text-text-primary">{waiver.userPhone}</span>
            </div>
          )}
          {waiver.relatives && waiver.relatives.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex justify-between py-1 mb-2">
                <span className="text-text-muted font-semibold">
                  {t('companions')} ({waiver.relatives.length})
                </span>
              </div>
              <ul className="space-y-1.5">
                {waiver.relatives.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between gap-2 bg-white rounded-lg px-3 py-2 text-sm border border-border"
                  >
                    <span className="font-semibold text-text-primary truncate">
                      {r.relativeName}
                    </span>
                    <span className="text-xs text-text-muted shrink-0">
                      {r.relativeAge} {t('yearsOld')}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {waiver.relatives && waiver.relatives.length === 0 && (
            <div className="flex justify-between py-1">
              <span className="text-text-muted">{t('companions')}</span>
              <span className="text-text-muted italic text-xs">
                {t('noCompanions')}
              </span>
            </div>
          )}
          <div className="flex justify-between py-1">
            <span className="text-text-muted">{t('status')}</span>
            <span
              className={[
                'inline-flex items-center gap-1 font-semibold',
                waiver.status === 'ACTIVE' ? 'text-success' : 'text-text-muted',
              ].join(' ')}
            >
              <span
                className={[
                  'w-2 h-2 rounded-full',
                  waiver.status === 'ACTIVE' ? 'bg-success' : 'bg-gray-400',
                ].join(' ')}
              />
              {waiver.status === 'ACTIVE' ? t('active') : t('inactive')}
            </span>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-4 text-sm text-danger">⚠ {error}</p>
      )}

      {/* Acciones */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href={pdfUrl}
          target="_blank"
          rel="noreferrer"
          className="btn bg-primary text-white hover:bg-primary-600 px-6 py-3"
        >
          {t('downloadPdf')}
        </a>
        <a
          href={qrDataUrl ?? '#'}
          download={`waiver-${qrCode}.png`}
          className="btn btn-outline px-6 py-3"
        >
          ⬇ {t('downloadQr')}
        </a>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/cuenta#waivers" className="text-sm text-primary hover:underline">
          {t('myWaiversCta')} →
        </Link>
      </div>

      <p className="text-xs text-text-muted mt-6">{t('emailCopySent')}</p>
    </div>
  );
}
