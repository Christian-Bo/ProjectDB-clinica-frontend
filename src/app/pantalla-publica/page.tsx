'use client';

import { useMemo, useState } from 'react';
import { PublicScreenView } from '@/features/reception/components/PublicScreenView';
import { useDashboardData } from '@/features/reception/hooks/useDashboardData';

export default function PantallaPublicaPage() {
  const dashboard = useDashboardData();
  const [localSedeId, setLocalSedeId] = useState<number | undefined>();
  const [localServicioId, setLocalServicioId] = useState<number | undefined>();

  const sedeId = localSedeId ?? dashboard.filters.sedeId ?? dashboard.sedes[0]?.id;
  const servicioId = localServicioId ?? dashboard.filters.servicioId ?? dashboard.servicios[0]?.id;

  const ready = useMemo(() => Boolean(sedeId && servicioId), [sedeId, servicioId]);

  return (
    <div className="public-page-wrapper">
      <div className="public-config-bar">
        <select value={sedeId ?? ''} onChange={(event) => setLocalSedeId(Number(event.target.value) || undefined)}>
          <option value="">Selecciona sede</option>
          {dashboard.sedes.map((option) => <option key={option.id} value={option.id}>{option.label || option.nombre}</option>)}
        </select>
        <select value={servicioId ?? ''} onChange={(event) => setLocalServicioId(Number(event.target.value) || undefined)}>
          <option value="">Selecciona servicio</option>
          {dashboard.servicios.map((option) => <option key={option.id} value={option.id}>{option.label || option.nombre}</option>)}
        </select>
      </div>
      {ready ? (
        <PublicScreenView sedeId={sedeId!} servicioId={servicioId!} />
      ) : (
        <div className="public-page-empty">
          <h2>Selecciona sede y servicio</h2>
          <p>La pantalla publica necesita ambos filtros para mostrar el turno actual y los proximos tickets.</p>
        </div>
      )}
    </div>
  );
}
