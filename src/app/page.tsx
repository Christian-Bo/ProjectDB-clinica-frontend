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
<<<<<<< HEAD
    <main>
      <h1>Bienvenido a Clinica prueba</h1>
    </main>
=======
    <AppShell>
      <section className="hero-banner">
        <div>
          <span className="eyebrow">Experiencia clinica premium</span>
          <h1>Recepcion eficiente, clara y lista para produccion.</h1>
          <p>
            Este frontend consume tu backend en Railway, usa una paleta unificada reutilizable y muestra informacion
            entendible para el usuario, priorizando nombres, contexto y acciones claras por encima de ids tecnicos.
          </p>
          <div className="button-row-wrap">
            <Button onClick={() => setModalOpen(true)}>Generar ticket</Button>
            <Button variant="secondary" onClick={() => dashboard.refreshDashboard()}>Actualizar dashboard</Button>
          </div>
        </div>
        <div className="hero-card side-highlight">
          <span className="muted-text-light">Contexto actual</span>
          <strong>{activeFiltersLabel}</strong>
          <p>La interfaz trabaja sobre el contexto seleccionado y actualiza automaticamente resumen, cola y tickets.</p>
          <Badge className="badge-success">Conectado a Railway</Badge>
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
          loading={dashboard.loading.callNext || dashboard.loading.markInAttention || dashboard.loading.finishTicket || dashboard.loading.processNoShow}
          onCallNext={() => void dashboard.callNext()}
          onMarkInAttention={(ticketId) => void dashboard.markInAttention(ticketId)}
          onFinish={(ticketId) => void dashboard.finishTicket(ticketId, 'Finalizado desde panel operativo')}
          onProcessNoShow={() => void dashboard.processNoShow()}
        />

        <QueueDisplayPanel queue={queue.queue} error={queue.error} />
      </div>

      <Card className="stack-lg">
        <div className="section-heading-row">
          <div>
            <span className="eyebrow">UX inteligente</span>
            <h3>Seleccion del paciente y cita mediante listas amigables</h3>
          </div>
          <Button variant="secondary" onClick={() => setModalOpen(true)}>Abrir selector</Button>
        </div>
        <div className="selection-summary-grid">
          <div className="summary-chip-card">
            <span className="muted-text">Paciente seleccionado</span>
            <strong>{dashboard.selectedPatient?.label ?? dashboard.selectedAppointment?.pacienteNombre ?? 'Ninguno todavia'}</strong>
            <p>Las listas muestran nombres y contexto, sin obligar al recepcionista a memorizar ids.</p>
          </div>
          <div className="summary-chip-card">
            <span className="muted-text">Cita seleccionada</span>
            <strong>{dashboard.selectedAppointment?.label ?? 'Sin cita asociada'}</strong>
            <p>Si el paciente ya venia confirmado, el ticket puede originarse desde su cita con un solo clic.</p>
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
        isLoading={dashboard.loading.generateTicket || dashboard.loading.generateSpecialTicket || dashboard.loading.patients || dashboard.loading.appointments}
        priorityOptions={dashboard.prioridades}
        patientItems={dashboard.patients}
        appointmentItems={dashboard.appointments}
        selectedPatient={dashboard.selectedPatient}
        selectedAppointment={dashboard.selectedAppointment}
        onSelectPatient={dashboard.setSelectedPatient}
        onSelectAppointment={dashboard.setSelectedAppointment}
        onSearchPatients={(text) => { void dashboard.searchPatients(text); }}
        onSearchAppointments={(text) => { void dashboard.searchAppointments(text); }}
        onGenerate={(priority) => dashboard.generateNormalTicket(priority)}
        onGenerateSpecial={(reason) => dashboard.generateSpecialTicket(reason)}
      />
    </AppShell>
>>>>>>> cf2e740 (configuración global de paleta de colores y tost globales)
  );
}
