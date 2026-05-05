'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  {
    label: 'Recepción',
    hint: 'Tickets y cola operativa',
    href: '/recepcion',
    icon: '🏥',
  },
  {
    label: 'Kiosco de tickets',
    hint: 'Emisión rápida y N/A',
    href: '/recepcion/tickets',
    icon: '🎫',
  },
  {
    label: 'Pantalla pública',
    hint: 'Vista para sala de espera',
    href: '/pantalla-publica',
    icon: '📺',
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Navegación principal">
        <div className="brand-card">
          <div className="brand-mark" aria-hidden="true">✚</div>
          <div>
            <h1>Clínica Integral</h1>
            <p>Módulo 3 — Recepción</p>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Módulo 3">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="sidebar-link"
                aria-current={isActive ? 'page' : undefined}
                style={isActive ? {
                  background: 'rgba(46,196,182,0.22)',
                  borderColor: 'rgba(46,196,182,0.40)',
                } : undefined}
              >
                <span>
                  <span aria-hidden="true" style={{ marginRight: '8px' }}>{item.icon}</span>
                  {item.label}
                </span>
                <small>{item.hint}</small>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-note">
          <strong style={{ color: '#2EC4B6', fontSize: '0.8rem' }}>💡 Tip</strong>
          <p style={{ margin: '4px 0 0', fontSize: '0.78rem' }}>
            La pantalla pública se puede abrir en otro monitor o TV para la sala de espera.
          </p>
        </div>
      </aside>

      <div className="content-shell">
        <header className="topbar">
          <div>
            <span className="eyebrow">Módulo 3</span>
            <h2>Recepción, tickets y pantalla pública</h2>
          </div>
          <Link
            className="btn btn-secondary"
            href="/pantalla-publica"
            target="_blank"
            rel="noopener noreferrer"
          >
            📺 Pantalla pública
          </Link>
        </header>

        <main className="main-content" id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
