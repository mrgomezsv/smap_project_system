'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { useCheckout } from './CheckoutProvider';
import { api, ApiError } from '@/lib/api';
import { getFirebaseAuth } from '@/lib/firebase';
import type { Waiver } from '@/lib/types';

export function ConfirmForm() {
  const router = useRouter();
  const { data, reset } = useCheckout();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEmpty = !data.titular.name;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isEmpty) return;

    setSubmitting(true);
    setError(null);

    try {
      const auth = getFirebaseAuth();
      const token = auth?.currentUser ? await auth.currentUser.getIdToken() : null;

      if (!token) {
        setError('Necesitas iniciar sesión para generar el waiver.');
        setSubmitting(false);
        return;
      }

      const result = await api.post<{ qrCode: string; waiver: Waiver }>(
        '/api/v2/waiver',
        {
          userName: data.titular.name,
          userEmail: data.titular.email,
          relatives: data.familiares,
        },
        { token },
      );

      reset();
      router.push(`/checkout/success?qr=${result.qrCode}`);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Error al generar el waiver';
      setError(msg);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-6">
      <header>
        <h1 className="text-2xl font-heading font-extrabold text-text-primary">Confirma tu información</h1>
        <p className="text-sm text-text-muted mt-1">
          Revisa que todo esté correcto antes de generar tu waiver.
        </p>
      </header>

      {isEmpty && (
        <div className="bg-warning/10 border border-warning/30 text-warning text-sm rounded-lg p-4">
          ⚠ No has completado el paso de datos.{' '}
          <Link href="/checkout" className="underline font-medium">
            Volver a completar
          </Link>
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
          Titular
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-text-muted">Nombre</dt>
            <dd className="font-semibold text-text-primary mt-0.5">
              {data.titular.name || '—'}
            </dd>
          </div>
          <div>
            <dt className="text-text-muted">Email</dt>
            <dd className="font-semibold text-text-primary mt-0.5">
              {data.titular.email || '—'}
            </dd>
          </div>
          <div>
            <dt className="text-text-muted">Teléfono</dt>
            <dd className="font-semibold text-text-primary mt-0.5">
              {data.titular.phone || '—'}
            </dd>
          </div>
        </dl>
      </section>

      {/* Familiares */}
      <section>
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">
          Acompañantes ({data.familiares.length})
        </h2>
        {data.familiares.length === 0 ? (
          <p className="text-sm text-text-muted">Sin acompañantes registrados.</p>
        ) : (
          <ul className="divide-y divide-border border border-border rounded-xl">
            {data.familiares.map((f, i) => (
              <li key={i} className="flex items-center justify-between p-3 text-sm">
                <span className="font-medium text-text-primary">
                  {f.name || <span className="text-text-muted italic">Sin nombre</span>}
                </span>
                <span className="text-text-muted">{f.age} años</span>
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
          ← Volver
        </button>
        <button
          type="submit"
          className="btn btn-primary px-8 py-3 disabled:opacity-50"
          disabled={isEmpty || submitting}
        >
          {submitting ? 'Generando…' : 'Generar waiver'}
        </button>
      </div>
    </form>
  );
}
