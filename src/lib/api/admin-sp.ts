import { apiClient } from '@/lib/api/client';
import type {
  ActualizarEstadoOrdenCompraRequest,
  AgregarDetalleOrdenCompraRequest,
  ColaNotificacion,
  CrearOrdenCompraRequest,
  DespacharRecetaRequest,
  EncolarNotificacionRequest,
  GenerarCuentaDesdeCitaRequest,
  Medicamento,
  MedicamentoUpsertRequest,
  OrdenCompra,
  PlantillaNotificacion,
  PlantillaNotificacionUpsertRequest,
  Proveedor,
  ProveedorUpsertRequest,
  RegistrarMovimientoInventarioRequest,
  RegistrarPagoCuentaRequest,
  RegistrarRecepcionOrdenCompraRequest,
  SesionTelemedica,
  SesionTelemedicaUpsertRequest,
  SpResult,
} from '@/features/admin-sp/models/types';

// Rutas verificadas contra la colección Postman "Módulo 5 — Clínica Integral".
// Este es el punto único de integración para el módulo de administración de SPs.
export const adminSpEndpoints = {
  medicamentos: '/api/medicamentos',
  proveedores: '/api/proveedores',
  compras: '/api/compras',
  comprasRecepcion: '/api/compras/recepcion',
  movimientosInventario: '/api/inventario/movimientos',
  recetas: '/api/recetas',
  generarCuenta: '/api/cuentas/generar-desde-cita',
  pagos: '/api/pagos',
  plantillasNotificacion: '/api/notificaciones/plantillas',
  encolarNotificacion: '/api/notificaciones/encolar',
  notificacionesPendientes: '/api/notificaciones/pendientes',
  procesarNotificaciones: '/api/notificaciones/procesar',
  sesionesTelemedicas: '/api/telemedicina/sesiones',
  ejecutarEtl: '/api/reportes/etl-ejecutar',
} as const;

const removeKeys = <T extends Record<string, unknown>>(source: T, keys: string[]) => {
  const clone: Record<string, unknown> = { ...source };
  keys.forEach((key) => delete clone[key]);
  return clone;
};

export const adminSpApi = {
  listarMedicamentos: (filters?: { estado?: string | null; texto?: string | null }) =>
    apiClient.get<Medicamento[]>(adminSpEndpoints.medicamentos, filters),

  guardarMedicamento: (request: MedicamentoUpsertRequest) =>
    apiClient.post<SpResult>(adminSpEndpoints.medicamentos, request, true),

  listarProveedores: (filters?: { estado?: string | null; texto?: string | null }) =>
    apiClient.get<Proveedor[]>(adminSpEndpoints.proveedores, filters),

  guardarProveedor: (request: ProveedorUpsertRequest) =>
    apiClient.post<SpResult>(adminSpEndpoints.proveedores, request, true),

  listarOrdenesCompra: (filters?: {
    proveedorId?: number | null;
    estado?: string | null;
    fechaDesde?: string | null;
    fechaHasta?: string | null;
  }) => apiClient.get<OrdenCompra[]>(adminSpEndpoints.compras, filters),

  crearOrdenCompra: (request: CrearOrdenCompraRequest) =>
    apiClient.post<SpResult>(adminSpEndpoints.compras, request, true),

  agregarDetalleOrdenCompra: (request: AgregarDetalleOrdenCompraRequest) =>
    apiClient.post<SpResult>(
      `${adminSpEndpoints.compras}/${request.ordenCompraId}/detalle`,
      removeKeys(request as unknown as Record<string, unknown>, ['ordenCompraId']),
      true,
    ),

  actualizarEstadoOrdenCompra: (request: ActualizarEstadoOrdenCompraRequest) =>
    apiClient.patch<SpResult>(
      `${adminSpEndpoints.compras}/${request.ordenCompraId}/estado`,
      removeKeys(request as unknown as Record<string, unknown>, ['ordenCompraId']),
      true,
    ),

  registrarRecepcionOrdenCompra: (request: RegistrarRecepcionOrdenCompraRequest) =>
    apiClient.post<SpResult>(adminSpEndpoints.comprasRecepcion, request, true),

  registrarMovimientoInventario: (request: RegistrarMovimientoInventarioRequest) =>
    apiClient.post<SpResult>(adminSpEndpoints.movimientosInventario, request, true),

  despacharReceta: (request: DespacharRecetaRequest) =>
    apiClient.post<SpResult>(
      `${adminSpEndpoints.recetas}/${request.recetaId}/despachar${request.observaciones ? `?observaciones=${encodeURIComponent(request.observaciones)}` : ''}`,
      undefined,
      true,
    ),

  generarCuentaDesdeCita: (request: GenerarCuentaDesdeCitaRequest) =>
    apiClient.post<SpResult>(adminSpEndpoints.generarCuenta, request, true),

  registrarPagoCuenta: (request: RegistrarPagoCuentaRequest) =>
    apiClient.post<SpResult>(adminSpEndpoints.pagos, request, true),

  listarPlantillasNotificacion: (filters?: {
    tipoEvento?: string | null;
    canal?: string | null;
    activo?: boolean | null;
  }) => apiClient.get<PlantillaNotificacion[]>(adminSpEndpoints.plantillasNotificacion, {
    tipoEvento: filters?.tipoEvento,
    canal: filters?.canal,
    activo: filters?.activo === null || filters?.activo === undefined ? null : String(filters.activo),
  }),

  guardarPlantillaNotificacion: (request: PlantillaNotificacionUpsertRequest) =>
    apiClient.post<SpResult>(adminSpEndpoints.plantillasNotificacion, request, true),

  encolarNotificacion: (request: EncolarNotificacionRequest) =>
    apiClient.post<SpResult>(adminSpEndpoints.encolarNotificacion, request, true),

  listarNotificacionesPendientes: (filters?: { canal?: string | null; maxRegistros?: number | null }) =>
    apiClient.get<ColaNotificacion[]>(adminSpEndpoints.notificacionesPendientes, filters),

  procesarColaNotificaciones: () =>
    apiClient.post<SpResult>(adminSpEndpoints.procesarNotificaciones, undefined, true),

  listarSesionesTelemedicas: (filters?: {
    estado?: string | null;
    fechaDesde?: string | null;
    fechaHasta?: string | null;
  }) => apiClient.get<SesionTelemedica[]>(adminSpEndpoints.sesionesTelemedicas, filters),

  guardarSesionTelemedica: (request: SesionTelemedicaUpsertRequest) =>
    apiClient.post<SpResult>(adminSpEndpoints.sesionesTelemedicas, request, true),

  ejecutarEtlDw: () => apiClient.post<SpResult>(adminSpEndpoints.ejecutarEtl, undefined, true),
};
