'use client';

import { useState, useEffect } from 'react';
import { session } from '@/lib/auth/session';
import { useParams, useRouter } from 'next/navigation';
import { consultasApi } from '@/lib/api/consultas';
import type { DiagnosticoRequest } from '@/lib/api/consultas.types';

function DiagnosticosEditor({
  diagnosticos,
  onChange,
}: {
  diagnosticos: DiagnosticoRequest[];
  onChange: (d: DiagnosticoRequest[]) => void;
}) {
  const agregar = () => {
    onChange([...diagnosticos, { codigoCIE10: '', descripcionCIE10: '', tipoDiagnostico: 'PRINCIPAL' }]);
  };
  const quitar = (i: number) => onChange(diagnosticos.filter((_, idx) => idx !== i));
  const actualizar = (i: number, field: keyof DiagnosticoRequest, value: string) => {
    const updated = [...diagnosticos];
    updated[i] = { ...updated[i], [field]: value };
    onChange(updated);
  };

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {diagnosticos.map((d, i) => (
        <div key={i} style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr 1fr auto',
          gap: 8,
          alignItems: 'end',
          padding: '12px',
          background: 'var(--color-background)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)',
        }}>
          <label style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>Código CIE-10</span>
            <input
              className="input"
              value={d.codigoCIE10}
              onChange={(e) => actualizar(i, 'codigoCIE10', e.target.value)}
              placeholder="Ej: J06.9"
            />
          </label>
          <label style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>Descripción</span>
            <input
              className="input"
              value={d.descripcionCIE10}
              onChange={(e) => actualizar(i, 'descripcionCIE10', e.target.value)}
              placeholder="Descripción del diagnóstico"
            />
          </label>
          <label style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>Tipo</span>
            <select className="input" value={d.tipoDiagnostico} onChange={(e) => actualizar(i, 'tipoDiagnostico', e.target.value)}>
              <option value="PRINCIPAL">Principal</option>
              <option value="SECUNDARIO">Secundario</option>
              <option value="PRESUNTIVO">Presuntivo</option>
              <option value="DEFINITIVO">Definitivo</option>
              <option value="DIFERENCIAL">Diferencial</option>
            </select>
          </label>
          <button className="btn btn-ghost" onClick={() => quitar(i)} style={{ color: 'var(--color-danger)' }}>✕</button>
        </div>
      ))}
      <button className="btn btn-secondary" onClick={agregar} style={{ justifySelf: 'start' }}>
        + Agregar diagnóstico
      </button>
    </div>
  );
}

export default function CerrarConsultaPage() {
  const params = useParams();
  const router = useRouter();
  const consultaId = Number(params.consultaId);

  const [hallazgos, setHallazgos] = useState('');
  const [plan, setPlan] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [usuarioId, setUsuarioId] = useState<number>(1);

  useEffect(() => {
    const user = session.getUser();
    if (user) setUsuarioId(user.usuarioId);
  }, []);
  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoRequest[]>([
    { codigoCIE10: '', descripcionCIE10: '', tipoDiagnostico: 'PRINCIPAL' }
  ]);

  // Signos vitales
  const [sv, setSv] = useState({
    presionSistolica: '', presionDiastolica: '',
    frecuenciaCardiaca: '', frecuenciaRespiratoria: '',
    temperatura: '', saturacionOxigeno: '',
    pesoKg: '', tallaCm: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCerrar = async () => {
    if (diagnosticos.some(d => !d.codigoCIE10 || !d.descripcionCIE10)) {
      setError('Completa el código CIE-10 y la descripción de todos los diagnósticos.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await consultasApi.cerrar(consultaId, {
        hallazgos: hallazgos || undefined,
        plan: plan || undefined,
        observaciones: observaciones || undefined,
        usuarioId,
        diagnosticos,
        presionSistolica: sv.presionSistolica ? Number(sv.presionSistolica) : undefined,
        presionDiastolica: sv.presionDiastolica ? Number(sv.presionDiastolica) : undefined,
        frecuenciaCardiaca: sv.frecuenciaCardiaca ? Number(sv.frecuenciaCardiaca) : undefined,
        frecuenciaRespiratoria: sv.frecuenciaRespiratoria ? Number(sv.frecuenciaRespiratoria) : undefined,
        temperatura: sv.temperatura ? Number(sv.temperatura) : undefined,
        saturacionOxigeno: sv.saturacionOxigeno ? Number(sv.saturacionOxigeno) : undefined,
        pesoKg: sv.pesoKg ? Number(sv.pesoKg) : undefined,
        tallaCm: sv.tallaCm ? Number(sv.tallaCm) : undefined,
      });
      router.push(`/medico/consultas/${consultaId}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cerrar consulta');
      setLoading(false);
    }
  };

  const updateSv = (field: string, value: string) => setSv(prev => ({ ...prev, [field]: value }));

  return (
    <>
      <div className="topbar">
        <div>
          <span className="eyebrow">Consulta #{consultaId}</span>
          <h2>Cerrar consulta</h2>
          <p className="muted-text" style={{ color: 'var(--color-danger)' }}>
            ⚠ Esta acción es irreversible. La consulta quedará inmutable.
          </p>
        </div>
        <button className="btn btn-ghost" onClick={() => router.back()}>← Volver</button>
      </div>

      {error && (
        <div style={{
          background: 'rgba(220,38,38,0.08)',
          border: '1px solid var(--color-danger)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 16px',
          color: 'var(--color-danger)',
          marginBottom: 16,
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div style={{ display: 'grid', gap: 20 }}>

        {/* Hallazgos y plan */}
        <div className="card stack-lg">
          <h4 style={{ margin: 0, color: 'var(--color-primary)' }}>Datos clínicos</h4>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Hallazgos clínicos</span>
            <textarea
              className="input"
              rows={4}
              value={hallazgos}
              onChange={(e) => setHallazgos(e.target.value)}
              placeholder="Describe los hallazgos de la consulta..."
            />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Plan de tratamiento</span>
            <textarea
              className="input"
              rows={3}
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              placeholder="Plan terapéutico..."
            />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Observaciones adicionales</span>
            <textarea
              className="input"
              rows={2}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Observaciones..."
            />
          </label>
        </div>

        {/* Signos vitales */}
        <div className="card stack-lg">
          <h4 style={{ margin: 0, color: 'var(--color-primary)' }}>Signos vitales (opcionales)</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
            {[
              { label: 'Presión sistólica', field: 'presionSistolica', placeholder: 'mmHg' },
              { label: 'Presión diastólica', field: 'presionDiastolica', placeholder: 'mmHg' },
              { label: 'Freq. cardíaca', field: 'frecuenciaCardiaca', placeholder: 'bpm' },
              { label: 'Freq. respiratoria', field: 'frecuenciaRespiratoria', placeholder: '/min' },
              { label: 'Temperatura', field: 'temperatura', placeholder: '°C' },
              { label: 'Saturación O₂', field: 'saturacionOxigeno', placeholder: '%' },
              { label: 'Peso', field: 'pesoKg', placeholder: 'kg' },
              { label: 'Talla', field: 'tallaCm', placeholder: 'cm' },
            ].map(({ label, field, placeholder }) => (
              <label key={field} style={{ display: 'grid', gap: 4 }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{label}</span>
                <input
                  type="number"
                  className="input"
                  placeholder={placeholder}
                  value={sv[field as keyof typeof sv]}
                  onChange={(e) => updateSv(field, e.target.value)}
                />
              </label>
            ))}
          </div>
        </div>

        {/* Diagnósticos */}
        <div className="card stack-lg">
          <div>
            <h4 style={{ margin: '0 0 4px', color: 'var(--color-primary)' }}>
              Diagnósticos <span style={{ color: 'var(--color-danger)' }}>*</span>
            </h4>
            <p className="muted-text" style={{ margin: 0, fontSize: '0.85rem' }}>
              Se requiere al menos un diagnóstico para cerrar la consulta.
            </p>
          </div>
          <DiagnosticosEditor diagnosticos={diagnosticos} onChange={setDiagnosticos} />
        </div>

        {/* Botones */}
        <div className="card" style={{ display: 'flex', gap: 12 }}>
          <button
            className="btn btn-primary"
            onClick={() => void handleCerrar()}
            disabled={loading}
          >
            {loading && <span className="btn-spinner" />}
            <span>{loading ? 'Cerrando...' : 'Cerrar consulta definitivamente'}</span>
          </button>
          <button className="btn btn-ghost" onClick={() => router.back()}>
            Cancelar
          </button>
        </div>
      </div>
    </>
  );
}
