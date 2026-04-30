'use client';

import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';

export default function PacienteDashboard() {
  return (
    <div className="stack-lg">
      <section className="hero-banner">
        <div>
          <span className="eyebrow">Portal Paciente</span>
          <h1>Bienvenido</h1>
          <p>Gestiona tus citas médicas de forma fácil y rápida.</p>
          <div className="button-row-wrap">
            <Button onClick={() => window.location.href = '/paciente/citas/nueva'}>
              Reservar cita
            </Button>
            <Button variant="secondary" onClick={() => window.location.href = '/paciente/citas'}>
              Mis citas
            </Button>
          </div>
        </div>

        <div className="hero-card side-highlight">
          <span className="muted-text-light">Estado</span>
          <strong>Portal activo</strong>
          <p>Puedes reservar, confirmar, cancelar o reprogramar tus citas.</p>
        </div>
      </section>

      <div className="content-grid-2 align-start">
        <Card className="stack-md">
          <span className="eyebrow">Acciones rápidas</span>
          <h3>¿Qué deseas hacer?</h3>
          <div className="stack-sm">
            <Button
              fullWidth
              onClick={() => window.location.href = '/paciente/citas/nueva'}
            >
              Nueva cita
            </Button>
            <Button
              fullWidth
              variant="secondary"
              onClick={() => window.location.href = '/paciente/citas'}
            >
              Ver mis citas
            </Button>
          </div>
        </Card>

        <Card className="stack-md">
          <span className="eyebrow">Información</span>
          <h3>Tu perfil</h3>
          <p className="muted-text">
            Completa tu perfil para facilitar el proceso de agendamiento.
          </p>
          <Button variant="ghost" fullWidth>
            Ver perfil
          </Button>
        </Card>
      </div>
    </div>
  );
}