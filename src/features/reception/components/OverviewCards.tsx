import type { ReceptionOperationalSummary } from '@/lib/api/types';
import { Card } from '@/shared/components/ui/Card';

const STAT_ITEMS = [
  { key: 'ticketsEnEspera',      title: 'En espera',   tone: 'info',    icon: '⏳' },
  { key: 'ticketsLlamados',      title: 'Llamados',    tone: 'warning', icon: '📢' },
  { key: 'ticketsEnAtencion',    title: 'En atención', tone: 'teal',    icon: '🩺' },
  { key: 'ticketsFinalizados',   title: 'Finalizados', tone: 'success', icon: '✅' },
  { key: 'ticketsNoShow',        title: 'No-show',     tone: 'danger',  icon: '❌' },
  { key: 'ticketsEspecialesHoy', title: 'Especiales',  tone: 'neutral', icon: '⭐' },
] as const;

const TONE_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  info:    { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' },
  warning: { bg: '#fffbeb', color: '#78350f', border: '#fde68a' },
  teal:    { bg: '#f0fdfa', color: '#0f5460', border: '#99f6e4' },
  success: { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
  danger:  { bg: '#fff1f2', color: '#9f1239', border: '#fecdd3' },
  neutral: { bg: '#fafafa', color: '#374151', border: '#e5e7eb' },
};

export function OverviewCards({ summary }: { summary: ReceptionOperationalSummary }) {
  return (
    <div className="stats-grid" role="region" aria-label="Resumen operativo">
      {STAT_ITEMS.map(({ key, title, tone, icon }) => {
        const value  = summary[key] ?? 0;
        const styles = TONE_STYLES[tone];

        return (
          <Card
            key={key}
            className="stat-card"
            style={{
              background: styles.bg,
              borderColor: styles.border,
            }}
          >
            <div className="card-meta-row" style={{ alignItems: 'center' }}>
              <span style={{ fontSize: '1.4rem' }} aria-hidden="true">{icon}</span>
              <span
                style={{
                  fontSize: '0.73rem',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: styles.color,
                  background: 'rgba(255,255,255,0.6)',
                  padding: '2px 8px',
                  borderRadius: '999px',
                }}
              >
                {title}
              </span>
            </div>
            <strong
              className="stat-value"
              style={{ color: styles.color }}
              aria-label={`${title}: ${value}`}
            >
              {value}
            </strong>
          </Card>
        );
      })}
    </div>
  );
}
