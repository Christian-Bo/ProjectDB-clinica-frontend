'use client';

import { useMemo, useState } from 'react';
import type { AppointmentSelection, PatientSelection, SelectionOption } from '@/lib/api/types';
import { Button } from '@/shared/components/ui/Button';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Modal } from '@/shared/components/ui/Modal';

function SearchList<T>({
  title,
  subtitle,
  items,
  emptyTitle,
  emptyDescription,
  isLoading,
  selectedKey,
  getKey,
  render,
  onSearch,
  onSelect,
}: {
  title: string;
  subtitle: string;
  items: T[];
  emptyTitle: string;
  emptyDescription: string;
  isLoading?: boolean;
  selectedKey?: string | number | null;
  getKey: (item: T) => string | number;
  render: (item: T) => React.ReactNode;
  onSearch: (value: string) => void;
  onSelect: (item: T) => void;
}) {
  return (
    <div className="stack-md">
      <div>
        <h4>{title}</h4>
        <p className="muted-text">{subtitle}</p>
      </div>
      <input className="search-input" placeholder="Escribe para buscar..." onChange={(event) => onSearch(event.target.value)} />
      <div className="selection-list">
        {isLoading ? <div className="loading-box">Buscando...</div> : null}
        {!isLoading && items.length === 0 ? <EmptyState title={emptyTitle} description={emptyDescription} /> : null}
        {items.map((item) => {
          const key = getKey(item);
          return (
            <button
              key={key}
              type="button"
              className={`selection-item ${selectedKey === key ? 'selection-item-active' : ''}`}
              onClick={() => onSelect(item)}
            >
              {render(item)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function GenerateTicketModal({
  open,
  onClose,
  isLoading,
  priorityOptions,
  patientItems,
  appointmentItems,
  selectedPatient,
  selectedAppointment,
  onSelectPatient,
  onSelectAppointment,
  onSearchPatients,
  onSearchAppointments,
  onGenerate,
  onGenerateSpecial,
}: {
  open: boolean;
  onClose: () => void;
  isLoading?: boolean;
  priorityOptions: SelectionOption[];
  patientItems: PatientSelection[];
  appointmentItems: AppointmentSelection[];
  selectedPatient: PatientSelection | null;
  selectedAppointment: AppointmentSelection | null;
  onSelectPatient: (patient: PatientSelection | null) => void;
  onSelectAppointment: (appointment: AppointmentSelection | null) => void;
  onSearchPatients: (text: string) => void;
  onSearchAppointments: (text: string) => void;
  onGenerate: (priority?: string) => Promise<unknown>;
  onGenerateSpecial: (reason: string) => Promise<unknown>;
}) {
  const [selectedPriority, setSelectedPriority] = useState('NORMAL');
  const [specialReason, setSpecialReason] = useState('');

  const usablePriorities = useMemo(
    () => priorityOptions.filter((option) => option.label !== 'ESPECIAL' && option.activo),
    [priorityOptions],
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Generacion de tickets con UX guiada"
      subtitle="Selecciona un paciente y una cita confirmada si aplica. La interfaz prioriza nombres, contexto y listas claras."
      size="xl"
    >
      <div className="modal-grid-2">
        <SearchList
          title="Pacientes"
          subtitle="Busca por nombre, expediente o documento."
          items={patientItems}
          emptyTitle="Sin pacientes cargados"
          emptyDescription="Empieza a escribir para encontrar pacientes y seleccionarlos sin usar ids visibles."
          isLoading={isLoading}
          selectedKey={selectedPatient?.pacienteId}
          getKey={(item) => item.pacienteId}
          onSearch={onSearchPatients}
          onSelect={(patient) => {
            onSelectPatient(patient);
            onSelectAppointment(null);
          }}
          render={(patient) => (
            <div className="selection-content">
              <strong>{patient.label}</strong>
              <span>{patient.documento || patient.numeroExpediente || 'Sin identificador visible'}</span>
              <small>{patient.telefono || 'Sin telefono registrado'}</small>
            </div>
          )}
        />

        <SearchList
          title="Citas confirmadas"
          subtitle="Si el paciente ya tenia una cita, puedes seleccionarla para generar el ticket directamente."
          items={appointmentItems}
          emptyTitle="No hay citas confirmadas"
          emptyDescription="Busca por nombre o espera a que existan citas confirmadas para la sede y servicio elegidos."
          isLoading={isLoading}
          selectedKey={selectedAppointment?.citaId}
          getKey={(item) => item.citaId}
          onSearch={onSearchAppointments}
          onSelect={(appointment) => {
            onSelectAppointment(appointment);
            onSelectPatient(null);
          }}
          render={(appointment) => (
            <div className="selection-content">
              <strong>{appointment.label}</strong>
              <span>{appointment.servicioNombre} · {appointment.sedeNombre}</span>
              <small>{new Date(appointment.fechaInicio).toLocaleString()}</small>
            </div>
          )}
        />
      </div>

      <div className="ticket-config-box">
        <div className="field-group">
          <span>Prioridad para ticket normal</span>
          <select value={selectedPriority} onChange={(event) => setSelectedPriority(event.target.value)}>
            {usablePriorities.map((option) => (
              <option key={option.id} value={option.label || option.nombre}>
                {option.label || option.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="field-group">
          <span>Motivo para ticket especial</span>
          <textarea
            rows={3}
            value={specialReason}
            placeholder="Explica por que el paciente requiere prioridad especial..."
            onChange={(event) => setSpecialReason(event.target.value)}
          />
        </div>
      </div>

      <div className="modal-actions">
        <Button variant="ghost" onClick={onClose}>Cerrar</Button>
        <Button loading={isLoading} variant="secondary" onClick={async () => {
          const created = await onGenerate(selectedPriority);
          if (created) onClose();
        }}>
          Generar ticket normal
        </Button>
        <Button loading={isLoading} onClick={async () => {
          const created = await onGenerateSpecial(specialReason);
          if (created) onClose();
        }}>
          Generar ticket especial
        </Button>
      </div>
    </Modal>
  );
}
