'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useAuth } from '@/components/auth/AuthProvider';
import { api, ApiError } from '@/lib/api';
import type { MetricsResponse } from '@/lib/types';

type MetricsRange = '7d' | '30d' | '90d';

export function MetricsCharts() {
  const { user, ready } = useAuth();
  const [range, setRange] = useState<MetricsRange>('30d');
  const [data, setData] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !user) return;
    let active = true;

    async function loadMetrics() {
      try {
        setLoading(true);
        const token = await user!.getIdToken();
        const response = await api.get<MetricsResponse>(`/api/metrics?range=${range}`, {
          token,
        });
        if (active) {
          setData(response);
          setError(null);
        }
      } catch (requestError) {
        if (active) {
          setError(
            requestError instanceof ApiError
              ? requestError.message
              : 'No se pudieron cargar las métricas.',
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadMetrics();
    return () => {
      active = false;
    };
  }, [range, ready, user]);

  if (loading && !data) {
    return <div className="card text-center text-text-muted py-12">Cargando métricas reales…</div>;
  }

  if (error && !data) {
    return <div className="card border border-danger/30 text-danger">{error}</div>;
  }

  const metrics = data;
  if (!metrics) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-muted">Datos actualizados desde la base de datos</p>
        <div className="flex rounded-lg border border-gray-200 p-1">
          {(['7d', '30d', '90d'] as MetricsRange[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRange(option)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                range === option ? 'bg-primary text-white' : 'text-text-muted hover:bg-gray-100'
              }`}
            >
              {option === '7d' ? '7 días' : option === '30d' ? '30 días' : '90 días'}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="card border border-warning/30 text-warning">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card"><p className="text-sm text-text-muted">Waivers</p><p className="text-3xl font-bold">{metrics.totals.waivers}</p></div>
        <div className="card"><p className="text-sm text-text-muted">Likes</p><p className="text-3xl font-bold">{metrics.totals.likes}</p></div>
        <div className="card"><p className="text-sm text-text-muted">Comentarios</p><p className="text-3xl font-bold">{metrics.totals.comments}</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-heading font-bold text-text-primary mb-1">Waivers generados por mes</h2>
          <p className="text-sm text-text-muted mb-4">Últimos 8 meses</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={metrics.waiversByMonth}>
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
              <Tooltip formatter={(value) => [Number(value), 'Waivers']} />
              <Bar dataKey="waivers" fill="#1e3a8a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="text-lg font-heading font-bold text-text-primary mb-1">Estados de waivers</h2>
          <p className="text-sm text-text-muted mb-4">Periodo seleccionado</p>
          {metrics.waiverStatuses.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={metrics.waiverStatuses} innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {metrics.waiverStatuses.map((status) => <Cell key={status.name} fill={status.color} />)}
                </Pie>
                <Tooltip formatter={(value) => Number(value)} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-text-muted">Sin waivers en este periodo</div>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-heading font-bold text-text-primary mb-1">Top productos</h2>
          <p className="text-sm text-text-muted mb-4">Likes y comentarios acumulados</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={metrics.topProducts} layout="vertical" margin={{ left: 80 }}>
              <XAxis type="number" stroke="#64748b" fontSize={12} allowDecimals={false} />
              <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={12} width={80} />
              <Tooltip formatter={(value) => [Number(value), 'Interacciones']} />
              <Bar dataKey="interactions" fill="#f5a91b" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="text-lg font-heading font-bold text-text-primary mb-1">Actividad diaria</h2>
          <p className="text-sm text-text-muted mb-4">Periodo seleccionado</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={metrics.trend}>
              <XAxis dataKey="label" stroke="#64748b" fontSize={12} minTickGap={20} />
              <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" name="Likes" dataKey="likes" stroke="#1e3a8a" strokeWidth={2} dot={false} />
              <Line type="monotone" name="Comentarios" dataKey="comments" stroke="#f5a91b" strokeWidth={2} dot={false} />
              <Line type="monotone" name="Waivers" dataKey="waivers" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-heading font-bold text-text-primary">Operación y crecimiento</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card"><p className="text-sm text-text-muted">Usuarios nuevos</p><p className="text-2xl font-bold">{metrics.users.newInRange}</p><p className="text-xs text-text-muted">{metrics.users.active} activos de {metrics.users.total}</p></div>
          <div className="card"><p className="text-sm text-text-muted">Escaneos válidos</p><p className="text-2xl font-bold">{metrics.waiverOperations.scans}</p><p className="text-xs text-text-muted">{metrics.waiverOperations.uniqueScanned} waivers únicos</p></div>
          <div className="card"><p className="text-sm text-text-muted">Tasa de escaneo</p><p className="text-2xl font-bold">{metrics.waiverOperations.scanRate === null ? '—' : `${metrics.waiverOperations.scanRate}%`}</p><p className="text-xs text-text-muted">Waivers del periodo ya escaneados</p></div>
          <div className="card"><p className="text-sm text-text-muted">Personas registradas</p><p className="text-2xl font-bold">{metrics.waiverOperations.relatives}</p><p className="text-xs text-text-muted">Familiares agregados al waiver</p></div>
          <div className="card"><p className="text-sm text-text-muted">Eventos próximos</p><p className="text-2xl font-bold">{metrics.events.upcomingPublished}</p><p className="text-xs text-text-muted">Publicados desde hoy</p></div>
          <div className="card"><p className="text-sm text-text-muted">Contactos pendientes</p><p className="text-2xl font-bold">{metrics.communications.unreadContacts}</p><p className="text-xs text-text-muted">{metrics.communications.contacts} recibidos en el periodo</p></div>
          <div className="card"><p className="text-sm text-text-muted">Chats pendientes</p><p className="text-2xl font-bold">{metrics.communications.unreadChatMessages}</p><p className="text-xs text-text-muted">{metrics.communications.activeChatRooms} salas activas</p></div>
          <div className="card"><p className="text-sm text-text-muted">Catálogo publicado</p><p className="text-2xl font-bold">{metrics.catalog.publishedProducts}</p><p className="text-xs text-text-muted">de {metrics.catalog.totalProducts} productos</p></div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-heading font-bold text-text-primary mb-1">Comunicaciones</h2>
          <p className="text-sm text-text-muted mb-4">Contactos web y mensajes de chat</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={metrics.communications.trend}>
              <XAxis dataKey="label" stroke="#64748b" fontSize={12} minTickGap={20} />
              <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" name="Contactos" dataKey="contacts" stroke="#ec4899" strokeWidth={2} dot={false} />
              <Line type="monotone" name="Chat" dataKey="chats" stroke="#1e3a8a" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="text-lg font-heading font-bold text-text-primary mb-4">Eventos por partner</h2>
          <div className="space-y-3">
            {metrics.events.byPartner.length ? metrics.events.byPartner.map((partner) => (
              <div key={partner.name} className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-sm font-medium">{partner.name}</span>
                <span className="font-bold">{partner.events}</span>
              </div>
            )) : <p className="text-sm text-text-muted">Sin eventos programados en el periodo</p>}
          </div>
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="rounded-lg bg-gray-50 p-3"><p className="text-xs text-text-muted">Creados</p><p className="text-xl font-bold">{metrics.events.created}</p></div>
            <div className="rounded-lg bg-gray-50 p-3"><p className="text-xs text-text-muted">Programados</p><p className="text-xl font-bold">{metrics.events.scheduled}</p></div>
          </div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <h2 className="text-lg font-heading font-bold text-text-primary mb-4">Rendimiento por categoría</h2>
        <table className="w-full min-w-[560px] text-sm">
          <thead><tr className="border-b text-left text-text-muted"><th className="pb-3">Categoría</th><th className="pb-3 text-right">Productos</th><th className="pb-3 text-right">Publicados</th><th className="pb-3 text-right">Interacciones</th></tr></thead>
          <tbody>{metrics.catalog.categories.map((category) => (
            <tr key={category.category} className="border-b border-gray-100"><td className="py-3 font-medium">{category.category}</td><td className="py-3 text-right">{category.products}</td><td className="py-3 text-right">{category.published}</td><td className="py-3 text-right font-bold">{category.interactions}</td></tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
