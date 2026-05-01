'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { consultasApi } from '@/lib/api/consultas';
import type { RecetaResponse } from '@/lib/api/consultas.types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' });
}

function EstadoBadge({ estado }: { estado: string }) {
  const map: Record<string, string> = {
    PENDIENTE: 'badge-warning',
    ENVIADA_FARMACIA: 'badge-info',
    DESPACHADA: 'badge-success',
    CANCELADA: 'badge-neutral',
    EXTERNA: 'badge-neutral',
  };
  return <span className={`badge ${map[estado] ?? 'badge-neutral'}`}>{estado}</span>;
}

export default function VerRecetaPage() {
  const params = useParams();
  const router = useRouter();
  const recetaId = Number(params.recetaId);

  const [receta, setReceta] = useState<RecetaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await consultasApi.obtenerReceta(recetaId);
      setReceta(res.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error cargando receta');
    } finally {
      setLoading(false);
    }
  }, [recetaId]);

  useEffect(() => { void cargar(); }, [cargar]);

  if (loading) return <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>Cargando receta...</div>;
  if (error) return <div className="card" style={{ borderLeft: '4px solid var(--color-danger)', padding: '1rem 1.5rem' }}><strong style={{ color: 'var(--color-danger)' }}>Error:</strong> {error}</div>;
  if (!receta) return null;

  return (
    <>
      <div className="topbar">
        <div>
          <span className="eyebrow">Receta #{receta.recetaId}</span>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {receta.pacienteNombre}
            <EstadoBadge estado={receta.estado} />
          </h2>
          <p className="muted-text">
            Dr(a). {receta.medicoNombre} · {formatDate(receta.fechaEmision)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href={`/medico/consultas/${receta.consultaId}`} className="btn btn-secondary">
            Ver consulta
          </Link>
          <button className="btn btn-ghost" onClick={() => router.back()}>← Volver</button>
        </div>
      </div>

      <div className="card stack-lg">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0, color: 'var(--color-primary)' }}>
            Medicamentos ({receta.items.length})
          </h4>
          {receta.fechaDespacho && (
            <span className="muted-text" style={{ fontSize: '0.85rem' }}>
              Despachada: {formatDate(receta.fechaDespacho)}
            </span>
          )}
        </div>

        {receta.items.map((item, i) => (
          <div key={i} style={{
            padding: '16px',
            background: 'var(--color-background)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            display: 'grid',
            gap: 6,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <strong style={{ fontSize: '1rem' }}>{item.nombreComercial}</strong>
                <span className="muted-text" style={{ fontSize: '0.85rem', marginLeft: 8 }}>
                  ({item.principioActivo})
                </span>
              </div>
              <span className="badge badge-info">{item.dosis}</span>
            </div>
            <div className="muted-text" style={{ fontSize: '0.85rem' }}>
              {item.frecuencia} · {item.duracionDias} día(s)
            </div>
            {item.indicaciones && (
              <div style={{ fontSize: '0.88rem', fontStyle: 'italic' }}>
                📌 {item.indicaciones}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
