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

const PACIENTE_ID_DEMO = 5;

export default function MisCitasPage() {
  const toast = useToast();
  const [citas, setCitas] = useState<CitaResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelando, setCancelando] = useState<number | null>(null);

  const cargarCitas = useCallback(async () => {
    setLoading(true);
    const res = await patientsApi.get<CitaResponse[]>(
      `/api/citas?PacienteId=${PACIENTE_ID_DEMO}`
    );
    if (res.success && res.data) {
      setCitas(res.data);
    } else {
      toast.error('Error', res.message || 'No se pudieron cargar las citas.');
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    void cargarCitas();
  }, [cargarCitas]);

  async function confirmar(citaId: number) {
    const res = await patientsApi.post(
      `/api/reservar/cita/${citaId}/confirmar`,
      { usuarioId: 1 },
      true
    );
    if (res.success) {
      toast.success('Cita confirmada', 'Tu cita fue confirmada correctamente.');
      void cargarCitas();
    } else {
      toast.error('Error', res.message);
    }
  }

  async function cancelar(citaId: number) {
    setCancelando(citaId);
    const res = await patientsApi.post(
      `/api/citas/${citaId}/cancelar`,
      { usuarioId: 1, motivoCancelacion: 'Cancelado por el paciente' }
    );
    if (res.success) {
      toast.success('Cita cancelada', 'Tu cita fue cancelada.');
      void cargarCitas();
    } else {
      toast.error('Error', res.message);
    }
    setCancelando(null);
  }

  return (
    <div className="stack-lg">
      <section className="hero-banner">
        <div>
          <span className="eyebrow">Portal Paciente</span>
          <h1>Mis Citas</h1>
          <p>Historial y estado de tus citas médicas.</p>
          <div className="button-row-wrap">
            <Button onClick={() => window.location.href = '/paciente/citas/nueva'}>
              Nueva cita
            </Button>
            <Button variant="secondary" onClick={() => void cargarCitas()}>
              Actualizar
            </Button>
          </div>
        </div>
        <div className="hero-card side-highlight">
          <span className="muted-text-light">Total</span>
          <strong>{citas.length} cita{citas.length !== 1 ? 's' : ''}</strong>
          <p>Puedes confirmar, cancelar o reprogramar tus citas activas.</p>
        </div>
      </section>

      {loading && (
        <div className="loading-box">
          <p className="muted-text">Cargando citas...</p>
        </div>
      )}

      {!loading && citas.length === 0 && (
        <div className="stack-md">
          <EmptyState
            title="No tienes citas registradas"
            description="Reserva tu primera cita médica."
          />
          <div style={{ textAlign: 'center' }}>
            <Button onClick={() => window.location.href = '/paciente/citas/nueva'}>
              Reservar cita
            </Button>
          </div>
        </div>
      )}

      {!loading && citas.map((cita) => (
        <Card key={cita.citaId} className="stack-md">
          <div className="section-heading-row">
            <div className="stack-sm">
              <span className="eyebrow">{cita.nombreSede}</span>
              <h3>{cita.nombreServicio}</h3>
              <div className="stack-sm">
                <strong style={{ fontSize: '1.1rem', color: 'var(--color-primary)' }}>
                  {new Date(cita.fechaInicio).toLocaleDateString('es-GT', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </strong>
                <span className="muted-text">
                  {new Date(cita.fechaInicio).toLocaleTimeString('es-GT', {
                    hour: '2-digit', minute: '2-digit'
                  })} — {new Date(cita.fechaFin).toLocaleTimeString('es-GT', {
                    hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
            <Badge className={ESTADO_CITA_BADGE[cita.estado] ?? 'badge-neutral'}>
              {ESTADO_CITA_LABEL[cita.estado] ?? cita.estado}
            </Badge>
          </div>

          <div className="detail-grid">
            <div className="detail-item">
              <span>Modalidad</span>
              <strong>{cita.modalidad}</strong>
            </div>
            <div className="detail-item">
              <span>Duración</span>
              <strong>
                {new Date(cita.fechaInicio).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}
                {' → '}
                {new Date(cita.fechaFin).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}
              </strong>
            </div>
          </div>

        {(cita.estado === 'PENDIENTE' || cita.estado === 'CONFIRMADA') && (
          <div className="button-row-wrap">
            {cita.estado === 'PENDIENTE' && (
              <Button onClick={() => void confirmar(cita.citaId)}>
                Confirmar
              </Button>
            )}
            {cita.estado === 'CONFIRMADA' && (  // ← solo CONFIRMADA puede reprogramar
              <Button
                variant="ghost"
                onClick={() => window.location.href = `/paciente/citas/${cita.citaId}/reprogramar`}
              >
                Reprogramar
              </Button>
            )}
            <Button
              variant="danger"
              loading={cancelando === cita.citaId}
              onClick={() => void cancelar(cita.citaId)}
            >
              Cancelar
            </Button>
          </div>
        )}
        </Card>
      ))}
    </div>
  );
}