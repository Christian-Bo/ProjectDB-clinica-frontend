'use client';

import { useState } from 'react';
import { session } from '@/lib/auth/session';
import { patientsApi } from '@/lib/api/patients';

interface RegistroForm {
  nombreUsuario: string;
  correoElectronico: string;
  password: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  rol: string;
}

const ROLES = ['Administrador', 'Supervisor', 'Medico', 'Recepcion', 'Farmacia', 'Auditor'];

export default function UsuariosPage() {
  const [form, setForm] = useState<RegistroForm>({
    nombreUsuario: '', correoElectronico: '', password: '',
    nombres: '', apellidos: '', telefono: '', rol: 'Recepcion'
  });
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleRegistro(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMensaje(null);

    try {
      const token = session.getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/registro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (data.success) {
        setMensaje({ tipo: 'success', texto: `Usuario ${data.data.nombreUsuario} creado correctamente con rol ${data.data.rol}.` });
        setForm({ nombreUsuario: '', correoElectronico: '', password: '', nombres: '', apellidos: '', telefono: '', rol: 'Recepcion' });
      } else {
        setMensaje({ tipo: 'error', texto: data.message ?? 'Error al crear usuario.' });
      }
    } catch {
      setMensaje({ tipo: 'error', texto: 'Error de conexión con el servidor.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: 0, color: '#0F4C5C', fontSize: '1.8rem', fontWeight: 900 }}>
          Gestión de Usuarios
        </h1>
        <p style={{ color: '#6B7280', marginTop: '8px' }}>Crear nuevos usuarios del sistema</p>
      </div>

      {mensaje && (
        <div style={{
          padding: '14px 18px', borderRadius: '14px', marginBottom: '24px',
          background: mensaje.tipo === 'success' ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)',
          border: `1px solid ${mensaje.tipo === 'success' ? 'rgba(22,163,74,0.3)' : 'rgba(220,38,38,0.3)'}`,
          color: mensaje.tipo === 'success' ? '#15803d' : '#b91c1c',
          fontWeight: 600, fontSize: '0.9rem'
        }}>
          {mensaje.tipo === 'success' ? '✅' : '❌'} {mensaje.texto}
        </div>
      )}

      <div style={{
        background: 'white', borderRadius: '20px', padding: '32px',
        border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(15,76,92,0.08)',
        maxWidth: '600px'
      }}>
        <h2 style={{ margin: '0 0 24px', color: '#0F4C5C', fontSize: '1.1rem', fontWeight: 800 }}>
          Nuevo Usuario
        </h2>

        <form onSubmit={handleRegistro} style={{ display: 'grid', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              { name: 'nombres', label: 'Nombres', placeholder: 'Carlos' },
              { name: 'apellidos', label: 'Apellidos', placeholder: 'Mendez' },
            ].map(f => (
              <div key={f.name} className="field-group">
                <span>{f.label}</span>
                <input name={f.name} value={(form as any)[f.name]}
                  onChange={handleChange} placeholder={f.placeholder} required />
              </div>
            ))}
          </div>

          <div className="field-group">
            <span>Nombre de usuario</span>
            <input name="nombreUsuario" value={form.nombreUsuario}
              onChange={handleChange} placeholder="usuario.demo" required />
          </div>

          <div className="field-group">
            <span>Correo electrónico</span>
            <input name="correoElectronico" type="email" value={form.correoElectronico}
              onChange={handleChange} placeholder="usuario@clinica.gt" required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="field-group">
              <span>Contraseña</span>
              <input name="password" type="password" value={form.password}
                onChange={handleChange} placeholder="Min. 8 caracteres" required />
            </div>
            <div className="field-group">
              <span>Teléfono</span>
              <input name="telefono" value={form.telefono}
                onChange={handleChange} placeholder="55551234" />
            </div>
          </div>

          <div className="field-group">
            <span>Rol</span>
            <select name="rol" value={form.rol} onChange={handleChange}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <button type="submit" disabled={loading} style={{
            padding: '14px', borderRadius: '14px', border: 'none',
            background: loading ? '#6B7280' : '#2EC4B6', color: 'white',
            fontWeight: 800, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: '8px', transition: 'all 0.2s',
            boxShadow: loading ? 'none' : '0 8px 20px rgba(46,196,182,0.3)'
          }}>
            {loading ? 'Creando usuario...' : '+ Crear Usuario'}
          </button>
        </form>
      </div>
    </div>
  );
}