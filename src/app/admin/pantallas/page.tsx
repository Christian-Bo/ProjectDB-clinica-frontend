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
  const [servicioId, setServicioId] = useState<number | undefined>();
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
      setServicioId(undefined);
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
        setServicioId((current) =>
          current && items.some((item) => item.id === current) ? current : items[0]?.id,
        );
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setServicios([]);
          setServicioId(undefined);
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

  const selectedServicio = useMemo(
    () => servicios.find((item) => item.id === servicioId),
    [servicioId, servicios],
  );

  const publicHref = sedeId && servicioId
    ? `/pantalla-publica?sedeId=${sedeId}&servicioId=${servicioId}`
    : '/pantalla-publica';

  return (
    <div className="main-content" style={{ maxWidth: '100%' }}>
      <section className="hero-banner">
        <div style={{ display: 'grid', gap: '14px', alignContent: 'center' }}>
          <span className="eyebrow light">Administración · Pantallas</span>
          <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Pantalla pública de turnos</h1>
          <p style={{ margin: 0, maxWidth: '560px' }}>
            Configura la sede y servicio que se mostrarán en monitores o televisores de sala de espera, sin mezclar esta vista con otros módulos del administrador.
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
          <strong>{selectedSede?.label ?? selectedSede?.nombre ?? 'Sin sede'} · {selectedServicio?.label ?? selectedServicio?.nombre ?? 'Sin servicio'}</strong>
          <p>La pantalla pública se actualiza por SSE cuando está disponible y por consulta automática cada 15 segundos como respaldo.</p>
          <div>
            {sedeId && servicioId
              ? <Badge className="badge-success">✅ Lista para mostrar</Badge>
              : <Badge className="badge-warning">⚠️ Selección pendiente</Badge>}
          </div>
        </div>
      </section>

      <Card className="stack-lg">
        <div className="section-heading-row">
          <div>
            <span className="eyebrow">Parámetros de pantalla</span>
            <h3>Seleccionar cola visible</h3>
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
                setServicioId(undefined);
              }}
            >
              <option value="">— Selecciona sede —</option>
              {sedes.map((item) => (
                <option key={item.id} value={item.id}>{item.label || item.nombre}</option>
              ))}
            </select>
          </label>

          <label className="field-group">
            <span>Servicio *</span>
            <select
              value={servicioId ?? ''}
              disabled={!sedeId || loadingServicios}
              onChange={(event) => setServicioId(event.target.value ? Number(event.target.value) : undefined)}
            >
              <option value="">— Selecciona servicio —</option>
              {servicios.map((item) => (
                <option key={item.id} value={item.id}>{item.label || item.nombre}</option>
              ))}
            </select>
          </label>
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

        {sedeId && servicioId ? (
          <div className="public-preview-frame">
            <PublicScreenView sedeId={sedeId} servicioId={servicioId} />
          </div>
        ) : (
          <EmptyState
            title="Selecciona sede y servicio"
            description="Cuando definas el contexto, aquí verás una vista previa de la pantalla pública."
          />
        )}
      </Card>
    </div>
  );
}
