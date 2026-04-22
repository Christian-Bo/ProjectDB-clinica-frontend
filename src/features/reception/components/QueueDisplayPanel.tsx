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
          <span className="eyebrow">Pantalla publica</span>
          <h3>Visualizacion near real-time</h3>
        </div>
        <Link href="/pantalla-publica" target="_blank" className="btn btn-secondary">
          Abrir vista premium
        </Link>
      </div>

      {error ? <div className="inline-alert inline-alert-warning">{error}</div> : null}

      {!queue ? (
        <EmptyState
          title="Selecciona sede y servicio"
          description="La pantalla publica necesita estos filtros para mostrar el turno actual y los proximos tickets."
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
              <EmptyState title="Sin proximos tickets" description="Cuando el backend tenga cola disponible, aparecera aqui automaticamente." />
            ) : (
              queue.proximos.map((item) => (
                <div key={item.ticketId} className="queue-next-item">
                  <strong>{item.numeroTicket}</strong>
                  <span>{item.consultorioNombre ?? 'Pendiente de consultorio'}</span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </Card>
  );
}
