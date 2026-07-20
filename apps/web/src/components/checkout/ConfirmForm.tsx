'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCheckout } from './CheckoutProvider';

export function ConfirmForm() {
  const router = useRouter();
  const { data } = useCheckout();
  const isEmpty = !data.titular.name;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push('/checkout/success?qr=DEMO');
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
        >
          ← Volver
        </button>
        <button type="submit" className="btn btn-primary px-8 py-3" disabled={isEmpty}>
          Generar waiver
        </button>
      </div>
    </form>
  );
}
