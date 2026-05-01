'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { consultasApi } from '@/lib/api/consultas';
import type { ConsultaResponse } from '@/lib/api/consultas.types';

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

export default function VerConsultaPage() {
  const params = useParams();
  const router = useRouter();
  const consultaId = Number(params.consultaId);

  const [consulta, setConsulta] = useState<ConsultaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await consultasApi.obtener(consultaId);
      setConsulta(res.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error cargando consulta');
    } finally {
      setLoading(false);
    }
  }, [consultaId]);

  useEffect(() => { void cargar(); }, [cargar]);

  if (loading) return (
    <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
      Cargando consulta...
    </div>
  );

  if (error) return (
    <div className="card" style={{ borderLeft: '4px solid var(--color-danger)', padding: '1rem 1.5rem' }}>
      <strong style={{ color: 'var(--color-danger)' }}>Error:</strong> {error}
    </div>
  );

  if (!consulta) return null;

  const estaAbierta = consulta.estado === 'ABIERTA';

  return (
    <>
      <div className="topbar">
        <div>
          <span className="eyebrow">Consulta #{consulta.consultaId}</span>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {consulta.pacienteNombre}
            <EstadoBadge estado={consulta.estado} />
          </h2>
          <p className="muted-text">
            {consulta.medicoNombre} · {consulta.modalidad} · {formatDate(consulta.fechaHoraInicio)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {estaAbierta && (
            <Link href={`/medico/consultas/${consulta.consultaId}/cerrar`} className="btn btn-primary">
              Cerrar consulta
            </Link>
          )}
          {!estaAbierta && (
            <Link href={`/medico/consultas/${consulta.consultaId}/correccion`} className="btn btn-secondary">
              Agregar corrección
            </Link>
          )}
          <button className="btn btn-ghost" onClick={() => router.push('/medico/agenda')}>
            ← Agenda
          </button>
        </div>
      </div>

      <div className="content-grid-2 align-start">
        {/* Columna izquierda */}
        <div style={{ display: 'grid', gap: 16 }}>

          {/* Datos principales */}
          <div className="card stack-lg">
            <h4 style={{ margin: 0, color: 'var(--color-primary)' }}>Datos de la consulta</h4>
            <div style={{ display: 'grid', gap: 8 }}>
              {consulta.motivoConsulta && (
                <div>
                  <span className="muted-text" style={{ fontSize: '0.8rem' }}>MOTIVO</span>
                  <p style={{ margin: '2px 0 0' }}>{consulta.motivoConsulta}</p>
                </div>
              )}
              {consulta.hallazgos && (
                <div>
                  <span className="muted-text" style={{ fontSize: '0.8rem' }}>HALLAZGOS</span>
                  <p style={{ margin: '2px 0 0' }}>{consulta.hallazgos}</p>
                </div>
              )}
              {consulta.plan && (
                <div>
                  <span className="muted-text" style={{ fontSize: '0.8rem' }}>PLAN</span>
                  <p style={{ margin: '2px 0 0' }}>{consulta.plan}</p>
                </div>
              )}
              {consulta.fechaHoraCierre && (
                <div>
                  <span className="muted-text" style={{ fontSize: '0.8rem' }}>FECHA CIERRE</span>
                  <p style={{ margin: '2px 0 0' }}>{formatDate(consulta.fechaHoraCierre)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Signos vitales */}
          {consulta.signosVitales && (
            <div className="card stack-lg">
              <h4 style={{ margin: 0, color: 'var(--color-primary)' }}>Signos vitales</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Presión arterial', value: consulta.signosVitales.presionSistolica ? `${consulta.signosVitales.presionSistolica}/${consulta.signosVitales.presionDiastolica} mmHg` : null },
                  { label: 'Freq. cardíaca', value: consulta.signosVitales.frecuenciaCardiaca ? `${consulta.signosVitales.frecuenciaCardiaca} bpm` : null },
                  { label: 'Temperatura', value: consulta.signosVitales.temperatura ? `${consulta.signosVitales.temperatura} °C` : null },
                  { label: 'Saturación O₂', value: consulta.signosVitales.saturacionOxigeno ? `${consulta.signosVitales.saturacionOxigeno}%` : null },
                  { label: 'Peso', value: consulta.signosVitales.pesoKg ? `${consulta.signosVitales.pesoKg} kg` : null },
                  { label: 'Talla', value: consulta.signosVitales.tallaCm ? `${consulta.signosVitales.tallaCm} cm` : null },
                  { label: 'IMC', value: consulta.signosVitales.imc ? `${consulta.signosVitales.imc}` : null },
                ].filter(x => x.value).map(({ label, value }) => (
                  <div key={label} className="summary-chip-card">
                    <span className="muted-text" style={{ fontSize: '0.78rem' }}>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notas de corrección */}
          {consulta.notasCorreccion.length > 0 && (
            <div className="card stack-lg">
              <h4 style={{ margin: 0, color: 'var(--color-warning)' }}>
                ⚠ Notas de corrección ({consulta.notasCorreccion.length})
              </h4>
              {consulta.notasCorreccion.map((nota) => (
                <div key={nota.notaId} style={{
                  background: 'rgba(245,158,11,0.08)',
                  border: '1px solid rgba(245,158,11,0.3)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 14px',
                }}>
                  <p style={{ margin: 0 }}>{nota.nota}</p>
                  <span className="muted-text" style={{ fontSize: '0.78rem' }}>
                    {nota.usuarioNombre} · {formatDate(nota.fechaCreacion)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Columna derecha */}
        <div style={{ display: 'grid', gap: 16 }}>

          {/* Diagnósticos */}
          <div className="card stack-lg">
            <h4 style={{ margin: 0, color: 'var(--color-primary)' }}>
              Diagnósticos ({consulta.diagnosticos.length})
            </h4>
            {consulta.diagnosticos.length === 0 ? (
              <p className="muted-text">Sin diagnósticos registrados.</p>
            ) : (
              consulta.diagnosticos.map((d) => (
                <div key={d.diagnosticoId} style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  padding: '10px 0',
                  borderBottom: '1px solid var(--color-border)',
                }}>
                  <span className="badge badge-info" style={{ flexShrink: 0 }}>{d.codigoCie}</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{d.descripcion}</div>
                    <span className="muted-text" style={{ fontSize: '0.8rem' }}>{d.tipoDiagnostico}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Acciones rápidas si está cerrada */}
          {!estaAbierta && (
            <div className="card stack-lg">
              <h4 style={{ margin: 0, color: 'var(--color-primary)' }}>Acciones clínicas</h4>
              <div style={{ display: 'grid', gap: 10 }}>
                <Link
                  href={`/medico/pacientes/${consulta.pacienteId}/historial`}
                  className="btn btn-secondary"
                  style={{ textAlign: 'center' }}
                >
                  Ver historial del paciente
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
