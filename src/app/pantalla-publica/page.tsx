'use client';

import { PublicScreenView } from '@/features/reception/components/PublicScreenView';
import { useDashboardData } from '@/features/reception/hooks/useDashboardData';

export default function PantallaPublicaPage() {
  const dashboard = useDashboardData();

  const handleSedeChange = (value: string) => {
    dashboard.setFilters((current) => ({
      ...current,
      sedeId: value ? Number(value) : undefined,
      servicioId: undefined,
      estacionId: undefined,
    }));
  };

  const handleServicioChange = (value: string) => {
    dashboard.setFilters((current) => ({
      ...current,
      servicioId: value ? Number(value) : undefined,
    }));
  };

  const ready = Boolean(dashboard.filters.sedeId && dashboard.filters.servicioId);

  return (
    <div className="public-page-wrapper">
      <div className="public-config-bar">
        <select
          value={dashboard.filters.sedeId ?? ''}
          onChange={(event) => handleSedeChange(event.target.value)}
        >
          <option value="">Selecciona sede</option>
          {dashboard.sedes.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label || option.nombre}
            </option>
          ))}
        </select>

        <select
          value={dashboard.filters.servicioId ?? ''}
          onChange={(event) => handleServicioChange(event.target.value)}
        >
          <option value="">Selecciona servicio</option>
          {dashboard.servicios.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label || option.nombre}
            </option>
          ))}
        </select>
      </div>

      {ready ? (
        <PublicScreenView
          sedeId={dashboard.filters.sedeId!}
          servicioId={dashboard.filters.servicioId!}
        />
      ) : (
        <div className="public-page-empty">
          <h2>Selecciona sede y servicio</h2>
          <p>La pantalla pública necesita ambos filtros para mostrar la cola.</p>
        </div>
      )}
    </div>
  );
}
