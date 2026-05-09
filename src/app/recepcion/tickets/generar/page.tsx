'use client';

import Link from 'next/link';
import { TicketKiosk } from '@/features/reception/components/TicketKiosk';

export default function ReceptionTicketGeneratorPage() {
  return (
    <main className="standalone-kiosk-shell">
      <Link className="kiosk-back-to-dashboard" href="/recepcion">
        ← Volver a recepción
      </Link>
      <TicketKiosk standalone />
    </main>
  );
}
