import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from '@/shared/components/providers/AppProviders';
import { ClinicaTheme } from '@/theme/clinicaTheme';

export const metadata: Metadata = {
  title: 'Clínica Integral | Recepción y Tickets',
  description: 'Panel de recepción, gestión de tickets y pantalla pública de la cola de atención.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={ClinicaTheme.toCssVariables()}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
