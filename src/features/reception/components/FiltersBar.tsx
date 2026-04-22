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
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}>
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
        <span className="eyebrow">Contexto operativo</span>
        <h3>Seleccion de sede, servicio y estacion</h3>
        <p className="muted-text">
          Todos los formularios usan nombres amigables y listados descriptivos. Internamente se guardan los ids,
          pero el usuario nunca trabaja con numeros aislados.
        </p>
      </div>
      <div className="filters-grid">
        <SelectBlock
          label="Sede"
          value={filters.sedeId}
          options={sedes}
          onChange={(value) => setFilters((current) => ({ ...current, sedeId: value, servicioId: undefined, estacionId: undefined }))}
        />
        <SelectBlock
          label="Servicio"
          value={filters.servicioId}
          options={servicios}
          onChange={(value) => setFilters((current) => ({ ...current, servicioId: value }))}
        />
        <SelectBlock
          label="Estacion"
          value={filters.estacionId}
          options={estaciones}
          onChange={(value) => setFilters((current) => ({ ...current, estacionId: value }))}
        />
        <label className="field-group">
          <span>Usuario operativo</span>
          <input
            type="number"
            min="1"
            value={filters.usuarioId}
            onChange={(event) => setFilters((current) => ({ ...current, usuarioId: Number(event.target.value) || 1 }))}
          />
        </label>
      </div>
    </Card>
  );
}
