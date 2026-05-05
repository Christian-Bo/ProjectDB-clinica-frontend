'use client';

import { TicketKiosk } from '@/features/reception/components/TicketKiosk';
import { AppShell } from '@/shared/components/shell/AppShell';

export default function ReceptionTicketsPage() {
  return (
    <AppShell>
      <TicketKiosk />
    </AppShell>
  );
}
