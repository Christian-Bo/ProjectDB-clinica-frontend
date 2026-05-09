'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { useToast } from '@/shared/components/providers/ToastProvider';
import { patientsApi } from '@/lib/api/patients';
import { session } from '@/lib/auth/session';

interface RecetaPendiente {
  recetaId: number;
  consultaId: number;
  pacienteId: number;
  pacienteNombre: string;
  medicoId?: number;
  medicoNombre: string;
  estado: string;
  fechaEmision: string;
  observaciones?: string;
  totalMedicamentos: number;
}

export default function FarmaciaPage() {
  const toast = useToast();
  const [recetas, setRecetas] = useState<RecetaPendiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [despachando, setDespachando] = useState<number | null>(null);
  const [texto, setTexto] = useState('');
  const [usuarioId, setUsuarioId] = useState<number>(1);

  useEffect(() => {
    const user = session.getUser();
    if (user) setUsuarioId(user.usuarioId);
  }, []);

  const cargarRecetas = useCallback(async () => {
    setLoading(true);
    const res = await patientsApi.get<RecetaPendiente[]>(
      `/api/farmacia/recetas-pendientes${texto ? `?texto=${texto}` : ''}`
    );
    if (res.success && res.data) setRecetas(res.data);
    else toast.error('Error', 'No se pudieron cargar las recetas.');
    setLoading(false);
  }, [toast, texto]);

  useEffect(() => { void cargarRecetas(); }, [cargarRecetas]);

  async function handleDespachar(recetaId: number) {
    setDespachando(recetaId);
    const res = await patientsApi.post(
      `/api/farmacia/recetas/${recetaId}/despachar?observaciones=Despachado+por+farmacia`
    );
    if (res.success) {
      toast.success('Receta despachada', 'La receta fue despachada correctamente.');
      void cargarRecetas();
    } else {
      toast.error('Error', res.message || 'No se pudo despachar la receta.');
    }
    setDespachando(null);
  }

  return (
    <div className="stack-lg">
      <section className="hero-banner">
        <div>
          <span className="eyebrow">Farmacia</span>
          <h1>Recetas pendientes</h1>
          <p>Despachá las recetas emitidas por los médicos.</p>
        </div>
        <div className="hero-card side-highlight">
          <span className="muted-text-light">Pendientes</span>
          <strong style={{ fontSize: '2rem' }}>{recetas.length}</strong>
          <p>recetas esperando despacho</p>
        </div>
      </section>

      <Card className="stack-md">
        <div className="filters-grid">
          <div className="field-group">
            <span>Buscar paciente o receta</span>
            <input
              type="text"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Nombre del paciente o número de receta..."
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button onClick={() => void cargarRecetas()}>Buscar</Button>
          </div>
        </div>
      </Card>

      {loading && (
        <div className="loading-box">
          <p className="muted-text">Cargando recetas...</p>
        </div>
      )}

      {!loading && recetas.length === 0 && (
        <EmptyState
          title="No hay recetas pendientes"
          description="Todas las recetas han sido despachadas."
        />
      )}

      {!loading && recetas.map((r) => (
        <Card key={r.recetaId} className="stack-md">
          <div className="section-heading-row">
            <div>
              <span className="eyebrow">Receta #{r.recetaId}</span>
              <h3 style={{ margin: 0 }}>{r.pacienteNombre}</h3>
              <span className="muted-text">{r.medicoNombre}</span>
            </div>
            <span className="badge badge-warning">{r.estado}</span>
          </div>

          <div className="filters-grid">
            <div className="detail-item">
              <span>Fecha emisión</span>
              <strong>{new Date(r.fechaEmision).toLocaleDateString('es-GT')}</strong>
            </div>
            <div className="detail-item">
              <span>Medicamentos</span>
              <strong>{r.totalMedicamentos} ítem(s)</strong>
            </div>
            {r.observaciones && (
              <div className="detail-item">
                <span>Observaciones</span>
                <strong>{r.observaciones}</strong>
              </div>
            )}
          </div>

          <div className="button-row-wrap">
            <Button
              loading={despachando === r.recetaId}
              disabled={despachando === r.recetaId}
              onClick={() => void handleDespachar(r.recetaId)}
            >
              Despachar receta
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}