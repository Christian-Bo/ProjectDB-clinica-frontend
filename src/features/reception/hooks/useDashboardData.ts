'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError } from '@/lib/api/client';
import { receptionApi } from '@/lib/api/reception';
import { session } from '@/lib/auth/session';
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
  const [filters, setFilters] = useState<DashboardFilters>({});
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

  const withLoading = useCallback(async <T,>(key: string, action: () => Promise<T>) => {
    setLoading((current) => ({ ...current, [key]: true }));
    try {
      return await action();
    } finally {
      setLoading((current) => ({ ...current, [key]: false }));
    }
  }, []);

  const loadBootstrap = useCallback(async () => {
    try {
      const [sedesResponse, prioridadesResponse] = await Promise.all([
        receptionApi.getSedes(),
        receptionApi.getPrioridades(),
      ]);

      setSedes(sedesResponse.data);
      setPrioridades(prioridadesResponse.data);

      const currentUser = session.getUser();
      const firstSedeId = sedesResponse.data[0]?.id;
      if (firstSedeId || currentUser?.usuarioId) {
        setFilters((current) => ({
          ...current,
          sedeId: current.sedeId ?? firstSedeId,
          usuarioId: current.usuarioId ?? currentUser?.usuarioId,
        }));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No fue posible cargar catálogos.';
      toast.error('Error', message);
    }
  }, [toast]);

  useEffect(() => {
    void loadBootstrap();
  }, [loadBootstrap]);

  useEffect(() => {
    if (!filters.sedeId) {
      setServicios([]);
      setEstaciones([]);
      setAppointments([]);
      return;
    }

    void withLoading('catalogosDependientes', async () => {
      try {
        const [serviciosResponse, estacionesResponse] = await Promise.all([
          receptionApi.getServicios(filters.sedeId),
          receptionApi.getEstaciones(filters.sedeId),
        ]);

        setServicios(serviciosResponse.data);
        setEstaciones(estacionesResponse.data);

        setFilters((current) => {
          const servicioId = serviciosResponse.data.some((item) => item.id === current.servicioId)
            ? current.servicioId
            : serviciosResponse.data[0]?.id;

          const estacionId = estacionesResponse.data.some((item) => item.id === current.estacionId)
            ? current.estacionId
            : estacionesResponse.data[0]?.id;

          return {
            ...current,
            servicioId,
            estacionId,
          };
        });
      } catch (err) {
        toast.error('Error', err instanceof Error ? err.message : 'No fue posible cargar datos.');
      }
    });
  }, [filters.sedeId, toast, withLoading]);

  const refreshDashboard = useCallback(async () => {
    if (!filters.sedeId || !filters.servicioId) {
      return;
    }

    try {
      const [summaryResponse, ticketsResponse] = await Promise.all([
        receptionApi.getResumenOperativo(filters.sedeId, filters.servicioId),
        receptionApi.getTickets({
          sedeId: filters.sedeId,
          servicioId: filters.servicioId,
        }),
      ]);

      setSummary(summaryResponse.data);
      setTickets(ticketsResponse.data);
    } catch (err) {
      toast.error('Error', err instanceof Error ? err.message : 'No fue posible actualizar.');
    }
  }, [filters.sedeId, filters.servicioId, toast]);

  useEffect(() => {
    void refreshDashboard();
  }, [refreshDashboard]);

  const loadPatients = useCallback(async () => {
    try {
      const response = await withLoading('patients', async () => receptionApi.getPacientes(undefined, 100));
      setPatients(response.data);
      return response.data;
    } catch (err) {
      toast.error('Error', err instanceof Error ? err.message : 'No fue posible cargar pacientes.');
      return [];
    }
  }, [toast, withLoading]);

  const loadAppointments = useCallback(async () => {
    if (!filters.sedeId || !filters.servicioId) {
      setAppointments([]);
      return [];
    }

    try {
      const response = await withLoading('appointments', async () =>
        receptionApi.getCitasConfirmadas(filters.sedeId, filters.servicioId),
      );
      setAppointments(response.data);
      return response.data;
    } catch (err) {
      toast.error('Error', err instanceof Error ? err.message : 'No fue posible cargar citas.');
      return [];
    }
  }, [filters.sedeId, filters.servicioId, toast, withLoading]);

  useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);

  const generateNormalTicket = useCallback(async (priority = 'NORMAL') => {
    if (!filters.sedeId || !filters.servicioId) {
      toast.warning('Atención', 'Selecciona sede y servicio.');
      return null;
    }

    if (!selectedPatient && !selectedAppointment) {
      toast.warning('Atención', 'Selecciona un paciente o una cita.');
      return null;
    }

    try {
      const response = await withLoading('generateTicket', async () =>
        receptionApi.generarTicket({
          citaId: selectedAppointment?.citaId,
          pacienteId: selectedAppointment?.pacienteId ?? selectedPatient?.pacienteId,
          sedeId: filters.sedeId,
          servicioId: filters.servicioId,
          prioridadSolicitada: priority,
          usuarioId: filters.usuarioId,
        }),
      );

      setSelectedTicket(response.data);
      toast.success('Correcto', `Ticket ${response.data.numeroTicket} generado.`);
      await refreshDashboard();
      return response.data;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'No fue posible generar el ticket.';
      toast.error('Error', message);
      return null;
    }
  }, [filters, refreshDashboard, selectedAppointment, selectedPatient, toast, withLoading]);

  const generateSpecialTicket = useCallback(async (reason: string) => {
    if (!filters.sedeId || !filters.servicioId) {
      toast.warning('Atención', 'Selecciona sede y servicio.');
      return null;
    }

    if (!selectedPatient && !selectedAppointment) {
      toast.warning('Atención', 'Selecciona un paciente o una cita.');
      return null;
    }

    if (!reason.trim()) {
      toast.warning('Atención', 'Escribe el motivo especial.');
      return null;
    }

    try {
      const response = await withLoading('generateSpecialTicket', async () =>
        receptionApi.generarTicketEspecial({
          citaId: selectedAppointment?.citaId,
          pacienteId: selectedAppointment?.pacienteId ?? selectedPatient?.pacienteId,
          sedeId: filters.sedeId,
          servicioId: filters.servicioId,
          motivoEspecial: reason,
          usuarioId: filters.usuarioId,
        }),
      );

      setSelectedTicket(response.data);
      toast.success('Correcto', `Ticket ${response.data.numeroTicket} generado.`);
      await refreshDashboard();
      return response.data;
    } catch (err) {
      const message = err instanceof ApiError
        ? err.message
        : 'No fue posible generar el ticket especial.';
      toast.error('Error', message);
      return null;
    }
  }, [filters, refreshDashboard, selectedAppointment, selectedPatient, toast, withLoading]);

  const callNext = useCallback(async () => {
    const { sedeId, servicioId, estacionId, usuarioId } = filters;

    if (!sedeId || !servicioId) {
      toast.warning('Atención', 'Selecciona sede y servicio.');
      return null;
    }

    try {
      const response = await withLoading('callNext', async () =>
        receptionApi.llamarSiguiente({
          sedeId,
          servicioId,
          estacionId,
          usuarioId,
        }),
      );

      setSelectedTicket(response.data);
      toast.info('Llamado', `${response.data.numeroTicket} fue enviado a atención.`);
      await refreshDashboard();
      return response.data;
    } catch (err) {
      toast.error('Error', err instanceof Error ? err.message : 'No fue posible llamar el ticket.');
      return null;
    }
  }, [filters, refreshDashboard, toast, withLoading]);


  const recallTicket = useCallback(async (ticketId: number) => {
    try {
      const response = await withLoading('recallTicket', async () =>
        receptionApi.rellamarTicket(ticketId, { usuarioId: filters.usuarioId }),
      );

      setSelectedTicket(response.data);
      toast.info('Llamado nuevamente', `${response.data.numeroTicket} · llamada #${response.data.contadorLlamados}.`);
      await refreshDashboard();
      return response.data;
    } catch (err) {
      toast.error('Error', err instanceof Error ? err.message : 'No fue posible volver a llamar.');
      return null;
    }
  }, [filters.usuarioId, refreshDashboard, toast, withLoading]);

  const markInAttention = useCallback(async (ticketId: number) => {
    try {
      const response = await withLoading('markInAttention', async () =>
        receptionApi.marcarEnAtencion(ticketId),
      );

      setSelectedTicket(response.data);
      toast.info('Actualizado', `${response.data.numeroTicket} en atención.`);
      await refreshDashboard();
      return response.data;
    } catch (err) {
      toast.error('Error', err instanceof Error ? err.message : 'No fue posible cambiar el estado.');
      return null;
    }
  }, [refreshDashboard, toast, withLoading]);

  const finishTicket = useCallback(async (ticketId: number, motivo?: string) => {
    try {
      const response = await withLoading('finishTicket', async () =>
        receptionApi.finalizarTicket(ticketId, { motivo }),
      );

      setSelectedTicket(response.data);
      toast.success('Finalizado', `${response.data.numeroTicket} finalizado.`);
      await refreshDashboard();
      return response.data;
    } catch (err) {
      toast.error('Error', err instanceof Error ? err.message : 'No fue posible finalizar.');
      return null;
    }
  }, [refreshDashboard, toast, withLoading]);

  const cancelTicket = useCallback(async (ticketId: number, motivo = 'Cancelado desde panel') => {
    try {
      const response = await withLoading('cancelTicket', async () =>
        receptionApi.cancelarTicket(ticketId, {
          motivo,
          usuarioId: filters.usuarioId,
        }),
      );

      setSelectedTicket(response.data);
      toast.warning('Cancelado', `${response.data.numeroTicket} cancelado.`);
      await refreshDashboard();
      return response.data;
    } catch (err) {
      toast.error('Error', err instanceof Error ? err.message : 'No fue posible cancelar.');
      return null;
    }
  }, [filters.usuarioId, refreshDashboard, toast, withLoading]);

  const processNoShow = useCallback(async () => {
    try {
      const response = await withLoading('processNoShow', async () =>
        receptionApi.procesarNoShow(),
      );

      toast.warning('Proceso ejecutado', `Registros procesados: ${response.data.registrosProcesados}`);
      await refreshDashboard();
      return response.data;
    } catch (err) {
      toast.error('Error', err instanceof Error ? err.message : 'No fue posible procesar no-show.');
      return null;
    }
  }, [refreshDashboard, toast, withLoading]);

  const findTicket = useCallback(async (reference: string) => {
    const normalized = reference.trim().toLowerCase();
    if (!normalized) {
      toast.warning('Atención', 'Ingresa un número, ID o DPI.');
      return null;
    }

    const localMatch = tickets.find((ticket) =>
      ticket.numeroTicket.toLowerCase() === normalized ||
      String(ticket.ticketId) === normalized ||
      (ticket.pacienteDocumento ?? '').toLowerCase().includes(normalized) ||
      (ticket.numeroExpediente ?? '').toLowerCase().includes(normalized),
    );

    if (localMatch) {
      setSelectedTicket(localMatch);
      toast.info('Encontrado', `${localMatch.numeroTicket} - ${localMatch.estado}`);
      return localMatch;
    }

    try {
      const response = /^\d{1,10}$/.test(normalized)
        ? await receptionApi.getTicketById(Number(normalized))
        : await receptionApi.getTicketByNumber(reference);

      setSelectedTicket(response.data);
      toast.info('Encontrado', `${response.data.numeroTicket} - ${response.data.estado}`);
      return response.data;
    } catch (err) {
      toast.error('Error', err instanceof Error ? err.message : 'No se encontró el ticket.');
      return null;
    }
  }, [tickets, toast]);

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
    loadPatients,
    loadAppointments,
    generateNormalTicket,
    generateSpecialTicket,
    callNext,
    recallTicket,
    markInAttention,
    finishTicket,
    cancelTicket,
    processNoShow,
    findTicket,
    refreshDashboard,
  }), [
    appointments,
    callNext,
    cancelTicket,
    filters,
    findTicket,
    finishTicket,
    generateNormalTicket,
    generateSpecialTicket,
    loadAppointments,
    loadPatients,
    loading,
    recallTicket,
    markInAttention,
    patients,
    prioridades,
    processNoShow,
    refreshDashboard,
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
