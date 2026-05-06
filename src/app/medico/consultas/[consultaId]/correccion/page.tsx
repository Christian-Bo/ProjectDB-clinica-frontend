'use client';

import { useState, useEffect } from 'react';
import { session } from '@/lib/auth/session';
import { useParams, useRouter } from 'next/navigation';
import { consultasApi } from '@/lib/api/consultas';

export default function CorreccionPage() {
  const params = useParams();
  const router = useRouter();
  const consultaId = Number(params.consultaId);

  const [nota, setNota] = useState('');
  const [usuarioId, setUsuarioId] = useState<number>(1);

  useEffect(() => {
    const user = session.getUser();
    if (user) setUsuarioId(user.usuarioId);
  }, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  const handleEnviar = async () => {
    if (!nota.trim()) {
      setError('La nota de corrección no puede estar vacía.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await consultasApi.agregarCorreccion(consultaId, {
        nota: nota.trim(),
        usuarioId,
      });
      setExito(true);
      setTimeout(() => router.push(`/medico/consultas/${consultaId}`), 1500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al agregar corrección');
      setLoading(false);
    }
  };

  return (
    <>
      <div className="topbar">
        <div>
          <span className="eyebrow">Consulta #{consultaId}</span>
          <h2>Agregar nota de corrección</h2>
          <p className="muted-text">
            Esta nota es <strong>append-only</strong>. No modifica el registro original.
          </p>
        </div>
        <button className="btn btn-ghost" onClick={() => router.back()}>← Volver</button>
      </div>

      <div className="card stack-lg" style={{ maxWidth: 600 }}>
        <div style={{
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 16px',
        }}>
          <strong style={{ color: 'var(--color-warning)' }}>⚠ Importante</strong>
          <p className="muted-text" style={{ margin: '4px 0 0', fontSize: '0.88rem' }}>
            Las notas de corrección no alteran la consulta original. Quedan registradas
            como un apéndice con fecha, hora y autor, para mantener la trazabilidad clínica.
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(220,38,38,0.08)',
            border: '1px solid var(--color-danger)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            color: 'var(--color-danger)',
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {exito && (
          <div style={{
            background: 'rgba(22,163,74,0.08)',
            border: '1px solid var(--color-success)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            color: 'var(--color-success)',
          }}>
            ✓ Nota registrada correctamente. Redirigiendo...
          </div>
        )}

        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontWeight: 600 }}>Contenido de la corrección</span>
          <textarea
            className="input"
            rows={6}
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Describe la corrección o aclaración clínica..."
            disabled={exito}
          />
        </label>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-primary"
            onClick={() => void handleEnviar()}
            disabled={loading || exito}
          >
            {loading && <span className="btn-spinner" />}
            <span>{loading ? 'Registrando...' : 'Registrar corrección'}</span>
          </button>
          <button className="btn btn-ghost" onClick={() => router.back()}>
            Cancelar
          </button>
        </div>
      </div>
    </>
  );
}
