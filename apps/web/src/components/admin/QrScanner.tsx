'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { api, ApiError } from '@/lib/api';
import { getFirebaseAuth } from '@/lib/firebase';
import type { Waiver } from '@/lib/types';

interface ValidationResult {
  valid: boolean;
  message?: string;
  waiver?: Waiver;
}

export function QrScanner() {
  const tPh = useTranslations('placeholders');
  const [code, setCode] = useState('');
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleValidate(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setValidating(true);
    setError(null);
    setResult(null);
    try {
      const auth = getFirebaseAuth();
      const token = auth?.currentUser ? await auth.currentUser.getIdToken() : null;
      if (!token) {
        setError('Necesitas iniciar sesión para validar.');
        return;
      }
      const res = await api.post<{ valid: boolean; message?: string; waiver?: Waiver }>(
        '/api/v2/waiver/validate',
        { qrCode: code.trim().toUpperCase() },
        { token },
      );
      setResult(res);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        setResult({ valid: false, message: 'QR no encontrado' });
      } else {
        setError(e instanceof ApiError ? e.message : 'Error al validar');
      }
    } finally {
      setValidating(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="card">
        <h1 className="text-2xl font-heading font-extrabold text-text-primary mb-1">
          Escanear QR
        </h1>
        <p className="text-sm text-text-muted mb-6">
          Ingresa o escanea el código QR del cliente para validar su entrada.
        </p>

        <form onSubmit={handleValidate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Código QR
            </label>
            <input
              type="text"
              autoFocus
              className="input font-mono text-lg uppercase tracking-wider"
              placeholder={tPh('qrCode')}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={8}
            />
          </div>
          <button
            type="submit"
            disabled={validating || !code.trim()}
            className="btn btn-primary w-full py-3"
          >
            {validating ? 'Validando…' : '🔍 Validar entrada'}
          </button>
        </form>

        {error && (
          <div className="mt-4 bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg p-3">
            ⚠ {error}
          </div>
        )}
      </div>

      {result && (
        <div
          className={[
            'card border-2',
            result.valid
              ? 'border-success bg-success/5'
              : 'border-danger bg-danger/5',
          ].join(' ')}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className={[
                'w-12 h-12 rounded-full flex items-center justify-center text-2xl',
                result.valid ? 'bg-success text-white' : 'bg-danger text-white',
              ].join(' ')}
            >
              {result.valid ? '✓' : '✕'}
            </div>
            <div>
              <h2 className="text-xl font-heading font-bold text-text-primary">
                {result.valid ? 'Acceso permitido' : 'Acceso denegado'}
              </h2>
              <p className="text-sm text-text-muted">{result.message ?? ''}</p>
            </div>
          </div>

          {result.waiver && (
            <div className="mt-4 pt-4 border-t border-border space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Titular</span>
                <span className="font-semibold text-text-primary">{result.waiver.userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Email</span>
                <span className="font-semibold text-text-primary">{result.waiver.userEmail}</span>
              </div>
              {result.waiver.relatives && result.waiver.relatives.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-text-muted">Acompañantes</span>
                  <span className="font-semibold text-text-primary">
                    {result.waiver.relatives.length}
                  </span>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => {
              setCode('');
              setResult(null);
            }}
            className="btn btn-outline w-full mt-4"
          >
            Escanear otro
          </button>
        </div>
      )}
    </div>
  );
}
