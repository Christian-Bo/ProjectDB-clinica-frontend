'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ReceptionDashboard } from '@/features/reception/components/ReceptionDashboard';
import { session } from '@/lib/auth/session';
import { AppShell } from '@/shared/components/shell/AppShell';

export default function HomePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

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
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) return null;

  return (
    <AppShell>
      <ReceptionDashboard />
    </AppShell>
  );
}
