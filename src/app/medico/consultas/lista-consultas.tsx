'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { consultasApi } from '@/lib/api/consultas';
import { session } from '@/lib/auth/session';

interface ConsultaResumen {
  consultaId: number;
  ticketId: number;
  pacienteNombre: string;
  medicoNombre: string;
  estado: string;
  modalidad: string;
  motivoConsulta?: string | null;
  fechaHoraInicio: string;
  fechaHoraCierre?: string | null;
  diagnosticos: { diagnosticoId: number }[];
  notasCorreccion: { notaId: number }[];
}

function EstadoBadge({ estado }: { estado: string }) {
  const map: Record<string, string> = {
    ABIERTA: 'badge-success',
    CERRADA: 'badge-neutral',
    ANULADA: 'badge-warning',
  };
  return <span className={`badge ${map[estado] ?? 'badge-neutral'}`}>{estado}</span>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-GT', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

// IDs de consultas conocidas — se cargan desde la BD
const CONSULTAS_CONOCIDAS = Array.from({ length: 30 }, (_, i) => i + 1);

export default function ListaConsultasPage() {
  const [consultas, setConsultas] = useState<ConsultaResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    const user = session.getUser();
    if (!user) return;

    const resultados: ConsultaResumen[] = [];

    // Carga las consultas intentando IDs del 1 al 30
    await Promise.all(
      CONSULTAS_CONOCIDAS.map(async (id) => {
        try {
          const res = await consultasApi.obtener(id);
          if (res.success && res.data) {
            resultados.push(res.data as ConsultaResumen);
          }
        } catch {
          // No existe, ignorar
        }
      })
    );

    // Ordenar por fecha descendente
    resultados.sort((a, b) =>
      new Date(b.fechaHoraInicio).getTime() - new Date(a.fechaHoraInicio).getTime()
    );

    setConsultas(resultados);
    setLoading(false);
  }, []);

  useEffect(() => { void cargar(); }, [cargar]);

  const consultasFiltradas = consultas.filter((c) => {
    const coincideEstado = filtroEstado ? c.estado === filtroEstado : true;
    const coincideBusqueda = busqueda
      ? c.pacienteNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.motivoConsulta?.toLowerCase().includes(busqueda.toLowerCase())
      : true;
    return coincideEstado && coincideBusqueda;
  });

  return (
    <>
      <div className="topbar">
        <div>
          <span className="eyebrow">Módulo 4</span>
          <h2>Mis consultas</h2>
          <p className="muted-text">{consultasFiltradas.length} consulta(s) encontrada(s)</p>
        </div>
        <button className="btn btn-secondary" onClick={() => void cargar()}>
          Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <label style={{ display: 'grid', gap: 4, flex: 1, minWidth: 200 }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Buscar paciente o motivo</span>
          <input
            className="input"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Nombre del paciente o motivo..."
          />
        </label>
        <label style={{ display: 'grid', gap: 4 }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Estado</span>
          <select
            className="input"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            style={{ minWidth: 160 }}
          >
            <option value="">Todos</option>
            <option value="ABIERTA">Abierta</option>
            <option value="CERRADA">Cerrada</option>
            <option value="ANULADA">Anulada</option>
          </select>
        </label>
      </div>

      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <span className="btn-spinner" style={{ display: 'inline-block', marginRight: 8 }} />
          Cargando consultas...
        </div>
      )}

      {error && (
        <div className="card" style={{ borderLeft: '4px solid var(--color-danger)', padding: '1rem 1.5rem' }}>
          <strong style={{ color: 'var(--color-danger)' }}>Error:</strong> {error}
        </div>
      )}

      {!loading && consultasFiltradas.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🏥</div>
          <h3>Sin consultas</h3>
          <p>No se encontraron consultas con los filtros actuales.</p>
        </div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {consultasFiltradas.map((c) => (
          <div key={c.consultaId} className="card" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 16,
          }}>
            <div style={{ display: 'grid', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <strong>Consulta #{c.consultaId}</strong>
                <EstadoBadge estado={c.estado} />
                <span className="badge badge-neutral">{c.modalidad}</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: '1rem' }}>{c.pacienteNombre}</div>
              {c.motivoConsulta && (
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                  {c.motivoConsulta}
                </p>
              )}
              <div className="muted-text" style={{ fontSize: '0.82rem' }}>
                Inicio: {formatDate(c.fechaHoraInicio)}
                {c.fechaHoraCierre && ` · Cierre: ${formatDate(c.fechaHoraCierre)}`}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span className="badge badge-info">
                  🩺 {c.diagnosticos?.length ?? 0} diagnóstico(s)
                </span>
                {c.notasCorreccion?.length > 0 && (
                  <span className="badge badge-warning">
                    ⚠ {c.notasCorreccion.length} corrección(es)
                  </span>
                )}
              </div>
            </div>
            <Link
              href={`/medico/consultas/${c.consultaId}`}
              className="btn btn-secondary"
              style={{ whiteSpace: 'nowrap' }}
            >
              Ver consulta
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}
