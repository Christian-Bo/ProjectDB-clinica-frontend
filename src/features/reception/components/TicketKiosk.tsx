'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError } from '@/lib/api/client';
import { receptionApi } from '@/lib/api/reception';
import { session } from '@/lib/auth/session';
import type {
  AppointmentSelection,
  KioskWindowConfig,
  PatientSelection,
  SelectionOption,
  TicketDetail,
} from '@/lib/api/types';
import { useToast } from '@/shared/components/providers/ToastProvider';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Modal } from '@/shared/components/ui/Modal';

const PRIORITY_OPTIONS = [
  { value: 'NORMAL', label: 'Normal', hint: 'Atención estándar' },
  { value: 'ANCIANO', label: 'Adulto mayor', hint: 'Prioridad por edad' },
  { value: 'DISCAPACIDAD', label: 'Discapacidad', hint: 'Asistencia preferencial' },
  { value: 'EMBARAZO', label: 'Embarazo', hint: 'Atención prioritaria' },
];

const STATUS_OPTIONS = ['TODOS', 'ESPERA', 'LLAMADO', 'EN_ATENCION', 'FINALIZADO', 'NO_SHOW', 'CANCELADO'];

const readPositiveIntQueryParam = (name: string): number | undefined => {
  if (typeof window === 'undefined') return undefined;

  const value = new URLSearchParams(window.location.search).get(name);
  const parsed = value ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const toWindowConfig = (service: SelectionOption, index: number, sedeId: number, sedeNombre = ''): KioskWindowConfig => ({
  kioscoVentanillaId: 0,
  sedeId,
  sedeNombre,
  servicioId: service.id,
  servicioNombre: service.label || service.nombre,
  especialidadId: undefined,
  especialidadNombre: service.label || service.nombre,
  numeroVentanilla: index + 1,
  ventanillaNombre: `Ventanilla ${index + 1}`,
  activo: service.activo !== false,
});

type TicketKioskProps = {
  initialSedeId?: number;
  standalone?: boolean;
  adminLauncherHref?: string;
};

export function TicketKiosk({ initialSedeId, standalone = false, adminLauncherHref }: TicketKioskProps) {
  const toast = useToast();
  const [sedes, setSedes] = useState<SelectionOption[]>([]);
  const [ventanillas, setVentanillas] = useState<KioskWindowConfig[]>([]);
  const [sedeId, setSedeId] = useState<number | undefined>();
  const [tickets, setTickets] = useState<TicketDetail[]>([]);
  const [dpi, setDpi] = useState('');
  const [noAplica, setNoAplica] = useState(false);
  const [priority, setPriority] = useState('NORMAL');
  const [priorityExplicitlySelected, setPriorityExplicitlySelected] = useState(false);
  const [specialReason, setSpecialReason] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<PatientSelection | null>(null);
  const [appointments, setAppointments] = useState<AppointmentSelection[]>([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | undefined>();
  const [operatorId, setOperatorId] = useState<number | undefined>();
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [priorityModalOpen, setPriorityModalOpen] = useState(false);
  const [specialModalOpen, setSpecialModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [ticketToCancel, setTicketToCancel] = useState<TicketDetail | null>(null);
  const [historySearch, setHistorySearch] = useState('');
  const [historyEstado, setHistoryEstado] = useState('TODOS');
  const [loading, setLoading] = useState(false);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  const selectedSede = useMemo(() => sedes.find((item) => item.id === sedeId), [sedes, sedeId]);

  useEffect(() => {
    try {
      const user = session.getUser();
      setOperatorId(user?.usuarioId);
    } catch {
      setOperatorId(undefined);
    }

    let cancelled = false;
    const load = async () => {
      setLoadingCatalogs(true);
      try {
        const response = await receptionApi.getSedes();
        if (cancelled) return;
        const data = Array.isArray(response.data) ? response.data : [];
        const requestedSedeId = initialSedeId ?? readPositiveIntQueryParam('sedeId');
        const defaultSedeId = requestedSedeId && data.some((item) => item.id === requestedSedeId)
          ? requestedSedeId
          : data[0]?.id;

        setSedes(data);
        setSedeId((current) => {
          if (current && data.some((item) => item.id === current)) return current;
          return defaultSedeId;
        });
      } catch (err) {
        if (!cancelled) toast.error('Error de catálogo', err instanceof Error ? err.message : 'No fue posible cargar sedes.');
      } finally {
        if (!cancelled) setLoadingCatalogs(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [initialSedeId, toast]);

  useEffect(() => {
    if (!initialSedeId || sedes.length === 0) return;
    if (!sedes.some((sede) => sede.id === initialSedeId)) return;

    setSedeId((current) => (current === initialSedeId ? current : initialSedeId));
  }, [initialSedeId, sedes]);

  const refreshTickets = useCallback(async () => {
    if (!sedeId) return;
    try {
      const response = await receptionApi.getTickets({ sedeId });
      setTickets(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      toast.error('Error de historial', err instanceof Error ? err.message : 'No fue posible cargar historial.');
    }
  }, [sedeId, toast]);

  useEffect(() => {
    if (!sedeId) {
      setVentanillas([]);
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        await refreshTickets();

        try {
          const windowsResponse = await receptionApi.getKioscoVentanillas(sedeId);
          if (cancelled) return;
          const data = Array.isArray(windowsResponse.data) ? windowsResponse.data : [];
          setVentanillas(data.filter((item) => item.activo));
        } catch {
          const servicesResponse = await receptionApi.getServicios(sedeId);
          if (cancelled) return;
          const sedeNombre = selectedSede?.label || selectedSede?.nombre || '';
          const services = Array.isArray(servicesResponse.data) ? servicesResponse.data : [];
          setVentanillas(services.filter((item) => item.activo !== false).map((item, index) => toWindowConfig(item, index, sedeId, sedeNombre)));
        }
      } catch (err) {
        if (!cancelled) toast.error('Error de ventanillas', err instanceof Error ? err.message : 'No fue posible cargar ventanillas.');
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [refreshTickets, sedeId, selectedSede?.label, selectedSede?.nombre, toast]);

  const selectedAppointment = useMemo(
    () => appointments.find((item) => item.citaId === selectedAppointmentId),
    [appointments, selectedAppointmentId],
  );

  const filteredTickets = useMemo(() => {
    const term = historySearch.trim().toLowerCase();
    return tickets.filter((ticket) => {
      const matchesEstado = historyEstado === 'TODOS' || ticket.estado === historyEstado;
      const matchesTerm = !term ||
        ticket.numeroTicket.toLowerCase().includes(term) ||
        String(ticket.ticketId).includes(term) ||
        (ticket.pacienteDocumento ?? '').toLowerCase().includes(term) ||
        (ticket.pacienteNombre ?? '').toLowerCase().includes(term);
      return matchesEstado && matchesTerm;
    });
  }, [historyEstado, historySearch, tickets]);

  const resetFlow = () => {
    setDpi('');
    setNoAplica(false);
    setPriority('NORMAL');
    setPriorityExplicitlySelected(false);
    setSpecialReason('');
    setSelectedPatient(null);
    setAppointments([]);
    setSelectedAppointmentId(undefined);
    setServiceModalOpen(false);
  };

  const appendDigit = (digit: string) => {
    if (noAplica) setNoAplica(false);
    setDpi((current) => `${current}${digit}`.slice(0, 13));
  };

  const ensureSede = () => {
    if (!sedeId) {
      toast.warning('Sede requerida', 'Abre la configuración oculta y selecciona una sede antes de generar tickets.');
      return false;
    }
    if (ventanillas.length === 0) {
      toast.warning('Sin ventanillas', 'El administrador debe configurar ventanillas activas para esta sede.');
      return false;
    }
    return true;
  };

  const openWindowSelectionForNA = () => {
    if (!ensureSede()) return;
    setNoAplica(true);
    setDpi('');
    setPriority('NORMAL');
    setPriorityExplicitlySelected(false);
    setSpecialReason('');
    setSelectedPatient(null);
    setAppointments([]);
    setSelectedAppointmentId(undefined);
    setServiceModalOpen(true);
  };

  const handleOk = async () => {
    if (!ensureSede()) return;

    if (noAplica) {
      setSelectedPatient(null);
      setAppointments([]);
      setSelectedAppointmentId(undefined);
      setServiceModalOpen(true);
      return;
    }

    if (dpi.trim().length < 4) {
      toast.warning('DPI requerido', 'Ingresa el DPI o usa N/A para un ticket sin paciente nominal.');
      return;
    }

    setLoading(true);
    try {
      const [patientsResponse, appointmentsResponse] = await Promise.all([
        receptionApi.getPacientes(dpi, 5),
        receptionApi.getCitasConfirmadas(sedeId, undefined, dpi),
      ]);

      const patients = Array.isArray(patientsResponse.data) ? patientsResponse.data : [];
      const patient = patients.find((item) => item.documento === dpi) ?? patients[0] ?? null;
      if (!patient) {
        toast.warning('Paciente no encontrado', 'No se encontró un paciente asociado al DPI ingresado.');
        return;
      }

      const citas = Array.isArray(appointmentsResponse.data) ? appointmentsResponse.data : [];
      setSelectedPatient(patient);
      setAppointments(citas.filter((cita) => cita.pacienteId === patient.pacienteId));
      setSelectedAppointmentId(citas.find((cita) => cita.pacienteId === patient.pacienteId)?.citaId);
      setServiceModalOpen(true);
    } catch (err) {
      toast.error('Error al buscar paciente', err instanceof Error ? err.message : 'No fue posible buscar el paciente.');
    } finally {
      setLoading(false);
    }
  };

  const generateTicket = async (windowConfig: KioskWindowConfig) => {
    if (!sedeId) return;

    const effectivePriority = priorityExplicitlySelected ? priority : 'NORMAL';
    const effectiveSpecialReason = effectivePriority === 'ESPECIAL' ? specialReason : null;

    setLoading(true);
    try {
      const response = selectedAppointment
        ? await receptionApi.generarTicket({
            citaId: selectedAppointment.citaId,
            pacienteId: selectedAppointment.pacienteId,
            sedeId,
            servicioId: windowConfig.servicioId,
            prioridadSolicitada: effectivePriority,
            motivoEspecial: effectiveSpecialReason,
            usuarioId: operatorId,
          })
        : await receptionApi.generarTicketKiosco({
            pacienteId: selectedPatient?.pacienteId,
            documentoPaciente: noAplica ? null : dpi,
            usarPacienteNoAplica: noAplica,
            sedeId,
            servicioId: windowConfig.servicioId,
            prioridadSolicitada: effectivePriority,
            motivoEspecial: effectiveSpecialReason,
            usuarioId: operatorId,
          });

      toast.success(
        'Ticket generado',
        `${response.data.numeroTicket} · ${windowConfig.ventanillaNombre} · ${response.data.pacienteNombre}`,
      );
      await refreshTickets();
      resetFlow();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'No fue posible generar el ticket.';
      toast.error('Error al generar ticket', message);
    } finally {
      setLoading(false);
    }
  };

  const cancelTicket = async (ticket: TicketDetail) => {
    if (!['ESPERA', 'LLAMADO', 'EN_ATENCION'].includes(ticket.estado)) {
      toast.warning('Acción no permitida', 'Solo se pueden cancelar tickets activos.');
      return;
    }

    setLoading(true);
    try {
      await receptionApi.cancelarTicket(ticket.ticketId, {
        motivo: 'Cancelado desde kiosco de tickets',
        usuarioId: operatorId,
      });
      toast.warning('Ticket cancelado', `${ticket.numeroTicket} cambió a CANCELADO y ya no seguirá en cola.`);
      await refreshTickets();
      setTicketToCancel(null);
    } catch (err) {
      toast.error('Error al cancelar', err instanceof Error ? err.message : 'No fue posible cancelar.');
    } finally {
      setLoading(false);
    }
  };

  const displayValue = noAplica ? 'N/A' : dpi || 'Ingrese DPI';

  return (
    <div className={`kiosk-page kiosk-page-clean stack-lg ${standalone ? 'kiosk-page-standalone' : ''}`.trim()}>
      <button
        type="button"
        className="kiosk-secret-toggle"
        onClick={() => setConfigOpen((current) => !current)}
        aria-label="Abrir configuración del kiosco"
        title="Configuración del kiosco"
      >
        ⚙️
      </button>

      {configOpen ? (
        <aside className="kiosk-secret-panel" aria-label="Configuración oculta del kiosco">
          <div className="section-heading-row">
            <div>
              <span className="eyebrow">Configuración</span>
              <h3>Sede del kiosco</h3>
            </div>
            <button className="icon-button" type="button" onClick={() => setConfigOpen(false)}>×</button>
          </div>
          <label className="field-group">
            <span>Sede activa</span>
            <select
              value={sedeId ?? ''}
              disabled={loadingCatalogs}
              onChange={(event) => {
                setSedeId(event.target.value ? Number(event.target.value) : undefined);
                resetFlow();
              }}
            >
              <option value="">— Selecciona sede —</option>
              {sedes.map((sede) => (
                <option key={sede.id} value={sede.id}>{sede.label || sede.nombre}</option>
              ))}
            </select>
          </label>
          {adminLauncherHref ? (
            <a className="btn btn-secondary" href={adminLauncherHref} target="_blank" rel="noopener noreferrer">
              Abrir pantalla independiente
            </a>
          ) : null}
          <p className="muted-text">Esta configuración queda oculta para que el kiosco se vea limpio ante pacientes.</p>
        </aside>
      ) : null}

      <section className="kiosk-single-layout">
        <Card className="kiosk-panel kiosk-keypad-card">
          <div className="section-heading-row">
            <div>
              <span className="eyebrow">Ingreso del paciente</span>
              <h3>DPI o caso N/A</h3>
            </div>
            <Badge className={noAplica ? 'badge-warning' : !priorityExplicitlySelected || priority === 'NORMAL' ? 'badge-info' : 'badge-danger'}>
              {noAplica ? 'N/A activo' : !priorityExplicitlySelected || priority === 'NORMAL' ? 'Normal' : priority}
            </Badge>
          </div>

          <div className="kiosk-display" aria-label="DPI ingresado">
            {displayValue}
          </div>

          <div className="kiosk-controls-grid">
            <div className="kiosk-keypad">
              {['1','2','3','4','5','6','7','8','9'].map((digit) => (
                <button type="button" key={digit} onClick={() => appendDigit(digit)}>{digit}</button>
              ))}
              <button type="button" onClick={() => setDpi((current) => current.slice(0, -1))}>⌫</button>
              <button type="button" onClick={() => appendDigit('0')}>0</button>
              <button type="button" className="kiosk-ok" onClick={() => void handleOk()} disabled={loading}>OK</button>
            </div>

            <div className="kiosk-side-actions">
              <button type="button" className={noAplica ? 'active' : ''} onClick={openWindowSelectionForNA}>
                N/A <small>Sin DPI</small>
              </button>
              <button type="button" onClick={() => setPriorityModalOpen(true)}>
                ! <small>Prioridad</small>
              </button>
              <button type="button" onClick={() => setSpecialModalOpen(true)}>
                ⭐ <small>Especial</small>
              </button>
              <button type="button" onClick={() => setHistoryModalOpen(true)}>
                🕘 <small>Historial</small>
              </button>
            </div>
          </div>
        </Card>
      </section>

      <Modal
        open={serviceModalOpen}
        onClose={() => setServiceModalOpen(false)}
        title="Seleccionar ventanilla"
        subtitle="Elige la ventanilla donde se atenderá este ticket."
        size="xl"
      >
        <div className="kiosk-patient-summary">
          <div>
            <span>Paciente</span>
            <strong>{noAplica ? 'Paciente N/A' : selectedPatient?.label ?? 'Sin paciente'}</strong>
          </div>
          <div>
            <span>Cita asociada</span>
            <select
              value={selectedAppointmentId ?? ''}
              onChange={(event) => setSelectedAppointmentId(event.target.value ? Number(event.target.value) : undefined)}
              disabled={appointments.length === 0 || noAplica}
            >
              <option value="">{appointments.length === 0 ? 'Sin cita programada' : 'Sin vincular cita'}</option>
              {appointments.map((appointment) => (
                <option key={appointment.citaId} value={appointment.citaId}>{appointment.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="kiosk-service-select-grid">
          {ventanillas.length === 0 ? (
            <EmptyState title="Sin ventanillas activas" description="El administrador debe configurar las ventanillas de esta sede." />
          ) : ventanillas.map((windowConfig) => (
            <button
              type="button"
              key={`${windowConfig.servicioId}-${windowConfig.numeroVentanilla}`}
              disabled={loading}
              onClick={() => void generateTicket(windowConfig)}
            >
              <span>{windowConfig.ventanillaNombre}</span>
              <strong>{windowConfig.especialidadNombre || windowConfig.servicioNombre}</strong>
            </button>
          ))}
        </div>
      </Modal>

      <Modal
        open={priorityModalOpen}
        onClose={() => setPriorityModalOpen(false)}
        title="Marcar prioridad"
        subtitle="Selecciona la razón de prioridad antes de presionar OK."
      >
        <div className="kiosk-priority-grid">
          {PRIORITY_OPTIONS.map((item) => (
            <button
              type="button"
              key={item.value}
              className={priorityExplicitlySelected && priority === item.value ? 'active' : ''}
              onClick={() => { setPriority(item.value); setPriorityExplicitlySelected(true); setPriorityModalOpen(false); }}
            >
              <strong>{item.label}</strong>
              <span>{item.hint}</span>
            </button>
          ))}
        </div>
      </Modal>

      <Modal
        open={specialModalOpen}
        onClose={() => setSpecialModalOpen(false)}
        title="Ticket especial autorizado"
        subtitle="Requiere observación del administrador o responsable."
      >
        <label className="field-group">
          <span>Observación *</span>
          <textarea rows={4} value={specialReason} onChange={(event) => setSpecialReason(event.target.value)} />
        </label>
        <div className="modal-actions">
          <Button variant="ghost" onClick={() => setSpecialModalOpen(false)}>Cancelar</Button>
          <Button
            disabled={specialReason.trim().length < 5}
            onClick={() => { setPriority('ESPECIAL'); setPriorityExplicitlySelected(true); setSpecialModalOpen(false); }}
          >
            Autorizar especial
          </Button>
        </div>
      </Modal>

      <Modal
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title="Historial de tickets generados"
        subtitle="Busca por ticket, DPI o paciente. Selecciona una fila activa para cancelarla."
        size="xl"
      >
        <div className="history-toolbar">
          <input
            className="search-input"
            value={historySearch}
            onChange={(event) => setHistorySearch(event.target.value)}
            placeholder="Buscar por ticket, DPI o paciente"
          />
          <select value={historyEstado} onChange={(event) => setHistoryEstado(event.target.value)}>
            {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <Button variant="secondary" onClick={() => void refreshTickets()}>Actualizar</Button>
        </div>

        <div className="kiosk-history-table">
          {filteredTickets.length === 0 ? (
            <EmptyState title="Sin resultados" description="Ajusta la búsqueda o el filtro de estado." />
          ) : (
            filteredTickets.map((ticket) => (
              <button type="button" key={ticket.ticketId} onClick={() => setTicketToCancel(ticket)}>
                <strong>{ticket.numeroTicket}</strong>
                <span>{ticket.pacienteNombre}</span>
                <small>{ticket.pacienteDocumento ?? 'Sin DPI'} · {ticket.ventanillaNombre ?? ticket.servicioNombre}</small>
                <Badge className={ticket.estado === 'CANCELADO' ? 'badge-neutral' : 'badge-info'}>{ticket.estado}</Badge>
              </button>
            ))
          )}
        </div>
      </Modal>

      <Modal
        open={Boolean(ticketToCancel)}
        onClose={() => setTicketToCancel(null)}
        title="Cancelar ticket"
        subtitle="Confirma la cancelación para retirar el ticket del flujo activo."
      >
        {ticketToCancel ? (
          <div className="stack-lg">
            <div className="inline-alert inline-alert-warning">
              <strong>{ticketToCancel.numeroTicket}</strong> · {ticketToCancel.pacienteNombre} · {ticketToCancel.estado}
            </div>
            <div className="modal-actions">
              <Button variant="ghost" onClick={() => setTicketToCancel(null)}>Volver</Button>
              <Button variant="danger" loading={loading} disabled={loading} onClick={() => void cancelTicket(ticketToCancel)}>
                🛑 Cancelar ticket
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
