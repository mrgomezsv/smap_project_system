import { MetricsCharts } from '@/components/admin/MetricsCharts';

export const metadata = { title: 'Métricas - Admin' };

export default function MetricasPage() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-heading font-extrabold text-text-primary">Métricas</h1>
        <p className="text-text-muted mt-1">Análisis de rendimiento del negocio.</p>
      </header>
      <MetricsCharts />
    </div>
  );
}
