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

export default function PantallaPublicaPage() {
  const [sedes,      setSedes]      = useState<SelectionOption[]>([]);
  const [servicios,  setServicios]  = useState<SelectionOption[]>([]);
  const [sedeId,     setSedeId]     = useState<number | undefined>();
  const [servicioId, setServicioId] = useState<number | undefined>();
  const [error,      setError]      = useState<string | null>(null);
  const [loadingSedes, setLoadingSedes] = useState(true);

  // Cargar sedes al montar. Si la pantalla se abre desde admin/pantallas,
  // respeta los parametros ?sedeId=&servicioId= para dejarla lista.
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
        }
      } finally {
        if (!cancelled) setLoadingSedes(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, []);

  // Cargar servicios cuando cambia la sede.
  useEffect(() => {
    if (!sedeId) { setServicios([]); setServicioId(undefined); return; }

    let cancelled = false;

    const load = async () => {
      try {
        const res = await receptionApi.getServicios(sedeId);
        if (cancelled) return;

        const safe = Array.isArray(res.data) ? res.data : [];
        const requestedServicioId = readPositiveIntParam('servicioId');
        setServicios(safe);
        setServicioId((prev) => {
          if (requestedServicioId && safe.some((s) => s.id === requestedServicioId)) {
            return requestedServicioId;
          }
          return prev && safe.some((s) => s.id === prev) ? prev : safe[0]?.id;
        });
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setServicios([]);
          setServicioId(undefined);
          setError(err instanceof Error ? err.message : 'No fue posible cargar los servicios.');
        }
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [sedeId]);

  const ready = useMemo(() => Boolean(sedeId && servicioId), [sedeId, servicioId]);

  return (
    <div className="public-page-wrapper">
      {/* Barra de configuración */}
      <div className="public-config-bar" role="navigation" aria-label="Configuración de pantalla">
        <span
          style={{
            color: '#2EC4B6',
            fontWeight: 800,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
          }}
        >
          ✚ Pantalla pública
        </span>

        <select
          value={sedeId ?? ''}
          disabled={loadingSedes}
          aria-label="Seleccionar sede"
          onChange={(e) => {
            setSedeId(e.target.value ? Number(e.target.value) : undefined);
            setServicioId(undefined);
          }}
        >
          <option value="">
            {loadingSedes ? 'Cargando sedes…' : '— Selecciona sede —'}
          </option>
          {sedes.map((s) => (
            <option key={s.id} value={s.id}>{s.label || s.nombre}</option>
          ))}
        </select>

        <select
          value={servicioId ?? ''}
          disabled={!sedeId || servicios.length === 0}
          aria-label="Seleccionar servicio"
          onChange={(e) => setServicioId(e.target.value ? Number(e.target.value) : undefined)}
        >
          <option value="">— Selecciona servicio —</option>
          {servicios.map((s) => (
            <option key={s.id} value={s.id}>{s.label || s.nombre}</option>
          ))}
        </select>

        {ready && (
          <span
            style={{
              marginLeft: 'auto',
              fontSize: '0.78rem',
              color: 'rgba(255,255,255,0.6)',
              whiteSpace: 'nowrap',
            }}
          >
            Actualización automática cada 15s
          </span>
        )}
      </div>

      {/* Error de carga */}
      {error && (
        <div
          className="inline-alert inline-alert-warning"
          style={{ borderRadius: 0, borderLeft: 0, borderRight: 0 }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Vista principal o instrucciones */}
      {ready ? (
        <PublicScreenView sedeId={sedeId!} servicioId={servicioId!} />
      ) : (
        <div className="public-page-empty">
          <div style={{ fontSize: '3.5rem', marginBottom: '20px' }}>📺</div>
          <h2>Pantalla de turnos</h2>
          <p>
            Selecciona la sede y el servicio en la barra superior para ver los
            turnos actuales y la cola de atención en tiempo real.
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
