'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { useToast } from '@/shared/components/providers/ToastProvider';
import { patientsApi } from '@/lib/api/patients';
import { session } from '@/lib/auth/session';

interface Proveedor { proveedorId: number; nombre: string; }
interface Medicamento { medicamentoId: number; nombre: string; codigoInterno: string; precioCompra?: number; }
interface OrdenCompra {
  ordenCompraId: number; proveedorId: number; numeroOrden: string;
  estado: string; fechaEmision: string; fechaEntregaPact?: string;
  subtotal: number; impuesto: number; total: number; observaciones?: string;
}
interface DetalleOrden {
  ordenCompraDetalleId: number;
  medicamentoId:        number;
  medicamentoNombre:    string;
  cantidadSolicitada:   number;
  cantidadRecibida:     number;
  precioUnitario:       number;
  subtotalLinea:        number;
}

const ESTADO_COLOR: Record<string, string> = {
  BORRADOR: 'badge-neutral', APROBADA: 'badge-info',
  ENVIADA: 'badge-warning', RECIBIDA_PARCIAL: 'badge-warning',
  RECIBIDA: 'badge-success', CANCELADA: 'badge-danger',
};

export default function ComprasPage() {
  const toast = useToast();
  const [ordenes, setOrdenes]             = useState<OrdenCompra[]>([]);
  const [proveedores, setProveedores]     = useState<Proveedor[]>([]);
  const [medicamentos, setMedicamentos]   = useState<Medicamento[]>([]);
  const [loading, setLoading]             = useState(true);
  const [mostrarForm, setMostrarForm]     = useState(false);
  const [guardando, setGuardando]         = useState(false);
  const [usuarioId, setUsuarioId]         = useState<number>(1);
  const [ordenActiva, setOrdenActiva]     = useState<OrdenCompra | null>(null);
  const [detalles, setDetalles]           = useState<DetalleOrden[]>([]);
  const [mostrarItem, setMostrarItem]     = useState(false);
  const [estadoFiltro, setEstadoFiltro]   = useState('BORRADOR');
  const [guardandoItem, setGuardandoItem] = useState(false);
  const [recepcionando, setRecepcionando] = useState<number | null>(null);
  const [formItem, setFormItem] = useState({
    medicamentoId: '', cantidadSolicitada: '', precioUnitario: '',
  });
  const [form, setForm] = useState({
    proveedorId: '', numeroOrden: '', fechaEntregaPact: '', observaciones: '',
  });

  useEffect(() => {
    const user = session.getUser();
    if (user) setUsuarioId(user.usuarioId);
    void cargarProveedores();
    void cargarMedicamentos();
  }, []);

  const cargar = useCallback(async () => {
    setLoading(true);
    const res = await patientsApi.get<OrdenCompra[]>('/api/compras');
    if (res.success && res.data) setOrdenes(res.data);
    else toast.error('Error', 'No se pudieron cargar las órdenes.');
    setLoading(false);
  }, [toast]);

  useEffect(() => { void cargar(); }, [cargar]);

  async function cargarProveedores() {
    const res = await patientsApi.get<Proveedor[]>('/api/proveedores');
    if (res.success && res.data) setProveedores(res.data);
  }

  async function cargarMedicamentos() {
    const res = await patientsApi.get<Medicamento[]>('/api/medicamentos?estado=ACTIVO');
    if (res.success && res.data) setMedicamentos(res.data);
  }

  async function verDetalle(o: OrdenCompra) {
    setOrdenActiva(o);
    const res = await patientsApi.get<{ detalles: DetalleOrden[] }>(`/api/compras/${o.ordenCompraId}`);
    if (res.success && res.data) setDetalles((res.data as any).detalles ?? []);
  }

  function generarNumeroOrden() {
    const f = new Date();
    return `OC-${f.getFullYear()}${String(f.getMonth()+1).padStart(2,'0')}${String(f.getDate()).padStart(2,'0')}-${String(Math.floor(Math.random()*999)+1).padStart(3,'0')}`;
  }

  async function handleCrear() {
    if (!form.proveedorId) { toast.warning('Requerido', 'Seleccioná un proveedor.'); return; }
    setGuardando(true);
    const res = await patientsApi.post('/api/compras', {
      proveedorId:      Number(form.proveedorId),
      numeroOrden:      form.numeroOrden || generarNumeroOrden(),
      fechaEntregaPact: form.fechaEntregaPact || null,
      observaciones:    form.observaciones || null,
      creadoPor:        usuarioId,
    });
    if (res.success) {
      toast.success('Orden creada', 'Orden creada correctamente.');
      setForm({ proveedorId: '', numeroOrden: '', fechaEntregaPact: '', observaciones: '' });
      setMostrarForm(false);
      void cargar();
    } else {
      toast.error('Error', res.message || 'No se pudo crear la orden.');
    }
    setGuardando(false);
  }

  async function handleAgregarItem() {
    if (!ordenActiva) return;
    if (!formItem.medicamentoId || !formItem.cantidadSolicitada || !formItem.precioUnitario) {
      toast.warning('Requerido', 'Completá todos los campos del ítem.');
      return;
    }
    setGuardandoItem(true);
    const res = await patientsApi.post(`/api/compras/${ordenActiva.ordenCompraId}/detalle`, {
      medicamentoId:      Number(formItem.medicamentoId),
      cantidadSolicitada: Number(formItem.cantidadSolicitada),
      precioUnitario:     Number(formItem.precioUnitario),
    });
    if (res.success) {
      toast.success('Ítem agregado', 'Medicamento agregado a la orden.');
      setFormItem({ medicamentoId: '', cantidadSolicitada: '', precioUnitario: '' });
      setMostrarItem(false);
      void verDetalle(ordenActiva);
      void cargar();
    } else {
      toast.error('Error', res.message || 'No se pudo agregar el ítem.');
    }
    setGuardandoItem(false);
  }

  async function handleRegistrarRecepcion(detalleId: number, cantidad: number) {
    setRecepcionando(detalleId);
    const res = await patientsApi.post('/api/compras/recepcion', {
      ordenCompraDetalleId: detalleId,
      cantidadRecibida:     cantidad,
      usuarioId:            usuarioId,
    });
    if (res.success) {
      toast.success('Stock actualizado', 'Recepción registrada correctamente.');
      if (ordenActiva) void verDetalle(ordenActiva);
      void cargar();
    } else {
      toast.error('Error', res.message || 'No se pudo registrar la recepción.');
    }
    setRecepcionando(null);
  }

  async function handleCambiarEstado(ordenCompraId: number, estado: string) {
    const res = await patientsApi.patch(`/api/compras/${ordenCompraId}/estado`, { estado });
    if (res.success) {
      toast.success('Estado actualizado', `Orden actualizada a ${estado}.`);
      void cargar();
      if (ordenActiva?.ordenCompraId === ordenCompraId)
        setOrdenActiva(prev => prev ? { ...prev, estado } : null);
    } else {
      toast.error('Error', res.message || 'No se pudo actualizar el estado.');
    }
  }

  function getNombreProveedor(id: number) {
    return proveedores.find(p => p.proveedorId === id)?.nombre ?? `Proveedor #${id}`;
  }

  function getNombreMedicamento(id: number) {
    const m = medicamentos.find(m => m.medicamentoId === id);
    return m ? `${m.nombre} (${m.codigoInterno})` : `Medicamento #${id}`;
  }

  function handleSeleccionarMedicamento(medId: string) {
    const med = medicamentos.find(m => m.medicamentoId === Number(medId));
    setFormItem(p => ({
      ...p,
      medicamentoId:  medId,
      precioUnitario: med?.precioCompra ? String(med.precioCompra) : p.precioUnitario,
    }));
  }

  return (
    <div className="stack-lg">
      <section className="hero-banner">
        <div>
          <span className="eyebrow">Farmacia</span>
          <h1>Órdenes de Compra</h1>
          <p>Gestioná las compras de medicamentos e insumos.</p>
          <div className="button-row-wrap">
            <Button onClick={() => setMostrarForm(!mostrarForm)}>
              {mostrarForm ? 'Cancelar' : '+ Nueva orden'}
            </Button>
          </div>
        </div>
        <div className="hero-card side-highlight">
          <span className="muted-text-light">Total órdenes</span>
          <strong style={{ fontSize: '2rem' }}>{ordenes.length}</strong>
          <p>órdenes registradas</p>
        </div>
      </section>

      {/* Formulario nueva orden */}
      {mostrarForm && (
        <Card className="stack-md">
          <span className="eyebrow">Nueva orden de compra</span>
          <h3>Crear orden</h3>
          <div className="filters-grid">
            <div className="field-group">
              <span>Proveedor *</span>
              <select value={form.proveedorId}
                onChange={(e) => setForm(p => ({ ...p, proveedorId: e.target.value }))}>
                <option value="">Seleccioná un proveedor...</option>
                {proveedores.map((p) => (
                  <option key={p.proveedorId} value={p.proveedorId}>{p.nombre}</option>
                ))}
              </select>
            </div>
            <div className="field-group">
              <span>Número de orden</span>
              <input type="text" value={form.numeroOrden}
                onChange={(e) => setForm(p => ({ ...p, numeroOrden: e.target.value }))}
                placeholder="Se genera automáticamente si se deja vacío" />
            </div>
            <div className="field-group">
              <span>Fecha entrega pactada</span>
              <input type="date" value={form.fechaEntregaPact}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setForm(p => ({ ...p, fechaEntregaPact: e.target.value }))} />
            </div>
            <div className="field-group">
              <span>Observaciones</span>
              <input type="text" value={form.observaciones}
                onChange={(e) => setForm(p => ({ ...p, observaciones: e.target.value }))}
                placeholder="Notas adicionales..." />
            </div>
          </div>
          <div className="button-row-wrap">
            <Button loading={guardando} disabled={guardando} onClick={() => void handleCrear()}>
              Crear orden
            </Button>
            <Button variant="ghost" onClick={() => setMostrarForm(false)}>Cancelar</Button>
          </div>
        </Card>
      )}

      {/* Filtro por estado */}
      <Card className="stack-md">
        <div className="filters-grid">
          <div className="field-group">
            <span>Filtrar por estado</span>
            <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
              <option value="">Todas</option>
              <option value="BORRADOR">Borrador</option>
              <option value="APROBADA">Aprobada</option>
              <option value="ENVIADA">Enviada</option>
              <option value="RECIBIDA_PARCIAL">Recibida parcial</option>
              <option value="RECIBIDA">Recibida</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </div>
        </div>
      </Card>

      {loading && <div className="loading-box"><p className="muted-text">Cargando...</p></div>}
      {!loading && ordenes.filter(o => !estadoFiltro || o.estado === estadoFiltro).length === 0 && (
        <EmptyState title="No hay órdenes"
          description="No se encontraron órdenes con ese estado." />
      )}

      {/* Lista de órdenes */}
      {!loading && ordenes
        .filter(o => !estadoFiltro || o.estado === estadoFiltro)
        .map((o) => (
        <Card key={o.ordenCompraId} className="stack-md">
          <div className="section-heading-row">
            <div>
              <span className="eyebrow">{o.numeroOrden}</span>
              <h3 style={{ margin: 0 }}>{getNombreProveedor(o.proveedorId)}</h3>
              <span className="muted-text">
                Emitida: {new Date(o.fechaEmision).toLocaleDateString('es-GT')}
                {o.fechaEntregaPact && ` · Entrega pactada: ${new Date(o.fechaEntregaPact).toLocaleDateString('es-GT')}`}
              </span>
            </div>
            <span className={`badge ${ESTADO_COLOR[o.estado] ?? 'badge-neutral'}`}>{o.estado}</span>
          </div>

          <div className="filters-grid">
            <div className="detail-item">
              <span>Subtotal</span>
              <strong>Q {o.subtotal.toFixed(2)}</strong>
            </div>
            <div className="detail-item">
              <span>IVA (12%)</span>
              <strong>Q {o.impuesto.toFixed(2)}</strong>
            </div>
            <div className="detail-item">
              <span>Total con IVA</span>
              <strong style={{ color: '#0F4C5C', fontSize: '1.05rem' }}>
                Q {o.total.toFixed(2)}
              </strong>
            </div>
          </div>

          {o.observaciones && (
            <div className="detail-item">
              <span>Observaciones</span>
              <strong>{o.observaciones}</strong>
            </div>
          )}

          <div className="button-row-wrap">
            <Button variant="secondary" onClick={() => void verDetalle(o)}>
              Ver medicamentos
            </Button>
            {o.estado === 'BORRADOR' && (
              <Button onClick={() => void handleCambiarEstado(o.ordenCompraId, 'APROBADA')}>
                Aprobar orden
              </Button>
            )}
            {o.estado === 'APROBADA' && (
              <Button onClick={() => void handleCambiarEstado(o.ordenCompraId, 'ENVIADA')}>
                Marcar enviada al proveedor
              </Button>
            )}
            {o.estado !== 'RECIBIDA' && o.estado !== 'CANCELADA' && (
              <Button variant="danger"
                onClick={() => void handleCambiarEstado(o.ordenCompraId, 'CANCELADA')}>
                Cancelar orden
              </Button>
            )}
          </div>
        </Card>
      ))}

      {/* Modal detalle orden */}
      {ordenActiva && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', padding: '32px',
            width: '100%', maxWidth: '700px', maxHeight: '90vh',
            overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }}>
            <div className="section-heading-row" style={{ marginBottom: '20px' }}>
              <div>
                <span className="eyebrow">{ordenActiva.numeroOrden}</span>
                <h3 style={{ margin: 0 }}>{getNombreProveedor(ordenActiva.proveedorId)}</h3>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span className={`badge ${ESTADO_COLOR[ordenActiva.estado] ?? 'badge-neutral'}`}>
                  {ordenActiva.estado}
                </span>
                <Button variant="ghost"
                  onClick={() => { setOrdenActiva(null); setMostrarItem(false); }}>
                  ✕ Cerrar
                </Button>
              </div>
            </div>

            {ordenActiva.estado === 'ENVIADA' && (
              <div style={{
                background: '#FFF7ED', border: '1px solid #FED7AA',
                borderRadius: '10px', padding: '12px 16px', marginBottom: '16px',
                fontSize: '0.9rem', color: '#92400E'
              }}>
                ⚠️ Confirmá la recepción de cada medicamento para actualizar el stock.
              </div>
            )}

            <div className="stack-sm" style={{ marginBottom: '20px' }}>
              <span className="eyebrow">Medicamentos en la orden</span>
              {detalles.length === 0 && (
                <p className="muted-text">No hay ítems. Agregá medicamentos abajo.</p>
              )}
              {detalles.map((d) => (
                <div key={d.ordenCompraDetalleId} style={{
                  padding: '14px 16px', background: '#F7FAFC', borderRadius: '10px',
                  border: '1px solid #E5E7EB', marginBottom: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <strong style={{ color: '#0F4C5C' }}>
                        {d.medicamentoNombre || getNombreMedicamento(d.medicamentoId)}
                      </strong>
                      <div style={{ fontSize: '0.85rem', color: '#6B7280', marginTop: '4px' }}>
                        Solicitado: {d.cantidadSolicitada} ·
                        Precio: Q {d.precioUnitario.toFixed(2)} ·
                        <span style={{ color: d.cantidadRecibida > 0 ? '#10B981' : '#EF4444', fontWeight: 600 }}>
                          {' '}Recibido: {d.cantidadRecibida}
                        </span>
                      </div>
                    </div>
                    <strong style={{ color: '#0F4C5C', fontSize: '1.05rem' }}>
                      Q {d.subtotalLinea.toFixed(2)}
                    </strong>
                  </div>
                  {ordenActiva.estado === 'ENVIADA' &&
                   d.cantidadRecibida < d.cantidadSolicitada && (
                    <div style={{ marginTop: '10px' }}>
                      <Button
                        loading={recepcionando === d.ordenCompraDetalleId}
                        disabled={recepcionando !== null}
                        onClick={() => void handleRegistrarRecepcion(
                          d.ordenCompraDetalleId,
                          d.cantidadSolicitada - d.cantidadRecibida
                        )}
                      >
                        ✓ Confirmar recepción — sube stock
                      </Button>
                    </div>
                  )}
                  {d.cantidadRecibida >= d.cantidadSolicitada && (
                    <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#10B981', fontWeight: 600 }}>
                      ✓ Recibido completo
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Agregar ítem solo en BORRADOR */}
            {ordenActiva.estado === 'BORRADOR' && (
              <>
                {!mostrarItem ? (
                  <Button variant="secondary" onClick={() => setMostrarItem(true)}>
                    + Agregar medicamento
                  </Button>
                ) : (
                  <div className="stack-md" style={{
                    background: '#F7FAFC', borderRadius: '12px', padding: '20px'
                  }}>
                    <span className="eyebrow">Agregar medicamento</span>
                    <div className="filters-grid">
                      <div className="field-group">
                        <span>Medicamento *</span>
                        <select value={formItem.medicamentoId}
                          onChange={(e) => handleSeleccionarMedicamento(e.target.value)}>
                          <option value="">Seleccioná un medicamento...</option>
                          {medicamentos.map((m) => (
                            <option key={m.medicamentoId} value={m.medicamentoId}>
                              {m.nombre} ({m.codigoInterno})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="field-group">
                        <span>Cantidad *</span>
                        <input type="number" value={formItem.cantidadSolicitada}
                          onChange={(e) => setFormItem(p => ({ ...p, cantidadSolicitada: e.target.value }))}
                          min="1" placeholder="0" />
                      </div>
                      <div className="field-group">
                        <span>Precio unitario (Q) *</span>
                        <input type="number" value={formItem.precioUnitario}
                          onChange={(e) => setFormItem(p => ({ ...p, precioUnitario: e.target.value }))}
                          min="0.01" step="0.01" placeholder="0.00" />
                      </div>
                    </div>
                    <div className="button-row-wrap">
                      <Button loading={guardandoItem} disabled={guardandoItem}
                        onClick={() => void handleAgregarItem()}>
                        Agregar
                      </Button>
                      <Button variant="ghost" onClick={() => setMostrarItem(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            <div style={{
              borderTop: '1px solid #E5E7EB', marginTop: '20px', paddingTop: '16px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span style={{ fontWeight: 700 }}>Total orden (con IVA)</span>
              <strong style={{ fontSize: '1.2rem', color: '#0F4C5C' }}>
                Q {ordenActiva.total.toFixed(2)}
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}