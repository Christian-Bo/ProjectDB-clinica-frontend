import { patientsApi } from '@/lib/api/patients';
import type {
  SecretariaContextoDto,
  SecretariaTicketDto,
  SecretariaResumenDto,
  KioscoTicketResponseDto,
} from '../../features/secretaria/models/secretaria';

export const secretariaApi = {

  getContextos: (usuarioId: number) =>
    patientsApi.get<SecretariaContextoDto[]>(
      `/api/secretaria/contextos?usuarioId=${usuarioId}`
    ),

  configurarContexto: (
    usuarioId: number,
    sedeId: number,
    servicioId: number | null,
    estacionId: number
  ) =>
    patientsApi.post<SecretariaContextoDto>(
      '/api/secretaria/contexto',
      { usuarioId, sedeId, servicioId, estacionId },
      true
    ),

  getCola: (
    usuarioId: number,
    sedeId: number,
    servicioId: number | null,
    estacionId: number,
    estado?: string,
    top = 50
  ) => {
    const params = new URLSearchParams({
      usuarioId:  String(usuarioId),
      sedeId:     String(sedeId),
      estacionId: String(estacionId),
      top:        String(top),
    });
    if (servicioId) params.set('servicioId', String(servicioId));
    if (estado)     params.set('estado', estado);
    return patientsApi.get<SecretariaTicketDto[]>(
      `/api/secretaria/cola?${params.toString()}`
    );
  },

  tomarSiguiente: (
    usuarioId: number,
    sedeId: number,
    servicioId: number | null,
    estacionId: number
  ) =>
    patientsApi.post<SecretariaTicketDto>(
      '/api/secretaria/tickets/siguiente',
      { usuarioId, sedeId, servicioId, estacionId },
      true
    ),

  registrarAsistencia: (
    ticketId: number,
    usuarioId: number,
    estacionId: number,
    documentoValidado: boolean,
    datosContactoActualizados: boolean,
    observaciones?: string
  ) =>
    patientsApi.post<SecretariaTicketDto>(
      `/api/secretaria/tickets/${ticketId}/asistencia`,
      { usuarioId, estacionId, documentoValidado, datosContactoActualizados, observaciones },
      true
    ),

  enviarMedico: (
    ticketId: number,
    usuarioId: number,
    estacionId: number,
    medicoId?: number,
    consultorioId?: number,
    observaciones?: string
  ) =>
    patientsApi.post<SecretariaTicketDto>(
      `/api/secretaria/tickets/${ticketId}/enviar-medico`,
      { usuarioId, estacionId, medicoId, consultorioId, observaciones },
      true
    ),

  marcarNoShow: (
    ticketId: number,
    usuarioId: number,
    estacionId: number,
    motivo?: string
  ) =>
    patientsApi.post<object>(
      `/api/secretaria/tickets/${ticketId}/no-show`,
      { usuarioId, estacionId, motivo },
      true
    ),

  getResumen: (
    usuarioId: number,
    sedeId: number,
    servicioId: number | null,
    estacionId: number
  ) => {
    const params = new URLSearchParams({
      usuarioId:  String(usuarioId),
      sedeId:     String(sedeId),
      estacionId: String(estacionId),
    });
    if (servicioId) params.set('servicioId', String(servicioId));
    return patientsApi.get<SecretariaResumenDto>(
      `/api/secretaria/resumen?${params.toString()}`
    );
  },

  reasignarTicket: (
    ticketId: number,
    usuarioId: number,
    estacionOrigenId: number,
    estacionDestinoId: number,
    motivo: string
  ) =>
    patientsApi.post<SecretariaTicketDto>(
      `/api/secretaria/tickets/${ticketId}/reasignar`,
      { usuarioId, estacionOrigenId, estacionDestinoId, motivo },
      true
    ),

  kioscoGenerarTicket: (
    sedeId: number,
    servicioId: number,
    pacienteId?: number,
    citaId?: number,
    prioridadSolicitada = 'NORMAL',
    motivoEspecial?: string
  ) =>
    patientsApi.post<KioscoTicketResponseDto>(
      '/api/secretaria/kiosco/ticket',
      { sedeId, servicioId, pacienteId, citaId, prioridadSolicitada, motivoEspecial },
      true
    ),
};