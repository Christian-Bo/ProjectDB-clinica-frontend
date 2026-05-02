'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { session } from '@/lib/auth/session';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const user = session.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    const roles = user.roles ?? [];
    if (roles.includes('Administrador') || roles.includes('Supervisor')) {
      router.push('/admin');
    } else if (roles.includes('Medico')) {
      router.push('/medico');
    } else if (roles.includes('Paciente')) {
      router.push('/paciente');
    }
    // Recepcion y Farmacia se quedan aqui — Dev3 maneja esta vista
  }, [router]);

  return null;
}