'use client';

import { useEffect, useRef, useState } from 'react';
// qr-scanner ships ambient global declarations in qr-scanner.d.ts but its ESM
// bundle (qr-scanner.min.js) uses `export default e`. We import under an
// alias to avoid clashing with this component's name.
import QrScannerLib from 'qr-scanner';
import { useTranslations } from 'next-intl';
import { api, ApiError } from '@/lib/api';
import { getFirebaseAuth } from '@/lib/firebase';
import type { Waiver } from '@/lib/types';

interface ValidationResult {
  valid: boolean;
  message?: string;
  waiver?: Waiver;
}

type ScannerState =
  | 'idle'
  | 'requesting-permission'
  | 'permission-denied'
  | 'no-camera'
  | 'error'
  | 'scanning';

export function QrScanner() {
  const tPh = useTranslations('placeholders');
  const [code, setCode] = useState('');
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannerState, setScannerState] = useState<ScannerState>('idle');
  const [lastDetected, setLastDetected] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<InstanceType<typeof QrScannerLib> | null>(null);

  useEffect(() => {
    let cancelled = false;
    QrScannerLib.hasCamera()
      .then((ok: boolean) => {
        if (!cancelled) setHasCamera(ok);
      })
      .catch(() => {
        if (!cancelled) setHasCamera(false);
      });
    return () => {
      cancelled = true;
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopScanner() {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current.destroy();
      scannerRef.current = null;
    }
  }

  async function startScanner() {
    if (!videoRef.current) return;
    setError(null);
    setScannerState('requesting-permission');
    try {
      const scanner = new QrScannerLib(
        videoRef.current,
        (res: QrScannerLib.ScanResult) => {
          const value = res.data.trim().toUpperCase();
          if (value === lastDetected) return;
          setLastDetected(value);
          setCode(value);
          stopScanner();
          setScannerState('idle');
          void runValidation(value);
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment',
          returnDetailedScanResult: true,
        },
      );
      scannerRef.current = scanner;
      await scanner.start();
      setScannerState('scanning');
    } catch (e) {
      const err = e as Error & { name?: string };
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setScannerState('permission-denied');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setScannerState('no-camera');
        setHasCamera(false);
      } else {
        setScannerState('error');
        setError(err.message ?? 'No se pudo iniciar la cámara');
      }
    }
  }

  async function runValidation(rawCode: string) {
    const qrCode = rawCode.trim().toUpperCase();
    if (!qrCode) return;
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
        { qrCode },
        { token },
      );
      setResult(res);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        setResult({ valid: false, message: 'QR no encontrado' });
      } else if (e instanceof ApiError && e.status === 403) {
        setError('Tu cuenta no tiene rol de administrador.');
      } else {
        setError(e instanceof ApiError ? e.message : 'Error al validar');
      }
    } finally {
      setValidating(false);
    }
  }

  async function handleValidate(e: React.FormEvent) {
    e.preventDefault();
    await runValidation(code);
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="card">
        <h1 className="text-2xl font-heading font-extrabold text-text-primary mb-1">
          Escanear QR
        </h1>
        <p className="text-sm text-text-muted mb-6">
          Activa la cámara o ingresa el código manualmente para validar la entrada.
        </p>

        {hasCamera !== false && (
          <div className="mb-4">
            {scannerState === 'idle' && (
              <button
                type="button"
                onClick={startScanner}
                className="btn btn-primary w-full py-3"
              >
                📷 Activar cámara
              </button>
            )}
            {scannerState === 'requesting-permission' && (
              <div className="card text-center py-6 text-text-muted text-sm">
                <div className="inline-block w-6 h-6 border-2 border-text-muted border-t-transparent rounded-full animate-spin mb-2" />
                <p>Solicitando permiso de cámara…</p>
              </div>
            )}
            {scannerState === 'scanning' && (
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full aspect-square object-cover rounded-xl bg-black"
                  playsInline
                  muted
                />
                <button
                  type="button"
                  onClick={() => {
                    stopScanner();
                    setScannerState('idle');
                  }}
                  className="absolute top-3 right-3 btn btn-outline text-xs px-3 py-1"
                >
                  Detener cámara
                </button>
                <p className="text-xs text-text-muted text-center mt-2">
                  Apunta la cámara al código QR del cliente.
                </p>
              </div>
            )}
            {scannerState === 'permission-denied' && (
              <div className="bg-warning/10 border border-warning/30 text-warning text-sm rounded-lg p-3 mb-2">
                Permiso de cámara denegado. Usa la entrada manual más abajo.
              </div>
            )}
            {scannerState === 'error' && (
              <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg p-3 mb-2">
                ⚠ {error ?? 'Error desconocido al iniciar la cámara'}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleValidate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Código QR (manual)
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
              {result.waiver.userPhone && (
                <div className="flex justify-between">
                  <span className="text-text-muted">Teléfono</span>
                  <span className="font-semibold text-text-primary">{result.waiver.userPhone}</span>
                </div>
              )}
              {result.waiver.relatives && result.waiver.relatives.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-text-muted">Acompañantes</span>
                  <span className="font-semibold text-text-primary">
                    {result.waiver.relatives.length}
                  </span>
                </div>
              )}
              {result.valid && result.waiver.status && (
                <div className="flex justify-between">
                  <span className="text-text-muted">Estado</span>
                  <span className="font-semibold text-text-primary">{result.waiver.status}</span>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => {
              setCode('');
              setResult(null);
              setLastDetected(null);
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
