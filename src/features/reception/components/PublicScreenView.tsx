'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQueueDisplay } from '@/features/reception/hooks/useQueueDisplay';

export function PublicScreenView({ sedeId, servicioId }: { sedeId: number; servicioId: number }) {
  const { queue, error } = useQueueDisplay(sedeId, servicioId, true);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const subtitle = useMemo(() => {
    if (!queue) {
      return 'Esperando información de la cola';
    }

    return `${queue.sedeNombre} · ${queue.servicioNombre}`;
  }, [queue]);

  return (
    <div className="public-page">
      <div className="public-page-overlay" />
      <div className="public-page-content">
        <header className="public-page-header">
          <div>
            <span className="eyebrow light">Pantalla pública</span>
            <h1>{subtitle}</h1>
            <p>Vista de turnos en tiempo real.</p>
          </div>
          <div className="clock-box">
            <div>{now.toLocaleDateString()}</div>
            <strong>{now.toLocaleTimeString()}</strong>
          </div>
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
              <span>Los próximos tickets aparecerán aquí.</span>
            </article>
          ) : null}
        </section>
      </div>
    </div>
  );
}
