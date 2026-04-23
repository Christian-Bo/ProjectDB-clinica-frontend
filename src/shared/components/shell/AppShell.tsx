import Link from 'next/link';

const items = [
  { label: 'Recepción', hint: 'Tickets y cola', href: '/' },
  { label: 'Pantalla pública', hint: 'Vista general', href: '/pantalla-publica' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-card">
          <div className="brand-mark">✚</div>
          <div>
            <h1>Clínica Integral</h1>
            <p>Recepción</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {items.map((item) => (
            <Link key={item.href} href={item.href} className="sidebar-link">
              <span>{item.label}</span>
              <small>{item.hint}</small>
            </Link>
          ))}
        </nav>
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
            Abrir pantalla pública
          </Link>
        </header>
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
