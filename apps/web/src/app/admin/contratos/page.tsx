'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { CreateContractModal } from '@/components/admin/CreateContractModal';
import { useAuth } from '@/components/auth/AuthProvider';

interface RentalContract {
  id: number;
  token: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientAddress: string;
  equipment: string;
  eventDate?: string;
  price?: number;
  status: 'PENDING' | 'SIGNED' | 'EXPIRED' | 'CANCELLED';
  createdAt: string;
  signedAt?: string;
}

export default function AdminContratosPage() {
  const { getToken } = useAuth();
  const [contracts, setContracts] = useState<RentalContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.set('search', search);
      const res = await api.get<{ items: RentalContract[]; total: number }>(
        `/api/v2/contracts?${query.toString()}`,
        { getToken }
      );
      setContracts(res.items || []);
    } catch (e) {
      console.error('Error cargando contratos:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
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

      {/* Buscador */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Buscar por cliente, email o equipo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input max-w-md w-full text-sm"
        />
      </div>

      {/* Tabla de Contratos */}
      {loading ? (
        <div className="card text-center py-12 text-text-muted">Cargando contratos...</div>
      ) : contracts.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-3 opacity-40">📄</div>
          <h3 className="text-lg font-bold">No hay contratos creados</h3>
          <p className="text-text-muted text-sm mb-4">
            Presiona el botón superior para enviar el primer contrato a un cliente.
          </p>
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary text-sm">
            Crear Contrato
          </button>
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
                const isSigned = c.status === 'SIGNED';
                const webBaseUrl =
                  typeof window !== 'undefined'
                    ? window.location.origin
                    : 'http://localhost:3000';
                const signUrl = `${webBaseUrl}/contrato/firmar/${c.token}`;
                const pdfUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/v2/contracts/public/${c.token}/pdf`;

                return (
                  <tr key={c.id} className="hover:bg-surface-elevated/50 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-text-primary">{c.clientName}</div>
                      <div className="text-xs text-text-muted">{c.clientEmail}</div>
                      {c.clientPhone && <div className="text-xs text-text-muted">{c.clientPhone}</div>}
                    </td>
                    <td className="py-3 px-4 font-medium">{c.equipment}</td>
                    <td className="py-3 px-4 text-text-muted">
                      {c.eventDate
                        ? new Date(c.eventDate).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      {isSigned ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-success/20 text-success border border-success/30">
                          ✓ Firmado
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-warning/20 text-warning border border-warning/30">
                          ⏳ Pendiente
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-text-muted text-xs">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(signUrl);
                          alert('¡Enlace de firma copiado!');
                        }}
                        className="px-3 py-1 bg-surface-elevated border border-border rounded-lg text-xs font-medium hover:bg-surface transition"
                        title="Copiar Enlace de Firma"
                      >
                        🔗 Enlace
                      </button>

                      <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-600 transition inline-block"
                      >
                        📄 PDF
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal para Crear Contrato */}
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
