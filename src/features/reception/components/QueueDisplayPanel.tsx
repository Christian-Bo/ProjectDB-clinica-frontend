import Link from 'next/link';
import type { QueueDisplayResponse } from '@/lib/api/types';
import { Badge } from '@/shared/components/ui/Badge';
import { Card } from '@/shared/components/ui/Card';
import { EmptyState } from '@/shared/components/ui/EmptyState';

export function QueueDisplayPanel({
  queue,
  error,
}: {
  queue: QueueDisplayResponse | null;
  error?: string | null;
}) {
  return (
    <Card className="stack-lg">
      <div className="section-heading-row">
        <div>
          <span className="eyebrow">Pantalla pública</span>
          <h3>Llamado en curso</h3>
        </div>
        <Link
          href="/pantalla-publica"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary"
        >
          Abrir pantalla pública
        </Link>
      </div>

      {error ? <div className="inline-alert inline-alert-warning">{error}</div> : null}

      {!queue ? (
        <EmptyState
          title="Selecciona sede y servicio"
          description="La pantalla pública necesita ambos filtros para mostrar la cola."
        />
      ) : (
        <>
          <div className="public-screen-card">
            <div>
              <span className="muted-text-light">Turno actual</span>
              <strong className="public-ticket-current">{queue.actual?.numeroTicket ?? '—'}</strong>
              <p>{queue.actual?.consultorioNombre ?? 'En espera de llamado'}</p>
            </div>
            <div className="stack-sm align-end">
              <Badge className="badge-info">{queue.sedeNombre}</Badge>
              <Badge className="badge-success">{queue.servicioNombre}</Badge>
            </div>
          </div>

          <div className="queue-next-grid">
            {queue.proximos.length === 0 ? (
              <EmptyState
                title="Sin próximos tickets"
                description="Cuando haya cola disponible, aparecerá aquí."
              />
            ) : (
              queue.proximos.map((item) => (
                <div key={item.ticketId} className="queue-next-item">
                  <strong>{item.numeroTicket}</strong>
                  <span>{item.consultorioNombre ?? 'Pendiente'}</span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </Card>
  );
}
