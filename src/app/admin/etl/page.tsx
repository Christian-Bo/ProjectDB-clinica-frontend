'use client';

import { useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { useToast } from '@/shared/components/providers/ToastProvider';
import { patientsApi } from '@/lib/api/patients';

interface EtlResultado {
  httpStatus: number;
  codigo: string;
  registros: number;
  mensaje: string;
}

export default function EtlPage() {
  const toast = useToast();
  const [ejecutando, setEjecutando] = useState(false);
  const [resultado, setResultado] = useState<EtlResultado | null>(null);
  const [ultimaEjecucion, setUltimaEjecucion] = useState<string | null>(null);

  async function handleEjecutarEtl() {
    setEjecutando(true);
    setResultado(null);
    const inicio = new Date();

    const res = await patientsApi.post('/api/reportes/etl-ejecutar');

    if (res.success) {
      const data = res.data as EtlResultado;
      setResultado(data);
      setUltimaEjecucion(inicio.toLocaleString('es-GT'));
      toast.success('ETL completado', `${data?.registros ?? 0} registros procesados.`);
    } else {
      toast.error('Error ETL', res.message || 'No se pudo ejecutar el ETL.');
    }
    setEjecutando(false);
  }

  return (
    <div className="stack-lg">
      <section className="hero-banner">
        <div>
          <span className="eyebrow">Administración</span>
          <h1>ETL y Reportes</h1>
          <p>Sincroniza el Data Warehouse con los datos operativos más recientes.</p>
        </div>
        <div className="hero-card side-highlight">
          <span className="muted-text-light">Data Warehouse</span>
          <strong style={{ fontSize: '1.3rem' }}>DW Clínica</strong>
          <p>4 cubos OLAP activos</p>
        </div>
      </section>

      <Card className="stack-md">
        <span className="eyebrow">ETL Incremental</span>
        <h3>Cargar datos al Data Warehouse</h3>
        <p className="muted-text">
          El ETL procesa únicamente los registros nuevos desde la última ejecución.
          Citas, tickets, recetas y órdenes se sincronizan automáticamente a los cubos OLAP.
        </p>

        {ultimaEjecucion && (
          <div style={{
            background: '#F0FDF4', border: '1px solid #BBF7D0',
            borderRadius: '10px', padding: '12px 16px',
            fontSize: '0.9rem', color: '#166534'
          }}>
            ✅ Última ejecución: {ultimaEjecucion}
          </div>
        )}

        <Button
          loading={ejecutando}
          disabled={ejecutando}
          onClick={() => void handleEjecutarEtl()}
        >
          {ejecutando ? 'Ejecutando ETL...' : '⚡ Ejecutar ETL ahora'}
        </Button>
      </Card>

      {resultado && (
        <Card className="stack-md">
          <span className="eyebrow">Resultado</span>
          <h3>ETL ejecutado correctamente</h3>
          <div className="filters-grid">
            <div className="detail-item">
              <span>Registros procesados</span>
              <strong style={{ fontSize: '2rem', color: '#2EC4B6' }}>
                {resultado.registros}
              </strong>
            </div>
            <div className="detail-item">
              <span>Estado</span>
              <strong style={{ color: '#10B981' }}>{resultado.codigo}</strong>
            </div>
            <div className="detail-item">
              <span>Mensaje</span>
              <strong>{resultado.mensaje}</strong>
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <span className="eyebrow">Cubos actualizados</span>
            <div className="filters-grid" style={{ marginTop: '8px' }}>
              {[
                { nombre: 'Atenciones por Día/Sede', icono: '📊' },
                { nombre: 'Espera por Hora/Sede', icono: '⏱️' },
                { nombre: 'Prioridades por Semana', icono: '🎯' },
                { nombre: 'Recetas por Especialidad', icono: '💊' },
              ].map((cubo) => (
                <div key={cubo.nombre} style={{
                  background: '#F0FDF4', border: '1px solid #BBF7D0',
                  borderRadius: '10px', padding: '12px',
                  fontSize: '0.85rem', textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.5rem' }}>{cubo.icono}</div>
                  <div style={{ fontWeight: 600, color: '#166534' }}>{cubo.nombre}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      <Card className="stack-md">
        <span className="eyebrow">Información del DW</span>
        <h3>Estructura del Data Warehouse</h3>
        <div className="filters-grid">
          {[
            { tabla: 'FactCitas', desc: 'Historial de citas médicas', icono: '📅' },
            { tabla: 'FactAtenciones', desc: 'Atenciones y tiempos', icono: '🏥' },
            { tabla: 'FactRecetas', desc: 'Recetas emitidas', icono: '💊' },
            { tabla: 'FactOrdenes', desc: 'Órdenes de lab/imagen', icono: '🔬' },
          ].map((f) => (
            <div key={f.tabla} style={{
              background: '#F7FAFC', border: '1px solid #E5E7EB',
              borderRadius: '10px', padding: '14px'
            }}>
              <div style={{ fontSize: '1.3rem' }}>{f.icono}</div>
              <div style={{ fontWeight: 700, color: '#0F4C5C' }}>{f.tabla}</div>
              <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}