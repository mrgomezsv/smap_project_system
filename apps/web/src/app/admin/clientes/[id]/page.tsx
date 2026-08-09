'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/components/auth/AuthProvider';
import type { Client, ContractStatus } from '@/lib/types';

type Flash = { kind: 'success' | 'error'; message: string } | null;

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  SIGNED: 'Firmado',
  EXPIRED: 'Expirado',
  CANCELLED: 'Cancelado',
};

function statusBadge(status: string): string {
  switch (status.toUpperCase()) {
    case 'SIGNED':
      return 'bg-success/20 text-success border border-success/30';
    case 'PENDING':
      return 'bg-warning/20 text-warning border border-warning/30';
    case 'EXPIRED':
      return 'bg-text-muted/20 text-text-muted border border-border';
    case 'CANCELLED':
      return 'bg-danger/15 text-danger border border-danger/30';
    default:
      return 'bg-text-muted/15 text-text-muted border border-border';
  }
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 text-sm">
      <span className="text-xs font-semibold text-text-muted uppercase tracking-wider sm:w-40 shrink-0">
        {label}
      </span>
      <span className="text-text-primary break-words">{value || '—'}</span>
    </div>
  );
}

interface EditForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  cityStateZip: string;
  driverLicense: string;
  notes: string;
  isActive: boolean;
}

export default function AdminClienteDetallePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);
  const { getToken } = useAuth();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<Flash>(null);

  const load = useCallback(async () => {
    if (!Number.isFinite(id) || id <= 0) {
      setError('Identificador de cliente inválido.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<Client>(`/api/v2/clients/${id}`, { getToken });
      setClient(res);
      setForm({
        name: res.name ?? '',
        email: res.email ?? '',
        phone: res.phone ?? '',
        address: res.address ?? '',
        cityStateZip: res.cityStateZip ?? '',
        driverLicense: res.driverLicense ?? '',
        notes: res.notes ?? '',
        isActive: !!res.isActive,
      });
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else {
        setError('No se pudo cargar el cliente.');
      }
    } finally {
      setLoading(false);
    }
  }, [id, getToken]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!flash) return;
    const handle = setTimeout(() => setFlash(null), 4000);
    return () => clearTimeout(handle);
  }, [flash]);

  function setField<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    try {
      setSaving(true);
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        address: form.address || undefined,
        cityStateZip: form.cityStateZip || undefined,
        driverLicense: form.driverLicense || undefined,
        notes: form.notes || undefined,
        isActive: form.isActive,
      };
      await api.patch(`/api/v2/clients/${id}`, payload, { getToken });
      setFlash({ kind: 'success', message: 'Cliente actualizado.' });
      await load();
    } catch (e) {
      setFlash({
        kind: 'error',
        message: e instanceof ApiError ? e.message : 'No se pudo actualizar el cliente.',
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="card text-center py-12 text-text-muted">Cargando cliente…</div>;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="card border border-danger/30 bg-danger/5 text-danger text-sm p-4">
          ⚠ {error}
        </div>
        <Link href="/admin/clientes" className="btn btn-secondary text-sm inline-block">
          ← Volver al listado
        </Link>
      </div>
    );
  }

  if (!client || !form) {
    return <div className="card text-center py-12 text-text-muted">Sin datos.</div>;
  }

  const contracts = client.rentalContracts || [];
  const source = client.source;

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="text-xs text-text-muted">
            <Link href="/admin/clientes" className="hover:underline">← Clientes</Link>
            <span className="mx-1">/</span>
            <span className="font-mono">#{client.id}</span>
          </div>
          <h1 className="text-3xl font-heading font-extrabold text-text-primary">
            {client.name}
          </h1>
          <p className="text-text-muted text-sm mt-1">{client.email}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={[
              'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold',
              form.isActive
                ? 'bg-success/10 text-success border border-success/30'
                : 'bg-text-muted/15 text-text-muted border border-border',
            ].join(' ')}
          >
            {form.isActive ? 'Activo' : 'Inactivo'}
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-info/10 text-info border border-info/30">
            Origen: {source}
          </span>
        </div>
      </header>

      {flash ? (
        <div
          className={[
            'rounded-xl px-3 py-2 text-sm border',
            flash.kind === 'success'
              ? 'bg-success/10 text-success border-success/30'
              : 'bg-danger/10 text-danger border-danger/30',
          ].join(' ')}
        >
          {flash.message}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-2 space-y-2">
          <h2 className="font-heading font-bold text-text-primary text-lg">Datos del cliente</h2>
          <Row label="Email" value={client.email} />
          <Row label="Nombre" value={client.name} />
          {client.phone ? <Row label="Teléfono" value={client.phone} /> : null}
          {client.address ? <Row label="Dirección" value={client.address} /> : null}
          {client.cityStateZip ? (
            <Row label="Ciudad / Estado / Zip" value={client.cityStateZip} />
          ) : null}
          {client.driverLicense ? <Row label="Licencia" value={client.driverLicense} /> : null}
          {client.user ? (
            <div className="pt-2 mt-2 border-t border-border text-xs text-text-muted space-y-0.5">
              <div>
                Usuario app: <span className="font-mono">#{client.user.id}</span> ({client.user.email})
              </div>
            </div>
          ) : null}
        </div>

        <div className="card space-y-2">
          <h2 className="font-heading font-bold text-text-primary text-lg">Resumen</h2>
          <Row label="Registrado" value={new Date(client.createdAt).toLocaleDateString()} />
          <Row label="Actualizado" value={new Date(client.updatedAt).toLocaleDateString()} />
          <Row label="Contratos" value={String(client._count?.rentalContracts ?? 0)} />
          {client.notes ? (
            <div className="pt-2 mt-2 border-t border-border">
              <div className="text-xs uppercase text-text-muted font-semibold">Notas</div>
              <div className="text-sm whitespace-pre-wrap">{client.notes}</div>
            </div>
          ) : null}
        </div>
      </div>

      <section className="card space-y-3">
        <h2 className="font-heading font-bold text-text-primary text-lg">Editar cliente</h2>
        <form onSubmit={handleSave} className="space-y-3 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Nombre *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                className="input w-full text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Email *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                className="input w-full text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Teléfono</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value)}
                className="input w-full text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Licencia</label>
              <input
                type="text"
                value={form.driverLicense}
                onChange={(e) => setField('driverLicense', e.target.value)}
                className="input w-full text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold mb-1">Dirección</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setField('address', e.target.value)}
                className="input w-full text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Ciudad / Estado / Zip</label>
              <input
                type="text"
                value={form.cityStateZip}
                onChange={(e) => setField('cityStateZip', e.target.value)}
                className="input w-full text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold mb-1">Notas</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setField('notes', e.target.value)}
                className="input w-full text-sm"
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-2">
              <input
                id="isActive"
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setField('isActive', e.target.checked)}
                className="w-4 h-4 text-primary rounded border-border focus:ring-primary"
              />
              <label htmlFor="isActive" className="text-sm font-semibold text-text-primary">
                Cliente activo
              </label>
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="btn btn-primary text-sm">
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </section>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-bold text-text-primary text-lg">Contratos previos</h2>
          <Link href={`/admin/contratos?search=${encodeURIComponent(client.email)}`} className="text-xs text-primary hover:underline">
            Ver todos →
          </Link>
        </div>
        {contracts.length === 0 ? (
          <p className="text-text-muted text-sm">Este cliente aún no tiene contratos.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-elevated border-b border-border text-xs uppercase text-text-muted">
                <tr>
                  <th className="py-2 px-3">#</th>
                  <th className="py-2 px-3">Equipo</th>
                  <th className="py-2 px-3">Fecha evento</th>
                  <th className="py-2 px-3">Precio</th>
                  <th className="py-2 px-3">Estado</th>
                  <th className="py-2 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {contracts.map((c) => {
                  const status = (c.status as ContractStatus) ?? 'PENDING';
                  return (
                    <tr key={c.id}>
                      <td className="py-2 px-3 font-mono">#{c.id}</td>
                      <td className="py-2 px-3 font-medium">{c.equipment}</td>
                      <td className="py-2 px-3 text-text-muted">
                        {c.eventDate ? new Date(c.eventDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-2 px-3 font-mono">
                        {c.price != null ? `$${Number(c.price).toFixed(2)}` : '—'}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={[
                            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold',
                            statusBadge(status),
                          ].join(' ')}
                        >
                          {STATUS_LABELS[status] ?? status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <Link
                          href={`/admin/contratos/${c.id}`}
                          className="text-primary hover:underline text-xs font-semibold"
                        >
                          Expediente →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
