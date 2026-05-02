'use client';

import { useState } from 'react';
import type { TicketDetail } from '@/lib/api/types';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { EmptyState } from '@/shared/components/ui/EmptyState';

const ESTADO_BADGE: Record<string, string> = {
  ESPERA:      'badge-info',
  LLAMADO:     'badge-warning',
  EN_ATENCION: 'badge-teal',
  FINALIZADO:  'badge-success',
  NO_SHOW:     'badge-danger',
  CANCELADO:   'badge-neutral',
};

const ESTADO_LABEL: Record<string, string> = {
  ESPERA:      'En espera',
  LLAMADO:     'Llamado',
  EN_ATENCION: 'En atención',
  FINALIZADO:  'Finalizado',
  NO_SHOW:     'No-show',
  CANCELADO:   'Cancelado',
};

export function TicketsPanel({
  tickets,
  selectedTicket,
  onSelect,
  onFind,
}: {
  tickets?: TicketDetail[];
  selectedTicket: TicketDetail | null;
  onSelect: (ticket: TicketDetail) => void;
  onFind: (reference: string) => void;
}) {
  const [reference, setReference] = useState('');
  const safeTickets = tickets ?? [];

  return (
    <div className="content-grid-2 align-start">
      {/* Lista de tickets */}
      <Card className="stack-lg">
        <div className="section-heading-row">
          <div>
            <span className="eyebrow">Seguimiento</span>
            <h3>Tickets recientes</h3>
          </div>
          <span className="muted-text" style={{ fontSize: '0.82rem', alignSelf: 'flex-end' }}>
            {safeTickets.length} registros
          </span>
        </div>

        {/* Búsqueda */}
        <div className="input-with-action">
          <input
            className="search-input"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onFind(reference)}
            placeholder="Busca por número o ID de ticket"
            aria-label="Buscar ticket por número o ID"
          />
          <Button variant="secondary" onClick={() => onFind(reference)} disabled={!reference.trim()}>
            Buscar
          </Button>
        </div>

        {/* Lista */}
        <div className="tickets-list" role="list" aria-label="Lista de tickets">
          {safeTickets.length === 0 ? (
            <EmptyState
              title="Sin tickets aún"
              description="Los tickets de hoy aparecerán aquí. Selecciona sede y servicio."
            />
          ) : (
            safeTickets.map((ticket) => (
              <button
                key={ticket.ticketId}
                type="button"
                role="listitem"
                className={`ticket-list-item ${
                  selectedTicket?.ticketId === ticket.ticketId ? 'ticket-list-item-active' : ''
                }`}
                onClick={() => onSelect(ticket)}
                aria-pressed={selectedTicket?.ticketId === ticket.ticketId}
                aria-label={`Ticket ${ticket.numeroTicket} — ${ticket.pacienteNombre} — ${ESTADO_LABEL[ticket.estado] ?? ticket.estado}`}
              >
                <div>
                  <strong>{ticket.numeroTicket}</strong>
                  <span>{ticket.pacienteNombre}</span>
                </div>
                <div className="ticket-list-meta">
                  <Badge className={ESTADO_BADGE[ticket.estado] ?? 'badge-neutral'} style={{ fontSize: '0.72rem' }}>
                    {ESTADO_LABEL[ticket.estado] ?? ticket.estado}
                  </Badge>
                  <small>{ticket.servicioNombre}</small>
                </div>
              </button>
            ))
          )}
        </div>
      </Card>

      {/* Detalle del ticket seleccionado */}
      <Card className="stack-lg">
        <div>
          <span className="eyebrow">Detalle</span>
          <h3>Ticket seleccionado</h3>
        </div>

        {!selectedTicket ? (
          <EmptyState
            title="Selecciona un ticket"
            description="Haz clic en cualquier ticket de la lista para ver su información completa."
          />
        ) : (
          <>
            {/* Header del ticket */}
            <div
              style={{
                padding: '16px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #0F4C5C, #185a6e)',
                color: '#ffffff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.72)', marginBottom: '4px' }}>
                  Número de ticket
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1 }}>
                  {selectedTicket.numeroTicket}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                <Badge className={ESTADO_BADGE[selectedTicket.estado] ?? 'badge-neutral'}>
                  {ESTADO_LABEL[selectedTicket.estado] ?? selectedTicket.estado}
                </Badge>
                {selectedTicket.esEspecial && (
                  <Badge className="badge-danger">⭐ ESPECIAL</Badge>
                )}
              </div>
            </div>

            {/* Grid de detalles */}
            <div className="detail-grid">
              {[
                { label: 'Paciente',     value: selectedTicket.pacienteNombre },
                { label: 'Expediente',   value: selectedTicket.numeroExpediente ?? 'Sin expediente' },
                { label: 'Sede',         value: selectedTicket.sedeNombre },
                { label: 'Servicio',     value: selectedTicket.servicioNombre },
                { label: 'Prioridad',    value: selectedTicket.prioridad },
                { label: 'Llamados',     value: String(selectedTicket.contadorLlamados) },
                { label: 'Médico',       value: selectedTicket.medicoNombre ?? 'Sin asignación' },
                { label: 'Consultorio',  value: selectedTicket.consultorioNombre ?? 'Pendiente' },
                { label: 'Generado',     value: new Date(selectedTicket.fechaGeneracion).toLocaleString('es-GT') },
                { label: 'Último llamado', value: selectedTicket.fechaLlamado
                    ? new Date(selectedTicket.fechaLlamado).toLocaleTimeString('es-GT')
                    : 'Sin llamar aún' },
              ].map(({ label, value }) => (
                <div key={label} className="detail-item">
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>

            {selectedTicket.motivoEspecial && (
              <div className="inline-alert inline-alert-warning">
                <strong>Motivo especial:</strong> {selectedTicket.motivoEspecial}
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
