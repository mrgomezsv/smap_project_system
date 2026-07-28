'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { api, ApiError } from '@/lib/api';
import { getFirebaseAuth } from '@/lib/firebase';

interface WebMessage {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  reason: string;
  createdAt: string;
  read?: boolean;
}

export function MessagesInbox() {
  const [messages, setMessages] = useState<WebMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; ids: number[] }>({
    open: false,
    ids: [],
  });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        setError('Debes iniciar sesión para ver los mensajes.');
        return;
      }

      try {
        setLoading(true);
        const token = await user.getIdToken();
        const res = await api.get<WebMessage[]>('/api/web-messages', { token });
        setMessages(res);
        setError(null);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Error al cargar mensajes');
      } finally {
        setLoading(false);
      }
    });

    return unsub;
  }, []);

  async function performDelete() {
    setDeleting(true);
    try {
      const auth = getFirebaseAuth();
      const token = auth?.currentUser ? await auth.currentUser.getIdToken() : null;
      const ids = confirmDelete.ids;
      if (ids.length === 1) {
        await api.delete(`/api/web-messages/${ids[0]}`, { token });
      } else {
        await api.post('/api/web-messages/delete-multiple', { ids }, { token });
      }
      setMessages((prev) => prev.filter((m) => !ids.includes(m.id)));
      setConfirmDelete({ open: false, ids: [] });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al eliminar');
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<WebMessage>[] = [
    {
      key: 'name',
      label: 'Remitente',
      render: (m) => (
        <div>
          <p className="font-semibold text-text-primary text-sm">
            {m.firstName} {m.lastName}
          </p>
          <p className="text-xs text-text-muted">{m.email}</p>
        </div>
      ),
    },
    {
      key: 'contactNumber',
      label: 'Teléfono',
      render: (m) => <span className="text-text-muted">{m.contactNumber}</span>,
    },
    {
      key: 'reason',
      label: 'Mensaje',
      render: (m) => (
        <p className="text-text-muted text-sm truncate max-w-md">{m.reason}</p>
      ),
    },
    {
      key: 'createdAt',
      label: 'Recibido',
      render: (m) => (
        <span className="text-xs text-text-muted">
          {new Date(m.createdAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg p-3">
          ⚠ {error}
        </div>
      )}

      {loading ? (
        <div className="card text-center py-12 text-text-muted">Cargando mensajes…</div>
      ) : (
        <DataTable
          rows={messages}
          columns={columns}
          rowKey={(m) => m.id}
          selectable
          emptyMessage="Bandeja vacía."
          bulkActions={(selected) => (
            <button
              onClick={() => setConfirmDelete({ open: true, ids: selected.map((m) => m.id) })}
              className="btn bg-danger text-white hover:bg-danger/90 text-sm py-1.5"
            >
              🗑 Eliminar {selected.length}
            </button>
          )}
          rowActions={(m) => (
            <button
              onClick={() => setConfirmDelete({ open: true, ids: [m.id] })}
              className="text-text-muted hover:text-danger p-1"
              title="Eliminar"
            >
              🗑
            </button>
          )}
        />
      )}

      <ConfirmModal
        open={confirmDelete.open}
        title={`¿Eliminar ${confirmDelete.ids.length} mensaje(s)?`}
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={performDelete}
        onCancel={() => setConfirmDelete({ open: false, ids: [] })}
      />
    </div>
  );
}
