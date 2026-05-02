'use client';

import { ReceptionDashboard } from '@/features/reception/components/ReceptionDashboard';

export default function AdminTicketsPage() {
  return (
    <div className="main-content" style={{ maxWidth: '100%' }}>
      <ReceptionDashboard
        eyebrow="Administración · Tickets"
        title="Tickets y cola de atención"
        subtitle="Control administrativo para generar tickets, llamar pacientes, finalizar turnos, procesar no-show y supervisar la pantalla pública de la clínica."
      />
    </div>
  );
}
