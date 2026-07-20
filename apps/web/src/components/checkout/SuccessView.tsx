'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { api, API_BASE_URL, ApiError } from '@/lib/api';
import { getFirebaseAuth } from '@/lib/firebase';
import type { Waiver } from '@/lib/types';

interface SuccessViewProps {
  qrCode: string;
}

export function SuccessView({ qrCode }: SuccessViewProps) {
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

        // Waiver completo (con auth)
        const auth = getFirebaseAuth();
        const token = auth?.currentUser ? await auth.currentUser.getIdToken() : null;

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
          setError('No se encontró el waiver. Verifica el código QR.');
        } else {
          setError('No se pudo cargar el detalle del waiver.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [qrCode]);

  const pdfUrl = `${API_BASE_URL}/api/v2/waiver/download/${qrCode}`;

  return (
    <div className="card text-center py-10">
      <div className="text-6xl mb-3">🎉</div>
      <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-text-primary">
        ¡Waiver generado!
      </h1>
      <p className="text-text-muted mt-2 max-w-md mx-auto">
        Guarda este código QR. Lo necesitarás para entrar al evento y será escaneado por
        nuestro equipo en la puerta.
      </p>

      {/* QR */}
      <div className="mt-8 flex justify-center">
        {qrDataUrl ? (
          <div className="p-4 bg-white border-2 border-border rounded-2xl shadow-medium inline-block">
            <img src={qrDataUrl} alt={`QR ${qrCode}`} className="w-64 h-64" />
          </div>
        ) : (
          <div className="w-64 h-64 bg-gray-100 rounded-2xl flex items-center justify-center text-text-muted text-sm">
            Generando QR…
          </div>
        )}
      </div>

      <p className="mt-3 font-mono text-lg font-bold text-primary tracking-wider">{qrCode}</p>

      {/* Detalles del waiver */}
      {waiver && (
        <div className="mt-6 max-w-md mx-auto text-left bg-surface rounded-xl p-4 text-sm">
          <div className="flex justify-between py-1">
            <span className="text-text-muted">Titular</span>
            <span className="font-semibold text-text-primary">{waiver.userName}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-text-muted">Email</span>
            <span className="font-semibold text-text-primary">{waiver.userEmail}</span>
          </div>
          {waiver.relatives && waiver.relatives.length > 0 && (
            <div className="flex justify-between py-1">
              <span className="text-text-muted">Acompañantes</span>
              <span className="font-semibold text-text-primary">{waiver.relatives.length}</span>
            </div>
          )}
          <div className="flex justify-between py-1">
            <span className="text-text-muted">Estado</span>
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
              {waiver.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
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
          📄 Descargar PDF
        </a>
        <a
          href={qrDataUrl ?? '#'}
          download={`waiver-${qrCode}.png`}
          className="btn btn-outline px-6 py-3"
        >
          ⬇ Descargar QR
        </a>
      </div>

      <p className="text-xs text-text-muted mt-6">
        También te enviamos una copia a tu email.
      </p>
    </div>
  );
}
