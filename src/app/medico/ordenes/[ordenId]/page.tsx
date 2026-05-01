'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { consultasApi } from '@/lib/api/consultas';
import type { OrdenResponse } from '@/lib/api/consultas.types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' });
}

function EstadoBadge({ estado }: { estado: string }) {
  const map: Record<string, string> = {
    SOLICITADA: 'badge-warning',
    EN_PROCESO: 'badge-info',
    COMPLETADA: 'badge-success',
    ENTREGADA: 'badge-neutral',
    CANCELADA: 'badge-neutral',
  };
  return <span className={`badge ${map[estado] ?? 'badge-neutral'}`}>{estado}</span>;
}

const ESTADOS_TRANSICION: Record<string, string[]> = {
  SOLICITADA: ['EN_PROCESO', 'CANCELADA'],
  EN_PROCESO: ['COMPLETADA', 'CANCELADA'],
  COMPLETADA: ['ENTREGADA'],
  ENTREGADA: [],
  CANCELADA: [],
};

export default function VerOrdenPage() {
  const params = useParams();
  const router = useRouter();
  const ordenId = Number(params.ordenId);

  const [orden, setOrden] = useState<OrdenResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [observacion, setObservacion] = useState('');
  const [actualizando, setActualizando] = useState(false);
  const [errorUpdate, setErrorUpdate] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await consultasApi.obtenerOrden(ordenId);
      setOrden(res.data);
      const siguientes = ESTADOS_TRANSICION[res.data.estado] ?? [];
      setNuevoEstado(siguientes[0] ?? '');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error cargando orden');
    } finally {
      setLoading(false);
    }
  }, [ordenId]);

  useEffect(() => { void cargar(); }, [cargar]);

  const handleActualizar = async () => {
    if (!nuevoEstado) return;
    setActualizando(true);
    setErrorUpdate(null);
    try {
      await consultasApi.actualizarEstadoOrden(ordenId, {
        nuevoEstado,
        observacion: observacion || undefined,
        usuarioId: 1,
      });
      await cargar();
      setObservacion('');
    } catch (e: unknown) {
      setErrorUpdate(e instanceof Error ? e.message : 'Error actualizando estado');
    } finally {
      setActualizando(false);
    }
  };

  if (loading) return <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>Cargando orden...</div>;
  if (error) return <div className="card" style={{ borderLeft: '4px solid var(--color-danger)', padding: '1rem 1.5rem' }}><strong style={{ color: 'var(--color-danger)' }}>Error:</strong> {error}</div>;
  if (!orden) return null;

  const siguientesEstados = ESTADOS_TRANSICION[orden.estado] ?? [];

  return (
    <>
      <div className="topbar">
        <div>
          <span className="eyebrow">Orden #{orden.ordenId}</span>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {orden.tipoOrden}
            <EstadoBadge estado={orden.estado} />
            {orden.urgente && <span className="badge badge-danger">🚨 URGENTE</span>}
          </h2>
          <p className="muted-text">
            {orden.pacienteNombre} · Dr(a). {orden.medicoNombre} · {formatDate(orden.fechaEmision)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href={`/medico/consultas/${orden.consultaId}`} className="btn btn-secondary">
            Ver consulta
          </Link>
          <button className="btn btn-ghost" onClick={() => router.back()}>← Volver</button>
        </div>
      </div>

      <div className="content-grid-2 align-start">

        {/* Info de la orden */}
        <div className="card stack-lg">
          <h4 style={{ margin: 0, color: 'var(--color-primary)' }}>Detalle de la orden</h4>
          <div>
            <span className="muted-text" style={{ fontSize: '0.78rem' }}>DESCRIPCIÓN</span>
            <p style={{ margin: '4px 0 0', fontWeight: 500 }}>{orden.descripcion}</p>
          </div>

          {/* Actualizar estado */}
          {siguientesEstados.length > 0 && (
            <div style={{
              padding: '16px',
              background: 'var(--color-background)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              display: 'grid',
              gap: 12,
            }}>
              <h5 style={{ margin: 0 }}>Actualizar estado</h5>

              {errorUpdate && (
                <div style={{ color: 'var(--color-danger)', fontSize: '0.88rem' }}>
                  {errorUpdate}
                </div>
              )}

              <label style={{ display: 'grid', gap: 4 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Nuevo estado</span>
                <select
                  className="input"
                  value={nuevoEstado}
                  onChange={(e) => setNuevoEstado(e.target.value)}
                >
                  {siguientesEstados.map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </label>

              <label style={{ display: 'grid', gap: 4 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Observación (opcional)</span>
                <input
                  className="input"
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                  placeholder="Ej: Muestra recibida en laboratorio"
                />
              </label>

              <button
                className="btn btn-primary"
                onClick={() => void handleActualizar()}
                disabled={actualizando}
              >
                {actualizando && <span className="btn-spinner" />}
                <span>{actualizando ? 'Actualizando...' : 'Confirmar cambio'}</span>
              </button>
            </div>
          )}

          {siguientesEstados.length === 0 && (
            <div className="muted-text" style={{ fontSize: '0.85rem' }}>
              Esta orden está en estado final y no puede cambiar.
            </div>
          )}
        </div>

        {/* Historial */}
        <div className="card stack-lg">
          <h4 style={{ margin: 0, color: 'var(--color-primary)' }}>
            Historial de estados ({orden.historial.length})
          </h4>
          {orden.historial.length === 0 ? (
            <p className="muted-text">Sin cambios de estado registrados.</p>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {orden.historial.map((h, i) => (
                <div key={i} style={{
                  padding: '12px',
                  background: 'var(--color-background)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  display: 'grid',
                  gap: 4,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem' }}>
                    {h.estadoAnterior && (
                      <>
                        <span className="badge badge-neutral">{h.estadoAnterior}</span>
                        <span>→</span>
                      </>
                    )}
                    <span className="badge badge-info">{h.estadoNuevo}</span>
                  </div>
                  {h.observacion && (
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>{h.observacion}</p>
                  )}
                  <span className="muted-text" style={{ fontSize: '0.78rem' }}>
                    {h.usuarioNombre} · {formatDate(h.fechaCambio)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
