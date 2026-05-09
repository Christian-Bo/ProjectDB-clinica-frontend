import { EmptyState } from '@/shared/components/ui/EmptyState';

type Column<T> = {
  header: string;
  render: (item: T) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
};

export function DataTable<T>({
  items,
  columns,
  keyExtractor,
  loading,
  emptyTitle,
  emptyDescription,
}: {
  items: T[];
  columns: Column<T>[];
  keyExtractor: (item: T, index: number) => string | number;
  loading?: boolean;
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (loading) {
    return <div className="loading-box">Cargando información...</div>;
  }

  if (items.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            {columns.map((column) => (
              <th
                key={column.header}
                style={{
                  padding: '12px 10px',
                  textAlign: column.align ?? 'left',
                  color: 'var(--color-text-muted)',
                  fontSize: '0.78rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={keyExtractor(item, index)} style={{ borderBottom: '1px solid var(--color-border)' }}>
              {columns.map((column) => (
                <td
                  key={column.header}
                  style={{
                    padding: '12px 10px',
                    textAlign: column.align ?? 'left',
                    verticalAlign: 'top',
                    color: 'var(--color-text)',
                  }}
                >
                  {column.render(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
