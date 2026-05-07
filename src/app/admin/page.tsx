'use client';

import { useState, useEffect } from 'react';
import { session } from '@/lib/auth/session';

interface Usuario {
  usuarioId: number;
  nombreUsuario: string;
  correoElectronico: string;
  nombres: string;
  apellidos: string;
  telefono: string | null;
  estado: string;
  rolesActivos: string | null;
  fechaCreacion: string;
}

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

const API = process.env.NEXT_PUBLIC_API_URL;

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loadingLista, setLoadingLista] = useState(true);
  const [form, setForm] = useState<RegistroForm>({
    nombreUsuario: '', correoElectronico: '', password: '',
    nombres: '', apellidos: '', telefono: '', rol: 'Recepcion'
  });
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  const [vista, setVista] = useState<'lista' | 'crear'>('lista');

  useEffect(() => { cargarUsuarios(); }, []);

  async function cargarUsuarios() {
    setLoadingLista(true);
    try {
      const token = session.getToken();
      const res = await fetch(`${API}/api/admin/usuarios`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setUsuarios(data.data);
    } catch { }
    setLoadingLista(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleRegistro(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMensaje(null);
    try {
      const token = session.getToken();
      const res = await fetch(`${API}/api/auth/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setMensaje({ tipo: 'success', texto: `Usuario ${data.data.nombreUsuario} creado correctamente.` });
        setForm({ nombreUsuario: '', correoElectronico: '', password: '', nombres: '', apellidos: '', telefono: '', rol: 'Recepcion' });
        cargarUsuarios();
        setTimeout(() => setVista('lista'), 1500);
      } else {
        setMensaje({ tipo: 'error', texto: data.message ?? 'Error al crear usuario.' });
      }
    } catch {
      setMensaje({ tipo: 'error', texto: 'Error de conexión.' });
    }
    setLoading(false);
  }

  async function cambiarEstado(id: number, estadoActual: string) {
    const nuevoEstado = estadoActual === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    try {
      const token = session.getToken();
      await fetch(`${API}/api/admin/usuarios/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      cargarUsuarios();
    } catch { }
  }

  const estadoColor = (e: string) => e === 'ACTIVO' ? '#16a34a' : '#dc2626';
  const estadoBg   = (e: string) => e === 'ACTIVO' ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ margin: 0, color: '#0F4C5C', fontSize: '1.8rem', fontWeight: 900 }}>Gestión de Usuarios</h1>
          <p style={{ color: '#6B7280', marginTop: '6px', margin: 0 }}>Administra los usuarios del sistema</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setVista('lista')} style={{
            padding: '10px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 700,
            background: vista === 'lista' ? '#0F4C5C' : '#e5e7eb',
            color: vista === 'lista' ? 'white' : '#374151',
          }}>👥 Lista</button>
          <button onClick={() => setVista('crear')} style={{
            padding: '10px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 700,
            background: vista === 'crear' ? '#2EC4B6' : '#e5e7eb',
            color: vista === 'crear' ? 'white' : '#374151',
          }}>+ Nuevo Usuario</button>
        </div>
      </div>

      {/* LISTA */}
      {vista === 'lista' && (
        <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 4px 12px rgba(15,76,92,0.08)' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 800, color: '#0F4C5C' }}>{usuarios.length} usuarios registrados</span>
            <button onClick={cargarUsuarios} style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
              🔄 Actualizar
            </button>
          </div>

          {loadingLista ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#6B7280' }}>Cargando usuarios...</div>
          ) : usuarios.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#6B7280' }}>No hay usuarios registrados.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  {['Usuario', 'Nombre completo', 'Correo', 'Rol', 'Estado', 'Acciones'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.78rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u, i) => (
                  <tr key={u.usuarioId} style={{ borderTop: '1px solid #F3F4F6', background: i % 2 === 0 ? 'white' : '#FAFAFA' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0F4C5C', fontSize: '0.9rem' }}>{u.nombreUsuario}</td>
                    <td style={{ padding: '14px 16px', color: '#374151', fontSize: '0.9rem' }}>{u.nombres} {u.apellidos}</td>
                    <td style={{ padding: '14px 16px', color: '#6B7280', fontSize: '0.85rem' }}>{u.correoElectronico}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(46,196,182,0.1)', color: '#0F4C5C', fontSize: '0.78rem', fontWeight: 700 }}>
                        {u.rolesActivos ?? 'Sin rol'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '8px', background: estadoBg(u.estado), color: estadoColor(u.estado), fontSize: '0.78rem', fontWeight: 700 }}>
                        {u.estado}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button onClick={() => cambiarEstado(u.usuarioId, u.estado)} style={{
                        padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                        background: u.estado === 'ACTIVO' ? 'rgba(220,38,38,0.1)' : 'rgba(22,163,74,0.1)',
                        color: u.estado === 'ACTIVO' ? '#dc2626' : '#16a34a',
                        fontWeight: 700, fontSize: '0.78rem'
                      }}>
                        {u.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* CREAR */}
      {vista === 'crear' && (
        <div style={{ maxWidth: '600px' }}>
          {mensaje && (
            <div style={{
              padding: '14px 18px', borderRadius: '14px', marginBottom: '20px',
              background: mensaje.tipo === 'success' ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)',
              border: `1px solid ${mensaje.tipo === 'success' ? 'rgba(22,163,74,0.3)' : 'rgba(220,38,38,0.3)'}`,
              color: mensaje.tipo === 'success' ? '#15803d' : '#b91c1c', fontWeight: 600, fontSize: '0.9rem'
            }}>
              {mensaje.tipo === 'success' ? '✅' : '❌'} {mensaje.texto}
            </div>
          )}
          <div style={{ background: 'white', borderRadius: '20px', padding: '32px', border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(15,76,92,0.08)' }}>
            <h2 style={{ margin: '0 0 24px', color: '#0F4C5C', fontSize: '1.1rem', fontWeight: 800 }}>Nuevo Usuario</h2>
            <form onSubmit={handleRegistro} style={{ display: 'grid', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {[{ name: 'nombres', label: 'Nombres', ph: 'Carlos' }, { name: 'apellidos', label: 'Apellidos', ph: 'Mendez' }].map(f => (
                  <div key={f.name}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '6px', textTransform: 'uppercase' }}>{f.label}</label>
                    <input name={f.name} value={(form as any)[f.name]} onChange={handleChange} placeholder={f.ph} required
                      style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' as const }} />
                  </div>
                ))}
              </div>
              {[
                { name: 'nombreUsuario', label: 'Nombre de usuario', ph: 'usuario.demo', type: 'text' },
                { name: 'correoElectronico', label: 'Correo electrónico', ph: 'usuario@clinica.gt', type: 'email' },
                { name: 'password', label: 'Contraseña', ph: 'Min. 8 caracteres', type: 'password' },
                { name: 'telefono', label: 'Teléfono', ph: '55551234', type: 'text' },
              ].map(f => (
                <div key={f.name}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '6px', textTransform: 'uppercase' }}>{f.label}</label>
                  <input name={f.name} type={f.type} value={(form as any)[f.name]} onChange={handleChange} placeholder={f.ph}
                    required={f.name !== 'telefono'}
                    style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' as const }} />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '6px', textTransform: 'uppercase' }}>Rol</label>
                <select name="rol" value={form.rol} onChange={handleChange}
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '0.9rem', outline: 'none' }}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <button type="submit" disabled={loading} style={{
                padding: '14px', borderRadius: '12px', border: 'none',
                background: loading ? '#6B7280' : '#2EC4B6', color: 'white',
                fontWeight: 800, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '8px', boxShadow: loading ? 'none' : '0 8px 20px rgba(46,196,182,0.3)'
              }}>
                {loading ? 'Creando...' : '+ Crear Usuario'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}