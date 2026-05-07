'use client';

import Link from 'next/link';
import { ReceptionDashboard } from '@/features/reception/components/ReceptionDashboard';

export default function AdminTicketsPage() {
  return (
    <div className="main-content" style={{ maxWidth: '100%' }}>
      <div className="inline-alert" style={{ marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span>La generación de tickets se realiza desde el kiosco independiente. Este panel queda para monitoreo y control de cola.</span>
        <Link href="/admin/kiosco" className="btn btn-secondary" style={{ minHeight: '34px' }}>
          🖥️ Abrir configuración de kiosco
        </Link>
      </div>
      <ReceptionDashboard
        eyebrow="Administración · Tickets"
        title="Tickets y cola de atención"
        subtitle="Control administrativo para monitorear la cola, llamar pacientes, finalizar turnos, procesar no-show y auditar tickets."
        showKioskShortcut={false}
      />
    </div>
  );
}
