'use client';

import { useEffect, useState } from 'react';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { VirtualList } from '@/components/ui/VirtualList';
import { api, API_BASE_URL, ApiError } from '@/lib/api';
import { getFirebaseAuth } from '@/lib/firebase';
import type { Waiver } from '@/lib/types';
import { WaiverWhatsAppModal } from './WaiverWhatsAppModal';

type Tab = 'active' | 'inactive' | 'all';
type Scope = 'mine' | 'global';
const VIRTUAL_THRESHOLD = 100;
const PAGE_SIZE = 100;

interface AllResponse {
  waivers: Waiver[];
  totalCount: number;
  hasMore: boolean;
  page: { take: number; skip: number };
}

export function WaiversTabs() {
  const [tab, setTab] = useState<Tab>('all');
  const [scope, setScope] = useState<Scope>('global');
  const [waivers, setWaivers] = useState<Waiver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalTotal, setGlobalTotal] = useState<number | null>(null);

  // Filtros
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal WhatsApp
  const [selectedWaiverForWa, setSelectedWaiverForWa] = useState<Waiver | null>(null);

  // Estado envío de email
  const [sendingEmailQr, setSendingEmailQr] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const auth = getFirebaseAuth();
        const token = auth?.currentUser ? await auth.currentUser.getIdToken() : null;
        if (!token) {
          setError('Necesitas iniciar sesión para ver los waivers.');
          setLoading(false);
          return;
        }
        const path =
          scope === 'mine'
            ? '/api/v2/waiver/user/me'
            : `/api/v2/waiver/all?take=${PAGE_SIZE}&skip=0`;
        const res = await api.get<{ waivers: Waiver[]; totalCount: number } | AllResponse>(
          path,
          { token },
        );
        if (cancelled) return;
        setWaivers(res.waivers ?? []);
        if (scope === 'global' && 'hasMore' in res) {
          setGlobalTotal(res.totalCount);
        } else {
          setGlobalTotal(null);
        }
      } catch (e) {
        if (!cancelled) {
          if (e instanceof ApiError && e.status === 403) {
            setError('Tu cuenta no tiene permisos para ver todos los waivers.');
          } else {
            setError(e instanceof ApiError ? e.message : 'Error al cargar waivers');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [scope]);

  const handleResendEmail = async (waiver: Waiver) => {
    try {
      setSendingEmailQr(waiver.qrCode);
      setNotification(null);
      const auth = getFirebaseAuth();
      const token = auth?.currentUser ? await auth.currentUser.getIdToken() : null;

      await api.post('/api/v2/waiver/resend-email', { qrCode: waiver.qrCode, lang: 'es' }, { token });
      setNotification({ type: 'success', message: `Waiver ${waiver.qrCode} reenviado a ${waiver.userEmail}` });
    } catch (e: any) {
      setNotification({ type: 'error', message: e.message || 'Error al reenviar el correo' });
    } finally {
      setSendingEmailQr(null);
    }
  };

  const filtered = waivers.filter((w) => {
    // Filtro Tab Status
    if (tab === 'active' && w.status !== 'ACTIVE') return false;
    if (tab === 'inactive' && w.status !== 'INACTIVE') return false;

    // Búsqueda por texto (Nombre, Email, QR)
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchName = w.userName?.toLowerCase().includes(q);
      const matchEmail = w.userEmail?.toLowerCase().includes(q);
      const matchQr = w.qrCode?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchQr) return false;
    }

    // Filtro por Fechas
    if (startDate) {
      const wDate = new Date(w.createdAt).getTime();
      const sDate = new Date(startDate).getTime();
      if (wDate < sDate) return false;
    }
    if (endDate) {
      const wDate = new Date(w.createdAt).getTime();
      const eDate = new Date(endDate).getTime() + 86399999; // incluir todo el día
      if (wDate > eDate) return false;
    }

    return true;
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
        <code className="font-mono font-bold text-primary text-sm">{w.qrCode}</code>
      ),
    },
    {
      key: 'userName',
      label: 'Titular',
      render: (w) => (
        <div>
          <span className="font-semibold text-text-primary text-sm block">{w.userName}</span>
          <span className="text-xs text-text-muted">{w.userEmail}</span>
        </div>
      ),
    },
    {
      key: 'relatives',
      label: 'Acompañantes',
      align: 'right',
      render: (w) => (
        <span className="font-semibold text-sm text-text-primary">
          {w.relatives?.length ?? 0}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Fecha Registro',
      render: (w) => (
        <span className="text-text-muted text-xs">
          {new Date(w.createdAt).toLocaleString('es-ES', {
            dateStyle: 'short',
            timeStyle: 'short',
          })}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      render: (w) => (
        w.status === 'ACTIVE' ? (
          <span className="inline-flex items-center gap-1 bg-success/10 text-success text-xs font-semibold px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-success rounded-full" />
            Activo
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 bg-gray-100 text-text-muted text-xs font-semibold px-2 py-0.5 rounded-full">
            Inactivo
          </span>
        )
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <WaiverWhatsAppModal
        isOpen={!!selectedWaiverForWa}
        onClose={() => setSelectedWaiverForWa(null)}
        waiver={selectedWaiverForWa}
      />

      {notification && (
        <div className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${notification.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="font-bold">✕</button>
        </div>
      )}

      {/* Selector Scope (Mis waivers vs Global) */}
      <div className="flex items-center justify-between border-b border-border pb-3 flex-wrap gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => setScope('global')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
              scope === 'global'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white text-text-muted hover:bg-gray-50 border border-border'
            }`}
          >
            Todos los Waivers (Admin)
          </button>
          <button
            onClick={() => setScope('mine')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
              scope === 'mine'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white text-text-muted hover:bg-gray-50 border border-border'
            }`}
          >
            Mis Waivers
          </button>
        </div>

        {/* Tabs Status */}
        <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
          <button
            onClick={() => setTab('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              tab === 'all' ? 'bg-white text-text-primary shadow-xs' : 'text-text-muted'
            }`}
          >
            Todos ({counts.all})
          </button>
          <button
            onClick={() => setTab('active')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              tab === 'active' ? 'bg-white text-text-primary shadow-xs' : 'text-text-muted'
            }`}
          >
            Activos ({counts.active})
          </button>
          <button
            onClick={() => setTab('inactive')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              tab === 'inactive' ? 'bg-white text-text-primary shadow-xs' : 'text-text-muted'
            }`}
          >
            Inactivos ({counts.inactive})
          </button>
        </div>
      </div>

      {/* Barra de Filtros Avanzada */}
      <div className="bg-white p-4 rounded-xl border border-border grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1">Buscar Titular / Email / QR</label>
          <input
            type="search"
            placeholder="Ej: Maria, maria@gmail.com, 690D8F41..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input w-full text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1">Fecha Inicial</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input w-full text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1">Fecha Final</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="input w-full text-sm"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-semibold">
          ⚠ {error}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-text-muted font-medium">Cargando lista de waivers...</div>
      ) : filtered.length >= VIRTUAL_THRESHOLD ? (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="grid grid-cols-[100px_1.5fr_120px_2fr_80px_120px_120px_100px] gap-0 items-center px-4 py-3 bg-surface border-b border-border text-xs font-bold text-text-muted uppercase">
            <div>QR</div>
            <div>Titular</div>
            <div>ID User</div>
            <div>Email</div>
            <div className="text-right">Acomp.</div>
            <div>Creado</div>
            <div>Estado</div>
            <div className="text-right">Acciones</div>
          </div>
          <VirtualList
            items={filtered}
            rowHeight={56}
            renderRow={(w) => (
              <div className="grid grid-cols-[100px_1.5fr_120px_2fr_80px_120px_120px_100px] gap-0 items-center px-4 border-b border-border h-14 hover:bg-surface transition">
                <code className="font-mono font-bold text-primary text-sm">{w.qrCode}</code>
                <span className="font-semibold text-text-primary text-sm truncate">
                  {w.userName}
                </span>
                <span className="text-text-muted text-xs font-mono truncate">{w.userId}</span>
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
                <div className="flex items-center justify-end gap-1.5">
                  <a
                    href={`${API_BASE_URL}/api/v2/waiver/download/${w.qrCode}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-text-primary hover:text-primary px-2 py-1 rounded-lg bg-gray-100 hover:bg-primary/10 transition"
                    title="Descargar PDF del Waiver"
                  >
                    <span>📄</span>
                    <span>Descargar PDF</span>
                  </a>
                  <button
                    onClick={() => handleResendEmail(w)}
                    disabled={sendingEmailQr === w.qrCode}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-text-primary hover:text-primary px-2 py-1 rounded-lg bg-gray-100 hover:bg-primary/10 transition disabled:opacity-50"
                    title="Reenviar Waiver por Correo Electrónico"
                  >
                    <span>✉️</span>
                    <span>Reenviar Email</span>
                  </button>
                  <button
                    onClick={() => setSelectedWaiverForWa(w)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-text-primary hover:text-emerald-700 px-2 py-1 rounded-lg bg-gray-100 hover:bg-emerald-50 transition"
                    title="Reenviar Waiver por WhatsApp"
                  >
                    <span>💬</span>
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            )}
            emptyMessage="No hay waivers que coincidan con la búsqueda."
          />
        </div>
      ) : (
        <DataTable
          rows={filtered}
          columns={columns}
          rowKey={(w) => w.id}
          emptyMessage="No hay waivers que coincidan con la búsqueda."
          rowActions={(w) => (
            <div className="flex items-center justify-end gap-1.5">
              <a
                href={`${API_BASE_URL}/api/v2/waiver/download/${w.qrCode}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-text-primary hover:text-primary px-2 py-1 rounded-lg bg-gray-100 hover:bg-primary/10 transition"
                title="Descargar PDF del Waiver"
              >
                <span>📄</span>
                <span>Descargar PDF</span>
              </a>
              <button
                onClick={() => handleResendEmail(w)}
                disabled={sendingEmailQr === w.qrCode}
                className="inline-flex items-center gap-1 text-xs font-semibold text-text-primary hover:text-primary px-2 py-1 rounded-lg bg-gray-100 hover:bg-primary/10 transition disabled:opacity-50"
                title="Reenviar Waiver por Correo Electrónico"
              >
                <span>✉️</span>
                <span>Reenviar Email</span>
              </button>
              <button
                onClick={() => setSelectedWaiverForWa(w)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-text-primary hover:text-emerald-700 px-2 py-1 rounded-lg bg-gray-100 hover:bg-emerald-50 transition"
                title="Reenviar Waiver por WhatsApp"
              >
                <span>💬</span>
                <span>WhatsApp</span>
              </button>
            </div>
          )}
        />
      )}

      {scope === 'global' && globalTotal !== null && waivers.length < globalTotal && (
        <p className="text-xs text-text-muted text-center">
          Mostrando {waivers.length} de {globalTotal} waivers totales
          (paginado a {PAGE_SIZE}).
        </p>
      )}
    </div>
  );
}
