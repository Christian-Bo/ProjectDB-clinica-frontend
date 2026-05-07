'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { consultasApi } from '@/lib/api/consultas';
import type { MedicamentoItemRequest } from '@/lib/api/consultas.types';
import { session } from '@/lib/auth/session';

const MEDICAMENTOS_SEED = [
  { id: 1, nombre: 'Amoxicilina 500mg cap x30', principio: 'Amoxicilina' },
  { id: 2, nombre: 'Ibuprofeno 400mg tab x20', principio: 'Ibuprofeno' },
  { id: 3, nombre: 'Paracetamol 500mg tab x20', principio: 'Paracetamol' },
  { id: 4, nombre: 'Metformina 850mg tab x30', principio: 'Metformina' },
  { id: 5, nombre: 'Enalapril 10mg tab x30', principio: 'Enalapril' },
  { id: 6, nombre: 'Losartán 50mg tab x30', principio: 'Losartán' },
  { id: 7, nombre: 'Azitromicina 500mg tab x3', principio: 'Azitromicina' },
  { id: 8, nombre: 'Omeprazol 20mg cap x14', principio: 'Omeprazol' },
  { id: 9, nombre: 'Loratadina 10mg tab x10', principio: 'Loratadina' },
  { id: 10, nombre: 'Metronidazol 500mg tab x14', principio: 'Metronidazol' },
  { id: 13, nombre: 'Ciprofloxacino 500mg tab x14', principio: 'Ciprofloxacino' },
  { id: 15, nombre: 'Suero Oral (SRO) sobres x10', principio: 'Sales de rehidratación' },
];

interface ItemForm {
  medicamentoId: number;
  dosis: string;
  frecuencia: string;
  duracionDias: number;
  cantidad: number;
  indicaciones: string;
}

const itemVacio = (): ItemForm => ({
  medicamentoId: 0,
  dosis: '',
  frecuencia: '',
  duracionDias: 1,
  cantidad: 1,
  indicaciones: '',
});

export default function CrearRecetaPage() {
  const params = useParams();
  const router = useRouter();
  const consultaId = Number(params.consultaId);

  const [items, setItems] = useState<ItemForm[]>([itemVacio()]);
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const agregarItem = () => setItems([...items, itemVacio()]);
  const quitarItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const actualizarItem = (i: number, field: keyof ItemForm, value: string | number) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [field]: value };
    setItems(updated);
  };

  const handleCrear = async () => {
    if (items.some(it => it.medicamentoId === 0 || !it.dosis || !it.frecuencia)) {
      setError('Completa todos los campos de cada medicamento.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload: MedicamentoItemRequest[] = items.map(it => ({
        medicamentoId: it.medicamentoId,
        dosis: it.dosis,
        frecuencia: it.frecuencia,
        duracionDias: it.duracionDias,
        cantidad: it.cantidad,
        indicaciones: it.indicaciones || undefined,
      }));
      const res = await consultasApi.crearReceta({
        consultaId,
        usuarioId: session.getUser()?.usuarioId ?? 1,
        items: payload,
      });
      router.push(`/medico/recetas/${res.data.recetaId}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al crear receta');
      setLoading(false);
    }
  };

  return (
    <>
      <div className="topbar">
        <div>
          <span className="eyebrow">Consulta #{consultaId}</span>
          <h2>Nueva receta</h2>
          <p className="muted-text">La consulta debe estar cerrada para emitir una receta.</p>
        </div>
        <button className="btn btn-ghost" onClick={() => router.back()}>← Volver</button>
      </div>

      {error && (
        <div style={{
          background: 'rgba(220,38,38,0.08)',
          border: '1px solid var(--color-danger)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 16px',
          color: 'var(--color-danger)',
          marginBottom: 16,
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div style={{ display: 'grid', gap: 20 }}>
        <div className="card stack-lg">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, color: 'var(--color-primary)' }}>Medicamentos</h4>
            <button className="btn btn-secondary" onClick={agregarItem}>+ Agregar</button>
          </div>

          {items.map((item, i) => (
            <div key={i} style={{
              padding: 16,
              background: 'var(--color-background)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              display: 'grid',
              gap: 12,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '0.9rem' }}>Medicamento {i + 1}</strong>
                {items.length > 1 && (
                  <button className="btn btn-ghost" onClick={() => quitarItem(i)} style={{ color: 'var(--color-danger)', padding: '4px 8px' }}>✕ Quitar</button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
                <label style={{ display: 'grid', gap: 4 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Medicamento *</span>
                  <select
                    className="input"
                    value={item.medicamentoId}
                    onChange={(e) => actualizarItem(i, 'medicamentoId', Number(e.target.value))}
                  >
                    <option value={0}>Seleccionar...</option>
                    {MEDICAMENTOS_SEED.map(m => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                </label>
                <label style={{ display: 'grid', gap: 4 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Dosis *</span>
                  <input className="input" value={item.dosis} onChange={(e) => actualizarItem(i, 'dosis', e.target.value)} placeholder="Ej: 500mg" />
                </label>
                <label style={{ display: 'grid', gap: 4 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Frecuencia *</span>
                  <input className="input" value={item.frecuencia} onChange={(e) => actualizarItem(i, 'frecuencia', e.target.value)} placeholder="Ej: Cada 8 horas" />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 10 }}>
                <label style={{ display: 'grid', gap: 4 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Duración (días)</span>
                  <input type="number" className="input" value={item.duracionDias} min={1} onChange={(e) => actualizarItem(i, 'duracionDias', Number(e.target.value))} />
                </label>
                <label style={{ display: 'grid', gap: 4 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Cantidad</span>
                  <input type="number" className="input" value={item.cantidad} min={1} onChange={(e) => actualizarItem(i, 'cantidad', Number(e.target.value))} />
                </label>
                <label style={{ display: 'grid', gap: 4 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Indicaciones</span>
                  <input className="input" value={item.indicaciones} onChange={(e) => actualizarItem(i, 'indicaciones', e.target.value)} placeholder="Ej: Tomar con alimentos" />
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="card stack-lg">
          <h4 style={{ margin: 0, color: 'var(--color-primary)' }}>Observaciones</h4>
          <textarea
            className="input"
            rows={3}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Observaciones generales de la receta..."
          />
        </div>

        <div className="card" style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-primary" onClick={() => void handleCrear()} disabled={loading}>
            {loading && <span className="btn-spinner" />}
            <span>{loading ? 'Creando receta...' : 'Emitir receta'}</span>
          </button>
          <button className="btn btn-ghost" onClick={() => router.back()}>Cancelar</button>
        </div>
      </div>
    </>
  );
}
