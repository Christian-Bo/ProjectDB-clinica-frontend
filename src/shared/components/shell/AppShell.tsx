import Link from 'next/link';

const items = [
  { label: 'Recepcion', hint: 'Tickets y cola', href: '/' },
  { label: 'Pantalla publica', hint: 'Visualizacion premium', href: '/pantalla-publica' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-card">
          <div className="brand-mark">✚</div>
          <div>
            <h1>Clinica Integral</h1>
            <p>Recepcion moderna premium</p>
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

        <div className="sidebar-note">
          <strong>Paleta unificada</strong>
          <p>
            El proyecto usa una sola fuente de verdad para colores, sombras y estados,
            evitando CSS repetido y facilitando el trabajo entre desarrolladores.
          </p>
        </div>
      </aside>

      <div className="content-shell">
        <header className="topbar">
          <div>
            <span className="eyebrow">Modulo 3</span>
            <h2>Recepcion, tickets y pantalla publica</h2>
            <p>Frontend conectado al backend en Railway, enfocado en una experiencia clara, profesional y amigable.</p>
          </div>
          <Link className="btn btn-secondary" href="/pantalla-publica" target="_blank">
            Abrir pantalla publica
          </Link>
        </header>
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
