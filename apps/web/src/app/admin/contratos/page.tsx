'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { CreateContractModal } from '@/components/admin/CreateContractModal';
import { useAuth } from '@/components/auth/AuthProvider';
import type { ContractStatus, ContractSummary } from '@/lib/types';

const STATUS_FILTERS: Array<{ value: 'ALL' | ContractStatus; label: string }> = [
  { value: 'ALL', label: 'Todos' },
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'SIGNED', label: 'Firmados' },
  { value: 'EXPIRED', label: 'Expirados' },
  { value: 'CANCELLED', label: 'Cancelados' },
];

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  if (normalized === 'SIGNED') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-success/20 text-success border border-success/30">
        ✓ Firmado
      </span>
    );
  }
  if (normalized === 'PENDING') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-warning/20 text-warning border border-warning/30">
        ⏳ Pendiente
      </span>
    );
  }
  if (normalized === 'EXPIRED') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-text-muted/20 text-text-muted border border-border">
        ⌛ Expirado
      </span>
    );
  }
  if (normalized === 'CANCELLED') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-danger/15 text-danger border border-danger/30">
        ✕ Cancelado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-text-muted/15 text-text-muted border border-border">
      {status}
    </span>
  );
}

export default function AdminContratosPage() {
  const { getToken } = useAuth();
  const [contracts, setContracts] = useState<ContractSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ContractStatus>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      const query = params.toString();
      const res = await api.get<{ items: ContractSummary[]; total: number }>(
        `/api/v2/contracts${query ? `?${query}` : ''}`,
        { getToken }
      );
      setContracts(res.items || []);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else {
        setError('Error al cargar contratos.');
      }
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    const handle = setTimeout(() => {
      fetchContracts();
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-text-primary">
            📄 Contratos Digitales de Renta
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Genera, envía y administra contratos de alquiler de inflables con firma electrónica.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary px-5 py-2.5 flex items-center gap-2 self-start sm:self-auto"
        >
          <span>➕</span> Crear Nuevo Contrato
        </button>
      </header>

      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <input
          type="text"
          placeholder="Buscar por cliente, email, equipo o token…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input max-w-md w-full text-sm"
        />
        <div className="flex items-center gap-1 flex-wrap">
          {STATUS_FILTERS.map((f) => {
            const active = statusFilter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={[
                  'px-3 py-1.5 rounded-lg text-xs font-semibold border transition',
                  active
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-text-muted border-border hover:bg-surface-elevated',
                ].join(' ')}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {error ? (
        <div className="card border border-danger/30 bg-danger/5 text-danger text-sm p-3">
          ⚠ {error}
        </div>
      ) : null}

      {loading ? (
        <div className="card text-center py-12 text-text-muted">Cargando contratos…</div>
      ) : contracts.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-3 opacity-40">📄</div>
          <h3 className="text-lg font-bold">No hay contratos que coincidan</h3>
          <p className="text-text-muted text-sm mb-4">
            {statusFilter === 'ALL' && !search.trim()
              ? 'Presiona el botón superior para enviar el primer contrato a un cliente.'
              : 'Prueba ajustando el filtro o la búsqueda.'}
          </p>
          {statusFilter === 'ALL' && !search.trim() ? (
            <button onClick={() => setIsModalOpen(true)} className="btn btn-primary text-sm">
              Crear Contrato
            </button>
          ) : null}
        </div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-surface-elevated border-b border-border text-xs font-semibold text-text-muted uppercase">
              <tr>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Equipo</th>
                <th className="py-3 px-4">Fecha Evento</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Creado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {contracts.map((c) => {
                const webBaseUrl =
                  typeof window !== 'undefined'
                    ? window.location.origin
                    : 'http://localhost:3000';
                const signUrl = `${webBaseUrl}/contrato/firmar/${c.token}`;
                const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
                const publicPdfUrl = `${apiBase}/api/v2/contracts/public/${c.token}/pdf`;
                const isPending = c.status === 'PENDING';
                const isSigned = c.status === 'SIGNED';

                return (
                  <tr key={c.id} className="hover:bg-surface-elevated/50 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-text-primary">{c.clientName}</div>
                      <div className="text-xs text-text-muted">{c.clientEmail}</div>
                      {c.clientPhone ? (
                        <div className="text-xs text-text-muted">{c.clientPhone}</div>
                      ) : null}
                    </td>
                    <td className="py-3 px-4 font-medium">{c.equipment}</td>
                    <td className="py-3 px-4 text-text-muted">
                      {c.eventDate ? new Date(c.eventDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="py-3 px-4 text-text-muted text-xs">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                      <Link
                        href={`/admin/contratos/${c.id}`}
                        className="px-3 py-1 bg-surface-elevated border border-border rounded-lg text-xs font-medium hover:bg-surface transition inline-block"
                        title="Ver expediente"
                      >
                        📂 Expediente
                      </Link>
                      {isPending ? (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(signUrl);
                          }}
                          className="px-3 py-1 bg-surface-elevated border border-border rounded-lg text-xs font-medium hover:bg-surface transition"
                          title="Copiar enlace de firma"
                        >
                          🔗 Enlace
                        </button>
                      ) : null}
                      {isSigned ? (
                        <a
                          href={publicPdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-600 transition inline-block"
                          title="PDF público"
                        >
                          📄 PDF
                        </a>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <CreateContractModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchContracts();
        }}
      />
    </div>
  );
}
