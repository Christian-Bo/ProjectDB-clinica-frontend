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
  const stateTone =
    currentTicket?.estado?.toLowerCase().includes('final') ? 'success' : 'warning';

  return (
    <Card className="stack-lg">
      <div className="section-heading-row">
        <div>
          <span className="eyebrow">Atención</span>
          <h3>Control del turno</h3>
        </div>
        <Badge className="badge-info">Cola activa</Badge>
      </div>

      <div className="button-row-wrap">
        <Button loading={loading} onClick={onCallNext}>
          Llamar siguiente
        </Button>
        <Button
          variant="secondary"
          loading={loading}
          disabled={!currentTicket}
          onClick={() => currentTicket && onMarkInAttention(currentTicket.ticketId)}
        >
          Marcar en atención
        </Button>
        <Button
          variant="ghost"
          loading={loading}
          disabled={!currentTicket}
          onClick={() => currentTicket && onFinish(currentTicket.ticketId)}
        >
          Finalizar
        </Button>
        <Button variant="danger" loading={loading} onClick={onProcessNoShow}>
          Procesar no-show
        </Button>
      </div>

      <div className="highlight-panel">
        <div>
          <span className="muted-text">Ticket actual</span>
          <strong className="hero-ticket">{currentTicket?.numeroTicket ?? '—'}</strong>
          <p>
            {currentTicket
              ? `${currentTicket.pacienteNombre} · ${currentTicket.servicioNombre}`
              : 'Aún no hay ticket seleccionado.'}
          </p>
        </div>
        <div className="stack-sm">
          <Badge className={`badge-${stateTone}`}>{currentTicket?.estado ?? 'SIN TICKET'}</Badge>
          <Badge className={currentTicket?.esEspecial ? 'badge-danger' : 'badge-info'}>
            {currentTicket?.prioridad ?? 'NORMAL'}
          </Badge>
        </div>
      </div>
    </Card>
  );
}
