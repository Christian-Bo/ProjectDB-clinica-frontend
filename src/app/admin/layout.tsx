'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { session } from '@/lib/auth/session';

const NAV_ITEMS = [
  { href: '/admin', label: '🏠 Dashboard' },
  { href: '/admin/tickets', label: '🎫 Tickets y cola' },
  { href: '/admin/kiosco', label: '🖥️ Kiosco tickets' },
  { href: '/admin/pantallas', label: '📺 Pantallas' },
  { href: '/admin/usuarios', label: '👥 Usuarios' },
  { href: '/admin/procedimientos', label: '🧩 Procedimientos' },
  { href: '/admin/etl', label: '⚡ ETL / Reportes' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const user = session.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    const roles = user.roles ?? [];
    if (!roles.includes('Administrador') && !roles.includes('Supervisor')) {
      router.push('/login');
    }
  }, [router]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: '100vh' }}>
      <aside style={{
        background: 'linear-gradient(180deg, #0F4C5C 0%, #071f2a 100%)',
        color: 'white', padding: '24px', display: 'flex',
        flexDirection: 'column', gap: '8px', position: 'sticky', top: 0, height: '100vh',
      }}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>Clínica Integral</div>
          <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }}>Panel Administrador</div>
        </div>

        {NAV_ITEMS.map((item) => {
          const active = item.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(item.href);

          return (
            <Link key={item.href} href={item.href} style={{
              padding: '12px 16px', borderRadius: '12px', color: 'white',
              textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600,
              background: active ? 'rgba(46,196,182,0.28)' : 'rgba(255,255,255,0.08)',
              border: active ? '1px solid rgba(46,196,182,0.38)' : '1px solid transparent',
              transition: 'background 0.2s',
            }}>
              {item.label}
            </Link>
          );
        })}

        <div style={{ marginTop: 'auto' }}>
          <button onClick={() => { session.clear(); window.location.href = '/login'; }}
            style={{
              width: '100%', padding: '12px', borderRadius: '12px',
              background: 'rgba(220,38,38,0.2)', border: 'none',
              color: 'white', cursor: 'pointer', fontWeight: 700,
            }}>
            🚪 Cerrar sesión
          </button>
        </div>
      </aside>

      <main style={{ padding: '32px', background: '#F7FAFC', minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}
