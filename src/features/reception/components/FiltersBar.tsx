'use client';

import { useEffect, useState } from 'react';
import type { SelectionOption } from '@/lib/api/types';
import type { DashboardFilters } from '@/features/reception/models/ui';
import { session } from '@/lib/auth/session';
import { Card } from '@/shared/components/ui/Card';

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
  const [operatorName, setOperatorName] = useState('Operador de sesión');

  useEffect(() => {
    try {
      const current = session.getUser();
      if (current?.usuarioId) {
        setOperatorName(current.nombreCompleto || current.username || `Usuario ${current.usuarioId}`);
        setFilters((prev) => ({ ...prev, usuarioId: prev.usuarioId ?? current.usuarioId }));
      }
    } catch {
      // Si localStorage no está disponible, se opera sin UsuarioId manual.
    }
  }, [setFilters]);

  return (
    <Card>
      <div className="section-heading-row" style={{ marginBottom: '14px' }}>
        <div>
          <span className="eyebrow">Contexto operativo</span>
          <h3 style={{ marginTop: '2px' }}>Filtros de sesión</h3>
        </div>
        <span className="muted-text" style={{ fontSize: '0.82rem', alignSelf: 'flex-end' }}>
          Los filtros aplican a todas las operaciones de la sesión
        </span>
      </div>

      <div className="filters-grid">
        <label className="field-group">
          <span>Sede *</span>
          <select
            value={filters.sedeId ?? ''}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                sedeId:     e.target.value ? Number(e.target.value) : undefined,
                servicioId: undefined,
                estacionId: undefined,
              }))
            }
          >
            <option value="">— Selecciona sede —</option>
            {sedes.map((s) => (
              <option key={s.id} value={s.id}>{s.label || s.nombre}</option>
            ))}
          </select>
        </label>

        <label className="field-group">
          <span>Servicio *</span>
          <select
            value={filters.servicioId ?? ''}
            disabled={!filters.sedeId}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                servicioId: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
          >
            <option value="">— Selecciona servicio —</option>
            {servicios.map((s) => (
              <option key={s.id} value={s.id}>{s.label || s.nombre}</option>
            ))}
          </select>
        </label>

        <label className="field-group">
          <span>Estación de atención</span>
          <select
            value={filters.estacionId ?? ''}
            disabled={!filters.sedeId}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                estacionId: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
          >
            <option value="">— Sin estación —</option>
            {estaciones.map((e) => (
              <option key={e.id} value={e.id}>{e.label || e.nombre}</option>
            ))}
          </select>
        </label>

        <div className="field-group operator-session-box">
          <span>Operador</span>
          <div className="operator-session-pill">
            <strong>{operatorName}</strong>
            <small>Tomado de la sesión activa</small>
          </div>
        </div>
      </div>

      {(!filters.sedeId || !filters.servicioId) && (
        <div className="inline-alert inline-alert-warning" style={{ marginTop: '12px' }}>
          ⚠️ Selecciona sede y servicio para habilitar todas las operaciones.
        </div>
      )}
    </Card>
  );
}
