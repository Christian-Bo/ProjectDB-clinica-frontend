'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError } from '@/lib/api/client';
import { receptionApi } from '@/lib/api/reception';
import type {
  AppointmentSelection,
  PatientSelection,
  ReceptionOperationalSummary,
  SelectionOption,
  TicketDetail,
} from '@/lib/api/types';
import type { DashboardFilters, LoadingMap } from '@/features/reception/models/ui';
import { useToast } from '@/shared/components/providers/ToastProvider';

const INITIAL_SUMMARY: ReceptionOperationalSummary = {
  ticketsEnEspera: 0,
  ticketsLlamados: 0,
  ticketsEnAtencion: 0,
  ticketsFinalizados: 0,
  ticketsNoShow: 0,
  ticketsEspecialesHoy: 0,
  consultadoEnUtc: new Date().toISOString(),
};

export function useDashboardData() {
  const toast = useToast();
  const [filters, setFilters] = useState<DashboardFilters>({ usuarioId: 1 });
  const [loading, setLoading] = useState<LoadingMap>({});
  const [sedes, setSedes] = useState<SelectionOption[]>([]);
  const [servicios, setServicios] = useState<SelectionOption[]>([]);
  const [estaciones, setEstaciones] = useState<SelectionOption[]>([]);
  const [prioridades, setPrioridades] = useState<SelectionOption[]>([]);
  const [tickets, setTickets] = useState<TicketDetail[]>([]);
  const [summary, setSummary] = useState<ReceptionOperationalSummary>(INITIAL_SUMMARY);
  const [patients, setPatients] = useState<PatientSelection[]>([]);
  const [appointments, setAppointments] = useState<AppointmentSelection[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientSelection | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentSelection | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);

  const withLoading = async <T,>(key: string, action: () => Promise<T>) => {
    setLoading((current) => ({ ...current, [key]: true }));
    try {
      return await action();
    } finally {
      setLoading((current) => ({ ...current, [key]: false }));
    }
  };

  const loadBootstrap = useCallback(async () => {
    try {
      const [sedesResponse, prioridadesResponse] = await Promise.all([
        receptionApi.getSedes(),
        receptionApi.getPrioridades(),
      ]);
      setSedes(sedesResponse.data);
      setPrioridades(prioridadesResponse.data);

      const defaultSede = sedesResponse.data[0];
      if (defaultSede) {
        setFilters((current) => ({ ...current, sedeId: current.sedeId ?? defaultSede.id }));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No fue posible cargar catalogos iniciales.';
      toast.error('Error cargando catalogos', message);
    }
  }, [toast]);

  useEffect(() => {
    void loadBootstrap();
  }, [loadBootstrap]);

  useEffect(() => {
    if (!filters.sedeId) return;

    void withLoading('catalogosDependientes', async () => {
      try {
        const [serviciosResponse, estacionesResponse] = await Promise.all([
          receptionApi.getServicios(filters.sedeId),
          receptionApi.getEstaciones(filters.sedeId),
        ]);

        setServicios(serviciosResponse.data);
        setEstaciones(estacionesResponse.data);

        setFilters((current) => ({
          ...current,
          servicioId: current.servicioId ?? serviciosResponse.data[0]?.id,
          estacionId: current.estacionId ?? estacionesResponse.data[0]?.id,
        }));
      } catch (err) {
        toast.error('Error cargando servicios y estaciones', err instanceof Error ? err.message : 'No fue posible completar la carga.');
      }
    });
  }, [filters.sedeId, toast]);

  const refreshDashboard = useCallback(async () => {
    if (!filters.sedeId || !filters.servicioId) return;

    try {
      const [summaryResponse, ticketsResponse] = await Promise.all([
        receptionApi.getResumenOperativo(filters.sedeId, filters.servicioId),
        receptionApi.getTickets({ sedeId: filters.sedeId, servicioId: filters.servicioId }),
      ]);
      setSummary(summaryResponse.data);
      setTickets(ticketsResponse.data);
    } catch (err) {
      toast.error('No fue posible actualizar el dashboard', err instanceof Error ? err.message : 'Intenta de nuevo.');
    }
  }, [filters.sedeId, filters.servicioId, toast]);

  useEffect(() => {
    void refreshDashboard();
  }, [refreshDashboard]);

  const searchPatients = useCallback(async (texto: string) => {
    return withLoading('patients', async () => {
      const response = await receptionApi.getPacientes(texto);
      setPatients(response.data);
      return response.data;
    });
  }, []);

  const searchAppointments = useCallback(async (texto: string) => {
    if (!filters.sedeId || !filters.servicioId) {
      toast.warning('Selecciona sede y servicio', 'La busqueda de citas confirmadas necesita estos filtros.');
      return [];
    }

    return withLoading('appointments', async () => {
      const response = await receptionApi.getCitasConfirmadas(filters.sedeId, filters.servicioId, texto);
      setAppointments(response.data);
      return response.data;
    });
  }, [filters.sedeId, filters.servicioId, toast]);

  const generateNormalTicket = useCallback(async (priority = 'NORMAL') => {
    if (!filters.sedeId || !filters.servicioId) {
      toast.warning('Selecciona sede y servicio', 'Necesitamos esos datos para generar el ticket.');
      return null;
    }

    if (!selectedPatient && !selectedAppointment) {
      toast.warning('Selecciona un paciente o una cita', 'El ticket requiere un paciente relacionado.');
      return null;
    }

    try {
      const response = await withLoading('generateTicket', async () => receptionApi.generarTicket({
        citaId: selectedAppointment?.citaId,
        pacienteId: selectedAppointment?.pacienteId ?? selectedPatient?.pacienteId,
        sedeId: filters.sedeId,
        servicioId: filters.servicioId,
        prioridadSolicitada: priority,
        usuarioId: filters.usuarioId,
      }));

      setSelectedTicket(response.data);
      toast.success('Ticket generado correctamente', `Numero asignado: ${response.data.numeroTicket}`);
      await refreshDashboard();
      return response.data;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'No fue posible generar el ticket.';
      toast.error('Error generando ticket', message);
      return null;
    }
  }, [filters, refreshDashboard, selectedAppointment, selectedPatient, toast]);

  const generateSpecialTicket = useCallback(async (reason: string) => {
    if (!filters.sedeId || !filters.servicioId) {
      toast.warning('Selecciona sede y servicio', 'Necesitamos esos datos para generar un ticket especial.');
      return null;
    }

    if (!selectedPatient && !selectedAppointment) {
      toast.warning('Selecciona un paciente o una cita', 'El ticket requiere un paciente relacionado.');
      return null;
    }

    try {
      const response = await withLoading('generateSpecialTicket', async () => receptionApi.generarTicketEspecial({
        citaId: selectedAppointment?.citaId,
        pacienteId: selectedAppointment?.pacienteId ?? selectedPatient?.pacienteId,
        sedeId: filters.sedeId,
        servicioId: filters.servicioId,
        motivoEspecial: reason,
        usuarioId: filters.usuarioId,
      }));

      setSelectedTicket(response.data);
      toast.success('Ticket especial generado', `Numero asignado: ${response.data.numeroTicket}`);
      await refreshDashboard();
      return response.data;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'No fue posible generar el ticket especial.';
      toast.error('Error generando ticket especial', message);
      return null;
    }
  }, [filters, refreshDashboard, selectedAppointment, selectedPatient, toast]);

  const callNext = useCallback(async () => {
    if (!filters.sedeId || !filters.servicioId) {
      toast.warning('Selecciona sede y servicio', 'Necesitamos estos filtros para llamar el siguiente ticket.');
      return null;
    }

    try {
      const response = await withLoading('callNext', async () => receptionApi.llamarSiguiente({
        sedeId: filters.sedeId!,
        servicioId: filters.servicioId!,
        estacionId: filters.estacionId,
        usuarioId: filters.usuarioId,
      }));

      setSelectedTicket(response.data);
      toast.info('Siguiente ticket llamado', `${response.data.numeroTicket} fue enviado a atencion.`);
      await refreshDashboard();
      return response.data;
    } catch (err) {
      toast.error('No se pudo llamar el siguiente ticket', err instanceof Error ? err.message : 'Intenta de nuevo.');
      return null;
    }
  }, [filters, refreshDashboard, toast]);

  const markInAttention = useCallback(async (ticketId: number) => {
    try {
      const response = await withLoading('markInAttention', async () => receptionApi.marcarEnAtencion(ticketId));
      setSelectedTicket(response.data);
      toast.info('Ticket en atencion', `${response.data.numeroTicket} ya esta siendo atendido.`);
      await refreshDashboard();
      return response.data;
    } catch (err) {
      toast.error('No se pudo marcar en atencion', err instanceof Error ? err.message : 'Intenta de nuevo.');
      return null;
    }
  }, [refreshDashboard, toast]);

  const finishTicket = useCallback(async (ticketId: number, motivo?: string) => {
    try {
      const response = await withLoading('finishTicket', async () => receptionApi.finalizarTicket(ticketId, { motivo }));
      setSelectedTicket(response.data);
      toast.success('Ticket finalizado', `${response.data.numeroTicket} finalizo correctamente.`);
      await refreshDashboard();
      return response.data;
    } catch (err) {
      toast.error('No se pudo finalizar', err instanceof Error ? err.message : 'Intenta nuevamente.');
      return null;
    }
  }, [refreshDashboard, toast]);

  const processNoShow = useCallback(async () => {
    try {
      const response = await withLoading('processNoShow', async () => receptionApi.procesarNoShow());
      toast.warning('Proceso de NO_SHOW ejecutado', `Registros procesados: ${response.data.registrosProcesados}`);
      await refreshDashboard();
      return response.data;
    } catch (err) {
      toast.error('No se pudo procesar NO_SHOW', err instanceof Error ? err.message : 'Intenta de nuevo.');
      return null;
    }
  }, [refreshDashboard, toast]);

  const findTicket = useCallback(async (reference: string) => {
    if (!reference.trim()) {
      toast.warning('Ingresa un ticket', 'Puedes escribir el numero del ticket o su id.');
      return null;
    }

    try {
      const response = Number.isFinite(Number(reference))
        ? await receptionApi.getTicketById(Number(reference))
        : await receptionApi.getTicketByNumber(reference);

      setSelectedTicket(response.data);
      toast.info('Ticket encontrado', `${response.data.numeroTicket} - ${response.data.estado}`);
      return response.data;
    } catch (err) {
      toast.error('No se encontro el ticket', err instanceof Error ? err.message : 'Verifica los datos ingresados.');
      return null;
    }
  }, [toast]);

  return useMemo(() => ({
    filters,
    setFilters,
    loading,
    sedes,
    servicios,
    estaciones,
    prioridades,
    tickets,
    summary,
    patients,
    appointments,
    selectedPatient,
    setSelectedPatient,
    selectedAppointment,
    setSelectedAppointment,
    selectedTicket,
    setSelectedTicket,
    searchPatients,
    searchAppointments,
    generateNormalTicket,
    generateSpecialTicket,
    callNext,
    markInAttention,
    finishTicket,
    processNoShow,
    findTicket,
    refreshDashboard,
  }), [
    appointments,
    callNext,
    filters,
    findTicket,
    finishTicket,
    generateNormalTicket,
    generateSpecialTicket,
    loading,
    markInAttention,
    patients,
    prioridades,
    processNoShow,
    refreshDashboard,
    searchAppointments,
    searchPatients,
    sedes,
    selectedAppointment,
    selectedPatient,
    selectedTicket,
    servicios,
    estaciones,
    summary,
    tickets,
  ]);
}
