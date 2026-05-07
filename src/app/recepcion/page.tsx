'use client';

import { ReceptionDashboard } from '@/features/reception/components/ReceptionDashboard';
import { AppShell } from '@/shared/components/shell/AppShell';

export default function ReceptionPage() {
  return (
    <AppShell>
      <ReceptionDashboard />
    </AppShell>
  );
}
