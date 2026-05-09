import { Card } from '@/shared/components/ui/Card';

export function OperationCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="stack-md">
      <div className="section-heading-row">
        <div>
          <span className="eyebrow">Gestión</span>
          <h3>{title}</h3>
          <p className="muted-text" style={{ margin: '4px 0 0' }}>{description}</p>
        </div>
      </div>
      {children}
    </Card>
  );
}

export function ResultBox({ result }: { result: unknown }) {
  if (!result) return null;

  return (
    <div className="detail-item" aria-live="polite">
      <span>Respuesta del backend</span>
      <pre
        style={{
          margin: 0,
          whiteSpace: 'pre-wrap',
          overflowX: 'auto',
          color: 'var(--color-text)',
          fontSize: '0.82rem',
        }}
      >
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
}
