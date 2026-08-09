'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/components/auth/AuthProvider';
import type { Client, ClientsListResponse } from '@/lib/types';

const SOURCE_LABELS: Record<string, string> = {
  manual: 'Manual',
  auth: 'Auth / Firebase',
  contract: 'Contrato',
  google: 'Google',
};

function sourceLabel(value: string): string {
  return SOURCE_LABELS[value] ?? value;
}

function sourceBadgeClass(value: string): string {
  switch (value) {
    case 'manual':
      return 'bg-text-muted/10 text-text-muted border border-border';
    case 'auth':
    case 'google':
      return 'bg-info/10 text-info border border-info/30';
    case 'contract':
      return 'bg-primary/10 text-primary border border-primary/30';
    default:
      return 'bg-text-muted/10 text-text-muted border border-border';
  }
}

export default function AdminClientesPage() {
  const { getToken } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = async (term: string) => {
    try {
      setLoading(true);
      setError(null);
      const query = new URLSearchParams();
      if (term.trim()) query.set('search', term.trim());
      query.set('take', '50');
      const res = await api.get<ClientsListResponse>(
        `/api/v2/clients?${query.toString()}`,
        { getToken }
      );
      setClients(res.items || []);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else {
        setError('Error al cargar clientes.');
      }
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => load(search), 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-text-primary">
            👥 Clientes
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Perfiles unificados de clientes (registro manual, Firebase/Google y contratos).
          </p>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre, email o teléfono…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input max-w-md w-full text-sm"
        />
      </div>

      {error ? (
        <div className="card border border-danger/30 bg-danger/5 text-danger text-sm p-3">
          ⚠ {error}
        </div>
      ) : null}

      {loading ? (
        <div className="card text-center py-12 text-text-muted">Cargando clientes…</div>
      ) : clients.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-3 opacity-40">👥</div>
          <h3 className="text-lg font-bold">No hay clientes que coincidan</h3>
          <p className="text-text-muted text-sm">
            Los clientes se crean al enviar un contrato o al registrarse en la app.
          </p>
        </div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-surface-elevated border-b border-border text-xs font-semibold text-text-muted uppercase">
              <tr>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Origen</th>
                <th className="py-3 px-4">Registrado</th>
                <th className="py-3 px-4 text-center">Contratos</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clients.map((c) => {
                const contractsCount = c._count?.rentalContracts ?? 0;
                return (
                  <tr key={c.id} className="hover:bg-surface-elevated/50 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-text-primary">{c.name}</div>
                      <div className="text-xs text-text-muted">{c.email}</div>
                      {c.phone ? <div className="text-xs text-text-muted">📞 {c.phone}</div> : null}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={[
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
                          sourceBadgeClass(c.source),
                        ].join(' ')}
                      >
                        {sourceLabel(c.source)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-text-muted text-xs">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/30">
                        {contractsCount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/admin/clientes/${c.id}`}
                        className="px-3 py-1 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-600 transition inline-block"
                      >
                        Ver perfil
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
