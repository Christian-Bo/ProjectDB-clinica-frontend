'use client';

import { useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { patientsApi } from '@/lib/api/patients';
import { useToast } from '@/shared/components/providers/ToastProvider';
import { usePacienteSession } from '@/lib/auth/useSession';

const SEDES = [{ id: 3, nombre: 'Sede Central' }, { id: 4, nombre: 'Sede Zona 10' }];

const SERVICIOS_POR_SEDE: Record<number, { id: number; nombre: string }[]> = {
  3: [
    { id: 4, nombre: 'Consulta General Central' },
    { id: 5, nombre: 'Pediatría Central' },
  ],
  4: [
    { id: 6, nombre: 'Cardiología Zona 10' },
  ],
};

const MEDICOS = [
  { id: 1, nombre: 'Dr. Carlos Cárdenas' },
  { id: 2, nombre: 'Dra. Paola Pineda' },
];

function generarSlots(fecha: string) {
  if (!fecha) return [];
  const dia = new Date(fecha + 'T00:00:00').getDay(); // 0=domingo, 6=sábado
  if (dia === 0) return []; // domingo bloqueado
  const esSabado = dia === 6;
  const horaFin = esSabado ? 12 * 60 : 17 * 60;
  const slots = [];
  for (let min = 7 * 60; min < horaFin; min += 20) {
    const horas = Math.floor(min / 60);
    const minutos = min % 60;
    const label = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
    slots.push({ label, value: `${label}:00` });
  }
  return slots;
}

export default function ReservarCitaPage() {
  const toast = useToast();
  const { pacienteId, cargando: cargandoSession } = usePacienteSession();
  const [loading, setLoading] = useState(false);
  const [citaCreada, setCitaCreada] = useState<{ citaId: number; estado: string } | null>(null);
  const [fechaDate, setFechaDate] = useState('');
  const [horaSlot, setHoraSlot] = useState('');
  const [form, setForm] = useState({
    sedeId: 3, servicioId: 4, medicoId: 1,
    tipoConsultaId: 1, modalidad: 'PRESENCIAL', motivoConsulta: '',
  });

  const slots = generarSlots(fechaDate);
  const esDomingo = fechaDate ? new Date(fechaDate + 'T00:00:00').getDay() === 0 : false;
  const esSabado = fechaDate ? new Date(fechaDate + 'T00:00:00').getDay() === 6 : false;

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: Number(value) || value };
      if (name === 'sedeId') {
        const serviciosDisponibles = SERVICIOS_POR_SEDE[Number(value)] ?? [];
        updated.servicioId = serviciosDisponibles[0]?.id ?? 0;
      }
      return updated;
    });
  }

  function handleFechaChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFechaDate(e.target.value);
    setHoraSlot(''); // resetea hora al cambiar fecha
  }

  const sedaNombre = SEDES.find((s) => s.id === Number(form.sedeId))?.nombre ?? '';
  const servicioNombre = (SERVICIOS_POR_SEDE[Number(form.sedeId)] ?? []).find((s) => s.id === Number(form.servicioId))?.nombre ?? '';
  const medicoNombre = MEDICOS.find((m) => m.id === Number(form.medicoId))?.nombre ?? '';
  const resumenCompleto = fechaDate && horaSlot && form.motivoConsulta && !esDomingo;

  async function handleSubmit() {
    if (!fechaDate || !horaSlot) {
      toast.warning('Campos requeridos', 'Selecciona una fecha y una hora.');
      return;
    }
    if (esDomingo) {
      toast.error('Día no disponible', 'No atendemos los domingos.');
      return;
    }
    setLoading(true);
    setCitaCreada(null);
    const res = await patientsApi.post<{ citaId: number; estado: string }>(
      '/api/reservar/cita',
      {
        ...form,
        pacienteId,
        sedeId: Number(form.sedeId),
        servicioId: Number(form.servicioId),
        medicoId: Number(form.medicoId),
        tipoConsultaId: Number(form.tipoConsultaId),
        fechaInicio: `${fechaDate}T${horaSlot}`,
      },
      true
    );
    if (res.success && res.data) {
      toast.success('Cita reservada', '¡Tu cita fue reservada correctamente!');
      setCitaCreada(res.data);
    } else if (res.errorCode === 'SIN_CUPO') {
      toast.error('Sin cupo', 'El horario seleccionado ya no tiene cupo. Elige otro horario.');
    } else if (res.errorCode === 'HORARIO_NO_DISPONIBLE') {
      toast.error('Horario no disponible', 'No existe horario configurado para ese slot.');
    } else {
      toast.error('Error', res.message || 'No se pudo reservar la cita.');
    }
    setLoading(false);
  }

  if (cargandoSession) return <div className="loading-box"><p className="muted-text">Cargando sesión...</p></div>;

  return (
    <div className="stack-lg">
      <section className="hero-banner">
        <div>
          <span className="eyebrow">Portal Paciente</span>
          <h1>Reservar Cita</h1>
          <p>Selecciona sede, servicio, médico y horario para tu cita.</p>
        </div>
        <div className="hero-card side-highlight">
          <span className="muted-text-light">Horario de atención</span>
          <strong>Lunes a Viernes</strong>
          <p style={{ margin: '4px 0' }}>07:00 – 17:00 hrs</p>
          <strong>Sábados</strong>
          <p style={{ margin: '4px 0' }}>07:00 – 12:00 hrs</p>
          <p style={{ margin: '8px 0 0', fontSize: '0.8rem', opacity: 0.8 }}>
            Slots disponibles cada 20 minutos
          </p>
        </div>
      </section>

      {citaCreada && (
        <div className="inline-alert inline-alert-warning">
          ✅ Cita #{citaCreada.citaId} creada en estado <strong>{citaCreada.estado}</strong>.
          <Button variant="ghost" onClick={() => window.location.href = '/paciente/citas'}>
            Ver mis citas →
          </Button>
        </div>
      )}

      <div className="content-grid-2 align-start">
        <Card className="stack-md">
          <span className="eyebrow">Datos de la cita</span>
          <h3>Completa el formulario</h3>

          <div className="content-grid-2">
            <div className="field-group">
              <span>Sede</span>
              <select name="sedeId" value={form.sedeId} onChange={handleChange}>
                {SEDES.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>
            <div className="field-group">
              <span>Servicio</span>
              <select name="servicioId" value={form.servicioId} onChange={handleChange}>
                {(SERVICIOS_POR_SEDE[Number(form.sedeId)] ?? []).map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>
            <div className="field-group">
              <span>Médico</span>
              <select name="medicoId" value={form.medicoId} onChange={handleChange}>
                {MEDICOS.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
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
              <span>Fecha</span>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={fechaDate}
                onChange={handleFechaChange}
              />
              {esDomingo && (
                <span style={{ color: 'var(--color-danger)', fontSize: '0.82rem', fontWeight: 600 }}>
                  ⚠️ No atendemos los domingos
                </span>
              )}
              {esSabado && (
                <span style={{ color: 'var(--color-warning)', fontSize: '0.82rem', fontWeight: 600 }}>
                  ℹ️ Sábado: horario hasta las 12:00
                </span>
              )}
              {fechaDate && !esDomingo && !esSabado && (
                <span style={{ color: 'var(--color-success)', fontSize: '0.82rem', fontWeight: 600 }}>
                  ✅ Horario disponible 07:00 – 17:00
                </span>
              )}
            </div>

            <div className="field-group">
              <span>Hora</span>
              {!fechaDate ? (
                <select disabled>
                  <option>Selecciona una fecha primero</option>
                </select>
              ) : esDomingo ? (
                <select disabled>
                  <option>No disponible este día</option>
                </select>
              ) : (
                <select value={horaSlot} onChange={(e) => setHoraSlot(e.target.value)}>
                  <option value="">Selecciona un horario...</option>
                  {slots.map((slot) => (
                    <option key={slot.value} value={slot.value}>{slot.label}</option>
                  ))}
                </select>
              )}
            </div>
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
        </Card>

        <Card className="stack-md">
          <span className="eyebrow">Resumen</span>
          <h3>Tu cita</h3>
          <div className="stack-sm">
            <div className="detail-item"><span>Sede</span><strong>{sedaNombre}</strong></div>
            <div className="detail-item"><span>Servicio</span><strong>{servicioNombre}</strong></div>
            <div className="detail-item"><span>Médico</span><strong>{medicoNombre}</strong></div>
            <div className="detail-item"><span>Modalidad</span><strong>{form.modalidad}</strong></div>
            <div className="detail-item">
              <span>Fecha</span>
              <strong>{fechaDate || 'No seleccionada'}</strong>
            </div>
            <div className="detail-item">
              <span>Hora</span>
              <strong>{horaSlot ? horaSlot.slice(0, 5) : 'No seleccionada'}</strong>
            </div>
            <div className="detail-item">
              <span>Motivo</span>
              <strong>{form.motivoConsulta || 'No especificado'}</strong>
            </div>
          </div>

          {resumenCompleto && (
            <div style={{
              padding: '12px',
              background: 'rgba(46,196,182,0.1)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(46,196,182,0.3)'
            }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-secondary)', fontWeight: 700 }}>
                ✅ Todo listo para reservar
              </p>
            </div>
          )}

          <div className="button-row-wrap">
            <Button
              loading={loading}
              disabled={loading || esDomingo || !fechaDate || !horaSlot}
              onClick={() => void handleSubmit()}
            >
              {loading ? 'Reservando...' : 'Reservar cita'}
            </Button>
            <Button variant="ghost" onClick={() => window.location.href = '/paciente/citas'}>
              Cancelar
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}