'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { consultasApi } from '@/lib/api/consultas';

export default function AbrirConsultaPage() {
  const params = useParams();
  const router = useRouter();
  // En esta ruta el param se llama consultaId pero en realidad es el ticketId
  // porque Next.js requiere el mismo nombre de slug en toda la rama /consultas/[x]/...
  const ticketId = Number(params.consultaId);

  const [modalidad, setModalidad] = useState('PRESENCIAL');
  const [usuarioId, setUsuarioId] = useState('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAbrir = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await consultasApi.abrirDesdeTicket({
        ticketId,
        modalidad,
        usuarioId: Number(usuarioId),
      });
      router.push(`/medico/consultas/${res.data.consultaId}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al abrir consulta');
      setLoading(false);
    }
  };

  return (
    <>
      <div className="topbar">
        <div>
          <span className="eyebrow">Consulta médica</span>
          <h2>Abrir consulta</h2>
          <p className="muted-text">Ticket #{ticketId}</p>
        </div>
      </div>

      <div className="card stack-lg" style={{ maxWidth: 520 }}>
        <div>
          <h3 style={{ margin: '0 0 4px' }}>Confirmar apertura</h3>
          <p className="muted-text">
            Se abrirá una consulta desde el ticket #{ticketId}. El ticket debe estar
            en estado LLAMADO o EN_ATENCION.
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(220,38,38,0.08)',
            border: '1px solid var(--color-danger)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            color: 'var(--color-danger)',
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        <div style={{ display: 'grid', gap: 12 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Modalidad</span>
            <select
              className="input"
              value={modalidad}
              onChange={(e) => setModalidad(e.target.value)}
            >
              <option value="PRESENCIAL">Presencial</option>
              <option value="TELEMEDICINA">Telemedicina</option>
            </select>
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>ID de médico (temporal)</span>
            <input
              type="number"
              className="input"
              value={usuarioId}
              onChange={(e) => setUsuarioId(e.target.value)}
              placeholder="UsuarioId"
            />
            <span className="muted-text" style={{ fontSize: '0.8rem' }}>
              Esto vendrá del JWT cuando esté implementada la autenticación.
            </span>
          </label>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-primary"
            onClick={() => void handleAbrir()}
            disabled={loading}
          >
            {loading && <span className="btn-spinner" />}
            <span>{loading ? 'Abriendo...' : 'Abrir consulta'}</span>
          </button>
          <button className="btn btn-ghost" onClick={() => router.back()}>
            Cancelar
          </button>
        </div>
      </div>
    </>
  );
}
