import { apiClient } from '@/lib/api/client';
import type {
  AppointmentSelection,
  CallNextRequest,
  FinalizeTicketRequest,
  GenerateTicketRequest,
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
  healthDb: () => apiClient.get<{ message: string; database?: string; dataSource?: string }>('/api/health/db'),
  getSedes: () => apiClient.get<SelectionOption[]>('/api/recepcion/catalogos/sedes'),
  getServicios: (sedeId?: number | null) => apiClient.get<SelectionOption[]>('/api/recepcion/catalogos/servicios', { sedeId }),
  getEstaciones: (sedeId?: number | null) => apiClient.get<SelectionOption[]>('/api/recepcion/catalogos/estaciones', { sedeId }),
  getPacientes: (texto?: string) => apiClient.get<PatientSelection[]>('/api/recepcion/catalogos/pacientes', { texto }),
  getCitasConfirmadas: (sedeId?: number | null, servicioId?: number | null, texto?: string) =>
    apiClient.get<AppointmentSelection[]>('/api/recepcion/catalogos/citas-confirmadas', { sedeId, servicioId, texto }),
  getPrioridades: () => apiClient.get<SelectionOption[]>('/api/recepcion/catalogos/prioridades-ticket'),
  getEstados: () => apiClient.get<SelectionOption[]>('/api/recepcion/catalogos/estados-ticket'),
  getTickets: (filters?: Record<string, string | number | undefined | null>) => apiClient.get<TicketDetail[]>('/api/tickets', filters),
  getTicketById: (ticketId: number) => apiClient.get<TicketDetail>(`/api/tickets/${ticketId}`),
  getTicketByNumber: (numeroTicket: string) => apiClient.get<TicketDetail>(`/api/tickets/por-numero/${encodeURIComponent(numeroTicket)}`),
  getMiTicket: (ticketId?: number | null, numeroTicket?: string | null) => apiClient.get<TicketDetail>('/api/tickets/mi-ticket', { ticketId, numeroTicket }),
  getResumenOperativo: (sedeId?: number | null, servicioId?: number | null) =>
    apiClient.get<ReceptionOperationalSummary>('/api/tickets/resumen-operativo', { sedeId, servicioId }),
  getPantallaCola: (sedeId: number, servicioId: number) =>
    apiClient.get<QueueDisplayResponse>('/api/pantalla/cola', { sedeId, servicioId }),
  generarTicket: (request: GenerateTicketRequest) => apiClient.post<TicketDetail>('/api/tickets/generar', request, true),
  generarTicketEspecial: (request: SpecialTicketRequest) => apiClient.post<TicketDetail>('/api/tickets/generar-especial', request, true),
  llamarSiguiente: (request: CallNextRequest) => apiClient.post<TicketDetail>('/api/tickets/siguiente', request, true),
  marcarEnAtencion: (ticketId: number) => apiClient.post<TicketDetail>(`/api/tickets/${ticketId}/en-atencion`),
  finalizarTicket: (ticketId: number, request: FinalizeTicketRequest) => apiClient.post<TicketDetail>(`/api/tickets/${ticketId}/finalizar`, request),
  procesarNoShow: () => apiClient.post<NoShowResponse>('/api/tickets/no-show/procesar'),
};
