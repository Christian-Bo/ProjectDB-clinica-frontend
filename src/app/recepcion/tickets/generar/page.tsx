'use client';

import { TicketKiosk } from '@/features/reception/components/TicketKiosk';
import { AppShell } from '@/shared/components/shell/AppShell';

export default function ReceptionTicketGeneratorPage() {
  return (
    <AppShell>
      <TicketKiosk />
    </AppShell>
  );
}
