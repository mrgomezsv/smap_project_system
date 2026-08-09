'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';

interface ProductCommentItem {
  id: number;
  productId: number;
  userId?: string | null;
  userDisplayName?: string | null;
  comment: string;
  isApproved: boolean;
  createdAt: string;
  product?: {
    id: number;
    title: string;
    img: string;
  };
}

export default function AdminComentariosPage() {
  const { getToken } = useAuth();
  const [comments, setComments] = useState<ProductCommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [actionId, setActionId] = useState<number | null>(null);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.set('search', search);
      if (statusFilter !== 'all') query.set('status', statusFilter);

      const res = await api.get<{ items: ProductCommentItem[]; total: number }>(
        `/api/comments/all?${query.toString()}`,
        { getToken }
      );
      setComments(res.items || []);
    } catch (e) {
      console.error('Error cargando comentarios:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [search, statusFilter]);

  async function handleToggleApproval(id: number, currentApproved: boolean) {
    try {
      setActionId(id);
      await api.patch(`/api/comments/${id}/approval`, { isApproved: !currentApproved }, { getToken });
      setComments((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isApproved: !currentApproved } : c))
      );
    } catch (e) {
      alert('Error al cambiar el estado de aprobación.');
    } finally {
      setActionId(null);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Estás seguro de eliminar permanentemente este comentario?')) return;
    try {
      setActionId(id);
      await api.delete(`/api/comments/${id}`, { getToken });
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      alert('Error al eliminar el comentario.');
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-text-primary">
            💬 Moderación de Comentarios
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Revisa, aprueba, oculta o elimina los comentarios dejados por los usuarios en los productos.
          </p>
        </div>
      </header>

      {/* Filtros y Buscador */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <input
          type="text"
          placeholder="Buscar por usuario, producto o comentario..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input max-w-md w-full text-sm"
        />

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
          {(['all', 'approved', 'pending'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                statusFilter === filter
                  ? 'bg-primary text-white shadow-soft'
                  : 'bg-surface-elevated text-text-muted hover:text-text-primary border border-border'
              }`}
            >
              {filter === 'all' && 'Todos'}
              {filter === 'approved' && '🟢 Aprobados / Publicados'}
              {filter === 'pending' && '⏳ Ocultos / Pendientes'}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla / Lista de Comentarios */}
      {loading ? (
        <div className="card text-center py-12 text-text-muted">Cargando comentarios...</div>
      ) : comments.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-3 opacity-40">💬</div>
          <h3 className="text-lg font-bold">No hay comentarios encontrados</h3>
          <p className="text-text-muted text-sm">
            Los comentarios enviados por los clientes aparecerán aquí para tu revisión.
          </p>
        </div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-surface-elevated border-b border-border text-xs font-semibold text-text-muted uppercase">
              <tr>
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">Producto</th>
                <th className="py-3 px-4">Comentario</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {comments.map((item) => (
                <tr key={item.id} className="hover:bg-surface-elevated/50 transition">
                  <td className="py-3 px-4">
                    <div className="font-bold text-text-primary">
                      {item.userDisplayName || 'Usuario Anónimo'}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    {item.product ? (
                      <Link
                        href={`/productos/${item.product.id}`}
                        target="_blank"
                        className="font-medium text-primary hover:underline text-xs"
                      >
                        {item.product.title} ↗
                      </Link>
                    ) : (
                      <span className="text-text-muted text-xs">Producto #{item.productId}</span>
                    )}
                  </td>

                  <td className="py-3 px-4 max-w-xs md:max-w-md">
                    <p className="text-text-primary text-xs leading-relaxed line-clamp-3">
                      "{item.comment}"
                    </p>
                  </td>

                  <td className="py-3 px-4">
                    {item.isApproved ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-success/20 text-success border border-success/30">
                        🟢 Publicado
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-warning/20 text-warning border border-warning/30">
                        ⏳ Oculto
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-text-muted text-xs">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>

                  <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleApproval(item.id, item.isApproved)}
                      disabled={actionId === item.id}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition border ${
                        item.isApproved
                          ? 'bg-warning/10 text-warning border-warning/30 hover:bg-warning/20'
                          : 'bg-success/10 text-success border-success/30 hover:bg-success/20'
                      }`}
                    >
                      {item.isApproved ? '👁️ Ocultar' : '✓ Aprobar'}
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={actionId === item.id}
                      className="px-3 py-1 bg-danger/10 text-danger border border-danger/30 rounded-lg text-xs font-bold hover:bg-danger/20 transition"
                      title="Eliminar permanentemente"
                    >
                      🗑️ Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
