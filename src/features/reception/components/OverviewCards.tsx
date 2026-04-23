import type { ReceptionOperationalSummary } from '@/lib/api/types';
import { Badge } from '@/shared/components/ui/Badge';
import { Card } from '@/shared/components/ui/Card';

export function OverviewCards({ summary }: { summary: ReceptionOperationalSummary }) {
  const items = [
    { title: 'En espera', value: summary.ticketsEnEspera, tone: 'info' },
    { title: 'Llamados', value: summary.ticketsLlamados, tone: 'warning' },
    { title: 'En atención', value: summary.ticketsEnAtencion, tone: 'info' },
    { title: 'Finalizados', value: summary.ticketsFinalizados, tone: 'success' },
    { title: 'No-show', value: summary.ticketsNoShow, tone: 'danger' },
    { title: 'Especiales', value: summary.ticketsEspecialesHoy, tone: 'success' },
  ];

  return (
    <div className="stats-grid">
      {items.map((item) => (
        <Card key={item.title} className="stat-card">
          <div className="card-meta-row">
            <span className="muted-text">{item.title}</span>
            <Badge className={`badge-${item.tone}`}>{item.tone.toUpperCase()}</Badge>
          </div>
          <strong className="stat-value">{item.value}</strong>
        </Card>
      ))}
    </div>
  );
}
