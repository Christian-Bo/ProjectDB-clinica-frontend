'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';
import { consultasApi } from '@/lib/api/consultas';
import type { TicketDetail } from '@/lib/api/types';

const ESTADOS_VALIDOS = ['LLAMADO', 'EN_ATENCION'];

function EstadoBadge({ estado }: { estado: string }) {
  const map: Record<string, string> = {
    ESPERA: 'badge-warning',
    LLAMADO: 'badge-info',
    EN_ATENCION: 'badge-success',
    FINALIZADO: 'badge-neutral',
  };
  return <span className={`badge ${map[estado] ?? 'badge-neutral'}`}>{estado}</span>;
}

export default function AgendaPage() {
  const [tickets, setTickets] = useState<TicketDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<TicketDetail[]>('/api/tickets');
      const validos = res.data.filter((t) => ESTADOS_VALIDOS.includes(t.estado));

      // Filtrar tickets que ya tienen consulta asociada
      const sinConsulta: TicketDetail[] = [];
      await Promise.all(
        validos.map(async (ticket) => {
          try {
            // Intentar abrir con el ticketId — si ya existe consulta el SP devuelve 409
            // En su lugar verificamos buscando consultas existentes
            const consultaRes = await consultasApi.obtener(ticket.ticketId);
            if (!consultaRes.ok || !consultaRes.data) {
              // No tiene consulta asociada — mostrar en agenda
              sinConsulta.push(ticket);
            } else if (consultaRes.data.estado === 'ABIERTA') {
              // Tiene consulta ABIERTA — también mostrar para que el médico pueda continuar
              sinConsulta.push(ticket);
            }
            // Si está CERRADA — no mostrar en agenda
          } catch {
            // No encontró consulta — mostrar en agenda
            sinConsulta.push(ticket);
          }
        })
      );

      // Ordenar por ticketId descendente
      sinConsulta.sort((a, b) => b.ticketId - a.ticketId);
      setTickets(sinConsulta);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error cargando tickets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void cargar(); }, [cargar]);

  return (
    <>
      <div className="topbar">
        <div>
          <span className="eyebrow">Módulo 4</span>
          <h2>Agenda del día</h2>
          <p className="muted-text">Tickets pendientes de atención médica</p>
        </div>
        <button className="btn btn-secondary" onClick={() => void cargar()}>
          Actualizar
        </button>
      </div>

      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <span className="btn-spinner" style={{ display: 'inline-block', marginRight: 8 }} />
          Cargando agenda...
        </div>
      )}

      {error && (
        <div className="card" style={{ borderLeft: '4px solid var(--color-danger)', padding: '1rem 1.5rem' }}>
          <strong style={{ color: 'var(--color-danger)' }}>Error</strong>
          <p className="muted-text" style={{ margin: '4px 0 0' }}>{error}</p>
        </div>
      )}

      {!loading && !error && tickets.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>Sin tickets pendientes</h3>
          <p>No hay tickets pendientes de atención en este momento.</p>
        </div>
      )}

      {!loading && tickets.length > 0 && (
        <div className="stack-lg">
          {tickets.map((ticket) => (
            <div key={ticket.ticketId} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ display: 'grid', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <strong style={{ fontSize: '1.1rem' }}>#{ticket.numeroTicket}</strong>
                    <EstadoBadge estado={ticket.estado} />
                    {ticket.esEspecial && (
                      <span className="badge badge-warning">⭐ ESPECIAL</span>
                    )}
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 600 }}>{ticket.pacienteNombre}</div>
                  <div className="muted-text" style={{ fontSize: '0.85rem' }}>
                    {ticket.servicioNombre} · {ticket.consultorioNombre ?? 'Sin consultorio'} · {ticket.medicoNombre ?? 'Sin médico'}
                  </div>
                  {ticket.motivoEspecial && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-warning)' }}>
                      Motivo especial: {ticket.motivoEspecial}
                    </div>
                  )}
                </div>

                <Link
                  href={`/medico/consultas/${ticket.ticketId}/abrir`}
                  className="btn btn-primary"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  Abrir consulta
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
