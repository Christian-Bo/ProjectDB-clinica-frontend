'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { patientsApi } from '@/lib/api/patients';
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

    if (roles.includes('Paciente')) {
      router.push('/paciente');
    } else if (roles.includes('Medico')) {
      router.push('/medico');
    } else if (roles.includes('Administrador') || roles.includes('Supervisor')) {
      router.push('/admin');
    } else if (roles.includes('Farmacia')) {
      router.push('/farmacia');
    } else if (roles.includes('Recepcion')) {
      patientsApi
        .get<{ data: unknown[] }>(`/api/secretaria/contextos?usuarioId=${user.usuarioId}`)
        .then((res) => {
          const tieneSecretaria = Array.isArray((res as any).data) && (res as any).data.length > 0;
          router.push(tieneSecretaria ? '/secretaria' : '/recepcion');
        })
        .catch(() => router.push('/recepcion'));
    } else {
      router.push('/login');
    }
  }, [router]);

  return null;
}