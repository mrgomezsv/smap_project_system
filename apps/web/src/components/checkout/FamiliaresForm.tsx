'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useCheckout, type CheckoutFamiliare } from './CheckoutProvider';

const AGE_GROUPS = [
  { label: '👶 Niño (0-12)', age: 8 },
  { label: '🧒 Adolescente (13-17)', age: 15 },
  { label: '🧑 Adulto (18+)', age: 30 },
];

interface RowErrors {
  name?: string;
  age?: string;
}

function validateRow(f: CheckoutFamiliare): RowErrors {
  const errors: RowErrors = {};
  if (!f.name.trim()) errors.name = 'Requerido';
  if (!Number.isFinite(f.age) || f.age < 0 || f.age > 120) {
    errors.age = 'Edad entre 0 y 120';
  }
  return errors;
}

export function FamiliaresForm() {
  const router = useRouter();
  const { data, setFamiliares } = useCheckout();
  const [touched, setTouched] = useState<boolean[]>([]);

  const errors = useMemo(
    () => data.familiares.map(validateRow),
    [data.familiares],
  );

  const allValid = errors.every((e) => Object.keys(e).length === 0);

  function handleAdd() {
    setFamiliares([...data.familiares, { name: '', age: 0 }]);
    setTouched([...touched, false]);
  }

  function handleAddTemplate(age: number) {
    setFamiliares([...data.familiares, { name: '', age }]);
    setTouched([...touched, false]);
  }

  function handleRemove(index: number) {
    setFamiliares(data.familiares.filter((_, i) => i !== index));
    setTouched(touched.filter((_, i) => i !== index));
  }

  function handleChange(index: number, field: 'name' | 'age', value: string) {
    setFamiliares(
      data.familiares.map((f, i) =>
        i === index ? { ...f, [field]: field === 'age' ? Number(value) : value } : f,
      ),
    );
  }

  function handleBlur(index: number) {
    setTouched(touched.map((t, i) => (i === index ? true : t)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(data.familiares.map(() => true));
    if (allValid) {
      router.push('/checkout/confirm');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-5">
      <header>
        <h1 className="text-2xl font-heading font-extrabold text-text-primary">
          Familiares y acompañantes
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Registra a las personas que te acompañan. El titular ya está incluido.
        </p>
      </header>

      {/* Tabla de familiares */}
      {data.familiares.length > 0 && (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface border-b border-border">
              <tr>
                <th className="text-left py-2.5 px-4 font-semibold text-text-muted uppercase text-xs">
                  #
                </th>
                <th className="text-left py-2.5 px-4 font-semibold text-text-muted uppercase text-xs">
                  Nombre completo
                </th>
                <th className="text-left py-2.5 px-4 font-semibold text-text-muted uppercase text-xs w-32">
                  Edad
                </th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {data.familiares.map((f, i) => {
                const rowErr = errors[i];
                const showErr = touched[i];
                return (
                  <tr key={i} className="border-b border-border last:border-b-0">
                    <td className="py-2 px-4 text-text-muted font-mono">{i + 1}</td>
                    <td className="py-2 px-4">
                      <input
                        type="text"
                        className="input !py-2"
                        placeholder="Nombre del familiar"
                        value={f.name}
                        onChange={(e) => handleChange(i, 'name', e.target.value)}
                        onBlur={() => handleBlur(i)}
                      />
                      {showErr && rowErr.name && (
                        <p className="text-xs text-danger mt-1">{rowErr.name}</p>
                      )}
                    </td>
                    <td className="py-2 px-4">
                      <input
                        type="number"
                        min={0}
                        max={120}
                        className="input !py-2"
                        placeholder="0"
                        value={f.age || ''}
                        onChange={(e) => handleChange(i, 'age', e.target.value)}
                        onBlur={() => handleBlur(i)}
                      />
                      {showErr && rowErr.age && (
                        <p className="text-xs text-danger mt-1">{rowErr.age}</p>
                      )}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemove(i)}
                        className="text-text-muted hover:text-danger transition p-1"
                        aria-label="Quitar"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Acciones de agregar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <button type="button" onClick={handleAdd} className="btn btn-outline">
          + Agregar fila
        </button>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span>Plantillas:</span>
          {AGE_GROUPS.map((g) => (
            <button
              key={g.age}
              type="button"
              onClick={() => handleAddTemplate(g.age)}
              className="px-2 py-1 rounded-md border border-border hover:border-primary hover:text-primary transition"
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {data.familiares.length === 0 && (
        <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
          <div className="text-5xl mb-3 opacity-50">👨‍👩‍👧‍👦</div>
          <p className="text-text-muted text-sm">
            Aún no has agregado acompañantes. Si vienes solo, puedes continuar.
          </p>
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
