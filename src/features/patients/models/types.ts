export interface CitaResponse {
  citaId: number;
  pacienteId: number;
  numeroExpediente: string;
  sedeId: number;
  nombreSede: string;
  servicioId: number;
  nombreServicio: string;
  medicoId?: number;
  nombreMedico?: string;
  fechaInicio: string;
  fechaFin: string;
  estado: 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'REPROGRAMADA' | 'ATENDIDA' | 'NO_SHOW' | 'EXPIRADA';
  modalidad: string;
  motivoConsulta?: string;
  fechaCreacion: string;
}

export interface ReservarCitaRequest {
  pacienteId: number;
  sedeId: number;
  servicioId: number;
  medicoId?: number;
  tipoConsultaId: number;
  fechaInicio: string;
  modalidad: string;
  motivoConsulta?: string;
}

export const ESTADO_CITA_LABEL: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  CONFIRMADA: 'Confirmada',
  CANCELADA: 'Cancelada',
  REPROGRAMADA: 'Reprogramada',
  ATENDIDA: 'Atendida',
  NO_SHOW: 'No se presentó',
  EXPIRADA: 'Expirada',
};

export const ESTADO_CITA_BADGE: Record<string, string> = {
  PENDIENTE: 'badge-warning',
  CONFIRMADA: 'badge-success',
  CANCELADA: 'badge-danger',
  REPROGRAMADA: 'badge-info',
  ATENDIDA: 'badge-success',
  NO_SHOW: 'badge-danger',
  EXPIRADA: 'badge-neutral',
};