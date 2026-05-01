import Link from 'next/link';

const navItems = [
  { label: 'Agenda del día', hint: 'Tickets en espera', href: '/medico/agenda' },
  { label: 'Órdenes', hint: 'Lab e imagen', href: '/medico/ordenes' },
];

export default function MedicoLayout({ children }: { children: React.ReactNode }) {
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
      </aside>

      <div className="content-shell">
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
