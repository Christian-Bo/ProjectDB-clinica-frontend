'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { useToast } from '@/shared/components/providers/ToastProvider';
import { patientsApi } from '@/lib/api/patients';

interface Proveedor {
  proveedorId: number;
  nombre: string;
  nit?: string;
  contacto?: string;
  telefono?: string;
  correoElectronico?: string;
  direccion?: string;
  estado: string;
}

export default function ProveedoresPage() {
  const toast = useToast();
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading]         = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [guardando, setGuardando]     = useState(false);
  const [form, setForm] = useState({
    proveedorId:        '',
    nombre:             '',
    nit:                '',
    contacto:           '',
    telefono:           '',
    correoElectronico:  '',
    direccion:          '',
    estado:             'ACTIVO',
  });

  const cargar = useCallback(async () => {
    setLoading(true);
    const res = await patientsApi.get<Proveedor[]>('/api/proveedores');
    if (res.success && res.data) setProveedores(res.data);
    else toast.error('Error', 'No se pudieron cargar los proveedores.');
    setLoading(false);
  }, [toast]);

  useEffect(() => { void cargar(); }, [cargar]);

  function handleEditar(p: Proveedor) {
    setForm({
      proveedorId:       String(p.proveedorId),
      nombre:            p.nombre,
      nit:               p.nit ?? '',
      contacto:          p.contacto ?? '',
      telefono:          p.telefono ?? '',
      correoElectronico: p.correoElectronico ?? '',
      direccion:         p.direccion ?? '',
      estado:            p.estado,
    });
    setMostrarForm(true);
  }

  function resetForm() {
    setForm({
      proveedorId: '', nombre: '', nit: '', contacto: '',
      telefono: '', correoElectronico: '', direccion: '', estado: 'ACTIVO',
    });
  }

  async function handleGuardar() {
    if (!form.nombre) {
      toast.warning('Campo requerido', 'El nombre del proveedor es obligatorio.');
      return;
    }
    setGuardando(true);
    const res = await patientsApi.post('/api/proveedores', {
      proveedorId:       form.proveedorId ? Number(form.proveedorId) : null,
      nombre:            form.nombre,
      nit:               form.nit || null,
      contacto:          form.contacto || null,
      telefono:          form.telefono || null,
      correoElectronico: form.correoElectronico || null,
      direccion:         form.direccion || null,
      estado:            form.estado,
    });
    if (res.success) {
      toast.success(
        form.proveedorId ? 'Actualizado' : 'Creado',
        'Proveedor guardado correctamente.'
      );
      resetForm();
      setMostrarForm(false);
      void cargar();
    } else {
      toast.error('Error', res.message || 'No se pudo guardar el proveedor.');
    }
    setGuardando(false);
  }

  return (
    <div className="stack-lg">
      <section className="hero-banner">
        <div>
          <span className="eyebrow">Farmacia</span>
          <h1>Proveedores</h1>
          <p>Administrá los proveedores de medicamentos e insumos.</p>
          <div className="button-row-wrap">
            <Button onClick={() => { resetForm(); setMostrarForm(!mostrarForm); }}>
              {mostrarForm ? 'Cancelar' : '+ Nuevo proveedor'}
            </Button>
          </div>
        </div>
        <div className="hero-card side-highlight">
          <span className="muted-text-light">Total</span>
          <strong style={{ fontSize: '2rem' }}>{proveedores.length}</strong>
          <p>proveedores registrados</p>
        </div>
      </section>

      {mostrarForm && (
        <Card className="stack-md">
          <span className="eyebrow">{form.proveedorId ? 'Editar' : 'Nuevo'} proveedor</span>
          <h3>{form.proveedorId ? 'Actualizar proveedor' : 'Registrar proveedor'}</h3>
          <div className="filters-grid">
            <div className="field-group">
              <span>Nombre *</span>
              <input type="text" value={form.nombre}
                onChange={(e) => setForm(p => ({ ...p, nombre: e.target.value }))}
                placeholder="Nombre del proveedor" />
            </div>
            <div className="field-group">
              <span>NIT</span>
              <input type="text" value={form.nit}
                onChange={(e) => setForm(p => ({ ...p, nit: e.target.value }))}
                placeholder="1234567-8" />
            </div>
            <div className="field-group">
              <span>Contacto</span>
              <input type="text" value={form.contacto}
                onChange={(e) => setForm(p => ({ ...p, contacto: e.target.value }))}
                placeholder="Nombre del contacto" />
            </div>
            <div className="field-group">
              <span>Teléfono</span>
              <input type="text" value={form.telefono}
                onChange={(e) => setForm(p => ({ ...p, telefono: e.target.value }))}
                placeholder="55551234" />
            </div>
            <div className="field-group">
              <span>Correo electrónico</span>
              <input type="email" value={form.correoElectronico}
                onChange={(e) => setForm(p => ({ ...p, correoElectronico: e.target.value }))}
                placeholder="proveedor@ejemplo.com" />
            </div>
            <div className="field-group">
              <span>Dirección</span>
              <input type="text" value={form.direccion}
                onChange={(e) => setForm(p => ({ ...p, direccion: e.target.value }))}
                placeholder="Dirección del proveedor" />
            </div>
            <div className="field-group">
              <span>Estado</span>
              <select value={form.estado}
                onChange={(e) => setForm(p => ({ ...p, estado: e.target.value }))}>
                <option value="ACTIVO">Activo</option>
                <option value="INACTIVO">Inactivo</option>
                <option value="SUSPENDIDO">Suspendido</option>
              </select>
            </div>
          </div>
          <div className="button-row-wrap">
            <Button loading={guardando} disabled={guardando}
              onClick={() => void handleGuardar()}>
              Guardar proveedor
            </Button>
            <Button variant="ghost" onClick={() => { resetForm(); setMostrarForm(false); }}>
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      {loading && <div className="loading-box"><p className="muted-text">Cargando...</p></div>}

      {!loading && proveedores.length === 0 && (
        <EmptyState
          title="No hay proveedores"
          description="Registrá el primer proveedor usando el botón de arriba."
        />
      )}

      {!loading && proveedores.map((p) => (
        <Card key={p.proveedorId} className="stack-md">
          <div className="section-heading-row">
            <div>
              <h3 style={{ margin: 0 }}>{p.nombre}</h3>
              <span className="muted-text">{p.nit ? `NIT: ${p.nit}` : 'Sin NIT'}</span>
            </div>
            <span className={`badge ${p.estado === 'ACTIVO' ? 'badge-success' : 'badge-danger'}`}>
              {p.estado}
            </span>
          </div>
          <div className="filters-grid">
            {p.contacto && (
              <div className="detail-item">
                <span>Contacto</span>
                <strong>{p.contacto}</strong>
              </div>
            )}
            {p.telefono && (
              <div className="detail-item">
                <span>Teléfono</span>
                <strong>{p.telefono}</strong>
              </div>
            )}
            {p.correoElectronico && (
              <div className="detail-item">
                <span>Correo</span>
                <strong>{p.correoElectronico}</strong>
              </div>
            )}
          </div>
          <div className="button-row-wrap">
            <Button variant="secondary" onClick={() => handleEditar(p)}>
              Editar
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}