'use client';

import type { DashboardFilters } from '@/features/reception/models/ui';
import type { SelectionOption } from '@/lib/api/types';
import { Card } from '@/shared/components/ui/Card';

function SelectBlock({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value?: number;
  options: SelectionOption[];
  onChange: (value?: number) => void;
}) {
  return (
    <label className="field-group">
      <span>{label}</span>
      <select
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value ? Number(event.target.value) : undefined)}
      >
        <option value="">Selecciona...</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label || option.nombre}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FiltersBar({
  filters,
  setFilters,
  sedes,
  servicios,
  estaciones,
}: {
  filters: DashboardFilters;
  setFilters: React.Dispatch<React.SetStateAction<DashboardFilters>>;
  sedes: SelectionOption[];
  servicios: SelectionOption[];
  estaciones: SelectionOption[];
}) {
  return (
    <Card className="toolbar-card">
      <div>
        <span className="eyebrow">Contexto</span>
        <h3>Sede, servicio y estación</h3>
      </div>

      <div className="filters-grid">
        <SelectBlock
          label="Sede"
          value={filters.sedeId}
          options={sedes}
          onChange={(value) =>
            setFilters((current) => ({
              ...current,
              sedeId: value,
              servicioId: undefined,
              estacionId: undefined,
            }))
          }
        />

        <SelectBlock
          label="Servicio"
          value={filters.servicioId}
          options={servicios}
          onChange={(value) =>
            setFilters((current) => ({
              ...current,
              servicioId: value,
            }))
          }
        />

        <SelectBlock
          label="Estación"
          value={filters.estacionId}
          options={estaciones}
          onChange={(value) =>
            setFilters((current) => ({
              ...current,
              estacionId: value,
            }))
          }
        />

        <label className="field-group">
          <span>Usuario operativo</span>
          <input
            type="number"
            min="1"
            value={filters.usuarioId ?? ''}
            placeholder="Opcional"
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                usuarioId: event.target.value ? Number(event.target.value) : undefined,
              }))
            }
          />
        </label>
      </div>
    </Card>
  );
}
