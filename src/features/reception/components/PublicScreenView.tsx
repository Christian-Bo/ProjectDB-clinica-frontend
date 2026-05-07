'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueueDisplay } from '@/features/reception/hooks/useQueueDisplay';
import type { QueueTicketPreview } from '@/lib/api/types';

const PRIORIDAD_COLORS: Record<string, string> = {
  ESPECIAL:     '#ef4444',
  EMBARAZO:     '#f59e0b',
  DISCAPACIDAD: '#f59e0b',
  ANCIANO:      '#f59e0b',
  NORMAL:       'rgba(255,255,255,0.65)',
};

const getWindowLabel = (ticket?: QueueTicketPreview | null) =>
  ticket?.ventanillaNombre || ticket?.consultorioNombre || ticket?.servicioNombre || 'ventanilla asignada';

const getPatientName = (ticket?: QueueTicketPreview | null) =>
  ticket?.pacienteNombre?.trim() || 'Paciente N/A';

const speakTicket = (ticket: QueueTicketPreview) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  const message = `Turno ${ticket.numeroTicket}, paciente ${getPatientName(ticket)}, favor presentarse en ${getWindowLabel(ticket)}.`;
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.lang = 'es-GT';
  utterance.rate = 0.88;
  utterance.pitch = 1.08;
  utterance.volume = 1;

  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find((voice) =>
    /es/i.test(voice.lang) && /(female|mujer|mónica|monica|paulina|sofia|sofi|maria|google español|spanish)/i.test(voice.name),
  ) ?? voices.find((voice) => /es/i.test(voice.lang));

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
};

export function PublicScreenView({
  sedeId,
  servicioId,
  servicioIds,
}: {
  sedeId: number;
  servicioId?: number;
  servicioIds?: number[];
}) {
  const { queue, error } = useQueueDisplay(sedeId, servicioId, true, servicioIds);
  const [now, setNow] = useState(() => new Date());
  const lastSpokenTicketRef = useRef<string | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const subtitle = useMemo(() => {
    if (!queue) return 'Esperando datos de la cola…';
    const services = queue.serviciosNombre || queue.servicioNombre || 'Servicios seleccionados';
    return `${queue.sedeNombre} · ${services}`;
  }, [queue]);

  const ultimoLlamado = queue?.ultimoLlamado ?? queue?.actual ?? null;
  const ticketsLlamados = (queue?.ticketsLlamados?.length ? queue.ticketsLlamados : ultimoLlamado ? [ultimoLlamado] : [])
    .slice(0, 12);
  const ultimosCinco = (queue?.ultimosLlamados?.length ? queue.ultimosLlamados : queue?.proximos ?? [])
    .slice(0, 5);

  useEffect(() => {
    if (!ultimoLlamado?.ticketId) return;

    const spokenKey = `${ultimoLlamado.ticketId}-${ultimoLlamado.fechaReferencia ?? ''}`;
    if (lastSpokenTicketRef.current === spokenKey) return;

    lastSpokenTicketRef.current = spokenKey;
    speakTicket(ultimoLlamado);
  }, [ultimoLlamado]);

  return (
    <div className="public-page">
      <div className="public-page-content">
        <header className="public-page-header">
          <div>
            <span className="eyebrow light">Pantalla pública · Turnos llamados</span>
            <h1>{subtitle}</h1>
            <p>Solo se muestran pacientes llamados. La configuración está oculta para sala de espera.</p>
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

        <section className="public-focus-card public-focus-card-modern" aria-live="polite" aria-label="Último turno llamado">
          <span className="muted-text-light">📢 Último llamado</span>

          <div className="public-focus-grid">
            <div>
              <div className="public-focus-number">
                {ultimoLlamado?.numeroTicket ?? '—'}
              </div>
              <p className="public-ticket-label public-patient-label">
                {ultimoLlamado ? getPatientName(ultimoLlamado) : 'Esperando el siguiente llamado…'}
              </p>
            </div>

            <div className="public-window-box">
              <span>Presentarse en</span>
              <strong>{ultimoLlamado ? getWindowLabel(ultimoLlamado) : '—'}</strong>
              <small>{ultimoLlamado?.servicioNombre ?? 'Servicio pendiente'}</small>
            </div>
          </div>
        </section>

        <section aria-label="Tickets llamados">
          <div className="public-section-title-row">
            <p>Tickets llamados</p>
            <span>{ticketsLlamados.length} visibles</span>
          </div>

          <div className="public-called-grid">
            {ticketsLlamados.length === 0 ? (
              <article className="public-called-card public-called-empty">
                <strong>Sin llamados activos</strong>
                <span>Cuando un operador llame a un ticket aparecerá aquí.</span>
              </article>
            ) : (
              ticketsLlamados.map((item) => (
                <article key={item.ticketId} className="public-called-card">
                  <span className="public-called-ticket">{item.numeroTicket}</span>
                  <strong>{getPatientName(item)}</strong>
                  <small>{getWindowLabel(item)}</small>
                  {item.prioridad && item.prioridad !== 'NORMAL' && (
                    <em style={{ color: PRIORIDAD_COLORS[item.prioridad] ?? 'rgba(255,255,255,0.7)' }}>
                      ★ {item.prioridad}
                    </em>
                  )}
                </article>
              ))
            )}
          </div>
        </section>

        <section className="public-last-strip" aria-label="Últimos cinco llamados">
          <div className="public-section-title-row">
            <p>Últimos 5 llamados</p>
            <span>Historial reciente</span>
          </div>

          <div className="public-last-list">
            {ultimosCinco.length === 0 ? (
              <article className="public-last-item public-called-empty">
                <strong>Sin historial reciente</strong>
                <span>Los últimos llamados aparecerán al pie de la pantalla.</span>
              </article>
            ) : (
              ultimosCinco.map((item) => (
                <article key={`${item.ticketId}-${item.fechaReferencia ?? ''}`} className="public-last-item">
                  <strong>{item.numeroTicket}</strong>
                  <span>{getPatientName(item)}</span>
                  <small>{getWindowLabel(item)}</small>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
