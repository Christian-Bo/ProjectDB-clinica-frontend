'use client';

import Link from 'next/link';
import { session } from '@/lib/auth/session';

const navItems = [
  { label: 'Recetas',      hint: 'Despacho de recetas',  href: '/farmacia' },
  { label: 'Medicamentos', hint: 'Catálogo',             href: '/farmacia/medicamentos' },
  { label: 'Caja',         hint: 'Cuentas y pagos',      href: '/farmacia/caja' },
];

export default function FarmaciaLayout({ children }: { children: React.ReactNode }) {
  function handleLogout() {
    session.clear();
    window.location.href = '/login';
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-card">
          <div className="brand-mark">✚</div>
          <div>
            <h1>Clínica Integral</h1>
            <p>Módulo Farmacia</p>
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

        <div style={{ marginTop: 'auto' }}>
          <button
            onClick={handleLogout}
            className="sidebar-link"
            style={{
              width: '100%', textAlign: 'left', cursor: 'pointer',
              background: 'rgba(220,38,38,0.15)',
              border: '1px solid rgba(220,38,38,0.3)',
              color: 'white'
            }}
          >
            <span>Cerrar sesión</span>
            <small>Salir del módulo</small>
          </button>
        </div>
      </aside>

      <div className="content-shell">
        <header className="topbar">
          <div>
            <span className="eyebrow">Módulo 5</span>
            <h2>Farmacia</h2>
          </div>
        </header>
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}