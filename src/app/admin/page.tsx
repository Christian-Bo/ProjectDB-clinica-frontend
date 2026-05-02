'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { session } from '@/lib/auth/session';

const ADMIN_CARDS = [
  {
    icon: '🎫',
    title: 'Tickets y cola',
    desc: 'Generar tickets, llamar el siguiente turno, finalizar atenciones y procesar no-show.',
    href: '/admin/tickets',
    primary: true,
  },
  {
    icon: '📺',
    title: 'Pantallas',
    desc: 'Configurar y abrir pantallas públicas para sala de espera por sede y servicio.',
    href: '/admin/pantallas',
    primary: true,
  },
  {
    icon: '👥',
    title: 'Usuarios',
    desc: 'Crear y gestionar usuarios del sistema.',
    href: '/admin/usuarios',
  },
  {
    icon: '🏥',
    title: 'Sedes',
    desc: 'Administrar sedes de la clínica cuando el catálogo esté habilitado.',
    href: '/admin/sedes',
  },
  {
    icon: '⚕️',
    title: 'Especialidades',
    desc: 'Gestionar especialidades médicas cuando el catálogo esté habilitado.',
    href: '/admin/especialidades',
  },
];

export default function AdminDashboard() {
  const [user, setUser] = useState<{ nombreCompleto: string } | null>(null);

  useEffect(() => {
    setUser(session.getUser());
  }, []);

  return (
    <div className="main-content" style={{ maxWidth: '100%' }}>
      <section className="hero-banner">
        <div style={{ display: 'grid', gap: '12px', alignContent: 'center' }}>
          <span className="eyebrow light">Panel administrador</span>
          <h1 style={{ margin: 0, color: '#ffffff', fontSize: '1.8rem', fontWeight: 900 }}>
            Bienvenido, {user?.nombreCompleto ?? 'Administrador'}
          </h1>
          <p style={{ margin: 0, maxWidth: '560px' }}>
            Desde aquí puedes entrar a los módulos administrativos sin afectar los módulos de médico, paciente o recepción.
          </p>
        </div>

        <div className="hero-card side-highlight">
          <span className="eyebrow light">Nuevo módulo conectado</span>
          <strong>Tickets + Pantallas</strong>
          <p>La administración ya tiene accesos propios para operar la cola y abrir monitores públicos de turnos.</p>
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '20px' }}>
        {ADMIN_CARDS.map((card) => (
          <Link key={card.href} href={card.href} style={{ textDecoration: 'none' }}>
            <div style={{
              minHeight: '172px', background: 'white', borderRadius: '20px', padding: '24px',
              border: card.primary ? '1px solid rgba(46,196,182,0.45)' : '1px solid #E5E7EB',
              cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: card.primary ? '0 10px 28px rgba(15,76,92,0.12)' : '0 4px 12px rgba(15,76,92,0.08)',
              display: 'grid', gap: '10px', alignContent: 'start',
            }}>
              <div style={{ fontSize: '2rem' }}>{card.icon}</div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0F4C5C' }}>
                {card.title}
              </div>
              <div style={{ fontSize: '0.88rem', color: '#6B7280' }}>{card.desc}</div>
              {card.primary ? (
                <span className="badge badge-teal" style={{ justifySelf: 'start', marginTop: '4px' }}>Disponible</span>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
