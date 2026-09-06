'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { api, ApiError } from '@/lib/api';
import { getPartnerDisplay, type Event } from '@/lib/types';
import { useAuth } from '@/components/auth/AuthProvider';

export default function AdminEventosPage() {
  const { getToken } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await api.get<{ items: Event[] }>('/api/events?take=100', { getToken });
        if (!cancelled) setEvents(res.items);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : 'Error al cargar eventos');
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

  const columns: Column<Event>[] = [
    {
      key: 'title',
      label: 'Evento',
      render: (e) => (
        <Link href={`/admin/eventos/${e.id}/editar`} className="font-semibold text-text-primary hover:text-primary">
          {e.title}
        </Link>
      ),
    },
    {
      key: 'startDatetime',
      label: 'Fecha',
      render: (e) => (
        <span className="text-text-muted">
          {new Date(e.startDatetime).toLocaleString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    { key: 'location', label: 'Ubicación', render: (e) => <span className="text-text-muted">{e.location}</span> },
    {
      key: 'partners',
      label: 'Organiza',
      render: (e) => (
        <span className="text-text-muted">
          {getPartnerDisplay(e.partners).label}
        </span>
      ),
    },
    {
      key: 'ticketPrice',
      label: 'Entrada',
      align: 'right',
      render: (e) => (
        <span className="font-semibold text-text-primary">
          ${Number(e.ticketPrice || 0).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'published',
      label: 'Estado',
      render: (e) =>
        e.published ? (
          <span className="inline-flex items-center gap-1 bg-success/10 text-success text-xs font-semibold px-2 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-success rounded-full" />
            Publicado
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 bg-gray-100 text-text-muted text-xs font-semibold px-2 py-1 rounded-full">
            Borrador
          </span>
        ),
    },
  ];

  return (
    <div>
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-text-primary">Eventos</h1>
          <p className="text-text-muted mt-1">{events.length} evento{events.length === 1 ? '' : 's'}</p>
        </div>
        <Link href="/admin/eventos/nuevo" className="btn btn-primary">
          + Crear evento
        </Link>
      </header>

      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg p-3 mb-4">
          ⚠ {error}
        </div>
      )}

      {loading ? (
        <div className="card text-center py-12 text-text-muted">Cargando eventos…</div>
      ) : (
        <DataTable
          rows={events}
          columns={columns}
          rowKey={(e) => e.id}
          emptyMessage="Aún no hay eventos creados."
          rowActions={(e) => (
            <div className="flex items-center justify-end gap-1">
              <Link
                href={`/eventos/${e.id}`}
                className="text-text-muted hover:text-primary p-1"
                title="Ver público"
                target="_blank"
              >
                👁
              </Link>
              <Link
                href={`/admin/eventos/${e.id}/editar`}
                className="text-text-muted hover:text-primary p-1"
                title="Editar"
              >
                ✏️
              </Link>
            </div>
          )}
        />
      )}
    </div>
  );
}
