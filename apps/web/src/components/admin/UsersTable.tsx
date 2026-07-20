'use client';

import { DataTable, type Column } from '@/components/admin/DataTable';

interface AppUser {
  id: string;
  name: string;
  email: string;
  registeredAt: string;
  waivers: number;
  lastLogin: string;
}

const SAMPLE: AppUser[] = [
  { id: '1', name: 'María Pérez', email: 'maria@example.com', registeredAt: '2024-01-15', waivers: 3, lastLogin: 'Hace 2 horas' },
  { id: '2', name: 'Carlos López', email: 'carlos@example.com', registeredAt: '2024-02-20', waivers: 1, lastLogin: 'Ayer' },
  { id: '3', name: 'Ana Rodríguez', email: 'ana@example.com', registeredAt: '2024-03-10', waivers: 5, lastLogin: 'Hace 3 días' },
  { id: '4', name: 'Luis Martínez', email: 'luis@example.com', registeredAt: '2024-04-05', waivers: 0, lastLogin: 'Hace 1 semana' },
  { id: '5', name: 'Sofía García', email: 'sofia@example.com', registeredAt: '2024-05-12', waivers: 2, lastLogin: 'Hace 5 horas' },
];

export function UsersTable() {
  const columns: Column<AppUser>[] = [
    {
      key: 'name',
      label: 'Usuario',
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-brand-yellow text-white flex items-center justify-center font-bold text-sm">
            {u.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
          </div>
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
      render: (u) => <span className="text-text-muted">{u.registeredAt}</span>,
    },
    {
      key: 'waivers',
      label: 'Waivers',
      align: 'right',
      render: (u) => (
        <span className="font-semibold text-text-primary">{u.waivers}</span>
      ),
    },
    {
      key: 'lastLogin',
      label: 'Último acceso',
      render: (u) => <span className="text-text-muted text-sm">{u.lastLogin}</span>,
    },
  ];

  return (
    <DataTable
      rows={SAMPLE}
      columns={columns}
      rowKey={(u) => u.id}
      emptyMessage="No hay usuarios registrados."
    />
  );
}
