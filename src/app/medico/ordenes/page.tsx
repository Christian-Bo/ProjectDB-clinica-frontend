'use client';

import { useEffect, useState, useCallback } from 'react';
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

function TipoBadge({ tipo }: { tipo: string }) {
  const icons: Record<string, string> = {
    LABORATORIO: '🔬',
    IMAGEN: '🩻',
    PROCEDIMIENTO: '⚕️',
    REFERENCIA: '📋',
  };
  return <span>{icons[tipo] ?? '📄'} {tipo}</span>;
}

export default function OrdenesPage() {
  const [ordenes, setOrdenes] = useState<OrdenResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await consultasApi.listarOrdenes({
        estado: filtroEstado || undefined,
        tipoOrden: filtroTipo || undefined,
      });
      setOrdenes(res.data.items);
      setTotal(res.data.total);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error cargando órdenes');
    } finally {
      setLoading(false);
    }
  }, [filtroEstado, filtroTipo]);

  useEffect(() => { void cargar(); }, [cargar]);

  return (
    <>
      <div className="topbar">
        <div>
          <span className="eyebrow">Módulo 4</span>
          <h2>Órdenes clínicas</h2>
          <p className="muted-text">{total} orden(es) registrada(s)</p>
        </div>
        <button className="btn btn-secondary" onClick={() => void cargar()}>Actualizar</button>
      </div>

      {/* Filtros */}
      <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <label style={{ display: 'grid', gap: 4 }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Estado</span>
          <select className="input" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} style={{ minWidth: 160 }}>
            <option value="">Todos</option>
            <option value="SOLICITADA">Solicitada</option>
            <option value="EN_PROCESO">En proceso</option>
            <option value="COMPLETADA">Completada</option>
            <option value="ENTREGADA">Entregada</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
        </label>
        <label style={{ display: 'grid', gap: 4 }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Tipo</span>
          <select className="input" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} style={{ minWidth: 160 }}>
            <option value="">Todos</option>
            <option value="LABORATORIO">Laboratorio</option>
            <option value="IMAGEN">Imagen</option>
            <option value="PROCEDIMIENTO">Procedimiento</option>
            <option value="REFERENCIA">Referencia</option>
          </select>
        </label>
      </div>

      {loading && <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>Cargando órdenes...</div>}
      {error && <div className="card" style={{ borderLeft: '4px solid var(--color-danger)', padding: '1rem 1.5rem' }}><strong style={{ color: 'var(--color-danger)' }}>Error:</strong> {error}</div>}

      {!loading && ordenes.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🔬</div>
          <h3>Sin órdenes</h3>
          <p>No se encontraron órdenes con los filtros actuales.</p>
        </div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {ordenes.map((orden) => (
          <div key={orden.ordenId} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ display: 'grid', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <strong>Orden #{orden.ordenId}</strong>
                <EstadoBadge estado={orden.estado} />
                {orden.urgente && <span className="badge badge-danger">🚨 URGENTE</span>}
              </div>
              <div style={{ fontWeight: 600 }}><TipoBadge tipo={orden.tipoOrden} /></div>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>{orden.descripcion}</p>
              <div className="muted-text" style={{ fontSize: '0.82rem' }}>
                {orden.pacienteNombre} · {orden.medicoNombre} · {formatDate(orden.fechaEmision)}
              </div>
            </div>
            <Link href={`/medico/ordenes/${orden.ordenId}`} className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>
              Ver orden
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}
