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
import { AppShell } from '@/shared/components/shell/AppShell';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';

export default function HomePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const dashboard = useDashboardData();
  const queue = useQueueDisplay(dashboard.filters.sedeId, dashboard.filters.servicioId, true);

  const activeFiltersLabel = useMemo(() => {
    const sede = dashboard.sedes.find((item) => item.id === dashboard.filters.sedeId)?.label;
    const servicio = dashboard.servicios.find((item) => item.id === dashboard.filters.servicioId)?.label;
    return [sede, servicio].filter(Boolean).join(' · ') || 'Selecciona sede y servicio';
  }, [dashboard.filters.sedeId, dashboard.filters.servicioId, dashboard.sedes, dashboard.servicios]);

  return (
    <AppShell>
      <section className="hero-banner">
        <div>
          <span className="eyebrow">Recepción clínica</span>
          <h1>Gestión de tickets y cola</h1>
          <p>Panel operativo para recepción, seguimiento y pantalla pública.</p>
          <div className="button-row-wrap">
            <Button onClick={() => setModalOpen(true)}>Generar ticket</Button>
            <Button variant="secondary" onClick={() => void dashboard.refreshDashboard()}>
              Actualizar
            </Button>
          </div>
        </div>

        <div className="hero-card side-highlight">
          <span className="muted-text-light">Contexto</span>
          <strong>{activeFiltersLabel}</strong>
          <p>Selecciona sede y servicio para operar sobre la cola actual.</p>
          <Badge className="badge-success">Activo</Badge>
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
          onMarkInAttention={(ticketId) => void dashboard.markInAttention(ticketId)}
          onFinish={(ticketId) => void dashboard.finishTicket(ticketId, 'Finalizado desde panel')}
          onProcessNoShow={() => void dashboard.processNoShow()}
        />

        <QueueDisplayPanel queue={queue.queue} error={queue.error} />
      </div>

      <Card className="stack-lg">
        <div className="section-heading-row">
          <div>
            <span className="eyebrow">Selección</span>
            <h3>Paciente y cita</h3>
          </div>
          <Button variant="secondary" onClick={() => setModalOpen(true)}>
            Abrir selector
          </Button>
        </div>

        <div className="selection-summary-grid">
          <div className="summary-chip-card">
            <span className="muted-text">Paciente</span>
            <strong>
              {dashboard.selectedPatient?.label ??
                dashboard.selectedAppointment?.pacienteNombre ??
                'Ninguno'}
            </strong>
          </div>

          <div className="summary-chip-card">
            <span className="muted-text">Cita</span>
            <strong>{dashboard.selectedAppointment?.label ?? 'Sin cita seleccionada'}</strong>
          </div>

          <div className="summary-chip-card">
            <span className="muted-text">Sede actual</span>
            <strong>
              {dashboard.sedes.find((item) => item.id === dashboard.filters.sedeId)?.label ?? 'Sin sede'}
            </strong>
          </div>

          <div className="summary-chip-card">
            <span className="muted-text">Servicio actual</span>
            <strong>
              {dashboard.servicios.find((item) => item.id === dashboard.filters.servicioId)?.label ?? 'Sin servicio'}
            </strong>
          </div>
        </div>
      </Card>

      <TicketsPanel
        tickets={dashboard.tickets}
        selectedTicket={dashboard.selectedTicket}
        onSelect={(ticket) => dashboard.setSelectedTicket(ticket)}
        onFind={(reference) => void dashboard.findTicket(reference)}
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
        onGenerate={(priority) => dashboard.generateNormalTicket(priority)}
        onGenerateSpecial={(reason) => dashboard.generateSpecialTicket(reason)}
      />
    </AppShell>
  );
}
