export interface ApiEnvelope<T> {
  ok: boolean;
  code: string;
  message: string;
  data: T;
}

export interface SelectionOption {
  id: number;
  nombre: string;
  label: string;
  codigo?: string | null;
  descripcion?: string | null;
  activo: boolean;
}

export interface PatientSelection {
  pacienteId: number;
  label: string;
  numeroExpediente?: string | null;
  documento?: string | null;
  telefono?: string | null;
  correoElectronico?: string | null;
  esDiscapacitado: boolean;
}

export interface AppointmentSelection {
  citaId: number;
  pacienteId: number;
  label: string;
  fechaInicio: string;
  estado: string;
  pacienteNombre: string;
  servicioNombre: string;
  sedeNombre: string;
  medicoNombre?: string | null;
}

export interface TicketDetail {
  ticketId: number;
  numeroTicket: string;
  estado: string;
  prioridad: string;
  esEspecial: boolean;
  motivoEspecial?: string | null;
  citaId?: number | null;
  citaEstado?: string | null;
  pacienteId: number;
  pacienteNombre: string;
  numeroExpediente?: string | null;
  pacienteDocumento?: string | null;
  sedeId: number;
  sedeNombre: string;
  servicioId: number;
  servicioNombre: string;
  especialidadNombre?: string | null;
  medicoId?: number | null;
  medicoNombre?: string | null;
  consultorioId?: number | null;
  consultorioNombre?: string | null;
  autorizadoPorId?: number | null;
  autorizadoPorNombre?: string | null;
  fechaGeneracion: string;
  fechaLlamado?: string | null;
  fechaInicioAtencion?: string | null;
  fechaFinAtencion?: string | null;
  contadorLlamados: number;
}

export interface QueueTicketPreview {
  ticketId: number;
  numeroTicket: string;
  prioridad: string;
  estado: string;
  fechaReferencia?: string | null;
  consultorioId?: number | null;
  consultorioNombre?: string | null;
}

export interface QueueDisplayResponse {
  sedeId: number;
  sedeNombre: string;
  servicioId: number;
  servicioNombre: string;
  actual?: QueueTicketPreview | null;
  proximos: QueueTicketPreview[];
  consultadoEnUtc: string;
}

export interface ReceptionOperationalSummary {
  sedeId?: number | null;
  sedeNombre?: string | null;
  servicioId?: number | null;
  servicioNombre?: string | null;
  ticketsEnEspera: number;
  ticketsLlamados: number;
  ticketsEnAtencion: number;
  ticketsFinalizados: number;
  ticketsNoShow: number;
  ticketsEspecialesHoy: number;
  ultimoTicketLlamado?: string | null;
  consultadoEnUtc: string;
}

export interface GenerateTicketRequest {
  citaId?: number | null;
  pacienteId?: number | null;
  sedeId?: number | null;
  servicioId?: number | null;
  medicoId?: number | null;
  prioridadSolicitada?: string;
  motivoEspecial?: string | null;
  usuarioId?: number | null;
}

export interface SpecialTicketRequest {
  citaId?: number | null;
  pacienteId?: number | null;
  sedeId?: number | null;
  servicioId?: number | null;
  medicoId?: number | null;
  motivoEspecial: string;
  usuarioId?: number | null;
}

export interface CallNextRequest {
  sedeId: number;
  servicioId: number;
  estacionId?: number | null;
  usuarioId?: number | null;
}

export interface FinalizeTicketRequest {
  motivo?: string | null;
}

export interface NoShowResponse {
  registrosProcesados: number;
}
