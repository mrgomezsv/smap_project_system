'use client';

import { useEffect, useState } from 'react';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { VirtualList } from '@/components/ui/VirtualList';
import { api, API_BASE_URL, ApiError } from '@/lib/api';
import { getFirebaseAuth } from '@/lib/firebase';
import type { Waiver } from '@/lib/types';

type Tab = 'active' | 'inactive' | 'all';
const VIRTUAL_THRESHOLD = 100;

export function WaiversTabs() {
  const [tab, setTab] = useState<Tab>('active');
  const [waivers, setWaivers] = useState<Waiver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const auth = getFirebaseAuth();
        const token = auth?.currentUser ? await auth.currentUser.getIdToken() : null;
        if (!token) {
          setError('Necesitas iniciar sesión para ver los waivers.');
          return;
        }
        const res = await api.get<{ waivers: Waiver[]; totalCount: number }>(
          `/api/v2/waiver/user/me`,
          { token },
        ).catch(async () => {
          // fallback: listar con status filter
          return api.get<{ waivers: Waiver[]; totalCount: number }>(
            `/api/v2/waiver/user/${auth!.currentUser!.uid}`,
            { token },
          );
        });
        if (!cancelled) setWaivers(res.waivers ?? []);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : 'Error al cargar waivers');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = waivers.filter((w) => {
    if (tab === 'all') return true;
    if (tab === 'active') return w.status === 'ACTIVE';
    return w.status === 'INACTIVE';
  });

  const counts = {
    all: waivers.length,
    active: waivers.filter((w) => w.status === 'ACTIVE').length,
    inactive: waivers.filter((w) => w.status === 'INACTIVE').length,
  };

  const columns: Column<Waiver>[] = [
    {
      key: 'qrCode',
      label: 'QR',
      render: (w) => (
        <code className="font-mono font-bold text-primary">{w.qrCode}</code>
      ),
    },
    {
      key: 'userName',
      label: 'Titular',
      render: (w) => <span className="font-semibold text-text-primary">{w.userName}</span>,
    },
    {
      key: 'userEmail',
      label: 'Email',
      render: (w) => <span className="text-text-muted">{w.userEmail}</span>,
    },
    {
      key: 'relatives',
      label: 'Acompañantes',
      align: 'right',
      render: (w) => <span className="font-semibold">{w.relatives?.length ?? 0}</span>,
    },
    {
      key: 'createdAt',
      label: 'Creado',
      render: (w) => (
        <span className="text-text-muted text-xs">
          {new Date(w.createdAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      render: (w) =>
        w.status === 'ACTIVE' ? (
          <span className="inline-flex items-center gap-1 bg-success/10 text-success text-xs font-semibold px-2 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-success rounded-full" />
            Activo
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 bg-gray-100 text-text-muted text-xs font-semibold px-2 py-1 rounded-full">
            Inactivo
          </span>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-border">
        {(['active', 'inactive', 'all'] as Tab[]).map((t) => {
          const labels: Record<Tab, string> = {
            active: `Activos (${counts.active})`,
            inactive: `Inactivos (${counts.inactive})`,
            all: `Todos (${counts.all})`,
          };
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={[
                'px-4 py-2 text-sm font-medium border-b-2 transition',
                tab === t
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-muted hover:text-text-primary',
              ].join(' ')}
            >
              {labels[t]}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg p-3">
          ⚠ {error}
        </div>
      )}

      {loading ? (
        <div className="card text-center py-12 text-text-muted">Cargando waivers…</div>
      ) : filtered.length > VIRTUAL_THRESHOLD ? (
        <div className="card p-0 overflow-hidden">
          <div className="grid grid-cols-[100px_1.5fr_2fr_80px_120px_120px_60px] gap-0 bg-surface border-b border-border text-xs font-semibold text-text-muted uppercase tracking-wider px-4 py-3">
            <div>QR</div>
            <div>Titular</div>
            <div>Email</div>
            <div className="text-right">Acomp.</div>
            <div>Creado</div>
            <div>Estado</div>
            <div></div>
          </div>
          <VirtualList
            items={filtered}
            rowHeight={56}
            renderRow={(w) => (
              <div className="grid grid-cols-[100px_1.5fr_2fr_80px_120px_120px_60px] gap-0 items-center px-4 border-b border-border h-14 hover:bg-surface transition">
                <code className="font-mono font-bold text-primary text-sm">{w.qrCode}</code>
                <span className="font-semibold text-text-primary text-sm truncate">
                  {w.userName}
                </span>
                <span className="text-text-muted text-sm truncate">{w.userEmail}</span>
                <span className="text-right font-semibold text-sm">
                  {w.relatives?.length ?? 0}
                </span>
                <span className="text-text-muted text-xs">
                  {new Date(w.createdAt).toLocaleString('es-ES', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </span>
                <span>
                  {w.status === 'ACTIVE' ? (
                    <span className="inline-flex items-center gap-1 bg-success/10 text-success text-xs font-semibold px-2 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 bg-success rounded-full" />
                      Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-gray-100 text-text-muted text-xs font-semibold px-2 py-1 rounded-full">
                      Inactivo
                    </span>
                  )}
                </span>
                <div className="flex items-center justify-end">
                  <a
                    href={`${API_BASE_URL}/api/v2/waiver/download/${w.qrCode}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-text-muted hover:text-primary p-1"
                    title="Descargar PDF"
                  >
                    📄
                  </a>
                </div>
              </div>
            )}
            emptyMessage="No hay waivers en esta categoría."
          />
        </div>
      ) : (
        <DataTable
          rows={filtered}
          columns={columns}
          rowKey={(w) => w.id}
          emptyMessage="No hay waivers en esta categoría."
          rowActions={(w) => (
            <a
              href={`${API_BASE_URL}/api/v2/waiver/download/${w.qrCode}`}
              target="_blank"
              rel="noreferrer"
              className="text-text-muted hover:text-primary p-1"
              title="Descargar PDF"
            >
              📄
            </a>
          )}
        />
      )}
    </div>
  );
}
