'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminSpApi } from '@/lib/api/admin-sp';
import { session } from '@/lib/auth/session';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Modal } from '@/shared/components/ui/Modal';
import { useToast } from '@/shared/components/providers/ToastProvider';
import { DataTable } from '@/features/admin-sp/components/DataTable';
import { CheckboxField, SelectField, TextAreaField, TextField } from '@/features/admin-sp/components/FormField';
import { OperationCard, ResultBox } from '@/features/admin-sp/components/OperationCard';
import type {
  CanalNotificacion,
  DetalleCuentaRequest,
  EstadoOrdenCompra,
  EstadoRegistro,
  EstadoSesionTelemedica,
  Medicamento,
  OrdenCompra,
  PlantillaNotificacion,
  Proveedor,
  SesionTelemedica,
  SpResult,
  TipoConceptoCuenta,
  TipoMovimientoInventario,
} from '@/features/admin-sp/models/types';

type TabKey = 'farmacia' | 'finanzas' | 'notificaciones' | 'telemedicina' | 'dw';

type ModalKind =
  | 'medicamento'
  | 'proveedor'
  | 'orden'
  | 'detalle-orden'
  | 'estado-orden'
  | 'recepcion-orden'
  | 'movimiento'
  | 'despachar-receta'
  | 'cuenta'
  | 'pago'
  | 'plantilla'
  | 'encolar-notificacion'
  | 'sesion-telemedica';

const TABS: { key: TabKey; label: string; description: string }[] = [
  { key: 'farmacia', label: 'Farmacia e inventario', description: 'Medicamentos, proveedores, órdenes de compra, movimientos y despacho.' },
  { key: 'finanzas', label: 'Cuentas y pagos', description: 'Generación de cuentas desde citas y registro de pagos.' },
  { key: 'notificaciones', label: 'Notificaciones', description: 'Plantillas, cola, pendientes y procesamiento.' },
  { key: 'telemedicina', label: 'Telemedicina', description: 'Sesiones, salas, enlaces y estados.' },
  { key: 'dw', label: 'Data Warehouse', description: 'Carga incremental y control ETL.' },
];

const ESTADOS_REGISTRO: EstadoRegistro[] = ['ACTIVO', 'INACTIVO', 'SUSPENDIDO'];
const ESTADOS_ORDEN: EstadoOrdenCompra[] = ['BORRADOR', 'APROBADA', 'ENVIADA', 'RECIBIDA_PARCIAL', 'RECIBIDA', 'CANCELADA'];
const TIPOS_MOVIMIENTO: TipoMovimientoInventario[] = ['ENTRADA', 'SALIDA', 'AJUSTE', 'DEVOLUCION', 'VENCIMIENTO'];
const CANALES: CanalNotificacion[] = ['EMAIL', 'WHATSAPP', 'SMS', 'PUSH', 'SISTEMA'];
const ESTADOS_SESION: EstadoSesionTelemedica[] = ['PROGRAMADA', 'ACTIVA', 'FINALIZADA', 'CANCELADA'];
const TIPOS_CONCEPTO: TipoConceptoCuenta[] = ['CONSULTA', 'MEDICAMENTO', 'PROCEDIMIENTO', 'LAB', 'IMAGEN', 'OTRO'];

const estadoBadge = (estado?: string | null) => {
  if (!estado) return 'badge-neutral';
  if (['ACTIVO', 'PAGADA', 'RECIBIDA', 'ENVIADA', 'PROGRAMADA', 'ACTIVA', 'FINALIZADA'].includes(estado)) return 'badge-success';
  if (['BORRADOR', 'PENDIENTE', 'PARCIAL', 'RECIBIDA_PARCIAL', 'REINTENTO'].includes(estado)) return 'badge-warning';
  if (['INACTIVO', 'SUSPENDIDO', 'CANCELADA', 'FALLIDA', 'ANULADA'].includes(estado)) return 'badge-danger';
  return 'badge-neutral';
};

const optionsFrom = (values: string[], includeEmpty = false) => [
  ...(includeEmpty ? [{ value: '', label: 'Todos' }] : []),
  ...values.map((value) => ({ value, label: value.replaceAll('_', ' ') })),
];

const toNumber = (value: string, field: string) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${field} debe ser numérico.`);
  }
  return parsed;
};

const toNullableNumber = (value: string) => {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toNullableText = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const money = (value?: number | null) => `Q ${Number(value ?? 0).toFixed(2)}`;

const nowLocalInput = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

const normalizeDateTime = (value: string) => (value ? new Date(value).toISOString() : null);

const getCurrentUserId = () => session.getUser()?.usuarioId ?? 0;

const defaultMedicamentoForm = () => ({
  medicamentoId: '',
  codigoInterno: '',
  codigoBarras: '',
  nombre: '',
  nombreGenerico: '',
  principioActivo: '',
  tipo: 'ALOPÁTICO',
  presentacion: '',
  concentracionDescripcion: '',
  unidadMedida: 'UNIDAD',
  requiereReceta: true,
  controladoPorSalud: false,
  precioCompra: '',
  precioVenta: '',
  stockMinimo: '10',
  estado: 'ACTIVO' as EstadoRegistro,
});

const defaultProveedorForm = () => ({
  proveedorId: '',
  nombre: '',
  nit: '',
  contacto: '',
  telefono: '',
  correoElectronico: '',
  direccion: '',
  estado: 'ACTIVO' as EstadoRegistro,
});

const defaultOrdenForm = () => ({
  proveedorId: '',
  numeroOrden: '',
  fechaEmision: new Date().toISOString().slice(0, 10),
  fechaEntregaPact: '',
  observaciones: '',
});

const defaultDetalleOrdenForm = () => ({
  ordenCompraId: '',
  medicamentoId: '',
  cantidadSolicitada: '1',
  precioUnitario: '',
  fechaVencimientoLote: '',
  loteProveedor: '',
});

const defaultEstadoOrdenForm = () => ({
  ordenCompraId: '',
  estado: 'APROBADA' as EstadoOrdenCompra,
});

const defaultRecepcionOrdenForm = () => ({
  ordenCompraDetalleId: '',
  cantidadRecibida: '1',
  fechaVencimientoLote: '',
  codigoLote: '',
});

const defaultMovimientoForm = () => ({
  medicamentoId: '',
  tipoMovimiento: 'ENTRADA' as TipoMovimientoInventario,
  cantidad: '1',
  origenTipo: '',
  origenId: '',
  recetaDetalleId: '',
  costo: '',
  precioUnitario: '',
  referencia: '',
  observaciones: '',
  loteId: '',
});

const defaultDespachoForm = () => ({ recetaId: '', observaciones: '' });

const defaultCuentaForm = () => ({
  citaId: '',
  tipoConcepto: 'CONSULTA' as TipoConceptoCuenta,
  descripcion: '',
  cantidad: '1',
  precioUnitario: '',
});

const defaultPagoForm = () => ({
  cuentaId: '',
  metodoPagoId: '',
  monto: '',
  referencia: '',
  comprobanteUrl: '',
  observaciones: '',
});

const defaultPlantillaForm = () => ({
  plantillaId: '',
  tipoEvento: '',
  canal: 'EMAIL' as CanalNotificacion,
  asunto: '',
  cuerpo: '',
  variablesJSON: '',
  activo: true,
});

const defaultEncolarForm = () => ({
  pacienteId: '',
  usuarioId: '',
  tipoEvento: '',
  canal: 'EMAIL' as CanalNotificacion,
  destinatario: '',
  asunto: '',
  cuerpo: '',
  fechaProgramada: nowLocalInput(),
  maxIntentos: '3',
  metadatosJSON: '',
});

const defaultSesionForm = () => ({
  sesionTeleId: '',
  citaId: '',
  consultaId: '',
  plataformaVideoId: '',
  urlSala: '',
  codigoSala: '',
  passwordSala: '',
  estado: 'PROGRAMADA' as EstadoSesionTelemedica,
  fechaInicioReal: '',
  fechaFinReal: '',
  grabacionUrl: '',
  notasSesion: '',
  tokenMedico: '',
  tokenPaciente: '',
  tokenExpiracion: '',
});

export default function AdminProcedimientosPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>('farmacia');
  const [modal, setModal] = useState<ModalKind | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<SpResult | null>(null);

  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>([]);
  const [plantillas, setPlantillas] = useState<PlantillaNotificacion[]>([]);
  const [pendientes, setPendientes] = useState<import('@/features/admin-sp/models/types').ColaNotificacion[]>([]);
  const [sesiones, setSesiones] = useState<SesionTelemedica[]>([]);

  const [loadingFarmacia, setLoadingFarmacia] = useState(true);
  const [loadingNotificaciones, setLoadingNotificaciones] = useState(false);
  const [loadingTelemedicina, setLoadingTelemedicina] = useState(false);

  const [medicamentoFiltro, setMedicamentoFiltro] = useState({ estado: 'ACTIVO', texto: '' });
  const [proveedorFiltro, setProveedorFiltro] = useState({ estado: 'ACTIVO', texto: '' });
  const [ordenFiltro, setOrdenFiltro] = useState({ estado: '', proveedorId: '', fechaDesde: '', fechaHasta: '' });
  const [plantillaFiltro, setPlantillaFiltro] = useState({ tipoEvento: '', canal: '', activo: '' });
  const [pendienteFiltro, setPendienteFiltro] = useState({ canal: '', maxRegistros: '100' });
  const [sesionFiltro, setSesionFiltro] = useState({ estado: '', fechaDesde: '', fechaHasta: '' });

  const [medicamentoForm, setMedicamentoForm] = useState(defaultMedicamentoForm);
  const [proveedorForm, setProveedorForm] = useState(defaultProveedorForm);
  const [ordenForm, setOrdenForm] = useState(defaultOrdenForm);
  const [detalleOrdenForm, setDetalleOrdenForm] = useState(defaultDetalleOrdenForm);
  const [estadoOrdenForm, setEstadoOrdenForm] = useState(defaultEstadoOrdenForm);
  const [recepcionOrdenForm, setRecepcionOrdenForm] = useState(defaultRecepcionOrdenForm);
  const [movimientoForm, setMovimientoForm] = useState(defaultMovimientoForm);
  const [despachoForm, setDespachoForm] = useState(defaultDespachoForm);
  const [cuentaForm, setCuentaForm] = useState(defaultCuentaForm);
  const [cuentaDetalles, setCuentaDetalles] = useState<DetalleCuentaRequest[]>([]);
  const [pagoForm, setPagoForm] = useState(defaultPagoForm);
  const [plantillaForm, setPlantillaForm] = useState(defaultPlantillaForm);
  const [encolarForm, setEncolarForm] = useState(defaultEncolarForm);
  const [sesionForm, setSesionForm] = useState(defaultSesionForm);

  const selectedTab = useMemo(() => TABS.find((tab) => tab.key === activeTab) ?? TABS[0], [activeTab]);

  const loadFarmacia = useCallback(async () => {
    setLoadingFarmacia(true);
    try {
      const [medicamentosRes, proveedoresRes, ordenesRes] = await Promise.all([
        adminSpApi.listarMedicamentos({
          estado: medicamentoFiltro.estado || null,
          texto: medicamentoFiltro.texto || null,
        }),
        adminSpApi.listarProveedores({
          estado: proveedorFiltro.estado || null,
          texto: proveedorFiltro.texto || null,
        }),
        adminSpApi.listarOrdenesCompra({
          estado: ordenFiltro.estado || null,
          proveedorId: toNullableNumber(ordenFiltro.proveedorId),
          fechaDesde: ordenFiltro.fechaDesde || null,
          fechaHasta: ordenFiltro.fechaHasta || null,
        }),
      ]);
      setMedicamentos(medicamentosRes.data);
      setProveedores(proveedoresRes.data);
      setOrdenes(ordenesRes.data);
    } catch (error) {
      toast.error('No se pudo cargar farmacia', error instanceof Error ? error.message : 'Error desconocido.');
    } finally {
      setLoadingFarmacia(false);
    }
  }, [medicamentoFiltro, proveedorFiltro, ordenFiltro, toast]);

  const loadNotificaciones = useCallback(async () => {
    setLoadingNotificaciones(true);
    try {
      const [plantillasRes, pendientesRes] = await Promise.all([
        adminSpApi.listarPlantillasNotificacion({
          tipoEvento: plantillaFiltro.tipoEvento || null,
          canal: plantillaFiltro.canal || null,
          activo: plantillaFiltro.activo === '' ? null : plantillaFiltro.activo === 'true',
        }),
        adminSpApi.listarNotificacionesPendientes({
          canal: pendienteFiltro.canal || null,
          maxRegistros: toNullableNumber(pendienteFiltro.maxRegistros) ?? 100,
        }),
      ]);
      setPlantillas(plantillasRes.data);
      setPendientes(pendientesRes.data);
    } catch (error) {
      toast.error('No se pudieron cargar notificaciones', error instanceof Error ? error.message : 'Error desconocido.');
    } finally {
      setLoadingNotificaciones(false);
    }
  }, [pendienteFiltro, plantillaFiltro, toast]);

  const loadTelemedicina = useCallback(async () => {
    setLoadingTelemedicina(true);
    try {
      const res = await adminSpApi.listarSesionesTelemedicas({
        estado: sesionFiltro.estado || null,
        fechaDesde: sesionFiltro.fechaDesde ? normalizeDateTime(sesionFiltro.fechaDesde) : null,
        fechaHasta: sesionFiltro.fechaHasta ? normalizeDateTime(sesionFiltro.fechaHasta) : null,
      });
      setSesiones(res.data);
    } catch (error) {
      toast.error('No se pudo cargar telemedicina', error instanceof Error ? error.message : 'Error desconocido.');
    } finally {
      setLoadingTelemedicina(false);
    }
  }, [sesionFiltro, toast]);

  useEffect(() => { void loadFarmacia(); }, [loadFarmacia]);
  useEffect(() => { if (activeTab === 'notificaciones') void loadNotificaciones(); }, [activeTab, loadNotificaciones]);
  useEffect(() => { if (activeTab === 'telemedicina') void loadTelemedicina(); }, [activeTab, loadTelemedicina]);

  function openModal(kind: ModalKind) {
    setLastResult(null);
    setModal(kind);
  }

  function closeModal() {
    if (!submitting) setModal(null);
  }

  async function submitAction(action: () => Promise<SpResult>, successTitle: string, after?: () => Promise<void> | void) {
    setSubmitting(true);
    setLastResult(null);
    try {
      const result = await action();
      setLastResult(result);
      toast.success(successTitle, result.mensaje ?? result.codigo ?? 'Operación realizada correctamente.');
      await after?.();
    } catch (error) {
      toast.error('Operación no completada', error instanceof Error ? error.message : 'Error desconocido.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMedicamentoSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitAction(async () => {
      const res = await adminSpApi.guardarMedicamento({
        medicamentoId: toNullableNumber(medicamentoForm.medicamentoId),
        codigoInterno: medicamentoForm.codigoInterno.trim(),
        codigoBarras: toNullableText(medicamentoForm.codigoBarras),
        nombre: medicamentoForm.nombre.trim(),
        nombreGenerico: toNullableText(medicamentoForm.nombreGenerico),
        principioActivo: medicamentoForm.principioActivo.trim(),
        tipo: medicamentoForm.tipo.trim(),
        presentacion: toNullableText(medicamentoForm.presentacion),
        concentracionDescripcion: toNullableText(medicamentoForm.concentracionDescripcion),
        unidadMedida: medicamentoForm.unidadMedida.trim(),
        requiereReceta: medicamentoForm.requiereReceta,
        controladoPorSalud: medicamentoForm.controladoPorSalud,
        precioCompra: toNullableNumber(medicamentoForm.precioCompra),
        precioVenta: toNumber(medicamentoForm.precioVenta, 'Precio venta'),
        stockMinimo: toNumber(medicamentoForm.stockMinimo, 'Stock mínimo'),
        estado: medicamentoForm.estado,
      });
      return res.data;
    }, 'Medicamento guardado', loadFarmacia);
  }

  async function handleProveedorSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitAction(async () => {
      const res = await adminSpApi.guardarProveedor({
        proveedorId: toNullableNumber(proveedorForm.proveedorId),
        nombre: proveedorForm.nombre.trim(),
        nit: toNullableText(proveedorForm.nit),
        contacto: toNullableText(proveedorForm.contacto),
        telefono: toNullableText(proveedorForm.telefono),
        correoElectronico: toNullableText(proveedorForm.correoElectronico),
        direccion: toNullableText(proveedorForm.direccion),
        estado: proveedorForm.estado,
      });
      return res.data;
    }, 'Proveedor guardado', loadFarmacia);
  }

  async function handleOrdenSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitAction(async () => {
      const res = await adminSpApi.crearOrdenCompra({
        proveedorId: toNumber(ordenForm.proveedorId, 'ProveedorId'),
        numeroOrden: ordenForm.numeroOrden.trim(),
        fechaEmision: ordenForm.fechaEmision || null,
        fechaEntregaPact: ordenForm.fechaEntregaPact || null,
        observaciones: toNullableText(ordenForm.observaciones),
        creadoPor: getCurrentUserId(),
      });
      return res.data;
    }, 'Orden de compra creada', loadFarmacia);
  }

  async function handleDetalleOrdenSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitAction(async () => {
      const res = await adminSpApi.agregarDetalleOrdenCompra({
        ordenCompraId: toNumber(detalleOrdenForm.ordenCompraId, 'OrdenCompraId'),
        medicamentoId: toNumber(detalleOrdenForm.medicamentoId, 'MedicamentoId'),
        cantidadSolicitada: toNumber(detalleOrdenForm.cantidadSolicitada, 'Cantidad solicitada'),
        precioUnitario: toNumber(detalleOrdenForm.precioUnitario, 'Precio unitario'),
        fechaVencimientoLote: detalleOrdenForm.fechaVencimientoLote || null,
        loteProveedor: toNullableText(detalleOrdenForm.loteProveedor),
      });
      return res.data;
    }, 'Detalle agregado', loadFarmacia);
  }

  async function handleEstadoOrdenSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitAction(async () => {
      const res = await adminSpApi.actualizarEstadoOrdenCompra({
        ordenCompraId: toNumber(estadoOrdenForm.ordenCompraId, 'OrdenCompraId'),
        estado: estadoOrdenForm.estado,
        aprobadoPor: getCurrentUserId(),
      });
      return res.data;
    }, 'Estado actualizado', loadFarmacia);
  }

  async function handleRecepcionSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitAction(async () => {
      const res = await adminSpApi.registrarRecepcionOrdenCompra({
        ordenCompraDetalleId: toNumber(recepcionOrdenForm.ordenCompraDetalleId, 'OrdenCompraDetalleId'),
        cantidadRecibida: toNumber(recepcionOrdenForm.cantidadRecibida, 'Cantidad recibida'),
        fechaVencimientoLote: recepcionOrdenForm.fechaVencimientoLote || null,
        codigoLote: toNullableText(recepcionOrdenForm.codigoLote),
        usuarioId: getCurrentUserId(),
      });
      return res.data;
    }, 'Recepción registrada', loadFarmacia);
  }

  async function handleMovimientoSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitAction(async () => {
      const res = await adminSpApi.registrarMovimientoInventario({
        medicamentoId: toNumber(movimientoForm.medicamentoId, 'MedicamentoId'),
        tipoMovimiento: movimientoForm.tipoMovimiento,
        cantidad: toNumber(movimientoForm.cantidad, 'Cantidad'),
        origenTipo: toNullableText(movimientoForm.origenTipo),
        origenId: toNullableNumber(movimientoForm.origenId),
        recetaDetalleId: toNullableNumber(movimientoForm.recetaDetalleId),
        costo: toNullableNumber(movimientoForm.costo),
        precioUnitario: toNullableNumber(movimientoForm.precioUnitario),
        referencia: toNullableText(movimientoForm.referencia),
        observaciones: toNullableText(movimientoForm.observaciones),
        usuarioId: getCurrentUserId(),
        loteId: toNullableNumber(movimientoForm.loteId),
      });
      return res.data;
    }, 'Movimiento registrado', loadFarmacia);
  }

  async function handleDespachoSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitAction(async () => {
      const res = await adminSpApi.despacharReceta({
        recetaId: toNumber(despachoForm.recetaId, 'RecetaId'),
        usuarioId: getCurrentUserId(),
        observaciones: toNullableText(despachoForm.observaciones),
      });
      return res.data;
    }, 'Receta despachada', loadFarmacia);
  }

  function addCuentaDetalle() {
    try {
      const detalle: DetalleCuentaRequest = {
        tipoConcepto: cuentaForm.tipoConcepto,
        descripcion: cuentaForm.descripcion.trim(),
        cantidad: toNumber(cuentaForm.cantidad, 'Cantidad'),
        precioUnitario: toNumber(cuentaForm.precioUnitario, 'Precio unitario'),
      };
      if (!detalle.descripcion) throw new Error('La descripción es obligatoria.');
      setCuentaDetalles((current) => [...current, detalle]);
      setCuentaForm((current) => ({ ...current, descripcion: '', cantidad: '1', precioUnitario: '' }));
    } catch (error) {
      toast.error('Detalle inválido', error instanceof Error ? error.message : 'Verifica el detalle.');
    }
  }

  async function handleCuentaSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitAction(async () => {
      if (cuentaDetalles.length === 0) throw new Error('Agrega al menos un detalle a la cuenta.');
      const res = await adminSpApi.generarCuentaDesdeCita({
        citaId: toNumber(cuentaForm.citaId, 'CitaId'),
        creadoPor: getCurrentUserId(),
        detalles: cuentaDetalles,
      });
      return res.data;
    }, 'Cuenta generada');
  }

  async function handlePagoSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitAction(async () => {
      const res = await adminSpApi.registrarPagoCuenta({
        cuentaId: toNumber(pagoForm.cuentaId, 'CuentaId'),
        metodoPagoId: toNumber(pagoForm.metodoPagoId, 'MetodoPagoId'),
        monto: toNumber(pagoForm.monto, 'Monto'),
        referencia: toNullableText(pagoForm.referencia),
        comprobanteUrl: toNullableText(pagoForm.comprobanteUrl),
        observaciones: toNullableText(pagoForm.observaciones),
        registradoPor: getCurrentUserId(),
      });
      return res.data;
    }, 'Pago registrado');
  }

  async function handlePlantillaSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitAction(async () => {
      const res = await adminSpApi.guardarPlantillaNotificacion({
        plantillaId: toNullableNumber(plantillaForm.plantillaId),
        tipoEvento: plantillaForm.tipoEvento.trim(),
        canal: plantillaForm.canal,
        asunto: toNullableText(plantillaForm.asunto),
        cuerpo: plantillaForm.cuerpo.trim(),
        variablesJSON: toNullableText(plantillaForm.variablesJSON),
        activo: plantillaForm.activo,
        fechaModificacion: new Date().toISOString(),
      });
      return res.data;
    }, 'Plantilla guardada', loadNotificaciones);
  }

  async function handleEncolarSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitAction(async () => {
      const res = await adminSpApi.encolarNotificacion({
        pacienteId: toNullableNumber(encolarForm.pacienteId),
        usuarioId: toNullableNumber(encolarForm.usuarioId),
        tipoEvento: encolarForm.tipoEvento.trim(),
        canal: encolarForm.canal,
        destinatario: encolarForm.destinatario.trim(),
        asunto: toNullableText(encolarForm.asunto),
        cuerpo: encolarForm.cuerpo.trim(),
        fechaProgramada: normalizeDateTime(encolarForm.fechaProgramada) ?? new Date().toISOString(),
        maxIntentos: toNumber(encolarForm.maxIntentos, 'MaxIntentos'),
        metadatosJSON: toNullableText(encolarForm.metadatosJSON),
      });
      return res.data;
    }, 'Notificación encolada', loadNotificaciones);
  }

  async function handleProcesarCola() {
    await submitAction(async () => {
      const res = await adminSpApi.procesarColaNotificaciones();
      return res.data;
    }, 'Cola procesada', loadNotificaciones);
  }

  async function handleSesionSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitAction(async () => {
      const res = await adminSpApi.guardarSesionTelemedica({
        sesionTeleId: toNullableNumber(sesionForm.sesionTeleId),
        citaId: toNumber(sesionForm.citaId, 'CitaId'),
        consultaId: toNullableNumber(sesionForm.consultaId),
        plataformaVideoId: toNullableNumber(sesionForm.plataformaVideoId),
        urlSala: sesionForm.urlSala.trim(),
        codigoSala: sesionForm.codigoSala.trim(),
        passwordSala: toNullableText(sesionForm.passwordSala),
        estado: sesionForm.estado,
        fechaInicioReal: normalizeDateTime(sesionForm.fechaInicioReal),
        fechaFinReal: normalizeDateTime(sesionForm.fechaFinReal),
        grabacionUrl: toNullableText(sesionForm.grabacionUrl),
        notasSesion: toNullableText(sesionForm.notasSesion),
        tokenMedico: toNullableText(sesionForm.tokenMedico),
        tokenPaciente: toNullableText(sesionForm.tokenPaciente),
        tokenExpiracion: normalizeDateTime(sesionForm.tokenExpiracion),
      });
      return res.data;
    }, 'Sesión de telemedicina guardada', loadTelemedicina);
  }

  async function handleEtl() {
    await submitAction(async () => {
      const res = await adminSpApi.ejecutarEtlDw();
      return res.data;
    }, 'ETL ejecutado');
  }

  function editMedicamento(item: Medicamento) {
    setMedicamentoForm({
      medicamentoId: String(item.medicamentoId),
      codigoInterno: item.codigoInterno ?? '',
      codigoBarras: item.codigoBarras ?? '',
      nombre: item.nombre ?? '',
      nombreGenerico: item.nombreGenerico ?? '',
      principioActivo: item.principioActivo ?? '',
      tipo: item.tipo ?? 'ALOPÁTICO',
      presentacion: item.presentacion ?? '',
      concentracionDescripcion: item.concentracionDescripcion ?? '',
      unidadMedida: item.unidadMedida ?? 'UNIDAD',
      requiereReceta: Boolean(item.requiereReceta),
      controladoPorSalud: Boolean(item.controladoPorSalud),
      precioCompra: item.precioCompra != null ? String(item.precioCompra) : '',
      precioVenta: String(item.precioVenta ?? ''),
      stockMinimo: String(item.stockMinimo ?? 10),
      estado: (item.estado || 'ACTIVO') as EstadoRegistro,
    });
    openModal('medicamento');
  }

  function editProveedor(item: Proveedor) {
    setProveedorForm({
      proveedorId: String(item.proveedorId),
      nombre: item.nombre ?? '',
      nit: item.nit ?? '',
      contacto: item.contacto ?? '',
      telefono: item.telefono ?? '',
      correoElectronico: item.correoElectronico ?? '',
      direccion: item.direccion ?? '',
      estado: (item.estado || 'ACTIVO') as EstadoRegistro,
    });
    openModal('proveedor');
  }

  function editPlantilla(item: PlantillaNotificacion) {
    setPlantillaForm({
      plantillaId: String(item.plantillaId),
      tipoEvento: item.tipoEvento ?? '',
      canal: (item.canal || 'EMAIL') as CanalNotificacion,
      asunto: item.asunto ?? '',
      cuerpo: item.cuerpo ?? '',
      variablesJSON: item.variablesJSON ?? '',
      activo: Boolean(item.activo),
    });
    openModal('plantilla');
  }

  function editSesion(item: SesionTelemedica) {
    const toLocal = (value?: string | null) => value ? new Date(value).toISOString().slice(0, 16) : '';
    setSesionForm({
      sesionTeleId: String(item.sesionTeleId),
      citaId: String(item.citaId ?? ''),
      consultaId: item.consultaId != null ? String(item.consultaId) : '',
      plataformaVideoId: item.plataformaVideoId != null ? String(item.plataformaVideoId) : '',
      urlSala: item.urlSala ?? '',
      codigoSala: item.codigoSala ?? '',
      passwordSala: item.passwordSala ?? '',
      estado: (item.estado || 'PROGRAMADA') as EstadoSesionTelemedica,
      fechaInicioReal: toLocal(item.fechaInicioReal),
      fechaFinReal: toLocal(item.fechaFinReal),
      grabacionUrl: item.grabacionUrl ?? '',
      notasSesion: item.notasSesion ?? '',
      tokenMedico: item.tokenMedico ?? '',
      tokenPaciente: item.tokenPaciente ?? '',
      tokenExpiracion: toLocal(item.tokenExpiracion),
    });
    openModal('sesion-telemedica');
  }

  return (
    <div className="stack-lg">
      <section className="hero-banner">
        <div>
          <span className="eyebrow light">Panel Administrador</span>
          <h1>Gestión clínica administrativa</h1>
          <p>
           Administra farmacia, inventario, cobros, notificaciones, telemedicina y reportes desde un solo panel.
          </p>
          <div className="button-row-wrap" style={{ marginTop: '18px' }}>
            <Button onClick={() => void loadFarmacia()}>Actualizar farmacia</Button>
            <Button variant="secondary" onClick={() => setActiveTab('notificaciones')}>Ir a notificaciones</Button>
          </div>
        </div>
        <div className="hero-card side-highlight">
          <span className="muted-text-light">Cobertura funcional</span>
          <strong>5 áreas administrativas disponibles</strong>
          <p>Consulta, registra, actualiza y ejecuta procesos administrativos según permisos del sistema.</p>
        </div>
      </section>

      <Card className="stack-md">
        <div className="button-row-wrap">
          {TABS.map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? 'secondary' : 'ghost'}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
        <p className="muted-text" style={{ margin: 0 }}>{selectedTab.description}</p>
      </Card>

      {activeTab === 'farmacia' ? (
        <div className="stack-lg">
          <div className="content-grid-2">
            <OperationCard title="Medicamentos" description="Consulta, alta y edición de medicamentos sin duplicar lógica de inventario.">
              <div className="filters-grid">
                <SelectField label="Estado" value={medicamentoFiltro.estado} options={optionsFrom(ESTADOS_REGISTRO, true)} onChange={(event) => setMedicamentoFiltro((current) => ({ ...current, estado: event.target.value }))} />
                <TextField label="Texto" value={medicamentoFiltro.texto} onChange={(event) => setMedicamentoFiltro((current) => ({ ...current, texto: event.target.value }))} placeholder="Nombre, código o principio activo" />
                <div className="button-row-wrap align-end">
                  <Button onClick={() => void loadFarmacia()}>Buscar</Button>
                  <Button variant="secondary" onClick={() => { setMedicamentoForm(defaultMedicamentoForm()); openModal('medicamento'); }}>Nuevo</Button>
                </div>
              </div>
              <DataTable
                items={medicamentos}
                loading={loadingFarmacia}
                emptyTitle="Sin medicamentos"
                emptyDescription="No existen medicamentos con los filtros actuales."
                keyExtractor={(item) => item.medicamentoId}
                columns={[
                  { header: 'Código', render: (item) => <strong>{item.codigoInterno}</strong> },
                  { header: 'Nombre', render: (item) => <span>{item.nombre}<br /><small className="muted-text">{item.principioActivo}</small></span> },
                  { header: 'Precio', align: 'right', render: (item) => money(item.precioVenta) },
                  { header: 'Estado', render: (item) => <Badge className={estadoBadge(item.estado)}>{item.estado}</Badge> },
                  { header: 'Acción', align: 'right', render: (item) => <Button variant="ghost" onClick={() => editMedicamento(item)}>Editar</Button> },
                ]}
              />
            </OperationCard>

            <OperationCard title="Proveedor" description="Mantenimiento de proveedores usados por órdenes de compra.">
              <div className="filters-grid">
                <SelectField label="Estado" value={proveedorFiltro.estado} options={optionsFrom(ESTADOS_REGISTRO, true)} onChange={(event) => setProveedorFiltro((current) => ({ ...current, estado: event.target.value }))} />
                <TextField label="Texto" value={proveedorFiltro.texto} onChange={(event) => setProveedorFiltro((current) => ({ ...current, texto: event.target.value }))} placeholder="Nombre o NIT" />
                <div className="button-row-wrap align-end">
                  <Button onClick={() => void loadFarmacia()}>Buscar</Button>
                  <Button variant="secondary" onClick={() => { setProveedorForm(defaultProveedorForm()); openModal('proveedor'); }}>Nuevo</Button>
                </div>
              </div>
              <DataTable
                items={proveedores}
                loading={loadingFarmacia}
                emptyTitle="Sin proveedores"
                emptyDescription="No existen proveedores con los filtros actuales."
                keyExtractor={(item) => item.proveedorId}
                columns={[
                  { header: 'Proveedor', render: (item) => <strong>{item.nombre}</strong> },
                  { header: 'NIT', render: (item) => item.nit ?? '—' },
                  { header: 'Contacto', render: (item) => item.contacto ?? item.telefono ?? '—' },
                  { header: 'Estado', render: (item) => <Badge className={estadoBadge(item.estado)}>{item.estado}</Badge> },
                  { header: 'Acción', align: 'right', render: (item) => <Button variant="ghost" onClick={() => editProveedor(item)}>Editar</Button> },
                ]}
              />
            </OperationCard>
          </div>

          <OperationCard title="Ordenes de compra" description="Crear órdenes, agregar detalle, actualizar estado y registrar recepción con impacto en inventario.">
            <div className="filters-grid">
              <SelectField label="Estado" value={ordenFiltro.estado} options={optionsFrom(ESTADOS_ORDEN, true)} onChange={(event) => setOrdenFiltro((current) => ({ ...current, estado: event.target.value }))} />
              <TextField label="ProveedorId" value={ordenFiltro.proveedorId} onChange={(event) => setOrdenFiltro((current) => ({ ...current, proveedorId: event.target.value }))} placeholder="Opcional" />
              <TextField label="Desde" type="date" value={ordenFiltro.fechaDesde} onChange={(event) => setOrdenFiltro((current) => ({ ...current, fechaDesde: event.target.value }))} />
              <TextField label="Hasta" type="date" value={ordenFiltro.fechaHasta} onChange={(event) => setOrdenFiltro((current) => ({ ...current, fechaHasta: event.target.value }))} />
            </div>
            <div className="button-row-wrap">
              <Button onClick={() => void loadFarmacia()}>Buscar órdenes</Button>
              <Button variant="secondary" onClick={() => { setOrdenForm(defaultOrdenForm()); openModal('orden'); }}>Nueva orden</Button>
              <Button variant="ghost" onClick={() => { setDetalleOrdenForm(defaultDetalleOrdenForm()); openModal('detalle-orden'); }}>Agregar detalle</Button>
              <Button variant="ghost" onClick={() => { setEstadoOrdenForm(defaultEstadoOrdenForm()); openModal('estado-orden'); }}>Cambiar estado</Button>
              <Button variant="ghost" onClick={() => { setRecepcionOrdenForm(defaultRecepcionOrdenForm()); openModal('recepcion-orden'); }}>Registrar recepción</Button>
            </div>
            <DataTable
              items={ordenes}
              loading={loadingFarmacia}
              emptyTitle="Sin órdenes de compra"
              emptyDescription="No hay órdenes con los filtros actuales."
              keyExtractor={(item) => item.ordenCompraId}
              columns={[
                { header: 'Orden', render: (item) => <strong>{item.numeroOrden}</strong> },
                { header: 'ProveedorId', render: (item) => item.proveedorId },
                { header: 'Estado', render: (item) => <Badge className={estadoBadge(item.estado)}>{item.estado}</Badge> },
                { header: 'Emisión', render: (item) => item.fechaEmision ? new Date(item.fechaEmision).toLocaleDateString('es-GT') : '—' },
                { header: 'Total', align: 'right', render: (item) => money(item.total) },
              ]}
            />
          </OperationCard>

          <div className="content-grid-2">
            <OperationCard title="Registrar Movimiento de Inventario" description="Entradas, salidas, ajustes, devoluciones y vencimientos con validación de stock en backend.">
              <div className="button-row-wrap">
                <Button onClick={() => { setMovimientoForm(defaultMovimientoForm()); openModal('movimiento'); }}>Registrar movimiento</Button>
              </div>
            </OperationCard>
            <OperationCard title="Despachar Receta" description="Despacho de receta con salida automática de inventario y auditoría.">
              <div className="button-row-wrap">
                <Button onClick={() => { setDespachoForm(defaultDespachoForm()); openModal('despachar-receta'); }}>Despachar receta</Button>
              </div>
            </OperationCard>
          </div>
        </div>
      ) : null}

      {activeTab === 'finanzas' ? (
        <div className="content-grid-2">
          <OperationCard title="Generar Cuenta Desde Cita" description="Genera una cuenta y sus detalles desde una cita existente.">
            <Button onClick={() => { setCuentaForm(defaultCuentaForm()); setCuentaDetalles([]); openModal('cuenta'); }}>Generar cuenta</Button>
          </OperationCard>
          <OperationCard title="Registrar Pago de Cuenta" description="Registra pagos y actualiza saldo/estado de la cuenta desde backend.">
            <Button onClick={() => { setPagoForm(defaultPagoForm()); openModal('pago'); }}>Registrar pago</Button>
          </OperationCard>
        </div>
      ) : null}

      {activeTab === 'notificaciones' ? (
        <div className="stack-lg">
          <OperationCard title="Plantilla Notificacion" description=".">
            <div className="filters-grid">
              <TextField label="Tipo evento" value={plantillaFiltro.tipoEvento} onChange={(event) => setPlantillaFiltro((current) => ({ ...current, tipoEvento: event.target.value }))} />
              <SelectField label="Canal" value={plantillaFiltro.canal} options={optionsFrom(CANALES, true)} onChange={(event) => setPlantillaFiltro((current) => ({ ...current, canal: event.target.value }))} />
              <SelectField label="Activo" value={plantillaFiltro.activo} options={[{ value: '', label: 'Todos' }, { value: 'true', label: 'Activo' }, { value: 'false', label: 'Inactivo' }]} onChange={(event) => setPlantillaFiltro((current) => ({ ...current, activo: event.target.value }))} />
              <div className="button-row-wrap align-end">
                <Button onClick={() => void loadNotificaciones()}>Buscar</Button>
                <Button variant="secondary" onClick={() => { setPlantillaForm(defaultPlantillaForm()); openModal('plantilla'); }}>Nueva</Button>
              </div>
            </div>
            <DataTable
              items={plantillas}
              loading={loadingNotificaciones}
              emptyTitle="Sin plantillas"
              emptyDescription="No hay plantillas con los filtros actuales."
              keyExtractor={(item) => item.plantillaId}
              columns={[
                { header: 'Evento', render: (item) => <strong>{item.tipoEvento}</strong> },
                { header: 'Canal', render: (item) => <Badge className="badge-teal">{item.canal}</Badge> },
                { header: 'Asunto', render: (item) => item.asunto ?? '—' },
                { header: 'Activo', render: (item) => <Badge className={item.activo ? 'badge-success' : 'badge-danger'}>{item.activo ? 'Sí' : 'No'}</Badge> },
                { header: 'Acción', align: 'right', render: (item) => <Button variant="ghost" onClick={() => editPlantilla(item)}>Editar</Button> },
              ]}
            />
          </OperationCard>

          <OperationCard title="Cola de Notificacion" description="Encola, consulta pendientes y procesa notificaciones programadas.">
            <div className="filters-grid">
              <SelectField label="Canal" value={pendienteFiltro.canal} options={optionsFrom(CANALES, true)} onChange={(event) => setPendienteFiltro((current) => ({ ...current, canal: event.target.value }))} />
              <TextField label="Máx. registros" type="number" min="1" value={pendienteFiltro.maxRegistros} onChange={(event) => setPendienteFiltro((current) => ({ ...current, maxRegistros: event.target.value }))} />
              <div className="button-row-wrap align-end">
                <Button onClick={() => void loadNotificaciones()}>Listar pendientes</Button>
                <Button variant="secondary" onClick={() => { setEncolarForm(defaultEncolarForm()); openModal('encolar-notificacion'); }}>Encolar</Button>
                <Button variant="ghost" loading={submitting} onClick={() => void handleProcesarCola()}>Procesar cola</Button>
              </div>
            </div>
            <DataTable
              items={pendientes}
              loading={loadingNotificaciones}
              emptyTitle="Sin pendientes"
              emptyDescription="No hay notificaciones pendientes o en reintento."
              keyExtractor={(item) => item.notificacionId}
              columns={[
                { header: 'ID', render: (item) => item.notificacionId },
                { header: 'Evento', render: (item) => <strong>{item.tipoEvento}</strong> },
                { header: 'Canal', render: (item) => item.canal },
                { header: 'Destino', render: (item) => item.destinatario },
                { header: 'Estado', render: (item) => <Badge className={estadoBadge(item.estado)}>{item.estado}</Badge> },
                { header: 'Programada', render: (item) => item.fechaProgramada ? new Date(item.fechaProgramada).toLocaleString('es-GT') : '—' },
              ]}
            />
          </OperationCard>
        </div>
      ) : null}

      {activeTab === 'telemedicina' ? (
        <OperationCard title="Sesion de Telemedica" description="CRUD y consulta de sesiones telemédicas.">
          <div className="filters-grid">
            <SelectField label="Estado" value={sesionFiltro.estado} options={optionsFrom(ESTADOS_SESION, true)} onChange={(event) => setSesionFiltro((current) => ({ ...current, estado: event.target.value }))} />
            <TextField label="Desde" type="datetime-local" value={sesionFiltro.fechaDesde} onChange={(event) => setSesionFiltro((current) => ({ ...current, fechaDesde: event.target.value }))} />
            <TextField label="Hasta" type="datetime-local" value={sesionFiltro.fechaHasta} onChange={(event) => setSesionFiltro((current) => ({ ...current, fechaHasta: event.target.value }))} />
            <div className="button-row-wrap align-end">
              <Button onClick={() => void loadTelemedicina()}>Buscar</Button>
              <Button variant="secondary" onClick={() => { setSesionForm(defaultSesionForm()); openModal('sesion-telemedica'); }}>Nueva sesión</Button>
            </div>
          </div>
          <DataTable
            items={sesiones}
            loading={loadingTelemedicina}
            emptyTitle="Sin sesiones"
            emptyDescription="No hay sesiones con los filtros actuales."
            keyExtractor={(item) => item.sesionTeleId}
            columns={[
              { header: 'Sesión', render: (item) => <strong>#{item.sesionTeleId}</strong> },
              { header: 'Cita', render: (item) => item.citaId },
              { header: 'Código', render: (item) => item.codigoSala },
              { header: 'Estado', render: (item) => <Badge className={estadoBadge(item.estado)}>{item.estado}</Badge> },
              { header: 'URL', render: (item) => item.urlSala ? <a className="muted-text" href={item.urlSala} target="_blank" rel="noreferrer">Abrir sala</a> : '—' },
              { header: 'Acción', align: 'right', render: (item) => <Button variant="ghost" onClick={() => editSesion(item)}>Editar</Button> },
            ]}
          />
        </OperationCard>
      ) : null}

      {activeTab === 'dw' ? (
        <OperationCard title="sp_ETL_CargarIncrementalDW" description="Ejecuta la carga incremental de dimensiones, hechos y cubos agregados.">
          <div className="highlight-panel">
            <div>
              <strong>Proceso ETL_GENERAL</strong>
              <p>El backend controla transacción, conteo de registros, duración y estado en dw.ETL_Control.</p>
            </div>
            <Button loading={submitting} onClick={() => void handleEtl()}>Ejecutar ETL</Button>
          </div>
          <ResultBox result={lastResult} />
        </OperationCard>
      ) : null}

      <Modal open={modal !== null} title="Ejecutar operación" subtitle="Formulario conectado a endpoint backend" onClose={closeModal} size="xl">
        {modal === 'medicamento' ? (
          <form className="stack-md" onSubmit={handleMedicamentoSubmit}>
            <div className="modal-grid-2">
              <TextField label="MedicamentoId (editar)" value={medicamentoForm.medicamentoId} onChange={(event) => setMedicamentoForm((current) => ({ ...current, medicamentoId: event.target.value }))} placeholder="Vacío para crear" />
              <TextField label="Código interno" required value={medicamentoForm.codigoInterno} onChange={(event) => setMedicamentoForm((current) => ({ ...current, codigoInterno: event.target.value }))} />
              <TextField label="Código barras" value={medicamentoForm.codigoBarras} onChange={(event) => setMedicamentoForm((current) => ({ ...current, codigoBarras: event.target.value }))} />
              <TextField label="Nombre" required value={medicamentoForm.nombre} onChange={(event) => setMedicamentoForm((current) => ({ ...current, nombre: event.target.value }))} />
              <TextField label="Nombre genérico" value={medicamentoForm.nombreGenerico} onChange={(event) => setMedicamentoForm((current) => ({ ...current, nombreGenerico: event.target.value }))} />
              <TextField label="Principio activo" required value={medicamentoForm.principioActivo} onChange={(event) => setMedicamentoForm((current) => ({ ...current, principioActivo: event.target.value }))} />
              <TextField label="Tipo" required value={medicamentoForm.tipo} onChange={(event) => setMedicamentoForm((current) => ({ ...current, tipo: event.target.value }))} />
              <TextField label="Presentación" value={medicamentoForm.presentacion} onChange={(event) => setMedicamentoForm((current) => ({ ...current, presentacion: event.target.value }))} />
              <TextField label="Concentración" value={medicamentoForm.concentracionDescripcion} onChange={(event) => setMedicamentoForm((current) => ({ ...current, concentracionDescripcion: event.target.value }))} />
              <TextField label="Unidad medida" required value={medicamentoForm.unidadMedida} onChange={(event) => setMedicamentoForm((current) => ({ ...current, unidadMedida: event.target.value }))} />
              <TextField label="Precio compra" type="number" step="0.01" min="0" value={medicamentoForm.precioCompra} onChange={(event) => setMedicamentoForm((current) => ({ ...current, precioCompra: event.target.value }))} />
              <TextField label="Precio venta" required type="number" step="0.01" min="0" value={medicamentoForm.precioVenta} onChange={(event) => setMedicamentoForm((current) => ({ ...current, precioVenta: event.target.value }))} />
              <TextField label="Stock mínimo" required type="number" min="0" value={medicamentoForm.stockMinimo} onChange={(event) => setMedicamentoForm((current) => ({ ...current, stockMinimo: event.target.value }))} />
              <SelectField label="Estado" value={medicamentoForm.estado} options={optionsFrom(ESTADOS_REGISTRO)} onChange={(event) => setMedicamentoForm((current) => ({ ...current, estado: event.target.value as EstadoRegistro }))} />
              <CheckboxField label="Requiere receta" checked={medicamentoForm.requiereReceta} onChange={(checked) => setMedicamentoForm((current) => ({ ...current, requiereReceta: checked }))} />
              <CheckboxField label="Controlado por salud" checked={medicamentoForm.controladoPorSalud} onChange={(checked) => setMedicamentoForm((current) => ({ ...current, controladoPorSalud: checked }))} />
            </div>
            <ResultBox result={lastResult} />
            <div className="modal-actions"><Button type="submit" loading={submitting}>Guardar medicamento</Button><Button variant="ghost" onClick={closeModal}>Cerrar</Button></div>
          </form>
        ) : null}

        {modal === 'proveedor' ? (
          <form className="stack-md" onSubmit={handleProveedorSubmit}>
            <div className="modal-grid-2">
              <TextField label="ProveedorId (editar)" value={proveedorForm.proveedorId} onChange={(event) => setProveedorForm((current) => ({ ...current, proveedorId: event.target.value }))} placeholder="Vacío para crear" />
              <TextField label="Nombre" required value={proveedorForm.nombre} onChange={(event) => setProveedorForm((current) => ({ ...current, nombre: event.target.value }))} />
              <TextField label="NIT" value={proveedorForm.nit} onChange={(event) => setProveedorForm((current) => ({ ...current, nit: event.target.value }))} />
              <TextField label="Contacto" value={proveedorForm.contacto} onChange={(event) => setProveedorForm((current) => ({ ...current, contacto: event.target.value }))} />
              <TextField label="Teléfono" value={proveedorForm.telefono} onChange={(event) => setProveedorForm((current) => ({ ...current, telefono: event.target.value }))} />
              <TextField label="Correo" type="email" value={proveedorForm.correoElectronico} onChange={(event) => setProveedorForm((current) => ({ ...current, correoElectronico: event.target.value }))} />
              <TextField label="Dirección" value={proveedorForm.direccion} onChange={(event) => setProveedorForm((current) => ({ ...current, direccion: event.target.value }))} />
              <SelectField label="Estado" value={proveedorForm.estado} options={optionsFrom(ESTADOS_REGISTRO)} onChange={(event) => setProveedorForm((current) => ({ ...current, estado: event.target.value as EstadoRegistro }))} />
            </div>
            <ResultBox result={lastResult} />
            <div className="modal-actions"><Button type="submit" loading={submitting}>Guardar proveedor</Button><Button variant="ghost" onClick={closeModal}>Cerrar</Button></div>
          </form>
        ) : null}

        {modal === 'orden' ? (
          <form className="stack-md" onSubmit={handleOrdenSubmit}>
            <div className="modal-grid-2">
              <TextField label="ProveedorId" required type="number" value={ordenForm.proveedorId} onChange={(event) => setOrdenForm((current) => ({ ...current, proveedorId: event.target.value }))} />
              <TextField label="Número orden" required value={ordenForm.numeroOrden} onChange={(event) => setOrdenForm((current) => ({ ...current, numeroOrden: event.target.value }))} />
              <TextField label="Fecha emisión" type="date" value={ordenForm.fechaEmision} onChange={(event) => setOrdenForm((current) => ({ ...current, fechaEmision: event.target.value }))} />
              <TextField label="Fecha entrega pactada" type="date" value={ordenForm.fechaEntregaPact} onChange={(event) => setOrdenForm((current) => ({ ...current, fechaEntregaPact: event.target.value }))} />
            </div>
            <TextAreaField label="Observaciones" value={ordenForm.observaciones} onChange={(event) => setOrdenForm((current) => ({ ...current, observaciones: event.target.value }))} />
            <ResultBox result={lastResult} />
            <div className="modal-actions"><Button type="submit" loading={submitting}>Crear orden</Button><Button variant="ghost" onClick={closeModal}>Cerrar</Button></div>
          </form>
        ) : null}

        {modal === 'detalle-orden' ? (
          <form className="stack-md" onSubmit={handleDetalleOrdenSubmit}>
            <div className="modal-grid-2">
              <TextField label="OrdenCompraId" required type="number" value={detalleOrdenForm.ordenCompraId} onChange={(event) => setDetalleOrdenForm((current) => ({ ...current, ordenCompraId: event.target.value }))} />
              <TextField label="MedicamentoId" required type="number" value={detalleOrdenForm.medicamentoId} onChange={(event) => setDetalleOrdenForm((current) => ({ ...current, medicamentoId: event.target.value }))} />
              <TextField label="Cantidad solicitada" required type="number" step="0.01" min="0.01" value={detalleOrdenForm.cantidadSolicitada} onChange={(event) => setDetalleOrdenForm((current) => ({ ...current, cantidadSolicitada: event.target.value }))} />
              <TextField label="Precio unitario" required type="number" step="0.01" min="0.01" value={detalleOrdenForm.precioUnitario} onChange={(event) => setDetalleOrdenForm((current) => ({ ...current, precioUnitario: event.target.value }))} />
              <TextField label="Fecha vencimiento lote" type="date" value={detalleOrdenForm.fechaVencimientoLote} onChange={(event) => setDetalleOrdenForm((current) => ({ ...current, fechaVencimientoLote: event.target.value }))} />
              <TextField label="Lote proveedor" value={detalleOrdenForm.loteProveedor} onChange={(event) => setDetalleOrdenForm((current) => ({ ...current, loteProveedor: event.target.value }))} />
            </div>
            <ResultBox result={lastResult} />
            <div className="modal-actions"><Button type="submit" loading={submitting}>Agregar detalle</Button><Button variant="ghost" onClick={closeModal}>Cerrar</Button></div>
          </form>
        ) : null}

        {modal === 'estado-orden' ? (
          <form className="stack-md" onSubmit={handleEstadoOrdenSubmit}>
            <div className="modal-grid-2">
              <TextField label="OrdenCompraId" required type="number" value={estadoOrdenForm.ordenCompraId} onChange={(event) => setEstadoOrdenForm((current) => ({ ...current, ordenCompraId: event.target.value }))} />
              <SelectField label="Estado" value={estadoOrdenForm.estado} options={optionsFrom(ESTADOS_ORDEN)} onChange={(event) => setEstadoOrdenForm((current) => ({ ...current, estado: event.target.value as EstadoOrdenCompra }))} />
            </div>
            <ResultBox result={lastResult} />
            <div className="modal-actions"><Button type="submit" loading={submitting}>Actualizar estado</Button><Button variant="ghost" onClick={closeModal}>Cerrar</Button></div>
          </form>
        ) : null}

        {modal === 'recepcion-orden' ? (
          <form className="stack-md" onSubmit={handleRecepcionSubmit}>
            <div className="modal-grid-2">
              <TextField label="OrdenCompraDetalleId" required type="number" value={recepcionOrdenForm.ordenCompraDetalleId} onChange={(event) => setRecepcionOrdenForm((current) => ({ ...current, ordenCompraDetalleId: event.target.value }))} />
              <TextField label="Cantidad recibida" required type="number" step="0.01" min="0.01" value={recepcionOrdenForm.cantidadRecibida} onChange={(event) => setRecepcionOrdenForm((current) => ({ ...current, cantidadRecibida: event.target.value }))} />
              <TextField label="Fecha vencimiento lote" type="date" value={recepcionOrdenForm.fechaVencimientoLote} onChange={(event) => setRecepcionOrdenForm((current) => ({ ...current, fechaVencimientoLote: event.target.value }))} />
              <TextField label="Código lote" value={recepcionOrdenForm.codigoLote} onChange={(event) => setRecepcionOrdenForm((current) => ({ ...current, codigoLote: event.target.value }))} />
            </div>
            <ResultBox result={lastResult} />
            <div className="modal-actions"><Button type="submit" loading={submitting}>Registrar recepción</Button><Button variant="ghost" onClick={closeModal}>Cerrar</Button></div>
          </form>
        ) : null}

        {modal === 'movimiento' ? (
          <form className="stack-md" onSubmit={handleMovimientoSubmit}>
            <div className="modal-grid-2">
              <TextField label="MedicamentoId" required type="number" value={movimientoForm.medicamentoId} onChange={(event) => setMovimientoForm((current) => ({ ...current, medicamentoId: event.target.value }))} />
              <SelectField label="Tipo movimiento" value={movimientoForm.tipoMovimiento} options={optionsFrom(TIPOS_MOVIMIENTO)} onChange={(event) => setMovimientoForm((current) => ({ ...current, tipoMovimiento: event.target.value as TipoMovimientoInventario }))} />
              <TextField label="Cantidad" required type="number" step="0.01" min="0.01" value={movimientoForm.cantidad} onChange={(event) => setMovimientoForm((current) => ({ ...current, cantidad: event.target.value }))} />
              <TextField label="LoteId" type="number" value={movimientoForm.loteId} onChange={(event) => setMovimientoForm((current) => ({ ...current, loteId: event.target.value }))} />
              <TextField label="Origen tipo" value={movimientoForm.origenTipo} onChange={(event) => setMovimientoForm((current) => ({ ...current, origenTipo: event.target.value }))} placeholder="ORDEN_COMPRA / RECETA" />
              <TextField label="OrigenId" type="number" value={movimientoForm.origenId} onChange={(event) => setMovimientoForm((current) => ({ ...current, origenId: event.target.value }))} />
              <TextField label="RecetaDetalleId" type="number" value={movimientoForm.recetaDetalleId} onChange={(event) => setMovimientoForm((current) => ({ ...current, recetaDetalleId: event.target.value }))} />
              <TextField label="Costo" type="number" step="0.01" value={movimientoForm.costo} onChange={(event) => setMovimientoForm((current) => ({ ...current, costo: event.target.value }))} />
              <TextField label="Precio unitario" type="number" step="0.01" value={movimientoForm.precioUnitario} onChange={(event) => setMovimientoForm((current) => ({ ...current, precioUnitario: event.target.value }))} />
              <TextField label="Referencia" value={movimientoForm.referencia} onChange={(event) => setMovimientoForm((current) => ({ ...current, referencia: event.target.value }))} />
            </div>
            <TextAreaField label="Observaciones" value={movimientoForm.observaciones} onChange={(event) => setMovimientoForm((current) => ({ ...current, observaciones: event.target.value }))} />
            <ResultBox result={lastResult} />
            <div className="modal-actions"><Button type="submit" loading={submitting}>Registrar movimiento</Button><Button variant="ghost" onClick={closeModal}>Cerrar</Button></div>
          </form>
        ) : null}

        {modal === 'despachar-receta' ? (
          <form className="stack-md" onSubmit={handleDespachoSubmit}>
            <TextField label="RecetaId" required type="number" value={despachoForm.recetaId} onChange={(event) => setDespachoForm((current) => ({ ...current, recetaId: event.target.value }))} />
            <TextAreaField label="Observaciones" value={despachoForm.observaciones} onChange={(event) => setDespachoForm((current) => ({ ...current, observaciones: event.target.value }))} />
            <ResultBox result={lastResult} />
            <div className="modal-actions"><Button type="submit" loading={submitting}>Despachar</Button><Button variant="ghost" onClick={closeModal}>Cerrar</Button></div>
          </form>
        ) : null}

        {modal === 'cuenta' ? (
          <form className="stack-md" onSubmit={handleCuentaSubmit}>
            <TextField label="CitaId" required type="number" value={cuentaForm.citaId} onChange={(event) => setCuentaForm((current) => ({ ...current, citaId: event.target.value }))} />
            <div className="modal-grid-2">
              <SelectField label="Tipo concepto" value={cuentaForm.tipoConcepto} options={optionsFrom(TIPOS_CONCEPTO)} onChange={(event) => setCuentaForm((current) => ({ ...current, tipoConcepto: event.target.value as TipoConceptoCuenta }))} />
              <TextField label="Descripción" value={cuentaForm.descripcion} onChange={(event) => setCuentaForm((current) => ({ ...current, descripcion: event.target.value }))} />
              <TextField label="Cantidad" type="number" step="0.01" min="0.01" value={cuentaForm.cantidad} onChange={(event) => setCuentaForm((current) => ({ ...current, cantidad: event.target.value }))} />
              <TextField label="Precio unitario" type="number" step="0.01" min="0" value={cuentaForm.precioUnitario} onChange={(event) => setCuentaForm((current) => ({ ...current, precioUnitario: event.target.value }))} />
            </div>
            <div className="button-row-wrap"><Button variant="ghost" onClick={addCuentaDetalle}>Agregar detalle</Button></div>
            <DataTable
              items={cuentaDetalles}
              emptyTitle="Sin detalles"
              emptyDescription="Agrega al menos un detalle para generar la cuenta."
              keyExtractor={(_, index) => index}
              columns={[
                { header: 'Tipo', render: (item) => item.tipoConcepto },
                { header: 'Descripción', render: (item) => item.descripcion },
                { header: 'Cantidad', align: 'right', render: (item) => item.cantidad },
                { header: 'Precio', align: 'right', render: (item) => money(item.precioUnitario) },
              ]}
            />
            <ResultBox result={lastResult} />
            <div className="modal-actions"><Button type="submit" loading={submitting}>Generar cuenta</Button><Button variant="ghost" onClick={closeModal}>Cerrar</Button></div>
          </form>
        ) : null}

        {modal === 'pago' ? (
          <form className="stack-md" onSubmit={handlePagoSubmit}>
            <div className="modal-grid-2">
              <TextField label="CuentaId" required type="number" value={pagoForm.cuentaId} onChange={(event) => setPagoForm((current) => ({ ...current, cuentaId: event.target.value }))} />
              <TextField label="MetodoPagoId" required type="number" value={pagoForm.metodoPagoId} onChange={(event) => setPagoForm((current) => ({ ...current, metodoPagoId: event.target.value }))} />
              <TextField label="Monto" required type="number" step="0.01" min="0.01" value={pagoForm.monto} onChange={(event) => setPagoForm((current) => ({ ...current, monto: event.target.value }))} />
              <TextField label="Referencia" value={pagoForm.referencia} onChange={(event) => setPagoForm((current) => ({ ...current, referencia: event.target.value }))} />
              <TextField label="Comprobante URL" value={pagoForm.comprobanteUrl} onChange={(event) => setPagoForm((current) => ({ ...current, comprobanteUrl: event.target.value }))} />
            </div>
            <TextAreaField label="Observaciones" value={pagoForm.observaciones} onChange={(event) => setPagoForm((current) => ({ ...current, observaciones: event.target.value }))} />
            <ResultBox result={lastResult} />
            <div className="modal-actions"><Button type="submit" loading={submitting}>Registrar pago</Button><Button variant="ghost" onClick={closeModal}>Cerrar</Button></div>
          </form>
        ) : null}

        {modal === 'plantilla' ? (
          <form className="stack-md" onSubmit={handlePlantillaSubmit}>
            <div className="modal-grid-2">
              <TextField label="PlantillaId (editar)" value={plantillaForm.plantillaId} onChange={(event) => setPlantillaForm((current) => ({ ...current, plantillaId: event.target.value }))} />
              <TextField label="Tipo evento" required value={plantillaForm.tipoEvento} onChange={(event) => setPlantillaForm((current) => ({ ...current, tipoEvento: event.target.value }))} />
              <SelectField label="Canal" value={plantillaForm.canal} options={optionsFrom(CANALES)} onChange={(event) => setPlantillaForm((current) => ({ ...current, canal: event.target.value as CanalNotificacion }))} />
              <TextField label="Asunto" value={plantillaForm.asunto} onChange={(event) => setPlantillaForm((current) => ({ ...current, asunto: event.target.value }))} />
            </div>
            <TextAreaField label="Cuerpo" required value={plantillaForm.cuerpo} onChange={(event) => setPlantillaForm((current) => ({ ...current, cuerpo: event.target.value }))} />
            <TextAreaField label="Variables JSON" value={plantillaForm.variablesJSON} onChange={(event) => setPlantillaForm((current) => ({ ...current, variablesJSON: event.target.value }))} />
            <CheckboxField label="Activo" checked={plantillaForm.activo} onChange={(checked) => setPlantillaForm((current) => ({ ...current, activo: checked }))} />
            <ResultBox result={lastResult} />
            <div className="modal-actions"><Button type="submit" loading={submitting}>Guardar plantilla</Button><Button variant="ghost" onClick={closeModal}>Cerrar</Button></div>
          </form>
        ) : null}

        {modal === 'encolar-notificacion' ? (
          <form className="stack-md" onSubmit={handleEncolarSubmit}>
            <div className="modal-grid-2">
              <TextField label="PacienteId" type="number" value={encolarForm.pacienteId} onChange={(event) => setEncolarForm((current) => ({ ...current, pacienteId: event.target.value }))} />
              <TextField label="UsuarioId" type="number" value={encolarForm.usuarioId} onChange={(event) => setEncolarForm((current) => ({ ...current, usuarioId: event.target.value }))} />
              <TextField label="Tipo evento" required value={encolarForm.tipoEvento} onChange={(event) => setEncolarForm((current) => ({ ...current, tipoEvento: event.target.value }))} />
              <SelectField label="Canal" value={encolarForm.canal} options={optionsFrom(CANALES)} onChange={(event) => setEncolarForm((current) => ({ ...current, canal: event.target.value as CanalNotificacion }))} />
              <TextField label="Destinatario" required value={encolarForm.destinatario} onChange={(event) => setEncolarForm((current) => ({ ...current, destinatario: event.target.value }))} />
              <TextField label="Asunto" value={encolarForm.asunto} onChange={(event) => setEncolarForm((current) => ({ ...current, asunto: event.target.value }))} />
              <TextField label="Fecha programada" type="datetime-local" required value={encolarForm.fechaProgramada} onChange={(event) => setEncolarForm((current) => ({ ...current, fechaProgramada: event.target.value }))} />
              <TextField label="Máx. intentos" type="number" min="1" value={encolarForm.maxIntentos} onChange={(event) => setEncolarForm((current) => ({ ...current, maxIntentos: event.target.value }))} />
            </div>
            <TextAreaField label="Cuerpo" required value={encolarForm.cuerpo} onChange={(event) => setEncolarForm((current) => ({ ...current, cuerpo: event.target.value }))} />
            <TextAreaField label="Metadatos JSON" value={encolarForm.metadatosJSON} onChange={(event) => setEncolarForm((current) => ({ ...current, metadatosJSON: event.target.value }))} />
            <ResultBox result={lastResult} />
            <div className="modal-actions"><Button type="submit" loading={submitting}>Encolar notificación</Button><Button variant="ghost" onClick={closeModal}>Cerrar</Button></div>
          </form>
        ) : null}

        {modal === 'sesion-telemedica' ? (
          <form className="stack-md" onSubmit={handleSesionSubmit}>
            <div className="modal-grid-2">
              <TextField label="SesionTeleId (editar)" type="number" value={sesionForm.sesionTeleId} onChange={(event) => setSesionForm((current) => ({ ...current, sesionTeleId: event.target.value }))} />
              <TextField label="CitaId" required type="number" value={sesionForm.citaId} onChange={(event) => setSesionForm((current) => ({ ...current, citaId: event.target.value }))} />
              <TextField label="ConsultaId" type="number" value={sesionForm.consultaId} onChange={(event) => setSesionForm((current) => ({ ...current, consultaId: event.target.value }))} />
              <TextField label="PlataformaVideoId" type="number" value={sesionForm.plataformaVideoId} onChange={(event) => setSesionForm((current) => ({ ...current, plataformaVideoId: event.target.value }))} />
              <TextField label="URL sala" required value={sesionForm.urlSala} onChange={(event) => setSesionForm((current) => ({ ...current, urlSala: event.target.value }))} />
              <TextField label="Código sala" required value={sesionForm.codigoSala} onChange={(event) => setSesionForm((current) => ({ ...current, codigoSala: event.target.value }))} />
              <TextField label="Password sala" value={sesionForm.passwordSala} onChange={(event) => setSesionForm((current) => ({ ...current, passwordSala: event.target.value }))} />
              <SelectField label="Estado" value={sesionForm.estado} options={optionsFrom(ESTADOS_SESION)} onChange={(event) => setSesionForm((current) => ({ ...current, estado: event.target.value as EstadoSesionTelemedica }))} />
              <TextField label="Inicio real" type="datetime-local" value={sesionForm.fechaInicioReal} onChange={(event) => setSesionForm((current) => ({ ...current, fechaInicioReal: event.target.value }))} />
              <TextField label="Fin real" type="datetime-local" value={sesionForm.fechaFinReal} onChange={(event) => setSesionForm((current) => ({ ...current, fechaFinReal: event.target.value }))} />
              <TextField label="Grabación URL" value={sesionForm.grabacionUrl} onChange={(event) => setSesionForm((current) => ({ ...current, grabacionUrl: event.target.value }))} />
              <TextField label="Token expiración" type="datetime-local" value={sesionForm.tokenExpiracion} onChange={(event) => setSesionForm((current) => ({ ...current, tokenExpiracion: event.target.value }))} />
            </div>
            <TextAreaField label="Notas sesión" value={sesionForm.notasSesion} onChange={(event) => setSesionForm((current) => ({ ...current, notasSesion: event.target.value }))} />
            <TextAreaField label="Token médico" value={sesionForm.tokenMedico} onChange={(event) => setSesionForm((current) => ({ ...current, tokenMedico: event.target.value }))} />
            <TextAreaField label="Token paciente" value={sesionForm.tokenPaciente} onChange={(event) => setSesionForm((current) => ({ ...current, tokenPaciente: event.target.value }))} />
            <ResultBox result={lastResult} />
            <div className="modal-actions"><Button type="submit" loading={submitting}>Guardar sesión</Button><Button variant="ghost" onClick={closeModal}>Cerrar</Button></div>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}
