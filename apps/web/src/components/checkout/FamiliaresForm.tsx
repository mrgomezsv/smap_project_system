'use client';

import { useRouter } from 'next/navigation';
import { useCheckout } from './CheckoutProvider';

export function FamiliaresForm() {
  const router = useRouter();
  const { data, setFamiliares } = useCheckout();

  function handleAdd() {
    setFamiliares([...data.familiares, { name: '', age: 0 }]);
  }

  function handleRemove(index: number) {
    setFamiliares(data.familiares.filter((_, i) => i !== index));
  }

  function handleChange(index: number, field: 'name' | 'age', value: string) {
    setFamiliares(
      data.familiares.map((f, i) =>
        i === index ? { ...f, [field]: field === 'age' ? Number(value) : value } : f,
      ),
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push('/checkout/confirm');
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-5">
      <header>
        <h1 className="text-2xl font-heading font-extrabold text-text-primary">Familiares y acompañantes</h1>
        <p className="text-sm text-text-muted mt-1">
          Registra a las personas que te acompañan. Si vienes solo, continúa sin agregar.
        </p>
      </header>

      {data.familiares.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
          <p className="text-text-muted text-sm mb-3">Aún no has agregado acompañantes.</p>
          <button type="button" onClick={handleAdd} className="btn btn-outline">
            + Agregar familiar
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {data.familiares.map((f, i) => (
            <div key={i} className="flex items-end gap-3 p-3 bg-surface rounded-xl">
              <div className="flex-1">
                <label className="block text-xs font-medium text-text-muted mb-1">Nombre</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Nombre del familiar"
                  value={f.name}
                  onChange={(e) => handleChange(i, 'name', e.target.value)}
                />
              </div>
              <div className="w-28">
                <label className="block text-xs font-medium text-text-muted mb-1">Edad</label>
                <input
                  type="number"
                  min={0}
                  max={120}
                  className="input"
                  placeholder="0"
                  value={f.age || ''}
                  onChange={(e) => handleChange(i, 'age', e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="btn btn-ghost text-danger px-3"
                aria-label="Quitar"
              >
                ✕
              </button>
            </div>
          ))}
          <button type="button" onClick={handleAdd} className="btn btn-outline w-full">
            + Agregar otro familiar
          </button>
        </div>
      )}

      <div className="flex justify-between pt-2">
        <button
          type="button"
          onClick={() => router.push('/checkout')}
          className="btn btn-ghost"
        >
          ← Volver
        </button>
        <button type="submit" className="btn btn-primary px-8 py-3">
          Continuar →
        </button>
      </div>
    </form>
  );
}
