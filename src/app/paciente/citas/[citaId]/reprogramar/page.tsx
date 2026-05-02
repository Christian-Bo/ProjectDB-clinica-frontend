'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { patientsApi } from '@/lib/api/patients';
import { useToast } from '@/shared/components/providers/ToastProvider';

const SLOTS = Array.from({ length: 30 }, (_, i) => {
  const totalMinutos = 7 * 60 + i * 20;
  const horas = Math.floor(totalMinutos / 60);
  const minutos = totalMinutos % 60;
  const label = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
  return { label, value: `${label}:00` };
});

export default function ReprogramarCitaPage() {
  const params = useParams();
  const citaId = params.citaId as string;
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [fechaDate, setFechaDate] = useState('');
  const [horaSlot, setHoraSlot] = useState('');

  async function handleReprogramar() {
    if (!fechaDate || !horaSlot) {
      toast.warning('Campos requeridos', 'Selecciona una fecha y una hora.');
      return;
    }

    setLoading(true);
    const nuevaFechaInicio = `${fechaDate}T${horaSlot}`;

    const res = await patientsApi.post(
      `/api/citas/${citaId}/reprogramar`,
      {
        usuarioId: 1,
        nuevaFechaInicio,
        idempotencyKey: crypto.randomUUID(),
      }
    );

    if (res.success) {
      toast.success('Cita reprogramada', 'Tu cita fue reprogramada correctamente.');
      setTimeout(() => window.location.href = '/paciente/citas', 1500);
    } else {
      toast.error('Error', res.message || 'No se pudo reprogramar la cita.');
    }

    setLoading(false);
  }

  return (
    <div className="stack-lg">
      <section className="hero-banner">
        <div>
          <span className="eyebrow">Portal Paciente</span>
          <h1>Reprogramar Cita</h1>
          <p>Selecciona una nueva fecha y hora para tu cita #{citaId}.</p>
        </div>
        <div className="hero-card side-highlight">
          <span className="muted-text-light">Importante</span>
          <strong>Horario disponible</strong>
          <p>Lunes a viernes 07:00–17:00, sábados 07:00–12:00. Slots de 20 minutos.</p>
        </div>
      </section>

      <Card className="stack-md">
        <span className="eyebrow">Nueva fecha</span>
        <h3>Selecciona el nuevo horario</h3>

        <div className="content-grid-2">
          <div className="field-group">
            <span>Fecha</span>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={fechaDate}
              onChange={(e) => setFechaDate(e.target.value)}
            />
          </div>
          <div className="field-group">
            <span>Hora</span>
            <select value={horaSlot} onChange={(e) => setHoraSlot(e.target.value)}>
              <option value="">Selecciona un horario...</option>
              {SLOTS.map((slot) => (
                <option key={slot.value} value={slot.value}>{slot.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="button-row-wrap">
          <Button loading={loading} disabled={loading} onClick={() => void handleReprogramar()}>
            {loading ? 'Reprogramando...' : 'Confirmar reprogramación'}
          </Button>
          <Button variant="ghost" onClick={() => window.location.href = '/paciente/citas'}>
            Cancelar
          </Button>
        </div>
      </Card>
    </div>
  );
}