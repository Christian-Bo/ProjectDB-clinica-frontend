'use client';

import { useEffect, useMemo, useState } from 'react';
import { PublicScreenView } from '@/features/reception/components/PublicScreenView';
import { receptionApi } from '@/lib/api/reception';
import type { SelectionOption } from '@/lib/api/types';

const readPositiveIntParam = (name: string): number | undefined => {
  if (typeof window === 'undefined') return undefined;
  const value = new URLSearchParams(window.location.search).get(name);
  const parsed = value ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const readPositiveIntListParam = (name: string): number[] => {
  if (typeof window === 'undefined') return [];
  const value = new URLSearchParams(window.location.search).get(name);
  if (!value) return [];

  return Array.from(new Set(
    value
      .split(',')
      .map((item) => Number(item.trim()))
      .filter((item) => Number.isFinite(item) && item > 0),
  ));
};

export default function PantallaPublicaPage() {
  const [sedes, setSedes] = useState<SelectionOption[]>([]);
  const [servicios, setServicios] = useState<SelectionOption[]>([]);
  const [sedeId, setSedeId] = useState<number | undefined>();
  const [servicioIds, setServicioIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingSedes, setLoadingSedes] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoadingSedes(true);
      try {
        const res = await receptionApi.getSedes();
        if (cancelled) return;

        const safeSedes = Array.isArray(res.data) ? res.data : [];
        const requestedSedeId = readPositiveIntParam('sedeId');
        const initialSedeId = requestedSedeId && safeSedes.some((s) => s.id === requestedSedeId)
          ? requestedSedeId
          : safeSedes[0]?.id;

        setSedes(safeSedes);
        if (initialSedeId) setSedeId(initialSedeId);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setSedes([]);
          setError(err instanceof Error ? err.message : 'No fue posible cargar las sedes.');
          setSettingsOpen(true);
        }
      } finally {
        if (!cancelled) setLoadingSedes(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!sedeId) {
      setServicios([]);
      setServicioIds([]);
      setSettingsOpen(true);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const res = await receptionApi.getServicios(sedeId);
        if (cancelled) return;

        const safe = Array.isArray(res.data) ? res.data : [];
        const requestedMany = readPositiveIntListParam('servicioIds');
        const requestedOne = readPositiveIntParam('servicioId');
        const requested = requestedMany.length > 0 ? requestedMany : requestedOne ? [requestedOne] : [];
        const validRequested = requested.filter((id) => safe.some((item) => item.id === id));

        setServicios(safe);
        setServicioIds((current) => {
          if (validRequested.length > 0) return validRequested;
          const currentValid = current.filter((id) => safe.some((item) => item.id === id));
          return currentValid.length > 0 ? currentValid : safe[0]?.id ? [safe[0].id] : [];
        });
        setError(null);
        setSettingsOpen(validRequested.length === 0 && requested.length === 0);
      } catch (err) {
        if (!cancelled) {
          setServicios([]);
          setServicioIds([]);
          setError(err instanceof Error ? err.message : 'No fue posible cargar los servicios.');
          setSettingsOpen(true);
        }
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [sedeId]);

  const selectedServicesLabel = useMemo(() => {
    const labels = servicios
      .filter((item) => servicioIds.includes(item.id))
      .map((item) => item.label || item.nombre);

    return labels.length > 0 ? labels.join(', ') : 'Sin servicios';
  }, [servicioIds, servicios]);

  const ready = Boolean(sedeId && servicioIds.length > 0);

  const toggleService = (id: number) => {
    setServicioIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  return (
    <div className="public-page-wrapper">
      <button
        type="button"
        className="public-config-toggle"
        onClick={() => setSettingsOpen((current) => !current)}
        aria-expanded={settingsOpen}
        aria-controls="public-config-panel"
      >
        ⚙
      </button>

      <aside
        id="public-config-panel"
        className={`public-config-drawer ${settingsOpen ? 'public-config-drawer-open' : ''}`}
        aria-label="Configuración de pantalla pública"
      >
        <div className="public-config-drawer-header">
          <div>
            <span className="eyebrow light">Configuración</span>
            <h2>Pantalla pública</h2>
          </div>
          <button type="button" className="icon-button" onClick={() => setSettingsOpen(false)} aria-label="Ocultar configuración">
            ✕
          </button>
        </div>

        <label className="field-group public-field-dark">
          <span>Sede *</span>
          <select
            value={sedeId ?? ''}
            disabled={loadingSedes}
            aria-label="Seleccionar sede"
            onChange={(e) => {
              setSedeId(e.target.value ? Number(e.target.value) : undefined);
              setServicioIds([]);
            }}
          >
            <option value="">
              {loadingSedes ? 'Cargando sedes…' : '— Selecciona sede —'}
            </option>
            {sedes.map((s) => (
              <option key={s.id} value={s.id}>{s.label || s.nombre}</option>
            ))}
          </select>
        </label>

        <div className="field-group public-field-dark">
          <span>Servicios visibles *</span>
          <div className="public-service-checks">
            {servicios.length === 0 ? (
              <p>No hay servicios disponibles para la sede.</p>
            ) : (
              servicios.map((service) => (
                <label key={service.id} className="public-service-check">
                  <input
                    type="checkbox"
                    checked={servicioIds.includes(service.id)}
                    onChange={() => toggleService(service.id)}
                  />
                  <span>{service.label || service.nombre}</span>
                </label>
              ))
            )}
          </div>
        </div>

        <div className="inline-alert" style={{ color: '#ffffff', background: 'rgba(46,196,182,0.14)' }}>
          Mostrando: {selectedServicesLabel}
        </div>
      </aside>

      {error && (
        <div className="inline-alert inline-alert-warning" style={{ borderRadius: 0, borderLeft: 0, borderRight: 0 }}>
          ⚠️ {error}
        </div>
      )}

      {ready ? (
        <PublicScreenView sedeId={sedeId!} servicioId={servicioIds[0]} servicioIds={servicioIds} />
      ) : (
        <div className="public-page-empty">
          <div style={{ fontSize: '3.5rem', marginBottom: '20px' }}>📺</div>
          <h2>Pantalla de turnos</h2>
          <p>
            Abre la configuración desde el botón izquierdo y selecciona una sede con uno o varios servicios.
          </p>
          {loadingSedes && (
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.88rem', marginTop: '16px' }}>
              Cargando sedes disponibles…
            </p>
          )}
        </div>
      )}
    </div>
  );
}
