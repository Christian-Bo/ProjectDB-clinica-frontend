export type EstadoRegistro = 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO';
export type EstadoOrdenCompra = 'BORRADOR' | 'APROBADA' | 'ENVIADA' | 'RECIBIDA_PARCIAL' | 'RECIBIDA' | 'CANCELADA';
export type TipoMovimientoInventario = 'ENTRADA' | 'SALIDA' | 'AJUSTE' | 'DEVOLUCION' | 'VENCIMIENTO';
export type CanalNotificacion = 'EMAIL' | 'WHATSAPP' | 'SMS' | 'PUSH' | 'SISTEMA';
export type EstadoSesionTelemedica = 'PROGRAMADA' | 'ACTIVA' | 'FINALIZADA' | 'CANCELADA';
export type TipoConceptoCuenta = 'CONSULTA' | 'MEDICAMENTO' | 'PROCEDIMIENTO' | 'LAB' | 'IMAGEN' | 'OTRO';

export interface SpResult {
  httpStatus?: number;
  codigo?: string;
  mensaje?: string;
  idGenerado?: number;
  idActualizado?: number;
  cuentaId?: number;
  pagoId?: number;
  ordenCompraId?: number;
  ordenCompraDetalleId?: number;
  movimientoId?: number;
  stockResultante?: number;
  notificacionId?: number;
  sesionTeleId?: number;
  registros?: number;
  [key: string]: string | number | boolean | null | undefined;
}

export interface Medicamento {
  medicamentoId: number;
  codigoInterno: string;
  codigoBarras?: string | null;
  nombre: string;
  nombreGenerico?: string | null;
  principioActivo: string;
  tipo: string;
  presentacion?: string | null;
  concentracionDescripcion?: string | null;
  unidadMedida: string;
  requiereReceta: boolean;
  controladoPorSalud: boolean;
  precioCompra?: number | null;
  precioVenta: number;
  stockMinimo: number;
  estado: EstadoRegistro | string;
}

export interface MedicamentoUpsertRequest {
  medicamentoId?: number | null;
  codigoInterno: string;
  codigoBarras?: string | null;
  nombre: string;
  nombreGenerico?: string | null;
  principioActivo: string;
  tipo: string;
  presentacion?: string | null;
  concentracionDescripcion?: string | null;
  unidadMedida: string;
  requiereReceta: boolean;
  controladoPorSalud: boolean;
  precioCompra?: number | null;
  precioVenta: number;
  stockMinimo: number;
  estado: EstadoRegistro | string;
}

export interface Proveedor {
  proveedorId: number;
  nombre: string;
  nit?: string | null;
  contacto?: string | null;
  telefono?: string | null;
  correoElectronico?: string | null;
  direccion?: string | null;
  estado: EstadoRegistro | string;
  fechaRegistro?: string | null;
}

export interface ProveedorUpsertRequest {
  proveedorId?: number | null;
  nombre: string;
  nit?: string | null;
  contacto?: string | null;
  telefono?: string | null;
  correoElectronico?: string | null;
  direccion?: string | null;
  estado: EstadoRegistro | string;
}

export interface OrdenCompra {
  ordenCompraId: number;
  proveedorId: number;
  numeroOrden: string;
  estado: EstadoOrdenCompra | string;
  fechaEmision: string;
  fechaEntregaPact?: string | null;
  fechaRecepcion?: string | null;
  subtotal: number;
  impuesto: number;
  total: number;
  observaciones?: string | null;
  creadoPor: number;
  aprobadoPor?: number | null;
  fechaAprobacion?: string | null;
  fechaCreacion?: string | null;
}

export interface OrdenCompraDetalle {
  ordenCompraDetalleId: number;
  ordenCompraId: number;
  medicamentoId: number;
  cantidadSolicitada: number;
  cantidadRecibida: number;
  precioUnitario: number;
  subtotalLinea: number;
  fechaVencimientoLote?: string | null;
  loteProveedor?: string | null;
}

export interface CrearOrdenCompraRequest {
  proveedorId: number;
  numeroOrden: string;
  fechaEmision?: string | null;
  fechaEntregaPact?: string | null;
  observaciones?: string | null;
  creadoPor: number;
}

export interface AgregarDetalleOrdenCompraRequest {
  ordenCompraId: number;
  medicamentoId: number;
  cantidadSolicitada: number;
  precioUnitario: number;
  fechaVencimientoLote?: string | null;
  loteProveedor?: string | null;
}

export interface ActualizarEstadoOrdenCompraRequest {
  ordenCompraId: number;
  estado: EstadoOrdenCompra | string;
  aprobadoPor?: number | null;
}

export interface RegistrarRecepcionOrdenCompraRequest {
  ordenCompraDetalleId: number;
  cantidadRecibida: number;
  fechaVencimientoLote?: string | null;
  codigoLote?: string | null;
  usuarioId: number;
}

export interface RegistrarMovimientoInventarioRequest {
  medicamentoId: number;
  tipoMovimiento: TipoMovimientoInventario | string;
  cantidad: number;
  origenTipo?: string | null;
  origenId?: number | null;
  recetaDetalleId?: number | null;
  costo?: number | null;
  precioUnitario?: number | null;
  referencia?: string | null;
  observaciones?: string | null;
  usuarioId: number;
  loteId?: number | null;
}

export interface DespacharRecetaRequest {
  recetaId: number;
  usuarioId: number;
  observaciones?: string | null;
}

export interface DetalleCuentaRequest {
  tipoConcepto: TipoConceptoCuenta | string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
}

export interface GenerarCuentaDesdeCitaRequest {
  citaId: number;
  creadoPor?: number | null;
  detalles: DetalleCuentaRequest[];
}

export interface RegistrarPagoCuentaRequest {
  cuentaId: number;
  metodoPagoId: number;
  monto: number;
  referencia?: string | null;
  comprobanteUrl?: string | null;
  observaciones?: string | null;
  registradoPor?: number | null;
}

export interface PlantillaNotificacion {
  plantillaId: number;
  tipoEvento: string;
  canal: CanalNotificacion | string;
  asunto?: string | null;
  cuerpo: string;
  variablesJSON?: string | null;
  activo: boolean;
  fechaCreacion?: string | null;
  fechaModificacion?: string | null;
}

export interface PlantillaNotificacionUpsertRequest {
  plantillaId?: number | null;
  tipoEvento: string;
  canal: CanalNotificacion | string;
  asunto?: string | null;
  cuerpo: string;
  variablesJSON?: string | null;
  activo: boolean;
  fechaModificacion?: string | null;
}

export interface EncolarNotificacionRequest {
  pacienteId?: number | null;
  usuarioId?: number | null;
  tipoEvento: string;
  canal: CanalNotificacion | string;
  destinatario: string;
  asunto?: string | null;
  cuerpo: string;
  fechaProgramada: string;
  maxIntentos: number;
  metadatosJSON?: string | null;
}

export interface ColaNotificacion {
  notificacionId: number;
  pacienteId?: number | null;
  usuarioId?: number | null;
  tipoEvento: string;
  canal: CanalNotificacion | string;
  destinatario: string;
  asunto?: string | null;
  cuerpo: string;
  estado: string;
  intentos: number;
  maxIntentos: number;
  fechaCreacion: string;
  fechaProgramada: string;
  fechaEnvio?: string | null;
  motivoFallo?: string | null;
  referenciaExternaId?: string | null;
  metadatosJSON?: string | null;
}

export interface SesionTelemedica {
  sesionTeleId: number;
  citaId: number;
  consultaId?: number | null;
  plataformaVideoId?: number | null;
  urlSala: string;
  codigoSala: string;
  passwordSala?: string | null;
  estado: EstadoSesionTelemedica | string;
  fechaCreacion?: string | null;
  fechaInicioReal?: string | null;
  fechaFinReal?: string | null;
  grabacionUrl?: string | null;
  notasSesion?: string | null;
  tokenMedico?: string | null;
  tokenPaciente?: string | null;
  tokenExpiracion?: string | null;
}

export interface SesionTelemedicaUpsertRequest {
  sesionTeleId?: number | null;
  citaId: number;
  consultaId?: number | null;
  plataformaVideoId?: number | null;
  urlSala: string;
  codigoSala: string;
  passwordSala?: string | null;
  estado: EstadoSesionTelemedica | string;
  fechaInicioReal?: string | null;
  fechaFinReal?: string | null;
  grabacionUrl?: string | null;
  notasSesion?: string | null;
  tokenMedico?: string | null;
  tokenPaciente?: string | null;
  tokenExpiracion?: string | null;
}
