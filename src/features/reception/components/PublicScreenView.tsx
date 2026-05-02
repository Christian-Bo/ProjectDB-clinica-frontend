'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQueueDisplay } from '@/features/reception/hooks/useQueueDisplay';

const PRIORIDAD_COLORS: Record<string, string> = {
  ESPECIAL:     '#ef4444',
  EMBARAZO:     '#f59e0b',
  DISCAPACIDAD: '#f59e0b',
  ANCIANO:      '#f59e0b',
  NORMAL:       'rgba(255,255,255,0.65)',
};

export function PublicScreenView({
  sedeId,
  servicioId,
}: {
  sedeId: number;
  servicioId: number;
}) {
  const { queue, error } = useQueueDisplay(sedeId, servicioId, true);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const subtitle = useMemo(() => {
    if (!queue) return 'Esperando datos de la cola…';
    return `${queue.sedeNombre} · ${queue.servicioNombre}`;
  }, [queue]);

  const proximos = queue?.proximos ?? [];

  return (
    <div className="public-page">
      <div className="public-page-content">
        {/* Header */}
        <header className="public-page-header">
          <div>
            <span className="eyebrow light">Pantalla pública · Turnos en tiempo real</span>
            <h1>{subtitle}</h1>
            <p>Actualización automática cada 15 segundos.</p>
          </div>

          <div className="clock-box">
            <div>
              {now.toLocaleDateString('es-GT', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </div>
            <strong>
              {now.toLocaleTimeString('es-GT', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </strong>
          </div>
        </header>

        {error && (
          <div className="inline-alert inline-alert-warning">
            ⚠️ {error}
          </div>
        )}

        {/* Ticket actual — foco principal */}
        <section
          className="public-focus-card"
          aria-live="polite"
          aria-label="Turno actual"
        >
          <span className="muted-text-light">📢 Turno siendo atendido ahora</span>

          <div className="public-focus-number">
            {queue?.actual?.numeroTicket ?? '—'}
          </div>

          <p className="public-ticket-label">
            {queue?.actual
              ? `Consultorio: ${queue.actual.consultorioNombre ?? 'Sin asignación'}`
              : 'Esperando el siguiente llamado…'}
          </p>
        </section>

        {/* Próximos en cola */}
        <section aria-label="Próximos tickets en cola">
          <p
            style={{
              margin: '0 0 16px',
              color: 'rgba(255,255,255,0.72)',
              fontWeight: 700,
              fontSize: '0.9rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            Próximos en cola
          </p>

          <div className="public-next-board">
            {proximos.length === 0 ? (
              <article
                className="public-next-ticket"
                style={{ gridColumn: '1 / -1', opacity: 0.6 }}
              >
                <strong style={{ fontSize: '1.2rem' }}>Sin espera</strong>
                <span>Los próximos tickets aparecerán aquí.</span>
              </article>
            ) : (
              proximos.slice(0, 5).map((item) => (
                <article key={item.ticketId} className="public-next-ticket">
                  <strong>{item.numeroTicket}</strong>
                  <span>{item.consultorioNombre ?? 'Pendiente'}</span>
                  {item.prioridad && item.prioridad !== 'NORMAL' && (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        color: PRIORIDAD_COLORS[item.prioridad] ?? 'rgba(255,255,255,0.7)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}
                    >
                      ★ {item.prioridad}
                    </span>
                  )}
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
