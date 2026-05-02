'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { patientsApi } from '@/lib/api/patients';
import { useToast } from '@/shared/components/providers/ToastProvider';
import { usePacienteSession } from '@/lib/auth/useSession';

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

function calcularPorcentaje(form: Partial<PerfilPaciente>): number {
  const campos = ['tipoDocumento', 'numeroDocumento', 'fechaNacimiento', 'genero', 'nacionalidad', 'ocupacion', 'direccionResidencia', 'tipoSangre', 'contactoEmergenciaNombre', 'contactoEmergenciaTelefono'];
  const llenos = campos.filter((c) => !!(form as Record<string, unknown>)[c]);
  return Math.round((llenos.length / campos.length) * 100);
}

export default function PerfilPage() {
  const toast = useToast();
  const { pacienteId, nombreCompleto, cargando: cargandoSession } = usePacienteSession();
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState<Partial<PerfilPaciente>>({});

  const cargarPerfil = useCallback(async () => {
    if (!pacienteId) return;
    setLoading(true);
    const res = await patientsApi.get<PerfilPaciente>(`/api/pacientes/${pacienteId}`);
    if (res.success && res.data) setForm(res.data);
    else toast.error('Error', 'No se pudo cargar el perfil.');
    setLoading(false);
  }, [toast, pacienteId]);

  useEffect(() => { if (pacienteId) void cargarPerfil(); }, [cargarPerfil, pacienteId]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleGuardar() {
    setGuardando(true);
    const res = await patientsApi.put(`/api/pacientes/${pacienteId}`, {
      pacienteId, ...form, esDiscapacitado: form.esDiscapacitado ?? false,
    });
    if (res.success) toast.success('Perfil actualizado', 'Tus datos fueron guardados correctamente.');
    else toast.error('Error', res.message || 'No se pudo guardar el perfil.');
    setGuardando(false);
  }

  if (cargandoSession || loading) return <div className="loading-box"><p className="muted-text">Cargando perfil...</p></div>;

  const porcentaje = calcularPorcentaje(form);
  const iniciales = nombreCompleto.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="stack-lg">
      <section className="hero-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.4)',
            display: 'grid', placeItems: 'center',
            fontSize: '1.6rem', fontWeight: 900, color: 'white', flexShrink: 0
          }}>{iniciales}</div>
          <div>
            <span className="eyebrow light">Portal Paciente</span>
            <h1 style={{ margin: '4px 0' }}>Mi Perfil</h1>
            <p style={{ margin: 0, opacity: 0.85 }}>Expediente: <strong>{form.numeroExpediente}</strong></p>
          </div>
        </div>
        <div className="hero-card side-highlight">
          <span className="muted-text-light">Perfil completado</span>
          <strong style={{ fontSize: '2rem' }}>{porcentaje}%</strong>
          <div style={{ height: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${porcentaje}%`, background: porcentaje === 100 ? '#16A34A' : 'var(--color-secondary)', borderRadius: '999px', transition: 'width 0.5s ease' }} />
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', opacity: 0.8 }}>
            {porcentaje === 100 ? '¡Perfil completo!' : 'Completa tus datos para agilizar tus citas'}
          </p>
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
            <input type="date" name="fechaNacimiento" value={form.fechaNacimiento ? form.fechaNacimiento.split('T')[0] : ''} onChange={handleChange} />
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
              {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="content-grid-2">
          <div className="field-group">
            <span>Ocupación</span>
            <select name="ocupacion" value={form.ocupacion ?? ''} onChange={handleChange}>
              <option value="">No especificada</option>
              {['Estudiante','Empleado','Independiente','Ama de casa','Jubilado','Otro'].map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="field-group">
            <span>Dirección de residencia</span>
            <input type="text" name="direccionResidencia" value={form.direccionResidencia ?? ''} onChange={handleChange} placeholder="Tu dirección" />
          </div>
        </div>
      </Card>

      <Card className="stack-md">
        <span className="eyebrow">Contacto de emergencia</span>
        <h3>En caso de emergencia</h3>
        <div className="filters-grid">
          <div className="field-group">
            <span>Nombre</span>
            <input type="text" name="contactoEmergenciaNombre" value={form.contactoEmergenciaNombre ?? ''} onChange={handleChange} placeholder="Nombre completo" />
          </div>
          <div className="field-group">
            <span>Teléfono</span>
            <div style={{ display: 'flex', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'white' }}>
              <span style={{ padding: '14px 12px', background: 'var(--color-primary)', color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>+502</span>
              <input type="tel" name="contactoEmergenciaTelefono" value={form.contactoEmergenciaTelefono ?? ''} onChange={handleChange} placeholder="55557777" maxLength={8} style={{ border: 'none', outline: 'none', padding: '14px 16px', width: '100%', font: 'inherit' }} />
            </div>
          </div>
          <div className="field-group">
            <span>Relación</span>
            <select name="contactoEmergenciaRelacion" value={form.contactoEmergenciaRelacion ?? ''} onChange={handleChange}>
              <option value="">Selecciona...</option>
              {['Madre','Padre','Hermano/a','Esposo/a','Hijo/a','Amigo/a','Otro'].map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="field-group">
            <span>¿Es discapacitado?</span>
            <select name="esDiscapacitado" value={form.esDiscapacitado ? 'true' : 'false'} onChange={(e) => setForm((prev) => ({ ...prev, esDiscapacitado: e.target.value === 'true' }))}>
              <option value="false">No</option>
              <option value="true">Sí</option>
            </select>
          </div>
        </div>
      </Card>

      <div className="button-row-wrap">
        <Button loading={guardando} disabled={guardando} onClick={() => void handleGuardar()}>Guardar cambios</Button>
        <Button variant="ghost" onClick={() => window.location.href = '/paciente'}>Cancelar</Button>
      </div>
    </div>
  );
}