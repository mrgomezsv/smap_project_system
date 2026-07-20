'use client';

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

const REVENUE_DATA = [
  { month: 'Ene', revenue: 4200 },
  { month: 'Feb', revenue: 5100 },
  { month: 'Mar', revenue: 6800 },
  { month: 'Abr', revenue: 5900 },
  { month: 'May', revenue: 7400 },
  { month: 'Jun', revenue: 8200 },
  { month: 'Jul', revenue: 9100 },
  { month: 'Ago', revenue: 8420 },
];

const TOP_PRODUCTS = [
  { name: 'Brincolín 3x3', ventas: 24 },
  { name: 'Tobogán doble', ventas: 18 },
  { name: 'Mesa + sillas', ventas: 15 },
  { name: 'Popcorn machine', ventas: 12 },
  { name: 'Pin pong', ventas: 9 },
];

const SOURCES = [
  { name: 'Directo', value: 45, color: '#1e3a8a' },
  { name: 'WhatsApp', value: 25, color: '#10b981' },
  { name: 'Instagram', value: 18, color: '#ec4899' },
  { name: 'Facebook', value: 12, color: '#f5a91b' },
];

const TREND_DATA = [
  { day: 'Lun', visits: 120, conversions: 8 },
  { day: 'Mar', visits: 145, conversions: 11 },
  { day: 'Mié', visits: 168, conversions: 14 },
  { day: 'Jue', visits: 142, conversions: 9 },
  { day: 'Vie', visits: 220, conversions: 22 },
  { day: 'Sáb', visits: 280, conversions: 31 },
  { day: 'Dom', visits: 195, conversions: 18 },
];

export function MetricsCharts() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue */}
        <div className="card">
          <h2 className="text-lg font-heading font-bold text-text-primary mb-1">
            Ingresos por mes
          </h2>
          <p className="text-sm text-text-muted mb-4">Últimos 8 meses</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={REVENUE_DATA}>
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  fontSize: 12,
                }}
                formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Ingresos']}
              />
              <Bar dataKey="revenue" fill="#1e3a8a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sources */}
        <div className="card">
          <h2 className="text-lg font-heading font-bold text-text-primary mb-1">
            Fuentes de tráfico
          </h2>
          <p className="text-sm text-text-muted mb-4">Últimos 30 días</p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={SOURCES}
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {SOURCES.map((s) => (
                  <Cell key={s.name} fill={s.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `${v}%`} />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top products */}
        <div className="card">
          <h2 className="text-lg font-heading font-bold text-text-primary mb-1">
            Top productos
          </h2>
          <p className="text-sm text-text-muted mb-4">Más reservados este mes</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={TOP_PRODUCTS} layout="vertical" margin={{ left: 80 }}>
              <XAxis type="number" stroke="#64748b" fontSize={12} />
              <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={12} width={80} />
              <Tooltip />
              <Bar dataKey="ventas" fill="#f5a91b" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Trend */}
        <div className="card">
          <h2 className="text-lg font-heading font-bold text-text-primary mb-1">
            Visitas vs conversiones
          </h2>
          <p className="text-sm text-text-muted mb-4">Últimos 7 días</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={TREND_DATA}>
              <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="visits"
                stroke="#1e3a8a"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="conversions"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
