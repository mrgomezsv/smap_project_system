'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { StatCard } from '@/components/admin/StatCard';
import { api, ApiError } from '@/lib/api';

interface Activity {
  id: string;
  type: 'waiver' | 'product' | 'event' | 'message' | 'chat';
  title: string;
  description: string;
  timestamp: string;
}

interface DashboardData {
  stats: {
    activeProducts: number;
    eventsCount: number;
    waiversToday: number;
    unreadMessages: number;
  };
  activity: Activity[];
}

const ICONS: Record<Activity['type'], { icon: string; bg: string; text: string }> = {
  waiver: { icon: '📋', bg: 'bg-success/10', text: 'text-success' },
  product: { icon: '🎪', bg: 'bg-primary/10', text: 'text-primary' },
  event: { icon: '🎉', bg: 'bg-party-pink/10', text: 'text-party-pink' },
  message: { icon: '✉️', bg: 'bg-info/10', text: 'text-info' },
  chat: { icon: '💬', bg: 'bg-warning/10', text: 'text-warning' },
};

export default function AdminDashboardPage() {
  const { user, getToken } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    async function loadStats() {
      try {
        setLoading(true);
        const token = await getToken();
        const res = await api.get<DashboardData>('/api/dashboard/stats', { token });
        if (isMounted) {
          setData(res);
          setError(null);
        }
      } catch (e: any) {
        if (isMounted) {
          if (e instanceof ApiError && e.status === 403) {
            setError(`Acceso restringido: El correo (${user?.email ?? 'desconocido'}) no tiene permisos de administrador.`);
          } else {
            setError(e instanceof ApiError ? e.message : 'Error al cargar datos del dashboard');
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadStats();

    return () => {
      isMounted = false;
    };
  }, [user, getToken]);

  if (loading) {
    return <div className="card text-center py-12 text-text-muted">Cargando métricas reales…</div>;
  }

  if (error) {
    return <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-semibold mb-6">⚠ {error}</div>;
  }

  const stats = data?.stats ?? { activeProducts: 0, eventsCount: 0, waiversToday: 0, unreadMessages: 0 };
  const activity = data?.activity ?? [];

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-heading font-extrabold text-text-primary">Dashboard</h1>
        <p className="text-text-muted mt-1">
          Resumen general de la actividad de Kidsfun en tiempo real
        </p>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Productos activos"
          value={String(stats.activeProducts)}
          delta="En catálogo público"
          trend="up"
          color="primary"
          icon="🎪"
        />
        <StatCard
          label="Eventos publicados"
          value={String(stats.eventsCount)}
          delta="Disponibles en sitio"
          trend="up"
          color="info"
          icon="🎉"
        />
        <StatCard
          label="Waivers registrados hoy"
          value={String(stats.waiversToday)}
          delta="Nuevos accesos"
          trend="up"
          color="success"
          icon="📋"
        />
        <StatCard
          label="Mensajes sin leer"
          value={String(stats.unreadMessages)}
          delta="Buzón de contacto"
          trend={stats.unreadMessages > 0 ? 'up' : 'down'}
          color="warning"
          icon="✉️"
        />
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Actividad reciente */}
        <section className="card lg:col-span-2">
          <header className="flex items-center justify-between mb-5 border-b border-border pb-3">
            <h2 className="text-lg font-heading font-bold text-text-primary">
              Actividad reciente real
            </h2>
          </header>
          {activity.length === 0 ? (
            <p className="text-sm text-text-muted py-6 text-center">No hay actividad reciente registrada.</p>
          ) : (
            <ol className="space-y-3">
              {activity.map((a) => {
                const meta = ICONS[a.type] || { icon: '📌', bg: 'bg-gray-100', text: 'text-gray-600' };
                return (
                  <li
                    key={a.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-surface transition border-b border-border/50 last:border-0"
                  >
                    <div
                      className={`w-9 h-9 shrink-0 rounded-full ${meta.bg} ${meta.text} flex items-center justify-center`}
                    >
                      {meta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text-primary text-sm">{a.title}</p>
                      <p className="text-text-muted text-sm truncate">{a.description}</p>
                    </div>
                    <span className="text-xs text-text-muted shrink-0">
                      {new Date(a.timestamp).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {/* Accesos rápidos */}
        <aside className="space-y-4">
          <div className="card">
            <h3 className="font-heading font-bold text-text-primary mb-3">Accesos rápidos</h3>
            <div className="space-y-2">
              <a
                href="/admin/productos/nuevo"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface transition"
              >
                <span className="w-9 h-9 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                  ➕
                </span>
                <div>
                  <p className="font-semibold text-text-primary text-sm">Crear producto</p>
                  <p className="text-xs text-text-muted">Publica algo nuevo</p>
                </div>
              </a>
              <a
                href="/admin/eventos/nuevo"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface transition"
              >
                <span className="w-9 h-9 bg-party-pink/10 text-party-pink rounded-lg flex items-center justify-center">
                  🎉
                </span>
                <div>
                  <p className="font-semibold text-text-primary text-sm">Crear evento</p>
                  <p className="text-xs text-text-muted">Programa un nuevo evento</p>
                </div>
              </a>
              <a
                href="/admin/waivers/escanear"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface transition"
              >
                <span className="w-9 h-9 bg-success/10 text-success rounded-lg flex items-center justify-center">
                  📷
                </span>
                <div>
                  <p className="font-semibold text-text-primary text-sm">Escanear QR</p>
                  <p className="text-xs text-text-muted">Validar entrada en puerta</p>
                </div>
              </a>
              <a
                href="/admin/notificaciones"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface transition"
              >
                <span className="w-9 h-9 bg-warning/10 text-warning rounded-lg flex items-center justify-center">
                  🔔
                </span>
                <div>
                  <p className="font-semibold text-text-primary text-sm">Enviar push</p>
                  <p className="text-xs text-text-muted">Notifica a tus usuarios</p>
                </div>
              </a>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-primary to-primary-700 text-white">
            <div className="text-2xl mb-2">📱</div>
            <h3 className="font-heading font-bold mb-1">App móvil</h3>
            <p className="text-white/80 text-sm mb-3">
              Promociona la app entre tus clientes.
            </p>
            <a
              href="/mobile-app"
              className="btn bg-white text-primary hover:bg-white/90 w-full text-sm"
            >
              Ver landing
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
