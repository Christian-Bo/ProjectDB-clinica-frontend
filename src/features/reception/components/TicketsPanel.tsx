'use client';

import { useState } from 'react';
import type { TicketDetail } from '@/lib/api/types';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { EmptyState } from '@/shared/components/ui/EmptyState';

export function TicketsPanel({
  tickets,
  selectedTicket,
  onSelect,
  onFind,
}: {
  tickets: TicketDetail[];
  selectedTicket: TicketDetail | null;
  onSelect: (ticket: TicketDetail) => void;
  onFind: (reference: string) => void;
}) {
  const [reference, setReference] = useState('');

  return (
    <div className="content-grid-2">
      <Card className="stack-lg">
        <div className="section-heading-row">
          <div>
            <span className="eyebrow">Seguimiento</span>
            <h3>Tickets recientes</h3>
          </div>
          <span className="muted-text">{tickets.length} registros</span>
        </div>

        <div className="input-with-action">
          <input
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            placeholder="Busca por numero de ticket o id..."
          />
          <Button variant="secondary" onClick={() => onFind(reference)}>Buscar</Button>
        </div>

        <div className="tickets-list">
          {tickets.length === 0 ? (
            <EmptyState title="Sin tickets aun" description="Genera o llama tickets para verlos reflejados aqui con detalle enriquecido." />
          ) : (
            tickets.map((ticket) => (
              <button
                key={ticket.ticketId}
                type="button"
                className={`ticket-list-item ${selectedTicket?.ticketId === ticket.ticketId ? 'ticket-list-item-active' : ''}`}
                onClick={() => onSelect(ticket)}
              >
                <div>
                  <strong>{ticket.numeroTicket}</strong>
                  <span>{ticket.pacienteNombre}</span>
                </div>
                <div className="ticket-list-meta">
                  <small>{ticket.servicioNombre}</small>
                  <small>{ticket.estado}</small>
                </div>
              </button>
            ))
          )}
        </div>
      </Card>

      <Card className="stack-lg">
        <div>
          <span className="eyebrow">Detalle</span>
          <h3>Vista profesional del ticket</h3>
        </div>

        {!selectedTicket ? (
          <EmptyState title="Selecciona un ticket" description="Cuando elijas un registro, aqui veras nombres, contexto medico y tiempos operativos sin exponer ids innecesarios." />
        ) : (
          <div className="detail-grid">
            <div className="detail-item"><span>Numero</span><strong>{selectedTicket.numeroTicket}</strong></div>
            <div className="detail-item"><span>Estado</span><strong>{selectedTicket.estado}</strong></div>
            <div className="detail-item"><span>Prioridad</span><strong>{selectedTicket.prioridad}</strong></div>
            <div className="detail-item"><span>Paciente</span><strong>{selectedTicket.pacienteNombre}</strong></div>
            <div className="detail-item"><span>Sede</span><strong>{selectedTicket.sedeNombre}</strong></div>
            <div className="detail-item"><span>Servicio</span><strong>{selectedTicket.servicioNombre}</strong></div>
            <div className="detail-item"><span>Medico</span><strong>{selectedTicket.medicoNombre ?? 'Sin asignacion'}</strong></div>
            <div className="detail-item"><span>Consultorio</span><strong>{selectedTicket.consultorioNombre ?? 'Pendiente'}</strong></div>
            <div className="detail-item"><span>Generado</span><strong>{new Date(selectedTicket.fechaGeneracion).toLocaleString()}</strong></div>
            <div className="detail-item"><span>Llamados</span><strong>{selectedTicket.contadorLlamados}</strong></div>
          </div>
        )}
      </Card>
    </div>
  );
}
