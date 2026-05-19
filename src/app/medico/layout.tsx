'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { session } from '@/lib/auth/session';

const navItems = [
  { label: 'Agenda del día', hint: 'Tickets en espera', href: '/medico/agenda' },
  { label: 'Órdenes', hint: 'Lab e imagen', href: '/medico/ordenes' },
];

export default function MedicoLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    const user = session.getUser();
    if (!user) {
      router.push('/login');
    } else {
      setVerificando(false);
    }
  }, [router]);

  const handleLogout = () => {
    session.clear();
    router.push('/login');
  };

  if (verificando) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1rem',
        color: 'var(--color-text-secondary)',
      }}>
        Verificando sesión...
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-card">
          <div className="brand-mark">✚</div>
          <div>
            <h1>Clínica Integral</h1>
            <p>Módulo Médico</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="sidebar-link">
              <span>{item.label}</span>
              <small>{item.hint}</small>
            </Link>
          ))}
        </nav>

        <div className="sidebar-note">
          <p>Dev4 — Consulta Médica</p>
          <p style={{ fontSize: '0.78rem', marginTop: 4, opacity: 0.7 }}>
            Historia clínica, recetas y órdenes
          </p>
        </div>

        {/* Acciones de sesión */}
        <div style={{ marginTop: 'auto', padding: '12px', display: 'grid', gap: 8 }}>
          <Link
            href="/"
            className="sidebar-link"
            style={{ fontSize: '0.85rem', opacity: 0.8 }}
          >
            <span>← Dashboard principal</span>
          </Link>
          <button
            onClick={handleLogout}
            className="sidebar-link"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              color: 'var(--color-danger)',
              fontSize: '0.85rem',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="content-shell">
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}