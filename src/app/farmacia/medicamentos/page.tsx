'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { useToast } from '@/shared/components/providers/ToastProvider';
import { patientsApi } from '@/lib/api/patients';

interface Medicamento {
  medicamentoId: number;
  codigoInterno: string;
  nombre: string;
  principioActivo: string;
  tipo: string;
  presentacion?: string;
  unidadMedida: string;
  precioVenta: number;
  stockMinimo: number;
  estado: string;
  requiereReceta: boolean;
}

const ESTADOS = ['ACTIVO', 'DESCONTINUADO', 'AGOTADO'];

export default function MedicamentosPage() {
  const toast = useToast();
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [loading, setLoading]           = useState(true);
  const [mostrarForm, setMostrarForm]   = useState(false);
  const [guardando, setGuardando]       = useState(false);
  const [texto, setTexto]               = useState('');
  const [estado, setEstado]             = useState('ACTIVO');
  const [form, setForm] = useState({
    medicamentoId:           '',
    codigoInterno:           '',
    nombre:                  '',
    principioActivo:         '',
    tipo:                    'ALOPÁTICO',
    presentacion:            '',
    concentracionDescripcion:'',
    unidadMedida:            'UNIDAD',
    requiereReceta:          true,
    controladoPorSalud:      false,
    precioCompra:            '',
    precioVenta:             '',
    stockMinimo:             '10',
    estado:                  'ACTIVO',
  });

  const cargar = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (texto)  params.set('texto', texto);
    if (estado) params.set('estado', estado);
    const res = await patientsApi.get<Medicamento[]>(`/api/medicamentos?${params}`);
    if (res.success && res.data) setMedicamentos(res.data);
    else toast.error('Error', 'No se pudieron cargar los medicamentos.');
    setLoading(false);
  }, [toast, texto, estado]);

  useEffect(() => { void cargar(); }, [cargar]);

  function handleEditar(m: Medicamento) {
    setForm({
      medicamentoId:            String(m.medicamentoId),
      codigoInterno:            m.codigoInterno,
      nombre:                   m.nombre,
      principioActivo:          m.principioActivo,
      tipo:                     m.tipo,
      presentacion:             m.presentacion ?? '',
      concentracionDescripcion: '',
      unidadMedida:             m.unidadMedida,
      requiereReceta:           m.requiereReceta,
      controladoPorSalud:       false,
      precioCompra:             '',
      precioVenta:              String(m.precioVenta),
      stockMinimo:              String(m.stockMinimo),
      estado:                   m.estado,
    });
    setMostrarForm(true);
  }

  function resetForm() {
    setForm({
      medicamentoId: '', codigoInterno: '', nombre: '',
      principioActivo: '', tipo: 'ALOPÁTICO', presentacion: '',
      concentracionDescripcion: '', unidadMedida: 'UNIDAD',
      requiereReceta: true, controladoPorSalud: false,
      precioCompra: '', precioVenta: '', stockMinimo: '10', estado: 'ACTIVO',
    });
  }

  async function handleGuardar() {
    if (!form.codigoInterno || !form.nombre || !form.principioActivo || !form.precioVenta) {
      toast.warning('Campos requeridos', 'Código, nombre, principio activo y precio venta son obligatorios.');
      return;
    }
    setGuardando(true);
    const body = {
      medicamentoId:            form.medicamentoId ? Number(form.medicamentoId) : null,
      codigoInterno:            form.codigoInterno,
      nombre:                   form.nombre,
      principioActivo:          form.principioActivo,
      tipo:                     form.tipo,
      presentacion:             form.presentacion || null,
      concentracionDescripcion: form.concentracionDescripcion || null,
      unidadMedida:             form.unidadMedida,
      requiereReceta:           form.requiereReceta,
      controladoPorSalud:       form.controladoPorSalud,
      precioCompra:             form.precioCompra ? Number(form.precioCompra) : null,
      precioVenta:              Number(form.precioVenta),
      stockMinimo:              Number(form.stockMinimo),
      estado:                   form.estado,
    };
    const res = await patientsApi.post('/api/medicamentos', body);
    if (res.success) {
      toast.success(
        form.medicamentoId ? 'Actualizado' : 'Creado',
        'Medicamento guardado correctamente.'
      );
      resetForm();
      setMostrarForm(false);
      void cargar();
    } else {
      toast.error('Error', res.message || 'No se pudo guardar el medicamento.');
    }
    setGuardando(false);
  }

  return (
    <div className="stack-lg">
      <section className="hero-banner">
        <div>
          <span className="eyebrow">Farmacia</span>
          <h1>Catálogo de Medicamentos</h1>
          <p>Administrá el inventario de medicamentos disponibles.</p>
          <div className="button-row-wrap">
            <Button onClick={() => { resetForm(); setMostrarForm(!mostrarForm); }}>
              {mostrarForm ? 'Cancelar' : '+ Nuevo medicamento'}
            </Button>
          </div>
        </div>
        <div className="hero-card side-highlight">
          <span className="muted-text-light">Total</span>
          <strong style={{ fontSize: '2rem' }}>{medicamentos.length}</strong>
          <p>medicamentos en catálogo</p>
        </div>
      </section>

      {/* Filtros */}
      <Card className="stack-md">
        <div className="filters-grid">
          <div className="field-group">
            <span>Buscar</span>
            <input
              type="text" value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Nombre, principio activo o código..."
            />
          </div>
          <div className="field-group">
            <span>Estado</span>
            <select value={estado} onChange={(e) => setEstado(e.target.value)}>
              <option value="">Todos</option>
              {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button onClick={() => void cargar()}>Buscar</Button>
          </div>
        </div>
      </Card>

      {/* Formulario */}
      {mostrarForm && (
        <Card className="stack-md">
          <span className="eyebrow">{form.medicamentoId ? 'Editar' : 'Nuevo'} medicamento</span>
          <h3>{form.medicamentoId ? 'Actualizar medicamento' : 'Registrar medicamento'}</h3>
          <div className="filters-grid">
            <div className="field-group">
              <span>Código interno *</span>
              <input type="text" value={form.codigoInterno}
                onChange={(e) => setForm(p => ({ ...p, codigoInterno: e.target.value }))}
                placeholder="MED-0001" />
            </div>
            <div className="field-group">
              <span>Nombre *</span>
              <input type="text" value={form.nombre}
                onChange={(e) => setForm(p => ({ ...p, nombre: e.target.value }))}
                placeholder="Nombre comercial" />
            </div>
            <div className="field-group">
              <span>Principio activo *</span>
              <input type="text" value={form.principioActivo}
                onChange={(e) => setForm(p => ({ ...p, principioActivo: e.target.value }))}
                placeholder="Paracetamol" />
            </div>
            <div className="field-group">
              <span>Tipo</span>
              <select value={form.tipo}
                onChange={(e) => setForm(p => ({ ...p, tipo: e.target.value }))}>
                {['ALOPÁTICO','VITAMINA','SUPLEMENTO','BIOLÓGICO','HERBAL','OTRO'].map(t =>
                  <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="field-group">
              <span>Presentación</span>
              <input type="text" value={form.presentacion}
                onChange={(e) => setForm(p => ({ ...p, presentacion: e.target.value }))}
                placeholder="Tabletas, jarabe, inyectable..." />
            </div>
            <div className="field-group">
              <span>Unidad de medida</span>
              <select value={form.unidadMedida}
                onChange={(e) => setForm(p => ({ ...p, unidadMedida: e.target.value }))}>
                {['UNIDAD','CAJA','FRASCO','AMPOLLA','SOBRE','ML','MG'].map(u =>
                  <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="field-group">
              <span>Precio de venta (Q) *</span>
              <input type="number" value={form.precioVenta}
                onChange={(e) => setForm(p => ({ ...p, precioVenta: e.target.value }))}
                placeholder="0.00" min="0" step="0.01" />
            </div>
            <div className="field-group">
              <span>Precio de compra (Q)</span>
              <input type="number" value={form.precioCompra}
                onChange={(e) => setForm(p => ({ ...p, precioCompra: e.target.value }))}
                placeholder="0.00" min="0" step="0.01" />
            </div>
            <div className="field-group">
              <span>Stock mínimo</span>
              <input type="number" value={form.stockMinimo}
                onChange={(e) => setForm(p => ({ ...p, stockMinimo: e.target.value }))}
                min="0" />
            </div>
            <div className="field-group">
              <span>Estado</span>
              <select value={form.estado}
                onChange={(e) => setForm(p => ({ ...p, estado: e.target.value }))}>
                {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.requiereReceta}
                onChange={(e) => setForm(p => ({ ...p, requiereReceta: e.target.checked }))} />
              <span>Requiere receta</span>
            </label>
            <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.controladoPorSalud}
                onChange={(e) => setForm(p => ({ ...p, controladoPorSalud: e.target.checked }))} />
              <span>Controlado por salud</span>
            </label>
          </div>
          <div className="button-row-wrap">
            <Button loading={guardando} disabled={guardando} onClick={() => void handleGuardar()}>
              Guardar medicamento
            </Button>
            <Button variant="ghost" onClick={() => { resetForm(); setMostrarForm(false); }}>
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      {loading && <div className="loading-box"><p className="muted-text">Cargando...</p></div>}

      {!loading && medicamentos.length === 0 && (
        <EmptyState
          title="No hay medicamentos"
          description="Registrá el primer medicamento usando el botón de arriba."
        />
      )}

      {!loading && medicamentos.map((m) => (
        <Card key={m.medicamentoId} className="stack-md">
          <div className="section-heading-row">
            <div>
              <span className="eyebrow">{m.codigoInterno}</span>
              <h3 style={{ margin: 0 }}>{m.nombre}</h3>
              <span className="muted-text">{m.principioActivo} · {m.tipo}</span>
            </div>
            <span className={`badge ${m.estado === 'ACTIVO' ? 'badge-success' : 'badge-danger'}`}>
              {m.estado}
            </span>
          </div>
          <div className="filters-grid">
            <div className="detail-item">
              <span>Presentación</span>
              <strong>{m.presentacion || '—'}</strong>
            </div>
            <div className="detail-item">
              <span>Unidad</span>
              <strong>{m.unidadMedida}</strong>
            </div>
            <div className="detail-item">
              <span>Precio venta</span>
              <strong>Q {m.precioVenta.toFixed(2)}</strong>
            </div>
            <div className="detail-item">
              <span>Stock mínimo</span>
              <strong>{m.stockMinimo}</strong>
            </div>
            <div className="detail-item">
              <span>Requiere receta</span>
              <strong>{m.requiereReceta ? 'Sí' : 'No'}</strong>
            </div>
          </div>
          <div className="button-row-wrap">
            <Button variant="secondary" onClick={() => handleEditar(m)}>
              Editar
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}