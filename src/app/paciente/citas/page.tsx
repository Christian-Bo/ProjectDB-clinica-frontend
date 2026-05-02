'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { patientsApi } from '@/lib/api/patients';
import type { CitaResponse } from '@/features/patients/models/types';
import { ESTADO_CITA_BADGE, ESTADO_CITA_LABEL } from '@/features/patients/models/types';
import { useToast } from '@/shared/components/providers/ToastProvider';
import { usePacienteSession } from '@/lib/auth/useSession';

type Filtro = 'TODAS' | 'PENDIENTE' | 'CONFIRMADA' | 'HISTORIAL';

export default function MisCitasPage() {
  const toast = useToast();
  const { pacienteId, usuarioId, cargando: cargandoSession } = usePacienteSession();
  const [citas, setCitas] = useState<CitaResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelando, setCancelando] = useState<number | null>(null);
  const [filtro, setFiltro] = useState<Filtro>('TODAS');

  const cargarCitas = useCallback(async () => {
    if (!pacienteId) return;
    setLoading(true);
    const res = await patientsApi.get<CitaResponse[]>(`/api/citas?PacienteId=${pacienteId}`);
    if (res.success && res.data) setCitas(res.data);
    else toast.error('Error', res.message || 'No se pudieron cargar las citas.');
    setLoading(false);
  }, [toast, pacienteId]);

  useEffect(() => { if (pacienteId) void cargarCitas(); }, [cargarCitas, pacienteId]);

  const citasFiltradas = citas.filter((c) => {
    if (filtro === 'TODAS') return true;
    if (filtro === 'HISTORIAL') return ['CANCELADA', 'REPROGRAMADA', 'ATENDIDA', 'NO_SHOW', 'EXPIRADA'].includes(c.estado);
    return c.estado === filtro;
  });

  const contadores = {
    pendientes: citas.filter((c) => c.estado === 'PENDIENTE').length,
    confirmadas: citas.filter((c) => c.estado === 'CONFIRMADA').length,
    historial: citas.filter((c) => ['CANCELADA', 'REPROGRAMADA', 'ATENDIDA', 'NO_SHOW', 'EXPIRADA'].includes(c.estado)).length,
  };

  async function confirmar(citaId: number) {
    const res = await patientsApi.post(`/api/reservar/cita/${citaId}/confirmar`, { usuarioId }, true);
    if (res.success) { toast.success('Cita confirmada', 'Tu cita fue confirmada.'); void cargarCitas(); }
    else toast.error('Error', res.message);
  }

  async function cancelar(citaId: number) {
    setCancelando(citaId);
    const res = await patientsApi.post(`/api/citas/${citaId}/cancelar`, { usuarioId, motivoCancelacion: 'Cancelado por el paciente' });
    if (res.success) { toast.success('Cita cancelada', 'Tu cita fue cancelada.'); void cargarCitas(); }
    else toast.error('Error', res.message);
    setCancelando(null);
  }

  if (cargandoSession) return <div className="loading-box"><p className="muted-text">Cargando sesión...</p></div>;

  const tabStyle = (activo: boolean) => ({
    padding: '8px 16px',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '0.85rem',
    background: activo ? 'var(--color-primary)' : 'transparent',
    color: activo ? 'white' : 'var(--color-text-muted)',
    transition: 'all 0.2s ease',
  });

  return (
    <div className="stack-lg">
      <section className="hero-banner">
        <div>
          <span className="eyebrow">Portal Paciente</span>
          <h1>Mis Citas</h1>
          <p>Historial y estado de tus citas médicas.</p>
          <div className="button-row-wrap">
            <Button onClick={() => window.location.href = '/paciente/citas/nueva'}>Nueva cita</Button>
            <Button variant="secondary" onClick={() => void cargarCitas()}>Actualizar</Button>
          </div>
        </div>
        <div className="hero-card side-highlight">
          <span className="muted-text-light">Resumen</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '8px' }}>
            <div style={{ textAlign: 'center' }}>
              <strong style={{ fontSize: '1.6rem', color: 'var(--color-warning)' }}>{contadores.pendientes}</strong>
              <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.8 }}>Pendientes</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <strong style={{ fontSize: '1.6rem', color: 'white' }}>{contadores.confirmadas}</strong>
              <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.8 }}>Confirmadas</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <strong style={{ fontSize: '1.6rem', color: 'rgba(255,255,255,0.6)' }}>{contadores.historial}</strong>
              <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.8 }}>Historial</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs de filtro */}
      <div style={{ display: 'flex', gap: '8px', padding: '4px', background: 'var(--color-background)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
        {(['TODAS', 'PENDIENTE', 'CONFIRMADA', 'HISTORIAL'] as Filtro[]).map((f) => (
          <button key={f} style={tabStyle(filtro === f)} onClick={() => setFiltro(f)}>
            {f === 'TODAS' ? `Todas (${citas.length})` :
             f === 'PENDIENTE' ? `Pendientes (${contadores.pendientes})` :
             f === 'CONFIRMADA' ? `Confirmadas (${contadores.confirmadas})` :
             `Historial (${contadores.historial})`}
          </button>
        ))}
      </div>

      {loading && <div className="loading-box"><p className="muted-text">Cargando citas...</p></div>}

      {!loading && citasFiltradas.length === 0 && (
        <div className="stack-md">
          <EmptyState title="No hay citas en esta categoría" description="Prueba otro filtro o reserva una nueva cita." />
          <div style={{ textAlign: 'center' }}>
            <Button onClick={() => window.location.href = '/paciente/citas/nueva'}>Reservar cita</Button>
          </div>
        </div>
      )}

      {!loading && citasFiltradas.map((cita) => (
        <Card key={cita.citaId} className="stack-md">
          <div className="section-heading-row">
            <div className="stack-sm">
              <span className="eyebrow">{cita.nombreSede}</span>
              <h3>{cita.nombreServicio}</h3>
              <strong style={{ fontSize: '1.1rem', color: 'var(--color-primary)' }}>
                {new Date(cita.fechaInicio).toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </strong>
              <span className="muted-text">
                {new Date(cita.fechaInicio).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}
                {' — '}
                {new Date(cita.fechaFin).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <Badge className={ESTADO_CITA_BADGE[cita.estado] ?? 'badge-neutral'}>
              {ESTADO_CITA_LABEL[cita.estado] ?? cita.estado}
            </Badge>
          </div>

          <div className="detail-grid">
            <div className="detail-item">
              <span>Médico</span>
              <strong>{cita.nombreMedico || 'No asignado'}</strong>
            </div>
            <div className="detail-item">
              <span>Servicio</span>
              <strong>{cita.nombreServicio || 'No especificado'}</strong>
            </div>
            <div className="detail-item">
              <span>Modalidad</span>
              <strong>{cita.modalidad === 'PRESENCIAL' ? '🏥 Presencial' : '💻 Telemedicina'}</strong>
            </div>
            <div className="detail-item">
              <span>Motivo</span>
              <strong>{cita.motivoConsulta || 'No especificado'}</strong>
            </div>
          </div>

          {(cita.estado === 'PENDIENTE' || cita.estado === 'CONFIRMADA') && (
            <div className="button-row-wrap">
              {cita.estado === 'PENDIENTE' && <Button onClick={() => void confirmar(cita.citaId)}>Confirmar</Button>}
              {cita.estado === 'CONFIRMADA' && (
                <Button variant="ghost" onClick={() => window.location.href = `/paciente/citas/${cita.citaId}/reprogramar`}>
                  Reprogramar
                </Button>
              )}
              <Button variant="danger" loading={cancelando === cita.citaId} onClick={() => void cancelar(cita.citaId)}>
                Cancelar
              </Button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}