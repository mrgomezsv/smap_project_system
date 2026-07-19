export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-heading font-bold text-text-primary">Dashboard</h1>
      <p className="text-text-muted mt-2">Panel de administración - Kidsfun</p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Productos activos', value: '—', delta: '+0%' },
          { label: 'Eventos próximos', value: '—', delta: '+0%' },
          { label: 'Waivers hoy', value: '—', delta: '+0%' },
          { label: 'Ingresos del mes', value: '—', delta: '+0%' },
        ].map((stat) => (
          <div key={stat.label} className="card">
            <p className="text-sm text-text-muted">{stat.label}</p>
            <p className="text-3xl font-bold text-text-primary mt-2">{stat.value}</p>
            <p className="text-xs text-success mt-1">{stat.delta}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 card">
        <h2 className="text-xl font-semibold mb-4">Bienvenido</h2>
        <p className="text-text-muted">
          Desde aquí podrás gestionar productos, eventos, waivers, chats y más.
          Usa el menú lateral para navegar.
        </p>
      </div>
    </div>
  );
}
