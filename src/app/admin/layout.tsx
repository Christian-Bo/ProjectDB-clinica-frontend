'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { session } from '@/lib/auth/session';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

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
      {/* Sidebar */}
      <aside style={{
        background: 'linear-gradient(180deg, #0F4C5C 0%, #071f2a 100%)',
        color: 'white', padding: '24px', display: 'flex',
        flexDirection: 'column', gap: '8px'
      }}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>Clínica Integral</div>
          <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }}>Panel Administrador</div>
        </div>

        {[
          { href: '/admin', label: '🏠 Dashboard' },
          { href: '/admin/usuarios', label: '👥 Usuarios' },
        ].map((item) => (
          <a key={item.href} href={item.href} style={{
            padding: '12px 16px', borderRadius: '12px', color: 'white',
            textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600,
            background: 'rgba(255,255,255,0.08)',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(46,196,182,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          >
            {item.label}
          </a>
        ))}

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

      {/* Contenido */}
      <main style={{ padding: '32px', background: '#F7FAFC' }}>
        {children}
      </main>
    </div>
  );
}