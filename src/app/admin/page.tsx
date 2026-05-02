'use client';

import { useEffect, useState } from 'react';
import { session } from '@/lib/auth/session';

export default function AdminDashboard() {
  const [user, setUser] = useState<{ nombreCompleto: string } | null>(null);

  useEffect(() => {
    setUser(session.getUser());
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: 0, color: '#0F4C5C', fontSize: '1.8rem', fontWeight: 900 }}>
          Bienvenido, {user?.nombreCompleto ?? 'Administrador'}
        </h1>
        <p style={{ color: '#6B7280', marginTop: '8px' }}>
          Panel de administración del sistema
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        {[
          { icon: '👥', title: 'Usuarios', desc: 'Crear y gestionar usuarios del sistema', href: '/admin/usuarios' },
          { icon: '🏥', title: 'Sedes', desc: 'Administrar sedes de la clínica', href: '/admin/sedes' },
          { icon: '⚕️', title: 'Especialidades', desc: 'Gestionar especialidades médicas', href: '/admin/especialidades' },
        ].map((card) => (
          <a key={card.href} href={card.href} style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'white', borderRadius: '20px', padding: '24px',
              border: '1px solid #E5E7EB', cursor: 'pointer',
              transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(15,76,92,0.08)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(15,76,92,0.15)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(15,76,92,0.08)';
            }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>{card.icon}</div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0F4C5C', marginBottom: '6px' }}>
                {card.title}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>{card.desc}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}