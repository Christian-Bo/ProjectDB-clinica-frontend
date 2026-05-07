'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { CallNextPanel } from '@/features/reception/components/CallNextPanel';
import { FiltersBar } from '@/features/reception/components/FiltersBar';
import { OverviewCards } from '@/features/reception/components/OverviewCards';
import { QueueDisplayPanel } from '@/features/reception/components/QueueDisplayPanel';
import { TicketsPanel } from '@/features/reception/components/TicketsPanel';
import { useDashboardData } from '@/features/reception/hooks/useDashboardData';
import { useQueueDisplay } from '@/features/reception/hooks/useQueueDisplay';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';

type ReceptionDashboardProps = {
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  showKioskShortcut?: boolean;
};

export function ReceptionDashboard({
  title = 'Gestión de tickets y cola',
  subtitle = 'Panel operativo para generar tickets, controlar la cola de atención y gestionar la pantalla pública de turnos.',
  eyebrow = 'Recepción clínica',
  showKioskShortcut = true,
}: ReceptionDashboardProps) {
  const dashboard = useDashboardData();
  const queue = useQueueDisplay(
    dashboard.filters.sedeId,
    dashboard.filters.servicioId,
    true,
  );

  const activeFiltersLabel = useMemo(() => {
    const sede = dashboard.sedes.find((s) => s.id === dashboard.filters.sedeId)?.label;
    const servicio = dashboard.servicios.find((s) => s.id === dashboard.filters.servicioId)?.label;
    return [sede, servicio].filter(Boolean).join(' · ') || 'Sin sede/servicio seleccionados';
  }, [dashboard.filters, dashboard.sedes, dashboard.servicios]);

  const isOperating = Boolean(dashboard.filters.sedeId && dashboard.filters.servicioId);

  return (
    <>
      <section className="hero-banner">
        <div style={{ display: 'grid', gap: '14px', alignContent: 'center' }}>
          <span className="eyebrow light">{eyebrow}</span>
          <h1 style={{ margin: 0, fontSize: '1.8rem' }}>{title}</h1>
          <p style={{ margin: 0, maxWidth: '520px' }}>{subtitle}</p>
          <div className="button-row-wrap">
            {showKioskShortcut && (
              <Link className="btn btn-primary" href="/recepcion/tickets">
                🎫 Abrir kiosco de tickets
              </Link>
            )}
            <Button
              variant="ghost"
              style={{
                background: 'rgba(255,255,255,0.14)',
                color: '#ffffff',
                borderColor: 'rgba(255,255,255,0.25)',
              }}
              onClick={() => void dashboard.refreshDashboard()}
            >
              🔄 Actualizar datos
            </Button>
          </div>
        </div>

        <div className="hero-card side-highlight">
          <span className="eyebrow light">Contexto activo</span>
          <strong style={{ fontSize: '1.05rem' }}>{activeFiltersLabel}</strong>
          <p>Selecciona sede y servicio para operar sobre la cola de atención.</p>
          <div>
            {isOperating
              ? <Badge className="badge-success">✅ Operativo</Badge>
              : <Badge className="badge-warning">⚠️ Configuración pendiente</Badge>}
          </div>
        </div>
      </section>

      <OverviewCards summary={dashboard.summary} />

      <FiltersBar
        filters={dashboard.filters}
        setFilters={dashboard.setFilters}
        sedes={dashboard.sedes}
        servicios={dashboard.servicios}
        estaciones={dashboard.estaciones}
      />

      <div className="content-grid-2 align-start">
        <CallNextPanel
          currentTicket={dashboard.selectedTicket}
          loading={
            dashboard.loading.callNext ||
            dashboard.loading.recallTicket ||
            dashboard.loading.markInAttention ||
            dashboard.loading.finishTicket ||
            dashboard.loading.cancelTicket ||
            dashboard.loading.processNoShow
          }
          onCallNext={() => void dashboard.callNext()}
          onRecall={(id) => void dashboard.recallTicket(id)}
          onMarkInAttention={(id) => void dashboard.markInAttention(id)}
          onFinish={(id) => void dashboard.finishTicket(id, 'Finalizado desde panel')}
          onProcessNoShow={() => void dashboard.processNoShow()}
        />
        <QueueDisplayPanel queue={queue.queue} error={queue.error} />
      </div>

      <Card className="stack-lg">
        <div className="section-heading-row">
          <div>
            <span className="eyebrow">Selección activa</span>
            <h3>Paciente y cita vinculada</h3>
          </div>
          {showKioskShortcut && (
            <Link className="btn btn-secondary" href="/recepcion/tickets">
              🎫 Ir al kiosco
            </Link>
          )}
        </div>
        <div className="selection-summary-grid">
          {[
            { label: 'Paciente', value: dashboard.selectedPatient?.label ?? dashboard.selectedAppointment?.pacienteNombre ?? 'Ninguno' },
            { label: 'Cita vinculada', value: dashboard.selectedAppointment?.label ?? 'Sin cita' },
            { label: 'Sede actual', value: dashboard.sedes.find((s) => s.id === dashboard.filters.sedeId)?.label ?? 'Sin sede' },
            { label: 'Servicio actual', value: dashboard.servicios.find((s) => s.id === dashboard.filters.servicioId)?.label ?? 'Sin servicio' },
          ].map(({ label, value }) => (
            <div key={label} className="summary-chip-card">
              <span className="muted-text">{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </Card>

      <TicketsPanel
        tickets={dashboard.tickets}
        selectedTicket={dashboard.selectedTicket}
        onSelect={(t) => dashboard.setSelectedTicket(t)}
        onFind={(ref) => void dashboard.findTicket(ref)}
        onCancel={(ticket) => void dashboard.cancelTicket(ticket.ticketId, 'Cancelado desde seguimiento')}
        onRecall={(ticket) => void dashboard.recallTicket(ticket.ticketId)}
        loadingCancel={dashboard.loading.cancelTicket}
        loadingRecall={dashboard.loading.recallTicket}
      />
    </>
  );
}
