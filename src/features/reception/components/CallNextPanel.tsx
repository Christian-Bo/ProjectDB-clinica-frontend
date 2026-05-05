'use client';

import type { TicketDetail } from '@/lib/api/types';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';

const ESTADO_BADGE: Record<string, string> = {
  ESPERA:      'badge-info',
  LLAMADO:     'badge-warning',
  EN_ATENCION: 'badge-teal',
  FINALIZADO:  'badge-success',
  NO_SHOW:     'badge-danger',
  CANCELADO:   'badge-neutral',
};

const PRIORIDAD_BADGE: Record<string, string> = {
  ESPECIAL:     'badge-danger',
  EMBARAZO:     'badge-warning',
  DISCAPACIDAD: 'badge-warning',
  ANCIANO:      'badge-warning',
  NORMAL:       'badge-info',
};

export function CallNextPanel({
  currentTicket,
  loading,
  onCallNext,
  onRecall,
  onMarkInAttention,
  onFinish,
  onProcessNoShow,
}: {
  currentTicket: TicketDetail | null;
  loading?: boolean;
  onCallNext: () => void;
  onRecall: (ticketId: number) => void;
  onMarkInAttention: (ticketId: number) => void;
  onFinish: (ticketId: number) => void;
  onProcessNoShow: () => void;
}) {
  const estadoBadge   = currentTicket ? (ESTADO_BADGE[currentTicket.estado]   ?? 'badge-neutral') : 'badge-neutral';
  const prioridadBadge = currentTicket ? (PRIORIDAD_BADGE[currentTicket.prioridad] ?? 'badge-info') : 'badge-info';

  const canRecall          = currentTicket?.estado === 'LLAMADO';
  const canMarkInAttention = currentTicket?.estado === 'LLAMADO';
  const canFinish          = currentTicket?.estado === 'EN_ATENCION' || currentTicket?.estado === 'LLAMADO';

  return (
    <Card className="stack-lg">
      <div className="section-heading-row">
        <div>
          <span className="eyebrow">Atención</span>
          <h3>Control del turno</h3>
        </div>
        <Badge className="badge-teal">Cola activa</Badge>
      </div>

      {/* Action buttons */}
      <div className="button-row-wrap">
        <Button loading={loading} onClick={onCallNext} title="Llama al siguiente ticket de la cola">
          📢 Llamar siguiente
        </Button>
        <Button
          variant="secondary"
          loading={loading}
          disabled={!canRecall}
          onClick={() => currentTicket && onRecall(currentTicket.ticketId)}
          title={!canRecall ? 'Solo disponible cuando el ticket está LLAMADO' : 'Repetir el llamado del ticket actual'}
        >
          📣 Volver a llamar
        </Button>
        <Button
          variant="secondary"
          loading={loading}
          disabled={!canMarkInAttention}
          onClick={() => currentTicket && onMarkInAttention(currentTicket.ticketId)}
          title={!canMarkInAttention ? 'Solo disponible cuando el ticket está LLAMADO' : 'Marcar que el paciente llegó'}
        >
          🩺 En atención
        </Button>
        <Button
          variant="ghost"
          loading={loading}
          disabled={!canFinish}
          onClick={() => currentTicket && onFinish(currentTicket.ticketId)}
          title={!canFinish ? 'Solo disponible en atención o llamado' : 'Finalizar la atención'}
        >
          ✅ Finalizar
        </Button>
        <Button
          variant="danger"
          loading={loading}
          onClick={onProcessNoShow}
          title="Marca como no-show los tickets llamados que no se presentaron"
        >
          ❌ Procesar no-show
        </Button>
      </div>

      {/* Current ticket panel */}
      <div className="highlight-panel">
        <div style={{ display: 'grid', gap: '6px' }}>
          <span className="muted-text" style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.72)' }}>
            Ticket actual
          </span>
          <strong className="hero-ticket">
            {currentTicket?.numeroTicket ?? '—'}
          </strong>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.82)' }}>
            {currentTicket
              ? `${currentTicket.pacienteNombre} · ${currentTicket.servicioNombre}`
              : 'Ningún ticket seleccionado aún.'}
          </p>
          {(currentTicket?.ventanillaNombre || currentTicket?.consultorioNombre) && (
            <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.72)' }}>
              📍 {currentTicket.ventanillaNombre ?? currentTicket.consultorioNombre}
            </span>
          )}
        </div>

        <div className="stack-sm align-end">
          <Badge className={estadoBadge}>
            {currentTicket?.estado ?? 'SIN TICKET'}
          </Badge>
          <Badge className={prioridadBadge}>
            {currentTicket?.prioridad ?? 'NORMAL'}
          </Badge>
          {currentTicket?.esEspecial && (
            <Badge className="badge-danger">⭐ ESPECIAL</Badge>
          )}
        </div>
      </div>

      {/* Motivo especial si existe */}
      {currentTicket?.motivoEspecial && (
        <div className="inline-alert inline-alert-warning">
          <strong>Motivo especial:</strong> {currentTicket.motivoEspecial}
        </div>
      )}
    </Card>
  );
}
