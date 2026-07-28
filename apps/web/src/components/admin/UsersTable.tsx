'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { api } from '@/lib/api';
import { getFirebaseAuth } from '@/lib/firebase';

interface AppUser {
  id: string;
  name: string;
  email: string;
  registeredAt: string;
  lastLogin: string;
  photoUrl?: string;
  disabled?: boolean;
}

export function UsersTable() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        setError('Debes iniciar sesión para ver esta lista.');
        return;
      }

      try {
        setLoading(true);
        const token = await user.getIdToken();
        const res = await api.get<{ users: AppUser[] }>('/api/auth/users', { token });
        setUsers(res.users);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Error al cargar usuarios de Firebase');
      } finally {
        setLoading(false);
      }
    });

    return unsub;
  }, []);

  const columns: Column<AppUser>[] = [
    {
      key: 'name',
      label: 'Usuario',
      render: (u) => (
        <div className="flex items-center gap-3">
          {u.photoUrl ? (
            <img src={u.photoUrl} alt={u.name} className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-brand-yellow text-white flex items-center justify-center font-bold text-sm">
              {u.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
            </div>
          )}
          <div>
            <p className="font-semibold text-text-primary text-sm">{u.name}</p>
            <p className="text-xs text-text-muted">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'registeredAt',
      label: 'Registrado',
      render: (u) => <span className="text-text-muted text-sm">{u.registeredAt}</span>,
    },
    {
      key: 'lastLogin',
      label: 'Último acceso',
      render: (u) => <span className="text-text-muted text-sm">{u.lastLogin}</span>,
    },
    {
      key: 'disabled',
      label: 'Estado',
      align: 'right',
      render: (u) => (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.disabled ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {u.disabled ? 'Inactivo' : 'Activo'}
        </span>
      ),
    },
  ];

  if (loading) {
    return <div className="p-8 text-center text-text-muted">Cargando usuarios de Firebase...</div>;
  }

  if (error) {
    return <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm mb-4">⚠ {error}</div>;
  }

  return (
    <DataTable
      rows={users}
      columns={columns}
      rowKey={(u) => u.id}
      emptyMessage="No hay usuarios registrados en Firebase Auth."
    />
  );
}
