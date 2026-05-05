'use client';

import { TicketKiosk } from '@/features/reception/components/TicketKiosk';

export default function KioscoTicketsPage() {
  return (
    <main className="standalone-kiosk-shell">
      <TicketKiosk standalone />
    </main>
  );
}
