'use client';

import { useEffect, useMemo, useState } from 'react';
import type {
  AppointmentSelection,
  PatientSelection,
  SelectionOption,
} from '@/lib/api/types';
import type { DashboardFilters } from '@/features/reception/models/ui';
import { Button } from '@/shared/components/ui/Button';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Modal } from '@/shared/components/ui/Modal';

function toOptionLabel(option?: SelectionOption) {
  return option ? option.label || option.nombre : 'Selecciona...';
}

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
  sedes: SelectionOption[];
  servicios: SelectionOption[];
  priorityOptions: SelectionOption[];
  patientItems: PatientSelection[];
  appointmentItems: AppointmentSelection[];
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
  const [specialReason, setSpecialReason] = useState('');

  const usablePriorities = useMemo(
    () => priorityOptions.filter((option) => (option.label || option.nombre) !== 'ESPECIAL' && option.activo),
    [priorityOptions],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    void onLoadPatients();
    void onLoadAppointments();
  }, [open, onLoadAppointments, onLoadPatients]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Generar ticket"
      subtitle="Selecciona sede, servicio, paciente o una cita confirmada."
      size="xl"
    >
      <div className="modal-grid-2">
        <label className="field-group">
          <span>Sede</span>
          <select
            value={filters.sedeId ?? ''}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                sedeId: event.target.value ? Number(event.target.value) : undefined,
                servicioId: undefined,
                estacionId: undefined,
              }))
            }
          >
            <option value="">{toOptionLabel(undefined)}</option>
            {sedes.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label || option.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="field-group">
          <span>Servicio</span>
          <select
            value={filters.servicioId ?? ''}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                servicioId: event.target.value ? Number(event.target.value) : undefined,
              }))
            }
          >
            <option value="">{toOptionLabel(undefined)}</option>
            {servicios.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label || option.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="field-group">
          <span>Paciente</span>
          <select
            value={selectedPatient?.pacienteId ?? ''}
            onChange={(event) => {
              const patient = patientItems.find(
                (item) => item.pacienteId === Number(event.target.value),
              ) ?? null;
              onSelectPatient(patient);
              if (patient) {
                onSelectAppointment(null);
              }
            }}
          >
            <option value="">Selecciona...</option>
            {patientItems.map((patient) => (
              <option key={patient.pacienteId} value={patient.pacienteId}>
                {patient.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field-group">
          <span>Cita confirmada</span>
          <select
            value={selectedAppointment?.citaId ?? ''}
            onChange={(event) => {
              const appointment = appointmentItems.find(
                (item) => item.citaId === Number(event.target.value),
              ) ?? null;
              onSelectAppointment(appointment);
              if (appointment) {
                onSelectPatient(null);
              }
            }}
          >
            <option value="">Selecciona...</option>
            {appointmentItems.map((appointment) => (
              <option key={appointment.citaId} value={appointment.citaId}>
                {appointment.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!patientItems.length && !appointmentItems.length ? (
        <EmptyState
          title="Sin opciones disponibles"
          description="Cuando existan pacientes o citas confirmadas, aparecerán aquí."
        />
      ) : null}

      <div className="ticket-config-box">
        <div className="field-group">
          <span>Prioridad</span>
          <select
            value={selectedPriority}
            onChange={(event) => setSelectedPriority(event.target.value)}
          >
            {usablePriorities.map((option) => (
              <option key={option.id} value={option.label || option.nombre}>
                {option.label || option.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="field-group">
          <span>Motivo especial</span>
          <textarea
            rows={3}
            value={specialReason}
            placeholder="Describe el motivo especial"
            onChange={(event) => setSpecialReason(event.target.value)}
          />
        </div>
      </div>

      <div className="modal-actions">
        <Button variant="ghost" onClick={onClose}>
          Cerrar
        </Button>
        <Button
          variant="secondary"
          loading={isLoading}
          onClick={async () => {
            const created = await onGenerate(selectedPriority);
            if (created) {
              onClose();
            }
          }}
        >
          Generar ticket normal
        </Button>
        <Button
          loading={isLoading}
          onClick={async () => {
            const created = await onGenerateSpecial(specialReason);
            if (created) {
              onClose();
            }
          }}
        >
          Generar ticket especial
        </Button>
      </div>
    </Modal>
  );
}
