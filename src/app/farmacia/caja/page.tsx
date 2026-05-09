'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { useToast } from '@/shared/components/providers/ToastProvider';
import { patientsApi } from '@/lib/api/patients';
import { session } from '@/lib/auth/session';

interface CuentaDto {
  cuentaId: number;
  citaId: number;
  pacienteId: number;
  pacienteNombre: string;
  subtotalConsulta: number;
  subtotalMedicamentos: number;
  subtotalProcedimientos: number;
  descuento: number;
  total: number;
  saldo: number;
  estado: string;
  fechaEmision: string;
  fechaPago?: string;
}

interface DetalleCuentaLinea {
  cuentaDetalleId: number;
  tipoConcepto: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

interface PagoDto {
  pagoId: number;
  metodoPagoId: number;
  monto: number;
  referencia?: string;
  fechaPago: string;
}

interface CuentaDetalle {
  cuenta: CuentaDto;
  detalle: DetalleCuentaLinea[];
  pagos: PagoDto[];
}

interface MetodoPago {
  metodoPagoId: number;
  nombre: string;
  requiereReferencia: boolean;
  requiereComprobante: boolean;
}

const ESTADO_COLOR: Record<string, string> = {
  PENDIENTE: 'badge-warning',
  PARCIAL:   'badge-info',
  PAGADA:    'badge-success',
  ANULADA:   'badge-danger',
};

export default function CajaPage() {
  const toast = useToast();
  const [usuarioId, setUsuarioId]           = useState<number>(1);
  const [cuentas, setCuentas]               = useState<CuentaDto[]>([]);
  const [loading, setLoading]               = useState(true);
  const [estadoFiltro, setEstadoFiltro]     = useState('PENDIENTE');
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<CuentaDetalle | null>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [metodosPago, setMetodosPago]       = useState<MetodoPago[]>([]);
  const [mostrarPago, setMostrarPago]       = useState(false);
  const [guardando, setGuardando]           = useState(false);
  const [formPago, setFormPago] = useState({
    metodoPagoId: '',
    monto:        '',
    referencia:   '',
  });

  useEffect(() => {
    const user = session.getUser();
    if (user) setUsuarioId(user.usuarioId);
    void cargarMetodosPago();
  }, []);

  const cargarCuentas = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (estadoFiltro) params.set('estado', estadoFiltro);
    const res = await patientsApi.get<CuentaDto[]>(`/api/cuentas?${params}`);
    if (res.success && res.data) setCuentas(res.data);
    else toast.error('Error', 'No se pudieron cargar las cuentas.');
    setLoading(false);
  }, [toast, estadoFiltro]);

  useEffect(() => { void cargarCuentas(); }, [cargarCuentas]);

  async function cargarMetodosPago() {
    const res = await patientsApi.get<MetodoPago[]>('/api/pagos/metodos-pago');
    if (res.success && res.data) setMetodosPago(res.data);
  }

  async function verDetalle(cuentaId: number) {
    setLoadingDetalle(true);
    setCuentaSeleccionada(null);
    const res = await patientsApi.get<CuentaDetalle>(`/api/cuentas/${cuentaId}`);
    if (res.success && res.data) {
      setCuentaSeleccionada(res.data);
      setFormPago({
        metodoPagoId: metodosPago[0]?.metodoPagoId?.toString() ?? '',
        monto:        String(res.data.cuenta.saldo),
        referencia:   '',
      });
    } else {
      toast.error('Error', 'No se pudo cargar el detalle de la cuenta.');
    }
    setLoadingDetalle(false);
  }

  async function handleRegistrarPago() {
    if (!cuentaSeleccionada) return;
    if (!formPago.metodoPagoId || !formPago.monto) {
      toast.warning('Campos requeridos', 'Seleccioná el método de pago y el monto.');
      return;
    }
    const metodoPago = metodosPago.find(
      m => m.metodoPagoId === Number(formPago.metodoPagoId)
    );
    if (metodoPago?.requiereReferencia && !formPago.referencia) {
      toast.warning('Referencia requerida', 'Este método de pago requiere número de referencia.');
      return;
    }
    setGuardando(true);
    const res = await patientsApi.post(
      '/api/pagos',
      {
        cuentaId:     cuentaSeleccionada.cuenta.cuentaId,
        metodoPagoId: Number(formPago.metodoPagoId),
        monto:        Number(formPago.monto),
        referencia:   formPago.referencia || null,
        registradoPor: usuarioId,
      },
      true
    );
    if (res.success) {
      toast.success('Pago registrado', 'El pago fue registrado correctamente.');
      setMostrarPago(false);
      void cargarCuentas();
      void verDetalle(cuentaSeleccionada.cuenta.cuentaId);
    } else {
      toast.error('Error', res.message || 'No se pudo registrar el pago.');
    }
    setGuardando(false);
  }

  return (
    <div className="stack-lg">
      <section className="hero-banner">
        <div>
          <span className="eyebrow">Farmacia · Caja</span>
          <h1>Cuentas y Pagos</h1>
          <p>Gestioná los cobros de las consultas médicas.</p>
        </div>
        <div className="hero-card side-highlight">
          <span className="muted-text-light">Cuentas</span>
          <strong style={{ fontSize: '2rem' }}>{cuentas.length}</strong>
          <p>en estado {estadoFiltro || 'total'}</p>
        </div>
      </section>

      {/* Filtros */}
      <Card className="stack-md">
        <div className="filters-grid">
          <div className="field-group">
            <span>Estado de cuenta</span>
            <select
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
            >
              <option value="">Todas</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="PARCIAL">Parcial</option>
              <option value="PAGADA">Pagada</option>
              <option value="ANULADA">Anulada</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button onClick={() => void cargarCuentas()}>Buscar</Button>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>

        {/* Lista de cuentas */}
{/* Lista de cuentas */}
<div className="stack-md">
  {loading && <div className="loading-box"><p className="muted-text">Cargando cuentas...</p></div>}

  {!loading && cuentas.length === 0 && (
    <EmptyState
      title="No hay cuentas"
      description="No se encontraron cuentas con ese estado."
    />
  )}

  {!loading && cuentas.map((c) => (
    <Card key={c.cuentaId} className="stack-md">
      <div className="section-heading-row">
        <div>
          <span className="eyebrow">Cuenta #{c.cuentaId}</span>
          <h3 style={{ margin: 0 }}>{c.pacienteNombre}</h3>
          <span className="muted-text">
            {new Date(c.fechaEmision).toLocaleDateString('es-GT')}
          </span>
        </div>
        <span className={`badge ${ESTADO_COLOR[c.estado] ?? 'badge-neutral'}`}>
          {c.estado}
        </span>
      </div>
      <div className="filters-grid">
        <div className="detail-item">
          <span>Total</span>
          <strong>Q {c.total.toFixed(2)}</strong>
        </div>
        <div className="detail-item">
          <span>Saldo pendiente</span>
          <strong style={{ color: c.saldo > 0 ? '#EF4444' : '#10B981' }}>
            Q {c.saldo.toFixed(2)}
          </strong>
        </div>
      </div>
      <div className="button-row-wrap">
        <Button
          variant="secondary"
          loading={loadingDetalle}
          onClick={() => void verDetalle(c.cuentaId)}
        >
          Ver detalle
        </Button>
      </div>
    </Card>
  ))}
</div>

{/* Detalle de cuenta seleccionada */}
{cuentaSeleccionada && (
  <Card className="stack-md">
    <div className="section-heading-row">
      <div>
        <span className="eyebrow">Detalle cuenta #{cuentaSeleccionada.cuenta.cuentaId}</span>
        <h3 style={{ margin: 0 }}>{cuentaSeleccionada.cuenta.pacienteNombre}</h3>
      </div>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <span className={`badge ${ESTADO_COLOR[cuentaSeleccionada.cuenta.estado] ?? 'badge-neutral'}`}>
          {cuentaSeleccionada.cuenta.estado}
        </span>
        <Button variant="ghost" onClick={() => setCuentaSeleccionada(null)}>✕ Cerrar</Button>
      </div>
    </div>

    <div className="content-grid-2 align-start">
      {/* Conceptos */}
      <div className="stack-sm">
        <span className="eyebrow">Conceptos</span>
        {cuentaSeleccionada.detalle.map((d) => (
          <div key={d.cuentaDetalleId} style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '8px 12px', background: '#F7FAFC',
            borderRadius: '8px', fontSize: '0.9rem'
          }}>
            <span>{d.descripcion} <small className="muted-text">({d.tipoConcepto})</small></span>
            <strong>Q {d.subtotal.toFixed(2)}</strong>
          </div>
        ))}
      </div>

      {/* Totales y pagos */}
      <div className="stack-sm">
        <span className="eyebrow">Resumen</span>
        <div style={{ background: '#F7FAFC', borderRadius: '12px', padding: '16px' }}>
          <div className="detail-item">
            <span>Subtotal consulta</span>
            <strong>Q {cuentaSeleccionada.cuenta.subtotalConsulta.toFixed(2)}</strong>
          </div>
          <div className="detail-item">
            <span>Subtotal medicamentos</span>
            <strong>Q {cuentaSeleccionada.cuenta.subtotalMedicamentos.toFixed(2)}</strong>
          </div>
          <div className="detail-item">
            <span>Descuento</span>
            <strong>Q {cuentaSeleccionada.cuenta.descuento.toFixed(2)}</strong>
          </div>
          <div className="detail-item" style={{ borderTop: '1px solid #E5E7EB', paddingTop: '8px', marginTop: '8px' }}>
            <span>Total</span>
            <strong style={{ fontSize: '1.1rem' }}>Q {cuentaSeleccionada.cuenta.total.toFixed(2)}</strong>
          </div>
          <div className="detail-item">
            <span>Saldo pendiente</span>
            <strong style={{
              fontSize: '1.1rem',
              color: cuentaSeleccionada.cuenta.saldo > 0 ? '#EF4444' : '#10B981'
            }}>
              Q {cuentaSeleccionada.cuenta.saldo.toFixed(2)}
            </strong>
          </div>
        </div>

        {cuentaSeleccionada.pagos.length > 0 && (
          <>
            <span className="eyebrow" style={{ marginTop: '8px' }}>Pagos registrados</span>
            {cuentaSeleccionada.pagos.map((p) => (
              <div key={p.pagoId} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '8px 12px', background: '#F0FDF4',
                borderRadius: '8px', fontSize: '0.9rem'
              }}>
                <span>
                  {new Date(p.fechaPago).toLocaleDateString('es-GT')}
                  {p.referencia && <small className="muted-text"> · Ref: {p.referencia}</small>}
                </span>
                <strong style={{ color: '#10B981' }}>Q {p.monto.toFixed(2)}</strong>
              </div>
            ))}
          </>
        )}

        {cuentaSeleccionada.cuenta.saldo > 0 && (
          <Button onClick={() => setMostrarPago(true)}>
            Registrar pago
          </Button>
        )}
      </div>
    </div>
  </Card>
)}
      </div>

      {/* Modal registrar pago */}
      {mostrarPago && cuentaSeleccionada && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', padding: '32px',
            width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 20px', color: '#0F4C5C' }}>Registrar pago</h3>
            <p className="muted-text" style={{ marginBottom: '20px' }}>
              Saldo pendiente: <strong>Q {cuentaSeleccionada.cuenta.saldo.toFixed(2)}</strong>
            </p>
            <div className="stack-md">
              <div className="field-group">
                <span>Método de pago</span>
                <select
                  value={formPago.metodoPagoId}
                  onChange={(e) => setFormPago(p => ({ ...p, metodoPagoId: e.target.value }))}
                >
                  <option value="">Seleccioná un método...</option>
                  {metodosPago.map((m) => (
                    <option key={m.metodoPagoId} value={m.metodoPagoId}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field-group">
                <span>Monto (Q)</span>
                <input
                  type="number"
                  value={formPago.monto}
                  onChange={(e) => setFormPago(p => ({ ...p, monto: e.target.value }))}
                  min="0.01"
                  max={cuentaSeleccionada.cuenta.saldo}
                  step="0.01"
                />
              </div>
              {metodosPago.find(m => m.metodoPagoId === Number(formPago.metodoPagoId))?.requiereReferencia && (
                <div className="field-group">
                  <span>Número de referencia</span>
                  <input
                    type="text"
                    value={formPago.referencia}
                    onChange={(e) => setFormPago(p => ({ ...p, referencia: e.target.value }))}
                    placeholder="Número de autorización o referencia"
                  />
                </div>
              )}
            </div>
            <div className="button-row-wrap" style={{ marginTop: '24px' }}>
              <Button loading={guardando} disabled={guardando}
                onClick={() => void handleRegistrarPago()}>
                Confirmar pago
              </Button>
              <Button variant="ghost" onClick={() => setMostrarPago(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}