'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { useToast } from '@/shared/components/providers/ToastProvider';
import { session } from '@/lib/auth/session';
import { secretariaApi } from '@/lib/api/secretaria';
import type { SecretariaContextoDto, SecretariaTicketDto, SecretariaResumenDto } from '@/features/secretaria/models/secretaria';
import { PRIORIDAD_COLOR, ESTADO_ASIGNACION_COLOR, ESTADO_ASIGNACION_LABEL } from '@/features/secretaria/models/secretaria';

export default function SecretariaDashboard() {
  const toast = useToast();

  // ─── Estado ───────────────────────────────────────────────────────────────
  const [usuarioId,        setUsuarioId]        = useState<number>(0);
  const [contextos,        setContextos]        = useState<SecretariaContextoDto[]>([]);
  const [contextoActivo,   setContextoActivo]   = useState<SecretariaContextoDto | null>(null);
  const [cola,             setCola]             = useState<SecretariaTicketDto[]>([]);
  const [resumen,          setResumen]          = useState<SecretariaResumenDto | null>(null);
  const [ticketActual,     setTicketActual]     = useState<SecretariaTicketDto | null>(null);
  const [cargando,         setCargando]         = useState(true);
  const [tomando,          setTomando]          = useState(false);
  const [mostrarAsistencia,setMostrarAsistencia]= useState(false);
  const [mostrarMedico,    setMostrarMedico]    = useState(false);
  const [mostrarNoShow,    setMostrarNoShow]    = useState(false);
  const [docValidado,      setDocValidado]      = useState(false);
  const [datosActualizados,setDatosActualizados]= useState(false);
  const [observaciones,    setObservaciones]    = useState('');
  const [motivoNoShow,     setMotivoNoShow]     = useState('');
  const [guardando,        setGuardando]        = useState(false);

  // ─── Cargar sesión y contextos ────────────────────────────────────────────
  useEffect(() => {
    const user = session.getUser();
    if (!user) { window.location.href = '/login'; return; }
    setUsuarioId(user.usuarioId);

    secretariaApi.getContextos(user.usuarioId).then((res) => {
      if (res.success && res.data) {
        setContextos(res.data);
        const principal = res.data.find((c) => c.esPrincipal) ?? res.data[0];
        if (principal) seleccionarContexto(principal, user.usuarioId);
      }
      setCargando(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Seleccionar contexto ─────────────────────────────────────────────────
  async function seleccionarContexto(ctx: SecretariaContextoDto, uid?: number) {
    const id = uid ?? usuarioId;
    const res = await secretariaApi.configurarContexto(
      id, ctx.sedeId, ctx.servicioId ?? null, ctx.estacionId
    );
    if (res.success) {
      setContextoActivo(ctx);
      void cargarCola(ctx, id);
      void cargarResumen(ctx, id);
    } else {
      toast.error('Error', res.message || 'No se pudo configurar el contexto.');
    }
  }

  // ─── Cargar cola ─────────────────────────────────────────────────────────
  const cargarCola = useCallback(async (ctx?: SecretariaContextoDto | null, uid?: number) => {
    const c  = ctx  ?? contextoActivo;
    const id = uid  ?? usuarioId;
    if (!c) return;
    const res = await secretariaApi.getCola(id, c.sedeId, c.servicioId ?? null, c.estacionId);
    if (res.success && res.data) setCola(res.data);
  }, [contextoActivo, usuarioId]);

  // ─── Cargar resumen ───────────────────────────────────────────────────────
  const cargarResumen = useCallback(async (ctx?: SecretariaContextoDto | null, uid?: number) => {
    const c  = ctx  ?? contextoActivo;
    const id = uid  ?? usuarioId;
    if (!c) return;
    const res = await secretariaApi.getResumen(id, c.sedeId, c.servicioId ?? null, c.estacionId);
    if (res.success && res.data) setResumen(res.data);
  }, [contextoActivo, usuarioId]);

  // ─── Polling cada 15 segundos ─────────────────────────────────────────────
  useEffect(() => {
    if (!contextoActivo) return;
    const interval = setInterval(() => {
      void cargarCola();
      void cargarResumen();
    }, 15000);
    return () => clearInterval(interval);
  }, [contextoActivo, cargarCola, cargarResumen]);

  // ─── Tomar siguiente ──────────────────────────────────────────────────────
  async function handleTomarSiguiente() {
    if (!contextoActivo) return;
    setTomando(true);
    const res = await secretariaApi.tomarSiguiente(
      usuarioId, contextoActivo.sedeId,
      contextoActivo.servicioId ?? null, contextoActivo.estacionId
    );
    if (res.success && res.data) {
      setTicketActual(res.data);
      toast.success('Ticket tomado', `Atendiendo ${res.data.numeroTicket}`);
      void cargarCola();
      void cargarResumen();
    } else {
      toast.warning('Sin tickets', res.message || 'No hay tickets pendientes.');
    }
    setTomando(false);
  }

  // ─── Registrar asistencia ─────────────────────────────────────────────────
  async function handleAsistencia() {
    if (!ticketActual || !contextoActivo) return;
    setGuardando(true);
    const res = await secretariaApi.registrarAsistencia(
      ticketActual.ticketId, usuarioId, contextoActivo.estacionId,
      docValidado, datosActualizados, observaciones || undefined
    );
    if (res.success && res.data) {
      setTicketActual(res.data);
      setMostrarAsistencia(false);
      setObservaciones('');
      toast.success('Asistencia registrada', 'Paciente presente en ventanilla.');
      void cargarResumen();
    } else {
      toast.error('Error', res.message || 'No se pudo registrar la asistencia.');
    }
    setGuardando(false);
  }

  // ─── Enviar al médico ─────────────────────────────────────────────────────
  async function handleEnviarMedico() {
    if (!ticketActual || !contextoActivo) return;
    setGuardando(true);
    const res = await secretariaApi.enviarMedico(
      ticketActual.ticketId, usuarioId, contextoActivo.estacionId,
      undefined, undefined, observaciones || undefined
    );
    if (res.success) {
      setTicketActual(null);
      setMostrarMedico(false);
      setObservaciones('');
      toast.success('Enviado', 'Ticket enviado al médico correctamente.');
      void cargarCola();
      void cargarResumen();
    } else {
      toast.error('Error', res.message || 'No se pudo enviar al médico.');
    }
    setGuardando(false);
  }

  // ─── No-show ──────────────────────────────────────────────────────────────
  async function handleNoShow() {
    if (!ticketActual || !contextoActivo) return;
    setGuardando(true);
    const res = await secretariaApi.marcarNoShow(
      ticketActual.ticketId, usuarioId,
      contextoActivo.estacionId, motivoNoShow || undefined
    );
    if (res.success) {
      setTicketActual(null);
      setMostrarNoShow(false);
      setMotivoNoShow('');
      toast.success('No-show', 'Paciente marcado como no presentado.');
      void cargarCola();
      void cargarResumen();
    } else {
      toast.error('Error', res.message || 'No se pudo marcar no-show.');
    }
    setGuardando(false);
  }

  if (cargando) return (
    <div className="loading-box"><p className="muted-text">Cargando panel...</p></div>
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="stack-lg">

      {/* Hero */}
      <section className="hero-banner">
        <div>
          <span className="eyebrow">Panel Secretaria</span>
          <h1>Gestión de Ventanilla</h1>
          <p>Administrá tu cola, registrá asistencias y enviá pacientes al médico.</p>
          {contextoActivo && (
            <div className="button-row-wrap" style={{ marginTop: '12px' }}>
              <span className="badge badge-teal">{contextoActivo.sedeNombre}</span>
              <span className="badge badge-info">{contextoActivo.servicioNombre}</span>
              <span className="badge badge-success">{contextoActivo.estacionNombre}</span>
            </div>
          )}
        </div>
        <div className="hero-card side-highlight">
          <span className="muted-text-light">Ventanilla activa</span>
          <strong style={{ fontSize: '1.3rem' }}>
            {contextoActivo?.estacionNombre ?? 'Sin configurar'}
          </strong>
          <p>{contextoActivo?.sedeNombre ?? 'Seleccioná un contexto'}</p>
        </div>
      </section>

      {/* Selector de contexto */}
      {contextos.length > 1 && (
        <Card className="stack-md">
          <span className="eyebrow">Cambiar ventanilla</span>
          <h3>Seleccioná tu ventanilla</h3>
          <div className="button-row-wrap">
            {contextos.map((ctx) => (
              <Button
                key={ctx.secretariaAsignacionId}
                variant={contextoActivo?.estacionId === ctx.estacionId ? 'primary' : 'secondary'}
                onClick={() => void seleccionarContexto(ctx)}
              >
                {ctx.estacionNombre}
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* Resumen operativo */}
      {resumen && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[
            { label: 'Pendientes',   value: resumen.ticketsPendientes,      color: '#2EC4B6' },
            { label: 'Tomados',      value: resumen.ticketsTomados,         color: '#F59E0B' },
            { label: 'Asistencias',  value: resumen.asistenciasRegistradas, color: '#10B981' },
            { label: 'Con médico',   value: resumen.enviadosMedico,         color: '#6366F1' },
            { label: 'No-show',      value: resumen.noShow,                 color: '#EF4444' },
            { label: 'Espera prom.', value: `${Math.round(resumen.promedioEsperaMinutos)} min`, color: '#0F4C5C' },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: 'white', borderRadius: '16px', padding: '20px',
              border: '1px solid #E5E7EB', textAlign: 'center',
              boxShadow: '0 4px 12px rgba(15,76,92,0.06)'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: stat.color }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#6B7280', marginTop: '4px' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ticket actual */}
      {ticketActual && (
        <Card className="stack-md">
          <div className="section-heading-row">
            <div>
              <span className="eyebrow">Atendiendo ahora</span>
              <h2 style={{ color: '#2EC4B6', fontSize: '2rem', margin: 0 }}>
                {ticketActual.numeroTicket}
              </h2>
            </div>
            <span className={`badge ${PRIORIDAD_COLOR[ticketActual.prioridad] ?? 'badge-neutral'}`}>
              {ticketActual.prioridad}
            </span>
          </div>

          <div className="filters-grid">
            <div className="detail-item">
              <span>Paciente</span>
              <strong>{ticketActual.pacienteNombre}</strong>
            </div>
            <div className="detail-item">
              <span>Expediente</span>
              <strong>{ticketActual.numeroExpediente || '—'}</strong>
            </div>
            <div className="detail-item">
              <span>Servicio</span>
              <strong>{ticketActual.servicioNombre}</strong>
            </div>
            <div className="detail-item">
              <span>Estado</span>
              <strong>{ESTADO_ASIGNACION_LABEL[ticketActual.estadoAsignacion] ?? ticketActual.estadoAsignacion}</strong>
            </div>
            {ticketActual.fechaCita && (
              <div className="detail-item">
                <span>Cita</span>
                <strong>{new Date(ticketActual.fechaCita).toLocaleDateString('es-GT')}</strong>
              </div>
            )}
            <div className="detail-item">
              <span>Espera</span>
              <strong>{ticketActual.minutosEspera} min</strong>
            </div>
          </div>

          <div className="button-row-wrap">
            {ticketActual.estadoAsignacion !== 'ASISTENCIA_REGISTRADA' &&
             ticketActual.estadoAsignacion !== 'ENVIADO_MEDICO' && (
              <Button onClick={() => setMostrarAsistencia(true)}>
                Registrar asistencia
              </Button>
            )}
            {ticketActual.estadoAsignacion === 'ASISTENCIA_REGISTRADA' && (
              <Button onClick={() => setMostrarMedico(true)}>
                Enviar a médico
              </Button>
            )}
            <Button variant="danger" onClick={() => setMostrarNoShow(true)}>
              No-show
            </Button>
          </div>
        </Card>
      )}

      {/* Botón tomar siguiente */}
      {!ticketActual && contextoActivo && (
        <Card className="stack-md" style={{ textAlign: 'center' }}>
          <h3>Cola de tu ventanilla</h3>
          <p className="muted-text">
            {cola.length > 0
              ? `${cola.length} ticket(s) esperando`
              : 'No hay tickets pendientes en tu ventanilla.'}
          </p>
          <Button
            loading={tomando}
            disabled={tomando || cola.length === 0}
            onClick={() => void handleTomarSiguiente()}
          >
            {tomando ? 'Tomando...' : 'Tomar siguiente ticket'}
          </Button>
        </Card>
      )}

      {/* Cola */}
      {cola.length > 0 && (
        <Card className="stack-md">
          <span className="eyebrow">Cola de ventanilla</span>
          <h3>Tickets asignados</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {cola.map((t) => (
              <div key={t.ticketId} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 18px', borderRadius: '12px',
                background: '#F7FAFC', border: '1px solid #E5E7EB'
              }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <strong style={{ color: '#2EC4B6', fontSize: '1.1rem' }}>
                    {t.numeroTicket}
                  </strong>
                  <span className={`badge ${PRIORIDAD_COLOR[t.prioridad] ?? 'badge-neutral'}`}>
                    {t.prioridad}
                  </span>
                  <span className={`badge ${ESTADO_ASIGNACION_COLOR[t.estadoAsignacion] ?? 'badge-neutral'}`}>
                    {ESTADO_ASIGNACION_LABEL[t.estadoAsignacion] ?? t.estadoAsignacion}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{t.pacienteNombre}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>{t.minutosEspera} min espera</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Modal asistencia */}
      {mostrarAsistencia && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', padding: '32px',
            width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 20px', color: '#0F4C5C' }}>Registrar asistencia</h3>
            <div className="stack-md">
              <label style={{ display: 'flex', gap: '10px', alignItems: 'center', cursor: 'pointer' }}>
                <input type="checkbox" checked={docValidado}
                  onChange={(e) => setDocValidado(e.target.checked)} />
                <span>Documento validado</span>
              </label>
              <label style={{ display: 'flex', gap: '10px', alignItems: 'center', cursor: 'pointer' }}>
                <input type="checkbox" checked={datosActualizados}
                  onChange={(e) => setDatosActualizados(e.target.checked)} />
                <span>Datos de contacto actualizados</span>
              </label>
              <div className="field-group">
                <span>Observaciones (opcional)</span>
                <input type="text" value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Notas adicionales..." />
              </div>
            </div>
            <div className="button-row-wrap" style={{ marginTop: '24px' }}>
              <Button loading={guardando} onClick={() => void handleAsistencia()}>
                Confirmar asistencia
              </Button>
              <Button variant="ghost" onClick={() => setMostrarAsistencia(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal enviar médico */}
      {mostrarMedico && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', padding: '32px',
            width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 20px', color: '#0F4C5C' }}>Enviar al médico</h3>
            <div className="stack-md">
              <p className="muted-text">
                El paciente <strong>{ticketActual?.pacienteNombre}</strong> será enviado
                al consultorio médico.
              </p>
              <div className="field-group">
                <span>Observaciones (opcional)</span>
                <input type="text" value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Notas para el médico..." />
              </div>
            </div>
            <div className="button-row-wrap" style={{ marginTop: '24px' }}>
              <Button loading={guardando} onClick={() => void handleEnviarMedico()}>
                Confirmar envío
              </Button>
              <Button variant="ghost" onClick={() => setMostrarMedico(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal no-show */}
      {mostrarNoShow && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', padding: '32px',
            width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 20px', color: '#EF4444' }}>Marcar no-show</h3>
            <div className="stack-md">
              <p className="muted-text">
                El ticket <strong>{ticketActual?.numeroTicket}</strong> será marcado
                como no presentado.
              </p>
              <div className="field-group">
                <span>Motivo (opcional)</span>
                <input type="text" value={motivoNoShow}
                  onChange={(e) => setMotivoNoShow(e.target.value)}
                  placeholder="Razón del no-show..." />
              </div>
            </div>
            <div className="button-row-wrap" style={{ marginTop: '24px' }}>
              <Button variant="danger" loading={guardando}
                onClick={() => void handleNoShow()}>
                Confirmar no-show
              </Button>
              <Button variant="ghost" onClick={() => setMostrarNoShow(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}