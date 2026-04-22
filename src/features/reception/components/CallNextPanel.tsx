'use client';

import type { TicketDetail } from '@/lib/api/types';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';

export function CallNextPanel({
  currentTicket,
  loading,
  onCallNext,
  onMarkInAttention,
  onFinish,
  onProcessNoShow,
}: {
  currentTicket: TicketDetail | null;
  loading?: boolean;
  onCallNext: () => void;
  onMarkInAttention: (ticketId: number) => void;
  onFinish: (ticketId: number) => void;
  onProcessNoShow: () => void;
}) {
  return (
    <Card className="stack-lg">
      <div className="section-heading-row">
        <div>
          <span className="eyebrow">Flujo operacional</span>
          <h3>Llamado y atencion del ticket</h3>
        </div>
        <Badge className="badge-info">Atomicidad y fairness</Badge>
      </div>

      <p className="muted-text">
        Desde aqui puedes llamar el siguiente ticket, pasarlo a atencion, finalizarlo o ejecutar el proceso de no-show.
        Todo se conecta a los stored procedures del backend ya desplegados.
      </p>

      <div className="button-row-wrap">
        <Button loading={loading} onClick={onCallNext}>Llamar siguiente ticket</Button>
        <Button variant="secondary" loading={loading} disabled={!currentTicket} onClick={() => currentTicket && onMarkInAttention(currentTicket.ticketId)}>
          Marcar en atencion
        </Button>
        <Button variant="ghost" loading={loading} disabled={!currentTicket} onClick={() => currentTicket && onFinish(currentTicket.ticketId)}>
          Finalizar ticket
        </Button>
        <Button variant="danger" loading={loading} onClick={onProcessNoShow}>
          Procesar no-show
        </Button>
      </div>

      <div className="highlight-panel">
        <div>
          <span className="muted-text">Ultimo ticket operativo</span>
          <strong className="hero-ticket">{currentTicket?.numeroTicket ?? '—'}</strong>
          <p>{currentTicket ? `${currentTicket.pacienteNombre} · ${currentTicket.servicioNombre}` : 'Todavia no has generado o llamado un ticket en esta sesion.'}</p>
        </div>
        <div className="stack-sm">
          <Badge className={`badge-${currentTicket?.estado?.toLowerCase().includes('final') ? 'success' : 'warning'}`}>
            {currentTicket?.estado ?? 'SIN TICKET'}
          </Badge>
          <Badge className={currentTicket?.esEspecial ? 'badge-danger' : 'badge-info'}>
            {currentTicket?.prioridad ?? 'NORMAL'}
          </Badge>
        </div>
      </div>
    </Card>
  );
}
