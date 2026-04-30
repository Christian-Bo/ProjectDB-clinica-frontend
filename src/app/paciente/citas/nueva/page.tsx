'use client';

import { useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { patientsApi } from '@/lib/api/patients';
import type { ReservarCitaRequest } from '@/features/patients/models/types';
import { useToast } from '@/shared/components/providers/ToastProvider';

const PACIENTE_ID_DEMO = 5;

export default function ReservarCitaPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [citaCreada, setCitaCreada] = useState<{ citaId: number; estado: string } | null>(null);

  const [form, setForm] = useState<ReservarCitaRequest>({
    pacienteId: PACIENTE_ID_DEMO,
    sedeId: 3,
    servicioId: 4,
    medicoId: 1,
    tipoConsultaId: 1,
    fechaInicio: '',
    modalidad: 'PRESENCIAL',
    motivoConsulta: '',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit() {
    if (!form.fechaInicio) {
      toast.warning('Campo requerido', 'Selecciona una fecha y hora para la cita.');
      return;
    }

    setLoading(true);
    setCitaCreada(null);

    const payload = {
      ...form,
      sedeId: Number(form.sedeId),
      servicioId: Number(form.servicioId),
      medicoId: Number(form.medicoId),
      tipoConsultaId: Number(form.tipoConsultaId),
      fechaInicio: form.fechaInicio + ':00',
    };

    const res = await patientsApi.post<{ citaId: number; estado: string }>(
      '/api/reservar/cita',
      payload,
      true // genera Idempotency-Key automáticamente
    );

    if (res.success && res.data) {
      toast.success('Cita reservada', '¡Tu cita fue reservada correctamente!');
      setCitaCreada(res.data);
    } else if (res.errorCode === 'SIN_CUPO') {
      toast.error('Sin cupo', 'El horario seleccionado ya no tiene cupo disponible.');
    } else if (res.errorCode === 'HORARIO_NO_DISPONIBLE') {
      toast.error('Horario no disponible', 'No existe horario configurado para ese slot.');
    } else {
      toast.error('Error', res.message || 'No se pudo reservar la cita.');
    }

    setLoading(false);
  }

  return (
    <div className="stack-lg">
      <section className="hero-banner">
        <div>
          <span className="eyebrow">Portal Paciente</span>
          <h1>Reservar Cita</h1>
          <p>Selecciona sede, servicio, médico y horario para tu cita.</p>
        </div>
        <div className="hero-card side-highlight">
          <span className="muted-text-light">Importante</span>
          <strong>Horario disponible</strong>
          <p>Lunes a viernes 07:00–17:00, sábados 07:00–12:00. Slots de 20 minutos.</p>
        </div>
      </section>

      {citaCreada && (
        <div className="inline-alert inline-alert-warning">
          ✅ Cita #{citaCreada.citaId} creada en estado <strong>{citaCreada.estado}</strong>.
          <Button
            variant="ghost"
            onClick={() => window.location.href = '/paciente/citas'}
          >
            Ver mis citas →
          </Button>
        </div>
      )}

      <Card className="stack-md">
        <span className="eyebrow">Datos de la cita</span>
        <h3>Completa el formulario</h3>

        <div className="filters-grid">
          <div className="field-group">
            <span>Sede</span>
            <select name="sedeId" value={form.sedeId} onChange={handleChange}>
              <option value={3}>Sede Central</option>
              <option value={4}>Sede Zona 10</option>
            </select>
          </div>

          <div className="field-group">
            <span>Servicio</span>
            <select name="servicioId" value={form.servicioId} onChange={handleChange}>
              <option value={4}>Consulta General Central</option>
              <option value={5}>Pediatría Central</option>
              <option value={6}>Cardiología Zona 10</option>
            </select>
          </div>

          <div className="field-group">
            <span>Médico</span>
            <select name="medicoId" value={form.medicoId} onChange={handleChange}>
              <option value={1}>Médico 1</option>
              <option value={2}>Médico 2</option>
            </select>
          </div>

          <div className="field-group">
            <span>Modalidad</span>
            <select name="modalidad" value={form.modalidad} onChange={handleChange}>
              <option value="PRESENCIAL">Presencial</option>
              <option value="TELEMEDICINA">Telemedicina</option>
            </select>
          </div>
        </div>

        <div className="content-grid-2">
          <div className="field-group">
            <span>Fecha y hora</span>
            <input
              type="datetime-local"
              name="fechaInicio"
              value={form.fechaInicio}
              onChange={handleChange}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          <div className="field-group">
            <span>Motivo de consulta</span>
            <input
              type="text"
              name="motivoConsulta"
              value={form.motivoConsulta}
              onChange={handleChange}
              placeholder="Describe brevemente el motivo"
            />
          </div>
        </div>

        <div className="button-row-wrap">
          <Button
            loading={loading}
            disabled={loading}
            onClick={() => void handleSubmit()}
          >
            {loading ? 'Reservando...' : 'Reservar cita'}
          </Button>
          <Button
            variant="ghost"
            onClick={() => window.location.href = '/paciente/citas'}
          >
            Ver mis citas
          </Button>
        </div>
      </Card>
    </div>
  );
}