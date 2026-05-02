'use client';

import { useEffect, useMemo, useState } from 'react';
import type { AppointmentSelection, PatientSelection, SelectionOption } from '@/lib/api/types';
import type { DashboardFilters } from '@/features/reception/models/ui';
import { Button } from '@/shared/components/ui/Button';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Modal } from '@/shared/components/ui/Modal';

export function GenerateTicketModal({
  open,
  onClose,
  isLoading,
  filters,
  setFilters,
  sedes,
  servicios,
  priorityOptions,
  patientItems,
  appointmentItems,
  selectedPatient,
  selectedAppointment,
  onSelectPatient,
  onSelectAppointment,
  onLoadPatients,
  onLoadAppointments,
  onGenerate,
  onGenerateSpecial,
}: {
  open: boolean;
  onClose: () => void;
  isLoading?: boolean;
  filters: DashboardFilters;
  setFilters: React.Dispatch<React.SetStateAction<DashboardFilters>>;
  sedes?: SelectionOption[];
  servicios?: SelectionOption[];
  priorityOptions?: SelectionOption[];
  patientItems?: PatientSelection[];
  appointmentItems?: AppointmentSelection[];
  selectedPatient: PatientSelection | null;
  selectedAppointment: AppointmentSelection | null;
  onSelectPatient: (patient: PatientSelection | null) => void;
  onSelectAppointment: (appointment: AppointmentSelection | null) => void;
  onLoadPatients: () => Promise<unknown>;
  onLoadAppointments: () => Promise<unknown>;
  onGenerate: (priority?: string) => Promise<unknown>;
  onGenerateSpecial: (reason: string) => Promise<unknown>;
}) {
  const [selectedPriority, setSelectedPriority] = useState('NORMAL');
  const [specialReason,    setSpecialReason]    = useState('');

  const safeSedes         = sedes            ?? [];
  const safeServicios     = servicios        ?? [];
  const safePriorities    = priorityOptions  ?? [];
  const safePatients      = patientItems     ?? [];
  const safeAppointments  = appointmentItems ?? [];

  const normalPriorities = useMemo(
    () => safePriorities.filter((p) => p.nombre !== 'ESPECIAL' && p.activo),
    [safePriorities],
  );

  useEffect(() => {
    if (!open) return;
    void onLoadPatients();
    void onLoadAppointments();
  }, [open, onLoadPatients, onLoadAppointments]);

  const canGenerateNormal = Boolean(
    filters.sedeId &&
    filters.servicioId &&
    (selectedPatient?.pacienteId || selectedAppointment?.citaId),
  );

  const canGenerateSpecial = canGenerateNormal && specialReason.trim().length >= 5;

  const hasData = safePatients.length > 0 || safeAppointments.length > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Generar ticket de atención"
      subtitle="Selecciona sede, servicio y paciente o cita confirmada para emitir el ticket."
      size="xl"
    >
      {/* Sede y servicio */}
      <div>
        <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: '0.88rem', color: '#374151' }}>
          1. Contexto de atención
        </p>
        <div className="modal-grid-2">
          <label className="field-group">
            <span>Sede *</span>
            <select
              value={filters.sedeId ?? ''}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  sedeId:     e.target.value ? Number(e.target.value) : undefined,
                  servicioId: undefined,
                }))
              }
            >
              <option value="">— Selecciona sede —</option>
              {safeSedes.map((s) => (
                <option key={s.id} value={s.id}>{s.label || s.nombre}</option>
              ))}
            </select>
          </label>

          <label className="field-group">
            <span>Servicio *</span>
            <select
              value={filters.servicioId ?? ''}
              disabled={!filters.sedeId}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  servicioId: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
            >
              <option value="">— Selecciona servicio —</option>
              {safeServicios.map((s) => (
                <option key={s.id} value={s.id}>{s.label || s.nombre}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Paciente y cita */}
      <div>
        <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: '0.88rem', color: '#374151' }}>
          2. Paciente o cita confirmada
        </p>
        {isLoading && !hasData ? (
          <div className="loading-box">Cargando pacientes y citas…</div>
        ) : !hasData ? (
          <EmptyState
            title="Sin pacientes ni citas disponibles"
            description="No hay pacientes o citas confirmadas para los filtros seleccionados."
          />
        ) : (
          <div className="modal-grid-2">
            <label className="field-group">
              <span>Paciente</span>
              <select
                value={selectedPatient?.pacienteId ?? ''}
                onChange={(e) => {
                  const patient = safePatients.find((p) => p.pacienteId === Number(e.target.value)) ?? null;
                  onSelectPatient(patient);
                  if (patient) onSelectAppointment(null);
                }}
              >
                <option value="">— Sin paciente directo —</option>
                {safePatients.map((p) => (
                  <option key={p.pacienteId} value={p.pacienteId}>{p.label}</option>
                ))}
              </select>
            </label>

            <label className="field-group">
              <span>Cita confirmada (opcional)</span>
              <select
                value={selectedAppointment?.citaId ?? ''}
                onChange={(e) => {
                  const cita = safeAppointments.find((c) => c.citaId === Number(e.target.value)) ?? null;
                  onSelectAppointment(cita);
                  if (cita) onSelectPatient(null);
                }}
              >
                <option value="">— Sin cita vinculada —</option>
                {safeAppointments.map((c) => (
                  <option key={c.citaId} value={c.citaId}>{c.label}</option>
                ))}
              </select>
            </label>
          </div>
        )}
      </div>

      {/* Configuración del ticket */}
      <div className="ticket-config-box">
        <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: '0.88rem', color: '#374151' }}>
          3. Tipo de ticket
        </p>

        <label className="field-group">
          <span>Prioridad</span>
          <select value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value)}>
            {normalPriorities.length > 0 ? (
              normalPriorities.map((p) => (
                <option key={p.id} value={p.label || p.nombre}>{p.label || p.nombre}</option>
              ))
            ) : (
              <>
                <option value="NORMAL">Normal</option>
                <option value="EMBARAZO">Embarazo</option>
                <option value="DISCAPACIDAD">Discapacidad</option>
                <option value="ANCIANO">Adulto mayor</option>
              </>
            )}
          </select>
        </label>

        <label className="field-group">
          <span>Motivo especial (solo para ticket especial)</span>
          <textarea
            rows={3}
            value={specialReason}
            placeholder="Describe el motivo que justifica la atención especial (mínimo 5 caracteres)…"
            onChange={(e) => setSpecialReason(e.target.value)}
            style={{ resize: 'vertical' }}
          />
          {specialReason.length > 0 && specialReason.length < 5 && (
            <small style={{ color: '#dc2626', fontSize: '0.8rem' }}>
              El motivo debe tener al menos 5 caracteres.
            </small>
          )}
        </label>
      </div>

      {/* Advertencia si faltan datos */}
      {!canGenerateNormal && (
        <div className="inline-alert inline-alert-warning">
          ⚠️ Selecciona sede, servicio y al menos un paciente o cita para generar el ticket.
        </div>
      )}

      {/* Acciones */}
      <div className="modal-actions">
        <Button variant="ghost" onClick={onClose} disabled={isLoading}>
          Cancelar
        </Button>

        <Button
          variant="secondary"
          loading={isLoading}
          disabled={!canGenerateNormal}
          onClick={async () => {
            const created = await onGenerate(selectedPriority);
            if (created) { setSpecialReason(''); onClose(); }
          }}
        >
          Generar ticket normal
        </Button>

        <Button
          loading={isLoading}
          disabled={!canGenerateSpecial}
          onClick={async () => {
            const created = await onGenerateSpecial(specialReason);
            if (created) { setSpecialReason(''); onClose(); }
          }}
        >
          ⭐ Generar ticket especial
        </Button>
      </div>
    </Modal>
  );
}
