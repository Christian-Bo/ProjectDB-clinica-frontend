export interface SecretariaContextoDto {
  secretariaAsignacionId: number;
  usuarioId:              number;
  sedeId:                 number;
  sedeNombre:             string;
  servicioId?:            number | null;
  servicioNombre:         string;
  estacionId:             number;
  estacionNombre:         string;
  tipoEstacion:           string;
  esPrincipal:            boolean;
  activo:                 boolean;
  rolOperativo:           string;
}

export interface SecretariaTicketDto {
  ticketId:           number;
  numeroTicket:       string;
  estado:             string;
  prioridad:          string;
  pacienteId:         number;
  pacienteNombre:     string;
  numeroExpediente:   string;
  sedeId:             number;
  sedeNombre:         string;
  servicioId:         number;
  servicioNombre:     string;
  estacionNombre:     string;
  citaId?:            number | null;
  fechaCita?:         string | null;
  minutosEspera:      number;
  estadoAsignacion:   string;
  fechaAsignacion?:   string | null;
  fechaToma?:         string | null;
  medicoId?:          number | null;
  consultorioId?:     number | null;
  fechaEnvioMedico?:  string | null;
}

export interface SecretariaResumenDto {
  ticketsPendientes:      number;
  ticketsTomados:         number;
  asistenciasRegistradas: number;
  enviadosMedico:         number;
  noShow:                 number;
  promedioEsperaMinutos:  number;
  ultimoTicketTomado:     string;
  nombreVentanilla:       string;
  nombreSede:             string;
  nombreServicio:         string;
}

export interface KioscoTicketResponseDto {
  ticketId:         number;
  numeroTicket:     string;
  estado:           string;
  prioridad:        string;
  estacionId:       number;
  ventanillaNombre: string;
  sedeNombre:       string;
  servicioNombre:   string;
}

export const PRIORIDAD_COLOR: Record<string, string> = {
  ESPECIAL:     'badge-danger',
  EMBARAZO:     'badge-warning',
  DISCAPACIDAD: 'badge-warning',
  ANCIANO:      'badge-warning',
  NORMAL:       'badge-info',
};

export const ESTADO_ASIGNACION_COLOR: Record<string, string> = {
  ASIGNADO:               'badge-info',
  TOMADO:                 'badge-warning',
  ASISTENCIA_REGISTRADA:  'badge-success',
  ENVIADO_MEDICO:         'badge-teal',
  CANCELADO:              'badge-danger',
  REASIGNADO:             'badge-neutral',
};

export const ESTADO_ASIGNACION_LABEL: Record<string, string> = {
  ASIGNADO:               'En espera',
  TOMADO:                 'En ventanilla',
  ASISTENCIA_REGISTRADA:  'Asistencia OK',
  ENVIADO_MEDICO:         'Con médico',
  CANCELADO:              'Cancelado',
  REASIGNADO:             'Reasignado',
};