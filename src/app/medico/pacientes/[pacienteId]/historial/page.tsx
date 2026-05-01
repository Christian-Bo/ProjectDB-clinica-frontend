'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { consultasApi } from '@/lib/api/consultas';
import type { HistorialClinicoResponse } from '@/lib/api/consultas.types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' });
}

function EstadoBadge({ estado }: { estado: string }) {
  const map: Record<string, string> = {
    ABIERTA: 'badge-success',
    CERRADA: 'badge-neutral',
    ANULADA: 'badge-warning',
  };
  return <span className={`badge ${map[estado] ?? 'badge-neutral'}`}>{estado}</span>;
}

export default function HistorialPage() {
  const params = useParams();
  const router = useRouter();
  const pacienteId = Number(params.pacienteId);

  const [historial, setHistorial] = useState<HistorialClinicoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await consultasApi.obtenerHistorial(pacienteId);
      setHistorial(res.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error cargando historial');
    } finally {
      setLoading(false);
    }
  }, [pacienteId]);

  useEffect(() => { void cargar(); }, [cargar]);

  if (loading) return <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>Cargando historial clínico...</div>;
  if (error) return <div className="card" style={{ borderLeft: '4px solid var(--color-danger)', padding: '1rem 1.5rem' }}><strong style={{ color: 'var(--color-danger)' }}>Error:</strong> {error}</div>;

  return (
    <>
      <div className="topbar">
        <div>
          <span className="eyebrow">Historia clínica</span>
          <h2>{historial?.pacienteNombre ?? `Paciente #${pacienteId}`}</h2>
          <p className="muted-text">
            {historial?.consultas.length ?? 0} consulta(s) registrada(s)
          </p>
        </div>
        <button className="btn btn-ghost" onClick={() => router.back()}>← Volver</button>
      </div>

      {historial?.consultas.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🏥</div>
          <h3>Sin historial clínico</h3>
          <p>Este paciente no tiene consultas registradas.</p>
        </div>
      )}

      <div style={{ display: 'grid', gap: 14 }}>
        {historial?.consultas.map((c) => (
          <div key={c.consultaId} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ display: 'grid', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <strong>Consulta #{c.consultaId}</strong>
                <EstadoBadge estado={c.estado} />
              </div>
              <div className="muted-text" style={{ fontSize: '0.85rem' }}>
                {c.medicoNombre} · {formatDate(c.fechaHoraInicio)}
                {c.fechaHoraCierre && ` → ${formatDate(c.fechaHoraCierre)}`}
              </div>
              {c.motivoConsulta && (
                <p style={{ margin: 0, fontSize: '0.9rem' }}>{c.motivoConsulta}</p>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <span className="badge badge-info">🩺 {c.totalDiagnosticos} diagnóstico(s)</span>
                <span className="badge badge-success">💊 {c.totalRecetas} receta(s)</span>
                <span className="badge badge-warning">🔬 {c.totalOrdenes} orden(es)</span>
              </div>
            </div>
            <Link href={`/medico/consultas/${c.consultaId}`} className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>
              Ver consulta
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}
