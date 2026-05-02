'use client';

import { useMemo, useState } from 'react';
import { CallNextPanel } from '@/features/reception/components/CallNextPanel';
import { FiltersBar } from '@/features/reception/components/FiltersBar';
import { GenerateTicketModal } from '@/features/reception/components/GenerateTicketModal';
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
};

export function ReceptionDashboard({
  title = 'Gestión de tickets y cola',
  subtitle = 'Panel operativo para generar tickets, controlar la cola de atención y gestionar la pantalla pública de turnos.',
  eyebrow = 'Recepción clínica',
}: ReceptionDashboardProps) {
  const [modalOpen, setModalOpen] = useState(false);
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
            <Button onClick={() => setModalOpen(true)} disabled={!isOperating}>
              🎫 Generar ticket
            </Button>
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
            dashboard.loading.markInAttention ||
            dashboard.loading.finishTicket ||
            dashboard.loading.processNoShow
          }
          onCallNext={() => void dashboard.callNext()}
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
          <Button variant="secondary" onClick={() => setModalOpen(true)}>
            🎫 Generar ticket
          </Button>
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
      />

      <GenerateTicketModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        isLoading={
          dashboard.loading.generateTicket ||
          dashboard.loading.generateSpecialTicket ||
          dashboard.loading.patients ||
          dashboard.loading.appointments ||
          dashboard.loading.catalogosDependientes
        }
        filters={dashboard.filters}
        setFilters={dashboard.setFilters}
        sedes={dashboard.sedes}
        servicios={dashboard.servicios}
        priorityOptions={dashboard.prioridades}
        patientItems={dashboard.patients}
        appointmentItems={dashboard.appointments}
        selectedPatient={dashboard.selectedPatient}
        selectedAppointment={dashboard.selectedAppointment}
        onSelectPatient={dashboard.setSelectedPatient}
        onSelectAppointment={dashboard.setSelectedAppointment}
        onLoadPatients={dashboard.loadPatients}
        onLoadAppointments={dashboard.loadAppointments}
        onGenerate={(p) => dashboard.generateNormalTicket(p)}
        onGenerateSpecial={(r) => dashboard.generateSpecialTicket(r)}
      />
    </>
  );
}
