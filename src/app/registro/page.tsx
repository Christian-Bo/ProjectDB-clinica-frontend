'use client';

import { useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { useToast } from '@/shared/components/providers/ToastProvider';
import { patientsApi } from '@/lib/api/patients';

export default function RegistroPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [paso, setPaso] = useState<1 | 2>(1);
  const [form, setForm] = useState({
    nombres: '',
    apellidos: '',
    correoElectronico: '',
    password: '',
    confirmarPassword: '',
    telefono: '',
    tipoDocumento: 'DPI',
    numeroDocumento: '',
    fechaNacimiento: '',
    genero: 'M',
    nacionalidad: 'Guatemalteca',
    tipoSangre: '',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function validarPaso1() {
    if (!form.nombres || !form.apellidos) {
      toast.warning('Campos requeridos', 'Ingresa tu nombre y apellido.');
      return false;
    }
    if (!form.correoElectronico.includes('@')) {
      toast.warning('Correo inválido', 'Ingresa un correo electrónico válido.');
      return false;
    }
    if (form.password.length < 8) {
      toast.warning('Contraseña muy corta', 'La contraseña debe tener al menos 8 caracteres.');
      return false;
    }
    if (form.password !== form.confirmarPassword) {
      toast.error('Contraseñas no coinciden', 'Verifica que ambas contraseñas sean iguales.');
      return false;
    }
    return true;
  }

  function validarPaso2() {
    if (!form.numeroDocumento) {
      toast.warning('Campo requerido', 'Ingresa tu número de documento.');
      return false;
    }
    if (!form.fechaNacimiento) {
      toast.warning('Campo requerido', 'Ingresa tu fecha de nacimiento.');
      return false;
    }
    return true;
  }

  async function handleSubmit() {
    if (!validarPaso2()) return;

    setLoading(true);
    const res = await patientsApi.post('/api/auth/registro-paciente', {
      nombres: form.nombres,
      apellidos: form.apellidos,
      correoElectronico: form.correoElectronico,
      password: form.password,
      telefono: form.telefono || null,
      tipoDocumento: form.tipoDocumento,
      numeroDocumento: form.numeroDocumento,
      fechaNacimiento: form.fechaNacimiento,
      genero: form.genero,
      nacionalidad: form.nacionalidad,
      tipoSangre: form.tipoSangre || null,
    });

    if (res.success) {
      toast.success('¡Registro exitoso!', 'Ya puedes iniciar sesión con tu correo y contraseña.');
      setTimeout(() => window.location.href = '/login', 2000);
    } else if (res.errorCode === 'CORREO_DUPLICADO') {
      toast.error('Correo en uso', 'Este correo ya está registrado.');
    } else if (res.errorCode === 'DOCUMENTO_DUPLICADO') {
      toast.error('Documento en uso', 'Este número de documento ya está registrado.');
    } else {
      toast.error('Error', res.message || 'No se pudo completar el registro.');
    }
    setLoading(false);
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      padding: '24px',
      background: 'radial-gradient(circle at top right, rgba(46, 196, 182, 0.12), transparent 24%), linear-gradient(180deg, #fbfdff 0%, var(--color-background) 100%)'
    }}>
      <div style={{ width: '100%', maxWidth: '560px' }} className="stack-lg">

        <div style={{ textAlign: 'center' }} className="stack-sm">
          <div style={{
            width: '56px', height: '56px',
            background: 'var(--color-primary)',
            borderRadius: '16px',
            display: 'grid', placeItems: 'center',
            margin: '0 auto',
            color: 'white', fontSize: '1.4rem', fontWeight: 700
          }}>✚</div>
          <h1 style={{ margin: 0, color: 'var(--color-primary)' }}>Clínica Integral</h1>
          <p className="muted-text">Crea tu cuenta de paciente</p>
        </div>

        {/* Indicador de pasos */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{
            flex: 1, height: '4px', borderRadius: '999px',
            background: 'var(--color-secondary)'
          }} />
          <div style={{
            flex: 1, height: '4px', borderRadius: '999px',
            background: paso === 2 ? 'var(--color-secondary)' : 'var(--color-border)'
          }} />
        </div>
        <p className="muted-text" style={{ textAlign: 'center', marginTop: '-8px' }}>
          Paso {paso} de 2 — {paso === 1 ? 'Datos de acceso' : 'Datos personales'}
        </p>

        {paso === 1 && (
          <Card className="stack-md">
            <span className="eyebrow">Paso 1</span>
            <h3>Datos de acceso</h3>

            <div className="content-grid-2">
              <div className="field-group">
                <span>Nombres</span>
                <input type="text" name="nombres" value={form.nombres}
                  onChange={handleChange} placeholder="Tu nombre" />
              </div>
              <div className="field-group">
                <span>Apellidos</span>
                <input type="text" name="apellidos" value={form.apellidos}
                  onChange={handleChange} placeholder="Tus apellidos" />
              </div>
            </div>

            <div className="field-group">
              <span>Correo electrónico</span>
              <input type="email" name="correoElectronico" value={form.correoElectronico}
                onChange={handleChange} placeholder="correo@ejemplo.com" />
            </div>

            <div className="field-group">
              <span>Teléfono (opcional)</span>
              <div style={{
                display: 'flex',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden', background: 'white'
              }}>
                <span style={{
                  padding: '14px 12px', background: 'var(--color-primary)',
                  color: 'white', fontWeight: 700, fontSize: '0.9rem'
                }}>+502</span>
                <input type="tel" name="telefono" value={form.telefono}
                  onChange={handleChange} placeholder="55551234" maxLength={8}
                  style={{ border: 'none', outline: 'none', padding: '14px 16px', width: '100%', font: 'inherit' }} />
              </div>
            </div>

            <div className="content-grid-2">
              <div className="field-group">
                <span>Contraseña</span>
                <input type="password" name="password" value={form.password}
                  onChange={handleChange} placeholder="Mínimo 8 caracteres" />
              </div>
              <div className="field-group">
                <span>Confirmar contraseña</span>
                <input type="password" name="confirmarPassword" value={form.confirmarPassword}
                  onChange={handleChange} placeholder="Repite tu contraseña" />
              </div>
            </div>

            <div className="button-row-wrap">
              <Button onClick={() => { if (validarPaso1()) setPaso(2); }}>
                Siguiente →
              </Button>
              <Button variant="ghost" onClick={() => window.location.href = '/login'}>
                Ya tengo cuenta
              </Button>
            </div>
          </Card>
        )}

        {paso === 2 && (
          <Card className="stack-md">
            <span className="eyebrow">Paso 2</span>
            <h3>Datos personales</h3>

            <div className="content-grid-2">
              <div className="field-group">
                <span>Tipo de documento</span>
                <select name="tipoDocumento" value={form.tipoDocumento} onChange={handleChange}>
                  <option value="DPI">DPI</option>
                  <option value="PASAPORTE">Pasaporte</option>
                </select>
              </div>
              <div className="field-group">
                <span>Número de documento</span>
                <input type="text" name="numeroDocumento" value={form.numeroDocumento}
                  onChange={handleChange} placeholder="Número de DPI" />
              </div>
            </div>

            <div className="content-grid-2">
              <div className="field-group">
                <span>Fecha de nacimiento</span>
                <input type="date" name="fechaNacimiento" value={form.fechaNacimiento}
                  onChange={handleChange} />
              </div>
              <div className="field-group">
                <span>Género</span>
                <select name="genero" value={form.genero} onChange={handleChange}>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>
            </div>

            <div className="content-grid-2">
              <div className="field-group">
                <span>Nacionalidad</span>
                <input type="text" name="nacionalidad" value={form.nacionalidad}
                  onChange={handleChange} />
              </div>
              <div className="field-group">
                <span>Tipo de sangre</span>
                <select name="tipoSangre" value={form.tipoSangre} onChange={handleChange}>
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

            <div className="button-row-wrap">
              <Button loading={loading} disabled={loading} onClick={() => void handleSubmit()}>
                {loading ? 'Registrando...' : 'Crear cuenta'}
              </Button>
              <Button variant="ghost" onClick={() => setPaso(1)}>
                ← Atrás
              </Button>
            </div>
          </Card>
        )}

      </div>
    </div>
  );
}