'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { consultasApi } from '@/lib/api/consultas';

export default function CrearOrdenPage() {
  const params = useParams();
  const router = useRouter();
  const consultaId = Number(params.consultaId);

  const [tipoOrden, setTipoOrden] = useState('LABORATORIO');
  const [descripcion, setDescripcion] = useState('');
  const [urgencia, setUrgencia] = useState('NORMAL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCrear = async () => {
    if (!descripcion.trim()) {
      setError('La descripción de la orden es obligatoria.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await consultasApi.crearOrden({
        consultaId,
        tipoOrden,
        descripcion: descripcion.trim(),
        urgencia,
        usuarioId: 1,
      });
      router.push(`/medico/ordenes/${res.data.ordenId}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al crear orden');
      setLoading(false);
    }
  };

  return (
    <>
      <div className="topbar">
        <div>
          <span className="eyebrow">Consulta #{consultaId}</span>
          <h2>Nueva orden</h2>
          <p className="muted-text">La consulta debe estar cerrada para emitir una orden.</p>
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

      <div className="card stack-lg" style={{ maxWidth: 600 }}>
        <h4 style={{ margin: 0, color: 'var(--color-primary)' }}>Datos de la orden</h4>

        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Tipo de orden *</span>
          <select className="input" value={tipoOrden} onChange={(e) => setTipoOrden(e.target.value)}>
            <option value="LABORATORIO">🔬 Laboratorio</option>
            <option value="IMAGEN">🩻 Imagen</option>
            <option value="PROCEDIMIENTO">⚕️ Procedimiento</option>
            <option value="REFERENCIA">📋 Referencia</option>
          </select>
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Descripción / Indicación clínica *</span>
          <textarea
            className="input"
            rows={4}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: Hemograma completo, glucosa en ayunas, perfil lipídico..."
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Urgencia</span>
          <select className="input" value={urgencia} onChange={(e) => setUrgencia(e.target.value)}>
            <option value="NORMAL">Normal</option>
            <option value="URGENTE">🚨 Urgente</option>
          </select>
        </label>

        {urgencia === 'URGENTE' && (
          <div style={{
            background: 'rgba(220,38,38,0.08)',
            border: '1px solid var(--color-danger)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            fontSize: '0.88rem',
            color: 'var(--color-danger)',
          }}>
            🚨 Esta orden será marcada como urgente y tendrá prioridad de atención.
          </div>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-primary" onClick={() => void handleCrear()} disabled={loading}>
            {loading && <span className="btn-spinner" />}
            <span>{loading ? 'Creando orden...' : 'Emitir orden'}</span>
          </button>
          <button className="btn btn-ghost" onClick={() => router.back()}>Cancelar</button>
        </div>
      </div>
    </>
  );
}
