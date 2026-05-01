// =============================================================================
// Tipos del módulo Dev4 — Consulta Médica, Historia Clínica, Recetas y Órdenes
// =============================================================================

export interface SignosVitales {
  presionSistolica?: number | null;
  presionDiastolica?: number | null;
  frecuenciaCardiaca?: number | null;
  frecuenciaRespiratoria?: number | null;
  temperatura?: number | null;
  saturacionOxigeno?: number | null;
  pesoKg?: number | null;
  tallaCm?: number | null;
  imc?: number | null;
}

export interface DiagnosticoItem {
  diagnosticoId: number;
  codigoCie: string;
  descripcion: string;
  tipoDiagnostico: string;
}

export interface NotaCorreccion {
  notaId: number;
  nota: string;
  usuarioNombre: string;
  fechaCreacion: string;
}

export interface ConsultaResponse {
  consultaId: number;
  ticketId: number;
  pacienteId: number;
  pacienteNombre: string;
  medicoId: number;
  medicoNombre: string;
  estado: string;
  modalidad: string;
  motivoConsulta?: string | null;
  hallazgos?: string | null;
  plan?: string | null;
  fechaHoraInicio: string;
  fechaHoraCierre?: string | null;
  signosVitales?: SignosVitales | null;
  diagnosticos: DiagnosticoItem[];
  notasCorreccion: NotaCorreccion[];
}

export interface ConsultaResumen {
  consultaId: number;
  medicoNombre: string;
  estado: string;
  motivoConsulta?: string | null;
  fechaHoraInicio: string;
  fechaHoraCierre?: string | null;
  totalDiagnosticos: number;
  totalRecetas: number;
  totalOrdenes: number;
}

export interface HistorialClinicoResponse {
  pacienteId: number;
  pacienteNombre: string;
  consultas: ConsultaResumen[];
}

export interface RecetaItem {
  medicamentoId: number;
  nombreComercial: string;
  principioActivo: string;
  dosis: string;
  frecuencia: string;
  duracionDias: number;
  indicaciones?: string | null;
}

export interface RecetaResponse {
  recetaId: number;
  consultaId: number;
  pacienteId: number;
  pacienteNombre: string;
  medicoNombre: string;
  estado: string;
  fechaEmision: string;
  fechaDespacho?: string | null;
  items: RecetaItem[];
}

export interface OrdenHistorial {
  estadoAnterior: string;
  estadoNuevo: string;
  observacion?: string | null;
  usuarioNombre: string;
  fechaCambio: string;
}

export interface OrdenResponse {
  ordenId: number;
  consultaId: number;
  pacienteId: number;
  pacienteNombre: string;
  medicoNombre: string;
  tipoOrden: string;
  descripcion: string;
  estado: string;
  urgente?: boolean;
  fechaEmision: string;
  historial: OrdenHistorial[];
}

export interface ListaOrdenesResponse {
  total: number;
  items: OrdenResponse[];
}

// =============================================================================
// Request types
// =============================================================================

export interface AbrirConsultaRequest {
  ticketId: number;
  modalidad?: string;
  usuarioId?: number;
}

export interface DiagnosticoRequest {
  codigoCIE10: string;
  descripcionCIE10: string;
  tipoDiagnostico: string;
  notas?: string;
}

export interface CerrarConsultaRequest {
  hallazgos?: string;
  plan?: string;
  observaciones?: string;
  usuarioId?: number;
  diagnosticos: DiagnosticoRequest[];
  presionSistolica?: number;
  presionDiastolica?: number;
  frecuenciaCardiaca?: number;
  frecuenciaRespiratoria?: number;
  temperatura?: number;
  saturacionOxigeno?: number;
  pesoKg?: number;
  tallaCm?: number;
}

export interface NotaCorreccionRequest {
  nota: string;
  usuarioId?: number;
}

export interface MedicamentoItemRequest {
  medicamentoId: number;
  dosis: string;
  frecuencia: string;
  duracionDias: number;
  cantidad?: number;
  indicaciones?: string;
}

export interface CrearRecetaRequest {
  consultaId: number;
  usuarioId?: number;
  items: MedicamentoItemRequest[];
}

export interface CrearOrdenRequest {
  consultaId: number;
  tipoOrden: string;
  descripcion: string;
  urgencia?: string;
  usuarioId?: number;
}

export interface ActualizarEstadoOrdenRequest {
  nuevoEstado: string;
  observacion?: string;
  usuarioId?: number;
}
