'use client';

import { useState } from 'react';
import { useToast } from '@/shared/components/providers/ToastProvider';
import { patientsApi } from '@/lib/api/patients';
import { session } from '@/lib/auth/session';

interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: {
    usuarioId: number;
    username: string;
    nombreCompleto: string;
    email: string;
    estado: string;
    roles: string[];
  };
}

export default function LoginPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleLogin() {
    if (!form.username || !form.password) {
      toast.warning('Campos requeridos', 'Ingresa tu usuario y contraseña.');
      return;
    }
    setLoading(true);
    const res = await patientsApi.post<LoginResponse>('/api/auth/login', {
      username: form.username,
      password: form.password,
    });
    const loginOk = (res as any).success ?? (res as any).ok;
    const loginData = (res as any).data as LoginResponse | undefined;
    if (loginOk && loginData) {
      session.setToken(loginData.accessToken);
      session.setUser({
        usuarioId: loginData.user.usuarioId,
        username:  loginData.user.username,
        nombreCompleto: loginData.user.nombreCompleto,
        email:     loginData.user.email,
        roles:     loginData.user.roles,
      });
      toast.success('Bienvenido', `Hola, ${loginData.user.nombreCompleto}`);
      const roles = loginData.user.roles;
      if (roles.includes('Paciente')) {
        setTimeout(() => window.location.href = '/paciente', 800);
      } else if (roles.includes('Medico')) {
        setTimeout(() => window.location.href = '/medico', 800);
      } else if (roles.includes('Administrador') || roles.includes('Supervisor')) {
        setTimeout(() => window.location.href = '/admin', 800);
      } else if (roles.includes('Farmacia')) {
        setTimeout(() => window.location.href = '/farmacia', 800);
      } else if (roles.includes('Recepcion')) {
        try {
          const ctxRes = await patientsApi.get<{ data: unknown[] }>(
            `/api/secretaria/contextos?usuarioId=${loginData.user.usuarioId}`
          );
          const tieneSecretaria =
            Array.isArray((ctxRes as any).data) && (ctxRes as any).data.length > 0;
          setTimeout(
            () => window.location.href = tieneSecretaria ? '/secretaria' : '/recepcion',
            800
          );
        } catch {
          setTimeout(() => window.location.href = '/recepcion', 800);
        }
      } else {
        setTimeout(() => window.location.href = '/', 800);
      }
    } else {
      toast.error('Error', (res as any).message || 'Credenciales incorrectas.');
    }
    setLoading(false);
  }

  return (
    <div className="lp-root">
      <div className="lp-left">
        <div className="lp-orb1" />
        <div className="lp-orb2" />
        <div className="lp-orb3" />

        <div className="lp-brand">
          <div className="lp-brand-icon">✚</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>Clínica Integral</div>
            <div style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.52)', marginTop: '2px' }}>
              Sistema de Gestión Médica
            </div>
          </div>
        </div>

        <div className="lp-hero">
          <h1>
            Gestión clínica<br />
            <span className="lp-accent">sin fricciones</span>
          </h1>
          <p>
            Accede al panel de control para gestionar citas, pacientes,
            tickets de atención y mucho más desde un solo lugar.
          </p>
        </div>

        <div className="lp-features">
          {[
            { icon: '📅', title: 'Agenda inteligente', desc: 'Control de citas sin conflictos' },
            { icon: '🎫', title: 'Cola de atención',   desc: 'Tickets y pantalla pública en tiempo real' },
            { icon: '🔒', title: 'Acceso seguro',      desc: 'Roles y permisos por módulo' },
            { icon: '📊', title: 'Auditoría total',    desc: 'Trazabilidad de cada acción' },
          ].map((f) => (
            <div key={f.title} className="lp-feat">
              <div className="lp-feat-icon">{f.icon}</div>
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, marginBottom: '2px' }}>{f.title}</div>
                <div style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.5)' }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="lp-footer">Clínica Integral © 2026 — Todos los derechos reservados</div>
      </div>

      <div className="lp-right">
        <div className="lp-form-wrap">
          <div className="lp-form-head">
            <h2>Bienvenido de nuevo</h2>
            <p>Ingresa tus credenciales para acceder al sistema</p>
          </div>

          <div className="lp-card">
            <div className="lp-field">
              <label>Usuario</label>
              <div className="lp-input-wrap">
                <span className="lp-input-icon"
                  style={{ color: focusedField === 'username' ? '#2EC4B6' : '#9ca3af' }}>
                  👤
                </span>
                <input
                  className="lp-input"
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="Tu nombre de usuario"
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                  onKeyDown={(e) => { if (e.key === 'Enter') void handleLogin(); }}
                />
              </div>
            </div>

            <div className="lp-field">
              <label>Contraseña</label>
              <div className="lp-input-wrap">
                <span className="lp-input-icon"
                  style={{ color: focusedField === 'password' ? '#2EC4B6' : '#9ca3af' }}>
                  🔑
                </span>
                <input
                  className="lp-input"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Tu contraseña"
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  onKeyDown={(e) => { if (e.key === 'Enter') void handleLogin(); }}
                  style={{ paddingRight: '44px' }}
                />
                <button className="lp-eye" type="button"
                  onClick={() => setShowPassword(p => !p)}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button className="lp-btn" onClick={() => void handleLogin()} disabled={loading}>
              {loading
                ? <><div className="lp-spinner" />Ingresando...</>
                : <>🔐 Iniciar sesión</>
              }
            </button>
          </div>

          <div className="lp-register">
            ¿No tienes cuenta?{' '}
            <a href="/registro">Regístrate aquí</a>
          </div>
        </div>
      </div>
    </div>
  );
}