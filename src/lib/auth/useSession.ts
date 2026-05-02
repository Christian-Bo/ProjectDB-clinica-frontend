'use client';

import { useEffect, useState } from 'react';
import { session } from './session';
import { patientsApi } from '@/lib/api/patients';

interface PacienteSession {
  usuarioId: number;
  pacienteId: number;
  nombreCompleto: string;
  numeroExpediente: string;
  cargando: boolean;
}

export function usePacienteSession(): PacienteSession {
  const [datos, setDatos] = useState<PacienteSession>({
    usuarioId: 0,
    pacienteId: 0,
    nombreCompleto: '',
    numeroExpediente: '',
    cargando: true,
  });

  useEffect(() => {
    const user = session.getUser();
    if (!user) {
      window.location.href = '/login';
      return;
    }

    patientsApi.get<{
      pacienteId: number;
      numeroExpediente: string;
    }>('/api/pacientes/yo').then((res) => {
      if (res.success && res.data) {
        setDatos({
          usuarioId: user.usuarioId,
          pacienteId: res.data.pacienteId,
          nombreCompleto: user.nombreCompleto,
          numeroExpediente: res.data.numeroExpediente,
          cargando: false,
        });
        // Guardar pacienteId en session
        session.setUser({ ...user, pacienteId: res.data.pacienteId });
      } else {
        window.location.href = '/login';
      }
    });
  }, []);

  return datos;
}