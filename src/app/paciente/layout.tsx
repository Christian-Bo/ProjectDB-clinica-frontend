import Link from 'next/link';

const navItems = [
  { label: 'Inicio', hint: 'Dashboard', href: '/paciente' },
  { label: 'Mis Citas', hint: 'Historial y estados', href: '/paciente/citas' },
  { label: 'Reservar Cita', hint: 'Nueva cita', href: '/paciente/citas/nueva' },
  { label: 'Mi Perfil', hint: 'Datos personales', href: '/paciente/perfil' }
];

export default function PacienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-card">
          <div className="brand-mark">✚</div>
          <div>
            <h1>Clínica Integral</h1>
            <p>Portal Paciente</p>
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
      </aside>

      <div className="content-shell">
        <header className="topbar">
          <div>
            <span className="eyebrow">Módulo 2</span>
            <h2>Portal Paciente y Citas</h2>
          </div>
        </header>
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}