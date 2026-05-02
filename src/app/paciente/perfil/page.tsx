'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { patientsApi } from '@/lib/api/patients';
import { useToast } from '@/shared/components/providers/ToastProvider';

const PACIENTE_ID_DEMO = 5;

interface PerfilPaciente {
  pacienteId: number;
  numeroExpediente: string;
  tipoDocumento: string;
  numeroDocumento: string;
  fechaNacimiento: string;
  genero: string;
  ocupacion?: string;
  nacionalidad: string;
  direccionResidencia?: string;
  tipoSangre?: string;
  notasMedicas?: string;
  esDiscapacitado: boolean;
  contactoEmergenciaNombre?: string;
  contactoEmergenciaTelefono?: string;
  contactoEmergenciaRelacion?: string;
  estado: string;
}

export default function PerfilPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState<Partial<PerfilPaciente>>({});

  const cargarPerfil = useCallback(async () => {
    setLoading(true);
    const res = await patientsApi.get<PerfilPaciente>(`/api/pacientes/${PACIENTE_ID_DEMO}`);
    if (res.success && res.data) {
      setForm(res.data);
    } else {
      toast.error('Error', 'No se pudo cargar el perfil.');
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    void cargarPerfil();
  }, [cargarPerfil]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleGuardar() {
    setGuardando(true);
    const res = await patientsApi.put(`/api/pacientes/${PACIENTE_ID_DEMO}`, {
      pacienteId: PACIENTE_ID_DEMO,
      tipoDocumento: form.tipoDocumento,
      numeroDocumento: form.numeroDocumento,
      fechaNacimiento: form.fechaNacimiento,
      genero: form.genero,
      ocupacion: form.ocupacion,
      nacionalidad: form.nacionalidad,
      direccionResidencia: form.direccionResidencia,
      tipoSangre: form.tipoSangre,
      notasMedicas: form.notasMedicas,
      esDiscapacitado: form.esDiscapacitado ?? false,
      contactoEmergenciaNombre: form.contactoEmergenciaNombre,
      contactoEmergenciaTelefono: form.contactoEmergenciaTelefono,
      contactoEmergenciaRelacion: form.contactoEmergenciaRelacion,
    });

    if (res.success) {
      toast.success('Perfil actualizado', 'Tus datos fueron guardados correctamente.');
    } else {
      toast.error('Error', res.message || 'No se pudo guardar el perfil.');
    }
    setGuardando(false);
  }

  if (loading) {
    return <div className="loading-box"><p className="muted-text">Cargando perfil...</p></div>;
  }

  return (
    <div className="stack-lg">
      <section className="hero-banner">
        <div>
          <span className="eyebrow">Portal Paciente</span>
          <h1>Mi Perfil</h1>
          <p>Expediente: <strong>{form.numeroExpediente}</strong></p>
        </div>
        <div className="hero-card side-highlight">
          <span className="muted-text-light">Estado</span>
          <strong>{form.estado}</strong>
          <p>Mantén tus datos actualizados para agilizar tus citas.</p>
        </div>
      </section>

      <Card className="stack-md">
        <span className="eyebrow">Datos personales</span>
        <h3>Información básica</h3>
        <div className="filters-grid">
          <div className="field-group">
            <span>Tipo de documento</span>
            <select name="tipoDocumento" value={form.tipoDocumento ?? ''} onChange={handleChange}>
              <option value="DPI">DPI</option>
              <option value="PASAPORTE">Pasaporte</option>
            </select>
          </div>
          <div className="field-group">
            <span>Número de documento</span>
            <input type="text" name="numeroDocumento" value={form.numeroDocumento ?? ''} onChange={handleChange} />
          </div>
          <div className="field-group">
            <span>Fecha de nacimiento</span>
            <input
              type="date"
              name="fechaNacimiento"
              value={form.fechaNacimiento ? form.fechaNacimiento.split('T')[0] : ''}
              onChange={handleChange}
            />
          </div>
          <div className="field-group">
            <span>Género</span>
            <select name="genero" value={form.genero ?? ''} onChange={handleChange}>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </div>
          <div className="field-group">
            <span>Nacionalidad</span>
            <input type="text" name="nacionalidad" value={form.nacionalidad ?? ''} onChange={handleChange} />
          </div>
          <div className="field-group">
            <span>Tipo de sangre</span>
            <select name="tipoSangre" value={form.tipoSangre ?? ''} onChange={handleChange}>
              <option value="">No especificado</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>
        </div>

        <div className="content-grid-2">
          <div className="field-group">
            <span>Ocupación</span>
            <select name="ocupacion" value={form.ocupacion ?? ''} onChange={handleChange}>
              <option value="">No especificada</option>
              <option value="Estudiante">Estudiante</option>
              <option value="Empleado">Empleado</option>
              <option value="Independiente">Independiente</option>
              <option value="Ama de casa">Ama de casa</option>
              <option value="Jubilado">Jubilado</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
          <div className="field-group">
            <span>Dirección de residencia</span>
            <input
              type="text"
              name="direccionResidencia"
              value={form.direccionResidencia ?? ''}
              onChange={handleChange}
              placeholder="Tu dirección"
            />
          </div>
        </div>
      </Card>

      <Card className="stack-md">
        <span className="eyebrow">Contacto de emergencia</span>
        <h3>En caso de emergencia</h3>
        <div className="filters-grid">
          <div className="field-group">
            <span>Nombre</span>
            <input
              type="text"
              name="contactoEmergenciaNombre"
              value={form.contactoEmergenciaNombre ?? ''}
              onChange={handleChange}
              placeholder="Nombre completo"
            />
          </div>

          <div className="field-group">
            <span>Teléfono</span>
            <div style={{
              display: 'flex',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              background: 'white'
            }}>
              <span style={{
                padding: '14px 12px',
                background: 'var(--color-primary)',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.9rem',
                whiteSpace: 'nowrap'
              }}>+502</span>
              <input
                type="tel"
                name="contactoEmergenciaTelefono"
                value={form.contactoEmergenciaTelefono ?? ''}
                onChange={handleChange}
                placeholder="55557777"
                maxLength={8}
                style={{
                  border: 'none',
                  outline: 'none',
                  padding: '14px 16px',
                  width: '100%',
                  font: 'inherit'
                }}
              />
            </div>
          </div>

          <div className="field-group">
            <span>Relación</span>
            <select name="contactoEmergenciaRelacion" value={form.contactoEmergenciaRelacion ?? ''} onChange={handleChange}>
              <option value="">Selecciona...</option>
              <option value="Madre">Madre</option>
              <option value="Padre">Padre</option>
              <option value="Hermano/a">Hermano/a</option>
              <option value="Esposo/a">Esposo/a</option>
              <option value="Hijo/a">Hijo/a</option>
              <option value="Amigo/a">Amigo/a</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <div className="field-group">
            <span>¿Es discapacitado?</span>
            <select
              name="esDiscapacitado"
              value={form.esDiscapacitado ? 'true' : 'false'}
              onChange={(e) => setForm((prev) => ({ ...prev, esDiscapacitado: e.target.value === 'true' }))}
            >
              <option value="false">No</option>
              <option value="true">Sí</option>
            </select>
          </div>
        </div>
      </Card>

      <div className="button-row-wrap">
        <Button loading={guardando} disabled={guardando} onClick={() => void handleGuardar()}>
          Guardar cambios
        </Button>
        <Button variant="ghost" onClick={() => window.location.href = '/paciente'}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}