import type { ReceptionOperationalSummary } from '@/lib/api/types';
import { Badge } from '@/shared/components/ui/Badge';
import { Card } from '@/shared/components/ui/Card';

export function OverviewCards({ summary }: { summary: ReceptionOperationalSummary }) {
  const items = [
    { title: 'En espera', value: summary.ticketsEnEspera, tone: 'info', hint: 'Pacientes pendientes de ser llamados' },
    { title: 'Llamados', value: summary.ticketsLlamados, tone: 'warning', hint: 'Tickets ya expuestos en pantalla publica' },
    { title: 'En atencion', value: summary.ticketsEnAtencion, tone: 'info', hint: 'Pacientes pasando por consulta o ventanilla' },
    { title: 'Finalizados', value: summary.ticketsFinalizados, tone: 'success', hint: 'Atenciones completadas en el turno actual' },
    { title: 'No-show', value: summary.ticketsNoShow, tone: 'danger', hint: 'Pacientes que no acudieron al llamado' },
    { title: 'Especiales hoy', value: summary.ticketsEspecialesHoy, tone: 'success', hint: 'Tickets con prioridad especial autorizada' },
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
          <p className="muted-text">{item.hint}</p>
        </Card>
      ))}
    </div>
  );
}
