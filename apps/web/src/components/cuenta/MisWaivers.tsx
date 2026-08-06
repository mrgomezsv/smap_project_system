'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { api, PUBLIC_API_URL } from '@/lib/api';
import { useAuth } from '@/components/auth/AuthProvider';
import type { Waiver } from '@/lib/types';

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

export function MisWaivers() {
  const t = useTranslations('misWaivers');
  const { user, ready, getToken } = useAuth();
  const [state, setState] = useState<LoadState>('idle');
  const [waivers, setWaivers] = useState<Waiver[]>([]);
  const [qrImages, setQrImages] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function load() {
    setState('loading');
    setErrorMsg(null);
    try {
      const token = await getToken();
      if (!token) {
        setState('ready');
        setWaivers([]);
        return;
      }
      const res = await api.get<{ waivers: Waiver[]; totalCount: number }>(
        '/api/v2/waiver/user/me',
        { token },
      );
      const list = res.waivers ?? [];
      setWaivers(list);

      const imgs: Record<string, string> = {};
      for (const w of list) {
        imgs[w.qrCode] = await QRCode.toDataURL(w.qrCode, {
          errorCorrectionLevel: 'M',
          margin: 1,
          width: 144,
        });
      }
      setQrImages(imgs);
      setState('ready');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Network error');
      setState('error');
    }
  }

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      setState('ready');
      setWaivers([]);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user?.uid]);

  if (!ready || state === 'idle' || state === 'loading') {
    return (
      <section
        id="waivers"
        className="card text-center py-10 text-text-muted"
        aria-busy="true"
      >
        <div className="inline-block w-6 h-6 border-2 border-text-muted border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-sm">{t('loading')}</p>
      </section>
    );
  }

  if (!user) {
    return (
      <section id="waivers" className="card text-center py-8 text-text-muted text-sm">
        {t('authRequired')}
      </section>
    );
  }

  if (state === 'error') {
    return (
      <section
        id="waivers"
        className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg p-4"
      >
        <p className="font-semibold mb-2">⚠ {t('errorTitle')}</p>
        {errorMsg && <p className="text-xs mb-3 opacity-80">{errorMsg}</p>}
        <button
          type="button"
          onClick={load}
          className="btn btn-outline text-xs px-4 py-1.5"
        >
          {t('errorRetry')}
        </button>
      </section>
    );
  }

  if (waivers.length === 0) {
    return (
      <section
        id="waivers"
        className="card text-center py-12 border-dashed border-border"
      >
        <div className="text-5xl mb-3">🎈</div>
        <p className="font-heading font-bold text-text-primary mb-1">{t('empty')}</p>
        <p className="text-sm text-text-muted mb-4">{t('emptyHint')}</p>
        <div className="flex justify-center gap-3">
          <Link href="/checkout/waiver" className="btn btn-primary px-5 py-2 inline-block">
            📝 Llenar Waiver Ahora →
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section id="waivers" className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-text-primary">
            {t('sectionTitle')}
          </h2>
          <p className="text-sm text-text-muted mt-1">{t('sectionSubtitle')}</p>
        </div>
        <Link
          href="/checkout/waiver"
          className="btn btn-primary text-xs px-3.5 py-2 flex items-center gap-1.5 font-bold shadow-xs"
        >
          <span>📝</span> Nuevo Waiver
        </Link>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {waivers.map((w) => (
          <WaiverCard
            key={w.id}
            waiver={w}
            qrDataUrl={qrImages[w.qrCode]}
            pdfUrl={`${PUBLIC_API_URL}/api/v2/waiver/download/${w.qrCode}`}
          />
        ))}
      </div>
    </section>
  );
}

function WaiverCard({
  waiver,
  qrDataUrl,
  pdfUrl,
}: {
  waiver: Waiver;
  qrDataUrl?: string;
  pdfUrl: string;
}) {
  const t = useTranslations('misWaivers');
  const isActive = waiver.status === 'ACTIVE';
  const created = new Date(waiver.createdAt);
  const companions = waiver.relatives?.length ?? 0;
  const dateStr = created.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <article className="card p-0 overflow-hidden">
      <div className="flex">
        <div className="shrink-0 w-32 sm:w-36 bg-surface flex items-center justify-center p-3 border-r border-border">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR ${waiver.qrCode}`}
              className="w-full h-auto"
            />
          ) : (
            <div className="w-24 h-24 bg-gray-100 rounded animate-pulse" />
          )}
        </div>
        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <code className="font-mono font-bold text-primary text-sm tracking-wider truncate">
              {waiver.qrCode}
            </code>
            <StatusBadge active={isActive} t={t} />
          </div>
          <p className="font-semibold text-text-primary text-sm truncate">
            {waiver.userName}
          </p>
          <p className="text-xs text-text-muted truncate">{waiver.userEmail}</p>
          {waiver.userPhone && (
            <p className="text-xs text-text-muted truncate">📞 {waiver.userPhone}</p>
          )}
          <p className="text-xs text-text-muted mt-2">
            {t('createdAt', { date: dateStr })}
          </p>
          {companions > 0 && (
            <p className="text-xs text-text-muted">
              {t('companion', { count: companions })}
            </p>
          )}
        </div>
      </div>
      <div className="border-t border-border bg-surface px-4 py-3 flex flex-wrap gap-2 justify-end">
        <a
          href={pdfUrl}
          target="_blank"
          rel="noreferrer"
          className="btn btn-outline text-xs px-3 py-1.5"
          title={t('pdfHint')}
        >
          {t('downloadPdf')}
        </a>
        {qrDataUrl && (
          <a
            href={qrDataUrl}
            download={`waiver-${waiver.qrCode}.png`}
            className="btn btn-outline text-xs px-3 py-1.5"
          >
            {t('downloadQr')}
          </a>
        )}
        <Link
          href={`/checkout/success?qr=${waiver.qrCode}`}
          className="btn btn-outline text-xs px-3 py-1.5"
        >
          {t('viewDetail')} →
        </Link>
      </div>
    </article>
  );
}

function StatusBadge({
  active,
  t,
}: {
  active: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  return active ? (
    <span className="inline-flex items-center gap-1 bg-success/10 text-success text-xs font-semibold px-2 py-0.5 rounded-full shrink-0">
      <span className="w-1.5 h-1.5 bg-success rounded-full" />
      {t('statusActive')}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 bg-gray-100 text-text-muted text-xs font-semibold px-2 py-0.5 rounded-full shrink-0">
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
      {t('statusInactive')}
    </span>
  );
}
