import { apiClient } from '@/lib/api/client';
import type {
  AppointmentSelection,
  CallNextRequest,
  CancelTicketRequest,
  FinalizeTicketRequest,
  GenerateKioskTicketRequest,
  GenerateTicketRequest,
  ConfigureKioskWindowRequest,
  KioskWindowConfig,
  NoShowResponse,
  PatientSelection,
  QueueDisplayResponse,
  ReceptionOperationalSummary,
  SelectionOption,
  SpecialTicketRequest,
  TicketDetail,
} from '@/lib/api/types';

export const receptionApi = {
  ping: () => apiClient.get<{ message: string }>('/api/health/ping'),

  healthDb: () =>
    apiClient.get<{ message: string }>('/api/health/db'),

  getSedes: () =>
    apiClient.get<SelectionOption[]>('/api/recepcion/catalogos/sedes'),

  getServicios: (sedeId?: number | null) =>
    apiClient.get<SelectionOption[]>('/api/recepcion/catalogos/servicios', { sedeId }),

  getEstaciones: (sedeId?: number | null) =>
    apiClient.get<SelectionOption[]>('/api/recepcion/catalogos/estaciones', { sedeId }),

  getPacientes: (texto?: string, limit = 100) =>
    apiClient.get<PatientSelection[]>('/api/recepcion/catalogos/pacientes', { texto, limit }),

  getCitasConfirmadas: (
    sedeId?: number | null,
    servicioId?: number | null,
    texto?: string,
  ) =>
    apiClient.get<AppointmentSelection[]>(
      '/api/recepcion/catalogos/citas-confirmadas',
      { sedeId, servicioId, texto },
    ),

  getPrioridades: () =>
    apiClient.get<SelectionOption[]>('/api/recepcion/catalogos/prioridades-ticket'),

  getEstados: () =>
    apiClient.get<SelectionOption[]>('/api/recepcion/catalogos/estados-ticket'),

  getKioscoVentanillas: (sedeId: number) =>
    apiClient.get<KioskWindowConfig[]>('/api/recepcion/catalogos/kiosco/ventanillas', { sedeId }),

  configurarKioscoVentanilla: (request: ConfigureKioskWindowRequest) =>
    apiClient.post<KioskWindowConfig>('/api/recepcion/catalogos/kiosco/ventanillas', request, true),

  getTickets: (filters?: Record<string, string | number | undefined | null>) =>
    apiClient.get<TicketDetail[]>('/api/tickets', filters),

  getTicketById: (ticketId: number) =>
    apiClient.get<TicketDetail>(`/api/tickets/${ticketId}`),

  getTicketByNumber: (numeroTicket: string) =>
    apiClient.get<TicketDetail>(`/api/tickets/por-numero/${encodeURIComponent(numeroTicket)}`),

  getMiTicket: (ticketId?: number | null, numeroTicket?: string | null) =>
    apiClient.get<TicketDetail>('/api/tickets/mi-ticket', { ticketId, numeroTicket }),

  getResumenOperativo: (sedeId?: number | null, servicioId?: number | null) =>
    apiClient.get<ReceptionOperationalSummary>('/api/tickets/resumen-operativo', {
      sedeId,
      servicioId,
    }),

  getPantallaCola: (sedeId: number, servicioId?: number | null, servicioIds?: number[]) =>
    apiClient.get<QueueDisplayResponse>('/api/pantalla/cola', {
      sedeId,
      servicioId: servicioId ?? servicioIds?.[0],
      servicioIds: servicioIds && servicioIds.length > 0 ? servicioIds.join(',') : undefined,
    }),

  generarTicket: (request: GenerateTicketRequest) =>
    apiClient.post<TicketDetail>('/api/tickets/generar', request, true),

  generarTicketKiosco: (request: GenerateKioskTicketRequest) =>
    apiClient.post<TicketDetail>('/api/tickets/generar-kiosco', request, true),

  generarTicketEspecial: (request: SpecialTicketRequest) =>
    apiClient.post<TicketDetail>('/api/tickets/generar-especial', request, true),

  llamarSiguiente: (request: CallNextRequest) =>
    apiClient.post<TicketDetail>('/api/tickets/siguiente', request, true),

  marcarEnAtencion: (ticketId: number) =>
    apiClient.post<TicketDetail>(`/api/tickets/${ticketId}/en-atencion`, undefined, true),

  finalizarTicket: (ticketId: number, request: FinalizeTicketRequest) =>
    apiClient.post<TicketDetail>(`/api/tickets/${ticketId}/finalizar`, request, true),

  cancelarTicket: (ticketId: number, request: CancelTicketRequest) =>
    apiClient.post<TicketDetail>(`/api/tickets/${ticketId}/cancelar`, request, true),

  rellamarTicket: (ticketId: number, request?: { usuarioId?: number | null }) =>
    apiClient.post<TicketDetail>(`/api/tickets/${ticketId}/rellamar`, request ?? {}, true),

  procesarNoShow: () =>
    apiClient.post<NoShowResponse>('/api/tickets/no-show/procesar', undefined, true),
};
