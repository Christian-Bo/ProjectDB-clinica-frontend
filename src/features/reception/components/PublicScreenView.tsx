'use client';

import { useMemo } from 'react';
import { useQueueDisplay } from '@/features/reception/hooks/useQueueDisplay';

export function PublicScreenView({ sedeId, servicioId }: { sedeId: number; servicioId: number }) {
  const { queue, error } = useQueueDisplay(sedeId, servicioId, true);

  const subtitle = useMemo(() => {
    if (!queue) return 'Esperando informacion de la cola...';
    return `${queue.sedeNombre} · ${queue.servicioNombre}`;
  }, [queue]);

  return (
    <div className="public-page">
      <div className="public-page-overlay" />
      <div className="public-page-content">
        <header className="public-page-header">
          <div>
            <span className="eyebrow light">Pantalla publica premium</span>
            <h1>{subtitle}</h1>
            <p>Vista pensada para monitor o television con actualizacion continua.</p>
          </div>
          <div className="clock-box">{new Date().toLocaleTimeString()}</div>
        </header>

        {error ? <div className="inline-alert inline-alert-warning">{error}</div> : null}

        <section className="public-focus-card">
          <span className="muted-text-light">Turno actual</span>
          <strong>{queue?.actual?.numeroTicket ?? '—'}</strong>
          <p>{queue?.actual?.consultorioNombre ?? 'Esperando siguiente llamado'}</p>
        </section>

        <section className="public-next-board">
          {(queue?.proximos ?? []).slice(0, 5).map((item) => (
            <article key={item.ticketId} className="public-next-ticket">
              <strong>{item.numeroTicket}</strong>
              <span>{item.consultorioNombre ?? 'Pendiente'}</span>
            </article>
          ))}
          {(!queue || queue.proximos.length === 0) ? (
            <article className="public-next-ticket public-next-empty">
              <strong>Sin cola</strong>
              <span>Los proximos tickets apareceran aqui.</span>
            </article>
          ) : null}
        </section>
      </div>
    </div>
  );
}
