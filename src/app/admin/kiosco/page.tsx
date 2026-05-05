'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { TicketKiosk } from '@/features/reception/components/TicketKiosk';
import { receptionApi } from '@/lib/api/reception';
import { session } from '@/lib/auth/session';
import type { KioskWindowConfig, SelectionOption } from '@/lib/api/types';
import { useToast } from '@/shared/components/providers/ToastProvider';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { EmptyState } from '@/shared/components/ui/EmptyState';

export default function AdminKioscoTicketsPage() {
  const toast = useToast();
  const [sedes, setSedes] = useState<SelectionOption[]>([]);
  const [sedeId, setSedeId] = useState<number | undefined>();
  const [ventanillas, setVentanillas] = useState<KioskWindowConfig[]>([]);
  const [drafts, setDrafts] = useState<Record<number, { numeroVentanilla: number; activo: boolean }>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
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
          setSedes([]);
          setError(err instanceof Error ? err.message : 'No fue posible cargar las sedes.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, []);

  const selectedSede = useMemo(
    () => sedes.find((item) => item.id === sedeId),
    [sedeId, sedes],
  );

  const loadWindows = useCallback(async () => {
    if (!sedeId) {
      setVentanillas([]);
      setDrafts({});
      return;
    }

    setLoading(true);
    try {
      const response = await receptionApi.getKioscoVentanillas(sedeId);
      const items = Array.isArray(response.data) ? response.data : [];
      setVentanillas(items);
      setDrafts(Object.fromEntries(items.map((item) => [
        item.servicioId,
        { numeroVentanilla: item.numeroVentanilla, activo: item.activo },
      ])));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible cargar las ventanillas del kiosco.');
      setVentanillas([]);
      setDrafts({});
    } finally {
      setLoading(false);
    }
  }, [sedeId]);

  useEffect(() => {
    void loadWindows();
  }, [loadWindows]);

  const kioskHref = sedeId ? `/kiosco-tickets?sedeId=${sedeId}` : '/kiosco-tickets';

  const updateDraft = (servicioId: number, patch: Partial<{ numeroVentanilla: number; activo: boolean }>) => {
    setDrafts((current) => ({
      ...current,
      [servicioId]: {
        numeroVentanilla: current[servicioId]?.numeroVentanilla ?? 1,
        activo: current[servicioId]?.activo ?? true,
        ...patch,
      },
    }));
  };

  const saveWindow = async (item: KioskWindowConfig) => {
    const draft = drafts[item.servicioId];
    if (!sedeId || !draft) return;

    const numeroVentanilla = Math.max(1, Math.min(999, Math.trunc(Number(draft.numeroVentanilla) || 1)));
    setSavingId(item.servicioId);
    try {
      const user = session.getUser();
      const response = await receptionApi.configurarKioscoVentanilla({
        sedeId,
        servicioId: item.servicioId,
        numeroVentanilla,
        activo: draft.activo,
        usuarioId: user?.usuarioId,
      });

      setVentanillas((current) => current.map((row) => row.servicioId === item.servicioId ? response.data : row));
      setDrafts((current) => ({
        ...current,
        [item.servicioId]: { numeroVentanilla: response.data.numeroVentanilla, activo: response.data.activo },
      }));
      toast.success('Ventanilla actualizada', `${response.data.servicioNombre} atenderá en ${response.data.ventanillaNombre}.`);
    } catch (err) {
      toast.error('No se pudo guardar', err instanceof Error ? err.message : 'Revisa la configuración e intenta nuevamente.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="main-content" style={{ maxWidth: '100%' }}>
      <section className="hero-banner">
        <div style={{ display: 'grid', gap: '14px', alignContent: 'center' }}>
          <span className="eyebrow light">Administración · Kiosco</span>
          <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Configuración de ventanillas del kiosco</h1>
          <p style={{ margin: 0, maxWidth: '740px' }}>
            Define en qué ventanilla se atenderá cada especialidad/servicio. El kiosco público solo muestra el teclado y mantiene la sede oculta.
          </p>
          <div className="button-row-wrap">
            <Link href={kioskHref} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              🖥️ Abrir kiosco independiente
            </Link>
            <Link href="/admin/tickets" className="btn btn-ghost" style={{ background: 'rgba(255,255,255,0.14)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.25)' }}>
              🎫 Monitorear cola
            </Link>
            <Link href="/admin/pantallas" className="btn btn-ghost" style={{ background: 'rgba(255,255,255,0.14)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.25)' }}>
              📺 Pantalla pública
            </Link>
          </div>
        </div>

        <div className="hero-card side-highlight">
          <span className="eyebrow light">Sede para kiosco</span>
          <select
            value={sedeId ?? ''}
            disabled={loading}
            onChange={(event) => setSedeId(event.target.value ? Number(event.target.value) : undefined)}
          >
            <option value="">{loading ? 'Cargando sedes…' : '— Selecciona sede —'}</option>
            {sedes.map((sede) => (
              <option key={sede.id} value={sede.id}>{sede.label || sede.nombre}</option>
            ))}
          </select>
          {selectedSede ? <Badge className="badge-success">✅ {selectedSede.label || selectedSede.nombre}</Badge> : <Badge className="badge-warning">⚠️ Selección pendiente</Badge>}
        </div>
      </section>

      {error ? <div className="inline-alert inline-alert-warning">⚠️ {error}</div> : null}

      <Card className="stack-lg">
        <div className="section-heading-row">
          <div>
            <span className="eyebrow">Ventanillas</span>
            <h3>Asignar especialidades por ventanilla</h3>
          </div>
          <Button variant="secondary" loading={loading} onClick={() => void loadWindows()}>
            🔄 Actualizar
          </Button>
        </div>

        {!sedeId ? (
          <EmptyState title="Selecciona una sede" description="Al seleccionar una sede se mostrarán sus servicios configurables." />
        ) : ventanillas.length === 0 ? (
          <EmptyState title="Sin servicios" description="No hay servicios activos para configurar en esta sede o falta ejecutar el script SQL 38." />
        ) : (
          <div className="kiosk-window-admin-grid">
            {ventanillas.map((item) => {
              const draft = drafts[item.servicioId] ?? { numeroVentanilla: item.numeroVentanilla, activo: item.activo };
              return (
                <div className="kiosk-window-admin-row" key={item.servicioId}>
                  <div>
                    <strong>{item.especialidadNombre || item.servicioNombre}</strong>
                    <br />
                    <small>{item.servicioNombre}</small>
                  </div>
                  <label className="field-group" style={{ margin: 0 }}>
                    <span>No. ventanilla</span>
                    <input
                      type="number"
                      min={1}
                      max={999}
                      value={draft.numeroVentanilla}
                      onChange={(event) => updateDraft(item.servicioId, { numeroVentanilla: Number(event.target.value) })}
                    />
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={draft.activo}
                      onChange={(event) => updateDraft(item.servicioId, { activo: event.target.checked })}
                    />
                    Activa
                  </label>
                  <Button loading={savingId === item.servicioId} disabled={savingId === item.servicioId} onClick={() => void saveWindow(item)}>
                    Guardar
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="stack-lg">
        <div className="section-heading-row">
          <div>
            <span className="eyebrow">Vista funcional</span>
            <h3>Previsualización del kiosco</h3>
          </div>
          {sedeId ? (
            <Link href={kioskHref} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ minHeight: '36px' }}>
              Abrir pantalla independiente
            </Link>
          ) : null}
        </div>

        {sedeId ? (
          <div className="admin-kiosk-preview-frame">
            <TicketKiosk initialSedeId={sedeId} adminLauncherHref={kioskHref} />
          </div>
        ) : (
          <EmptyState
            title="Selecciona una sede"
            description="Cuando definas la sede, el kiosco aparecerá aquí con toda su funcionalidad."
          />
        )}
      </Card>
    </div>
  );
}
