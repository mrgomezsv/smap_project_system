'use client';

import { useState } from 'react';
import { ConfirmModal } from '@/components/admin/ConfirmModal';

interface SudoAction {
  id: string;
  label: string;
  description: string;
  variant: 'danger' | 'primary';
  requireText: string;
}

const ACTIONS: SudoAction[] = [
  {
    id: 'reset-db',
    label: 'Resetear base de datos',
    description: 'Borra TODOS los datos: productos, eventos, waivers, mensajes. Solo deja la estructura de tablas.',
    variant: 'danger',
    requireText: 'RESET DB',
  },
  {
    id: 'rebuild-search',
    label: 'Reindexar búsqueda',
    description: 'Reconstruye los índices de búsqueda. Útil si los resultados están desactualizados.',
    variant: 'primary',
    requireText: 'REINDEX',
  },
  {
    id: 'clear-cache',
    label: 'Limpiar caché de imágenes',
    description: 'Invalida las versiones cacheadas de las imágenes del sitio público.',
    variant: 'primary',
    requireText: 'CLEAR CACHE',
  },
  {
    id: 'force-firebase-sync',
    label: 'Forzar sync Firebase',
    description: 'Re-sincroniza todos los usuarios de Firebase Auth con la base de datos local.',
    variant: 'primary',
    requireText: 'SYNC USERS',
  },
];

export function SudoActions() {
  const [pending, setPending] = useState<SudoAction | null>(null);
  const [result, setResult] = useState<{ action: SudoAction; ok: boolean } | null>(null);
  const [executing, setExecuting] = useState(false);

  async function handleConfirm() {
    if (!pending) return;
    setExecuting(true);
    setResult(null);
    // Simulación
    await new Promise((r) => setTimeout(r, 1500));
    setResult({ action: pending, ok: true });
    setExecuting(false);
    setPending(null);
  }

  return (
    <div className="space-y-6">
      {result && (
        <div
          className={[
            'rounded-lg p-3 text-sm',
            result.ok
              ? 'bg-success/10 text-success border border-success/30'
              : 'bg-danger/10 text-danger border border-danger/30',
          ].join(' ')}
        >
          ✓ Acción <strong>{result.action.label}</strong> ejecutada correctamente.
        </div>
      )}

      <div className="card border-2 border-danger/30 bg-danger/5">
        <div className="flex items-start gap-3">
          <div className="text-3xl">⚠️</div>
          <div>
            <h2 className="text-lg font-heading font-bold text-danger">Zona sudo</h2>
            <p className="text-sm text-text-muted mt-1">
              Las acciones aquí son <strong>irreversibles</strong> y pueden afectar la producción.
              Cada acción requiere confirmación por escrito.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ACTIONS.map((a) => (
          <div key={a.id} className="card">
            <h3 className="font-heading font-bold text-text-primary">{a.label}</h3>
            <p className="text-sm text-text-muted mt-1 mb-4">{a.description}</p>
            <button
              onClick={() => setPending(a)}
              className={
                a.variant === 'danger'
                  ? 'btn bg-danger text-white hover:bg-danger/90 text-sm'
                  : 'btn btn-outline text-sm'
              }
            >
              Ejecutar
            </button>
          </div>
        ))}
      </div>

      <ConfirmModal
        open={!!pending}
        title={pending?.label ?? ''}
        description={pending?.description}
        confirmLabel="Sí, ejecutar"
        cancelLabel="Cancelar"
        variant={pending?.variant ?? 'primary'}
        requireText={pending?.requireText}
        onConfirm={handleConfirm}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
