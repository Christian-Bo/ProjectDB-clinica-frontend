'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { PublicScreenView } from '@/features/reception/components/PublicScreenView';
import { receptionApi } from '@/lib/api/reception';
import type { SelectionOption } from '@/lib/api/types';
import { Badge } from '@/shared/components/ui/Badge';
import { Card } from '@/shared/components/ui/Card';
import { EmptyState } from '@/shared/components/ui/EmptyState';

export default function AdminPantallasPage() {
  const [sedes, setSedes] = useState<SelectionOption[]>([]);
  const [servicios, setServicios] = useState<SelectionOption[]>([]);
  const [sedeId, setSedeId] = useState<number | undefined>();
  const [servicioIds, setServicioIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingServicios, setLoadingServicios] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadSedes = async () => {
      setLoading(true);
      try {
        const response = await receptionApi.getSedes();
        if (cancelled) return;

        const items = Array.isArray(response.data) ? response.data : [];
        setSedes(items);
        setSedeId((current) => current ?? items[0]?.id);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'No fue posible cargar las sedes.');
          setSedes([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadSedes();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!sedeId) {
      setServicios([]);
      setServicioIds([]);
      return;
    }

    let cancelled = false;

    const loadServicios = async () => {
      setLoadingServicios(true);
      try {
        const response = await receptionApi.getServicios(sedeId);
        if (cancelled) return;

        const items = Array.isArray(response.data) ? response.data : [];
        setServicios(items);
        setServicioIds((current) => {
          const validCurrent = current.filter((id) => items.some((item) => item.id === id));
          return validCurrent.length > 0 ? validCurrent : items[0]?.id ? [items[0].id] : [];
        });
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setServicios([]);
          setServicioIds([]);
          setError(err instanceof Error ? err.message : 'No fue posible cargar los servicios.');
        }
      } finally {
        if (!cancelled) setLoadingServicios(false);
      }
    };

    void loadServicios();
    return () => { cancelled = true; };
  }, [sedeId]);

  const selectedSede = useMemo(
    () => sedes.find((item) => item.id === sedeId),
    [sedeId, sedes],
  );

  const selectedServiciosLabel = useMemo(
    () => servicios
      .filter((item) => servicioIds.includes(item.id))
      .map((item) => item.label || item.nombre)
      .join(', '),
    [servicioIds, servicios],
  );

  const publicHref = sedeId && servicioIds.length > 0
    ? `/pantalla-publica?sedeId=${sedeId}&servicioIds=${servicioIds.join(',')}`
    : '/pantalla-publica';

  const toggleService = (id: number) => {
    setServicioIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  return (
    <div className="main-content" style={{ maxWidth: '100%' }}>
      <section className="hero-banner">
        <div style={{ display: 'grid', gap: '14px', alignContent: 'center' }}>
          <span className="eyebrow light">Administración · Pantallas</span>
          <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Pantalla pública por sectores</h1>
          <p style={{ margin: 0, maxWidth: '620px' }}>
            Configura una sede con uno o varios servicios para que cada monitor muestre únicamente los llamados de su área o sector.
          </p>
          <div className="button-row-wrap">
            <Link href={publicHref} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              📺 Abrir pantalla pública
            </Link>
            <Link href="/admin/tickets" className="btn btn-ghost" style={{ background: 'rgba(255,255,255,0.14)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.25)' }}>
              🎫 Ir a tickets
            </Link>
          </div>
        </div>

        <div className="hero-card side-highlight">
          <span className="eyebrow light">Configuración activa</span>
          <strong>{selectedSede?.label ?? selectedSede?.nombre ?? 'Sin sede'} · {selectedServiciosLabel || 'Sin servicios'}</strong>
          <p>La configuración queda oculta en la pantalla pública y se abre con el botón lateral.</p>
          <div>
            {sedeId && servicioIds.length > 0
              ? <Badge className="badge-success">✅ Lista para mostrar</Badge>
              : <Badge className="badge-warning">⚠️ Selección pendiente</Badge>}
          </div>
        </div>
      </section>

      <Card className="stack-lg">
        <div className="section-heading-row">
          <div>
            <span className="eyebrow">Parámetros de pantalla</span>
            <h3>Seleccionar sede y servicios visibles</h3>
          </div>
          {loading || loadingServicios ? <Badge className="badge-info">Cargando...</Badge> : null}
        </div>

        {error ? <div className="inline-alert inline-alert-warning">⚠️ {error}</div> : null}

        <div className="filters-grid">
          <label className="field-group">
            <span>Sede *</span>
            <select
              value={sedeId ?? ''}
              disabled={loading}
              onChange={(event) => {
                setSedeId(event.target.value ? Number(event.target.value) : undefined);
                setServicioIds([]);
              }}
            >
              <option value="">— Selecciona sede —</option>
              {sedes.map((item) => (
                <option key={item.id} value={item.id}>{item.label || item.nombre}</option>
              ))}
            </select>
          </label>

          <div className="field-group" style={{ gridColumn: 'span 3' }}>
            <span>Servicios *</span>
            <div className="public-service-chip-row">
              {servicios.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={servicioIds.includes(item.id) ? 'active' : ''}
                  onClick={() => toggleService(item.id)}
                >
                  {item.label || item.nombre}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="stack-lg">
        <div className="section-heading-row">
          <div>
            <span className="eyebrow">Vista previa</span>
            <h3>Monitor de sala de espera</h3>
          </div>
          <Link href={publicHref} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ minHeight: '36px' }}>
            Abrir en nueva pestaña
          </Link>
        </div>

        {sedeId && servicioIds.length > 0 ? (
          <div className="public-preview-frame">
            <PublicScreenView sedeId={sedeId} servicioId={servicioIds[0]} servicioIds={servicioIds} />
          </div>
        ) : (
          <EmptyState
            title="Selecciona sede y al menos un servicio"
            description="Cuando definas el contexto, aquí verás una vista previa de la pantalla pública."
          />
        )}
      </Card>
    </div>
  );
}
