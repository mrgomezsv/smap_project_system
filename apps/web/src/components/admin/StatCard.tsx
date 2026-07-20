import { Sparkline } from '@/components/admin/Sparkline';

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: string;
  trend?: 'up' | 'down' | 'flat';
  sparkline?: number[];
  icon: string;
  color?: 'primary' | 'success' | 'warning' | 'info';
}

const COLORS = {
  primary: { bg: 'bg-primary/10', text: 'text-primary', spark: '#1e3a8a' },
  success: { bg: 'bg-success/10', text: 'text-success', spark: '#10b981' },
  warning: { bg: 'bg-warning/10', text: 'text-warning', spark: '#f59e0b' },
  info: { bg: 'bg-info/10', text: 'text-info', spark: '#3b82f6' },
};

export function StatCard({
  label,
  value,
  delta,
  trend = 'up',
  sparkline,
  icon,
  color = 'primary',
}: StatCardProps) {
  const palette = COLORS[color];
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
  const trendColor =
    trend === 'up' ? 'text-success' : trend === 'down' ? 'text-danger' : 'text-text-muted';

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${palette.bg} ${palette.text} flex items-center justify-center text-lg`}>
          {icon}
        </div>
        {sparkline && sparkline.length > 1 && (
          <Sparkline data={sparkline} color={palette.spark} />
        )}
      </div>
      <p className="text-sm text-text-muted">{label}</p>
      <p className="text-2xl md:text-3xl font-extrabold text-text-primary mt-1">{value}</p>
      {delta && (
        <p className={`text-xs font-medium mt-1 ${trendColor}`}>
          {trendIcon} {delta}
        </p>
      )}
    </div>
  );
}
