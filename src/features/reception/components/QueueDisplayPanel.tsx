import Link from 'next/link';
import type { QueueDisplayResponse } from '@/lib/api/types';
import { Badge } from '@/shared/components/ui/Badge';
import { Card } from '@/shared/components/ui/Card';
import { EmptyState } from '@/shared/components/ui/EmptyState';

const PRIORIDAD_BADGE: Record<string, string> = {
  ESPECIAL:     'badge-danger',
  EMBARAZO:     'badge-warning',
  DISCAPACIDAD: 'badge-warning',
  ANCIANO:      'badge-warning',
  NORMAL:       'badge-info',
};

export function QueueDisplayPanel({
  queue,
  error,
}: {
  queue: QueueDisplayResponse | null;
  error?: string | null;
}) {
  const proximos = queue?.proximos ?? [];

  return (
    <Card className="stack-lg">
      <div className="section-heading-row">
        <div>
          <span className="eyebrow">Cola en tiempo real</span>
          <h3>Vista de pantalla pública</h3>
        </div>
        <Link
          href="/pantalla-publica"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary"
          style={{ fontSize: '0.82rem', minHeight: '36px' }}
        >
          📺 Abrir pantalla
        </Link>
      </div>

      {error ? (
        <div className="inline-alert inline-alert-error">⚠️ {error}</div>
      ) : null}

      {!queue ? (
        <EmptyState
          title="Sin datos de cola"
          description="Selecciona sede y servicio para ver la cola actual."
        />
      ) : (
        <>
          {/* Ticket actual */}
          <div className="public-screen-card">
            <div style={{ display: 'grid', gap: '6px' }}>
              <span className="muted-text-light" style={{ fontSize: '0.8rem' }}>
                📢 Turno siendo atendido ahora
              </span>
              <strong className="public-ticket-current">
                {queue.actual?.numeroTicket ?? '—'}
              </strong>
              <p>{queue.actual?.consultorioNombre ?? 'Esperando siguiente llamado'}</p>
            </div>
            <div className="stack-sm align-end">
              <Badge className="badge-teal">{queue.sedeNombre}</Badge>
              <Badge className="badge-success">{queue.servicioNombre}</Badge>
              {queue.actual?.prioridad && queue.actual.prioridad !== 'NORMAL' && (
                <Badge className={PRIORIDAD_BADGE[queue.actual.prioridad] ?? 'badge-neutral'}>
                  {queue.actual.prioridad}
                </Badge>
              )}
            </div>
          </div>

          {/* Próximos */}
          <div>
            <p className="muted-text" style={{ fontSize: '0.82rem', margin: '0 0 10px', fontWeight: 600 }}>
              Próximos en cola ({proximos.length})
            </p>
            {proximos.length === 0 ? (
              <EmptyState
                title="Sin tickets en espera"
                description="Cuando haya cola, los próximos tickets aparecerán aquí."
              />
            ) : (
              <div className="queue-next-grid">
                {proximos.map((item) => (
                  <div key={item.ticketId} className="queue-next-item">
                    <strong>{item.numeroTicket}</strong>
                    <span>{item.consultorioNombre ?? 'Pendiente de asignación'}</span>
                    {item.prioridad && item.prioridad !== 'NORMAL' && (
                      <Badge
                        className={PRIORIDAD_BADGE[item.prioridad] ?? 'badge-neutral'}
                        style={{ fontSize: '0.7rem', minHeight: '22px' }}
                      >
                        {item.prioridad}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
