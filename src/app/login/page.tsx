'use client';

import { useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
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

// El endpoint de login usa "ok" en lugar de "success"
const loginOk = (res as any).ok ?? res.success;
const loginData = (res as any).data as LoginResponse | undefined;

if (loginOk && loginData) {
  session.setToken(loginData.accessToken);
  session.setUser({
    usuarioId: loginData.user.usuarioId,
    username: loginData.user.username,
    nombreCompleto: loginData.user.nombreCompleto,
    email: loginData.user.email,
    roles: loginData.user.roles,
  });
  toast.success('Bienvenido', `Hola, ${loginData.user.nombreCompleto}`);
  const roles = loginData.user.roles;
    if (roles.includes('Paciente')) {
      setTimeout(() => window.location.href = '/paciente', 1000);
    } else if (roles.includes('Medico')) {
      setTimeout(() => window.location.href = '/medico', 1000);
    } else if (roles.includes('Administrador') || roles.includes('Supervisor')) {
      setTimeout(() => window.location.href = '/admin', 1000);
    } else {
      setTimeout(() => window.location.href = '/', 1000);
    }
} else {
  toast.error('Error', (res as any).message || 'Credenciales incorrectas.');
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
      <div style={{ width: '100%', maxWidth: '420px' }} className="stack-lg">

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
          <p className="muted-text">Inicia sesión para continuar</p>
        </div>

        <Card className="stack-md">
          <div className="field-group">
            <span>Usuario</span>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Tu nombre de usuario"
              onKeyDown={(e) => { if (e.key === 'Enter') void handleLogin(); }}
            />
          </div>

          <div className="field-group">
            <span>Contraseña</span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Tu contraseña"
              onKeyDown={(e) => { if (e.key === 'Enter') void handleLogin(); }}
            />
          </div>

          <Button
            fullWidth
            loading={loading}
            disabled={loading}
            onClick={() => void handleLogin()}
          >
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </Button>

          <div style={{ textAlign: 'center' }}>
            <span className="muted-text">¿No tienes cuenta? </span>
            <a href="/registro" style={{ color: 'var(--color-secondary)', fontWeight: 700 }}>
              Regístrate aquí
            </a>
          </div>
        </Card>

      </div>
    </div>
  );
}