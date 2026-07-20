import { StatCard } from '@/components/admin/StatCard';

interface Activity {
  id: number;
  type: 'waiver' | 'product' | 'event' | 'message' | 'chat';
  title: string;
  description: string;
  timestamp: string;
}

const SAMPLE_ACTIVITY: Activity[] = [
  {
    id: 1,
    type: 'waiver',
    title: 'Nuevo waiver generado',
    description: 'QR ABC12345 para María Pérez',
    timestamp: 'Hace 5 min',
  },
  {
    id: 2,
    type: 'message',
    title: 'Mensaje recibido',
    description: 'Carlos López consultó sobre brincolines',
    timestamp: 'Hace 12 min',
  },
  {
    id: 3,
    type: 'event',
    title: 'Evento publicado',
    description: 'Gran Inauguración Miami',
    timestamp: 'Hace 1 hora',
  },
  {
    id: 4,
    type: 'product',
    title: 'Producto actualizado',
    description: 'Brincolín 3x3 — nuevo precio',
    timestamp: 'Hace 2 horas',
  },
  {
    id: 5,
    type: 'chat',
    title: 'Chat abierto',
    description: 'Ana Rodríguez preguntó por disponibilidad',
    timestamp: 'Hace 3 horas',
  },
];

const ICONS: Record<Activity['type'], { icon: string; bg: string; text: string }> = {
  waiver: { icon: '📋', bg: 'bg-success/10', text: 'text-success' },
  product: { icon: '🎪', bg: 'bg-primary/10', text: 'text-primary' },
  event: { icon: '🎉', bg: 'bg-party-pink/10', text: 'text-party-pink' },
  message: { icon: '✉️', bg: 'bg-info/10', text: 'text-info' },
  chat: { icon: '💬', bg: 'bg-warning/10', text: 'text-warning' },
};

export default function AdminDashboardPage() {
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-heading font-extrabold text-text-primary">Dashboard</h1>
        <p className="text-text-muted mt-1">
          Resumen general de la actividad de Kidsfun
        </p>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Productos activos"
          value="48"
          delta="+12% vs mes anterior"
          trend="up"
          color="primary"
          icon="🎪"
          sparkline={[10, 14, 12, 18, 22, 20, 28, 30, 32, 35, 38, 48]}
        />
        <StatCard
          label="Eventos próximos"
          value="6"
          delta="+2 este mes"
          trend="up"
          color="info"
          icon="🎉"
          sparkline={[2, 3, 3, 4, 4, 5, 5, 5, 6, 6, 6, 6]}
        />
        <StatCard
          label="Waivers hoy"
          value="14"
          delta="+3 vs ayer"
          trend="up"
          color="success"
          icon="📋"
          sparkline={[3, 5, 8, 6, 9, 11, 8, 10, 12, 9, 11, 14]}
        />
        <StatCard
          label="Ingresos del mes"
          value="$8,420"
          delta="+18% vs mes anterior"
          trend="up"
          color="warning"
          icon="💰"
          sparkline={[3, 4, 5, 4, 6, 5, 7, 6, 8, 7, 8, 9]}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Actividad reciente */}
        <section className="card lg:col-span-2">
          <header className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-heading font-bold text-text-primary">
              Actividad reciente
            </h2>
            <button className="text-sm text-primary hover:underline">Ver todo</button>
          </header>
          <ol className="space-y-3">
            {SAMPLE_ACTIVITY.map((a, i) => {
              const meta = ICONS[a.type];
              return (
                <li
                  key={a.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-surface transition"
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
                  <span className="text-xs text-text-muted shrink-0">{a.timestamp}</span>
                  {i < SAMPLE_ACTIVITY.length - 1 && (
                    <div className="absolute left-7 mt-9 w-px h-3 bg-border" style={{ display: 'none' }} />
                  )}
                </li>
              );
            })}
          </ol>
        </section>

        {/* Accesos rápidos */}
        <aside className="space-y-4">
          <div className="card">
            <h3 className="font-heading font-bold text-text-primary mb-3">Accesos rápidos</h3>
            <div className="space-y-2">
              <a
                href="/productos/nuevo"
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
                href="/eventos/nuevo"
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
                href="/waivers/escanear"
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
                href="/notificaciones"
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
