export default function PageHeader({ eyebrow, title, subtitle, actions, className = '' }) {
  return (
    <section className={`page-header ${className}`}>
      <div className="min-w-0">
        {eyebrow && <span className="page-kicker">{eyebrow}</span>}
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </section>
  );
}
