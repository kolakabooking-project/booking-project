import Card from './Card';

export default function DataTable({
  title,
  subtitle,
  actions,
  columns,
  children,
  empty,
  footer,
  className = '',
}) {
  return (
    <Card className={`min-w-0 max-w-full overflow-hidden ${className}`}>
      {(title || subtitle || actions) && (
        <div className="data-table-toolbar">
          <div>
            {title && <h3 className="text-base font-heading font-bold text-[color:var(--color-heading)]">{title}</h3>}
            {subtitle && <p className="mt-1 text-sm text-[color:var(--color-text-soft)]">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={column.className}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>

      {empty}
      
      {footer && (
        <div className="border-t px-5 py-3" style={{ borderColor: 'var(--color-border)', background: 'color-mix(in srgb, var(--color-surface-muted) 65%, transparent)' }}>
          {footer}
        </div>
      )}
    </Card>
  );
}
