'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { patientsApi } from '@/lib/api/patients';
import { useToast } from '@/shared/components/providers/ToastProvider';
import { usePacienteSession } from '@/lib/auth/useSession';

interface Alergia {
  pacienteAlergiaId: number;
  alergiaId: number;
  nombreAlergia: string;
  tipoAlergia: string;
  severidad: string;
  descripcion?: string;
  fechaDeteccion?: string;
}
// Agrega este array arriba del componente, antes del export:
const ALERGIAS_DISPONIBLES = [
  { id: 1, nombre: 'Penicilina', tipo: 'MEDICAMENTO' },
  { id: 2, nombre: 'Amoxicilina', tipo: 'MEDICAMENTO' },
  { id: 3, nombre: 'Ibuprofeno', tipo: 'MEDICAMENTO' },
  { id: 4, nombre: 'Latex', tipo: 'LATEX' },
  { id: 5, nombre: 'Contraste yodado', tipo: 'CONTRASTE' },
];

const SEVERIDADES = ['LEVE', 'MODERADA', 'GRAVE'];

const SEVERIDAD_COLOR: Record<string, string> = {
  LEVE: 'badge-info',
  MODERADA: 'badge-warning',
  GRAVE: 'badge-danger',
};

export default function AlergiasPage() {
  const toast = useToast();
  const { pacienteId, cargando: cargandoSession } = usePacienteSession();
  const [alergias, setAlergias] = useState<Alergia[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [quitando, setQuitando] = useState<number | null>(null);
  const [form, setForm] = useState({
    alergiaId: '',
    severidad: 'LEVE',
    descripcion: '',
    fechaDeteccion: '',
  });

  const cargarAlergias = useCallback(async () => {
    if (!pacienteId) return;
    setLoading(true);
    const res = await patientsApi.get<Alergia[]>(`/api/pacientes/${pacienteId}/alergias`);
    if (res.success && res.data) setAlergias(res.data);
    else toast.error('Error', 'No se pudieron cargar las alergias.');
    setLoading(false);
  }, [toast, pacienteId]);

  useEffect(() => { if (pacienteId) void cargarAlergias(); }, [cargarAlergias, pacienteId]);

  async function handleAgregar() {
    if (!form.alergiaId || !form.severidad) {
      toast.warning('Campos requeridos', 'Ingresa el ID de alergia y la severidad.');
      return;
    }
    setGuardando(true);
    const res = await patientsApi.post(`/api/pacientes/${pacienteId}/alergias`, {
      alergiaId: Number(form.alergiaId),
      severidad: form.severidad,
      descripcion: form.descripcion || null,
      fechaDeteccion: form.fechaDeteccion || null,
    });
    if (res.success) {
      toast.success('Alergia agregada', 'La alergia fue registrada correctamente.');
      setForm({ alergiaId: '', severidad: 'LEVE', descripcion: '', fechaDeteccion: '' });
      setMostrarForm(false);
      void cargarAlergias();
    } else if (res.errorCode === 'ALERGIA_DUPLICADA') {
      toast.error('Ya registrada', 'Ya tienes esta alergia registrada.');
    } else {
      toast.error('Error', res.message || 'No se pudo agregar la alergia.');
    }
    setGuardando(false);
  }

  async function handleQuitar(alergiaId: number) {
    setQuitando(alergiaId);
    const res = await patientsApi.post(`/api/pacientes/${pacienteId}/alergias/${alergiaId}/quitar`, {});
    if (res.success) {
      toast.success('Alergia eliminada', 'La alergia fue desactivada.');
      void cargarAlergias();
    } else {
      toast.error('Error', res.message || 'No se pudo quitar la alergia.');
    }
    setQuitando(null);
  }

  if (cargandoSession) return <div className="loading-box"><p className="muted-text">Cargando sesión...</p></div>;

  return (
    <div className="stack-lg">
      <section className="hero-banner">
        <div>
          <span className="eyebrow">Portal Paciente</span>
          <h1>Mis Alergias</h1>
          <p>Mantén actualizado tu registro de alergias para tu seguridad.</p>
          <div className="button-row-wrap">
            <Button onClick={() => setMostrarForm(!mostrarForm)}>
              {mostrarForm ? 'Cancelar' : '+ Agregar alergia'}
            </Button>
          </div>
        </div>
        <div className="hero-card side-highlight">
          <span className="muted-text-light">Total registradas</span>
          <strong style={{ fontSize: '2rem' }}>{alergias.length}</strong>
          <p>Las alergias son validadas al momento de emitir recetas médicas.</p>
        </div>
      </section>

      {mostrarForm && (
        <Card className="stack-md">
          <span className="eyebrow">Nueva alergia</span>
          <h3>Registrar alergia</h3>
          <div className="filters-grid">
            <div className="field-group">
            <span>Alergia</span>
            <select
                value={form.alergiaId}
                onChange={(e) => setForm((p) => ({ ...p, alergiaId: e.target.value }))}
            >
                <option value="">Selecciona una alergia...</option>
                {ALERGIAS_DISPONIBLES.map((a) => (
                <option key={a.id} value={a.id}>
                    {a.nombre} — {a.tipo}
                </option>
                ))}
            </select>
            </div>
            <div className="field-group">
              <span>Severidad</span>
              <select value={form.severidad} onChange={(e) => setForm((p) => ({ ...p, severidad: e.target.value }))}>
                {SEVERIDADES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="field-group">
              <span>Fecha de detección</span>
              <input
                type="date"
                value={form.fechaDeteccion}
                onChange={(e) => setForm((p) => ({ ...p, fechaDeteccion: e.target.value }))}
              />
            </div>
            <div className="field-group">
              <span>Descripción (opcional)</span>
              <input
                type="text"
                value={form.descripcion}
                onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
                placeholder="Síntomas o notas adicionales"
              />
            </div>
          </div>
          <div className="button-row-wrap">
            <Button loading={guardando} disabled={guardando} onClick={() => void handleAgregar()}>
              Guardar alergia
            </Button>
            <Button variant="ghost" onClick={() => setMostrarForm(false)}>Cancelar</Button>
          </div>
        </Card>
      )}

      {loading && <div className="loading-box"><p className="muted-text">Cargando alergias...</p></div>}

      {!loading && alergias.length === 0 && (
        <EmptyState
          title="No tienes alergias registradas"
          description="Agrega tus alergias para que el médico las tenga en cuenta al emitir recetas."
        />
      )}

      {!loading && alergias.map((alergia) => (
        <Card key={alergia.pacienteAlergiaId} className="stack-md">
          <div className="section-heading-row">
            <div className="stack-sm">
              <h3>{alergia.nombreAlergia}</h3>
              <span className="muted-text">{alergia.tipoAlergia}</span>
            </div>
            <span className={`badge ${SEVERIDAD_COLOR[alergia.severidad] ?? 'badge-neutral'}`}>
              {alergia.severidad}
            </span>
          </div>
          {alergia.descripcion && (
            <div className="detail-item">
              <span>Descripción</span>
              <strong>{alergia.descripcion}</strong>
            </div>
          )}
          {alergia.fechaDeteccion && (
            <div className="detail-item">
              <span>Fecha de detección</span>
              <strong>{new Date(alergia.fechaDeteccion).toLocaleDateString('es-GT')}</strong>
            </div>
          )}
          <div className="button-row-wrap">
            <Button
              variant="danger"
              loading={quitando === alergia.alergiaId}
              onClick={() => void handleQuitar(alergia.alergiaId)}
            >
              Quitar alergia
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}