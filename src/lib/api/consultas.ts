import { apiClient } from '@/lib/api/client';
import type {
  AbrirConsultaRequest,
  ActualizarEstadoOrdenRequest,
  CerrarConsultaRequest,
  ConsultaResponse,
  CrearOrdenRequest,
  CrearRecetaRequest,
  HistorialClinicoResponse,
  ListaOrdenesResponse,
  NotaCorreccionRequest,
  OrdenResponse,
  RecetaResponse,
} from '@/lib/api/consultas.types';

export const consultasApi = {
  // Consultas
  abrirDesdeTicket: (request: AbrirConsultaRequest) =>
    apiClient.post<ConsultaResponse>('/api/consultas/abrir-desde-ticket', request),

  cerrar: (consultaId: number, request: CerrarConsultaRequest) =>
    apiClient.post<ConsultaResponse>(`/api/consultas/${consultaId}/cerrar`, request),

  agregarCorreccion: (consultaId: number, request: NotaCorreccionRequest) =>
    apiClient.post<ConsultaResponse>(`/api/consultas/${consultaId}/correcciones`, request),

  obtener: (consultaId: number) =>
    apiClient.get<ConsultaResponse>(`/api/consultas/${consultaId}`),

  // Historial
  obtenerHistorial: (pacienteId: number) =>
    apiClient.get<HistorialClinicoResponse>(`/api/pacientes/${pacienteId}/historial`),

  // Recetas
  crearReceta: (request: CrearRecetaRequest) =>
    apiClient.post<RecetaResponse>('/api/recetas', request),

  obtenerReceta: (recetaId: number) =>
    apiClient.get<RecetaResponse>(`/api/recetas/${recetaId}`),

  // Órdenes
  crearOrden: (request: CrearOrdenRequest) =>
    apiClient.post<OrdenResponse>('/api/ordenes', request),

  obtenerOrden: (ordenId: number) =>
    apiClient.get<OrdenResponse>(`/api/ordenes/${ordenId}`),

  listarOrdenes: (filters?: Record<string, string | number | undefined | null>) =>
    apiClient.get<ListaOrdenesResponse>('/api/ordenes', filters),

  actualizarEstadoOrden: (ordenId: number, request: ActualizarEstadoOrdenRequest) =>
    apiClient.post<OrdenResponse>(`/api/ordenes/${ordenId}/estado`, request),
};
