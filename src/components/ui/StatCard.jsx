export default function StatCard({ icon: Icon, label, value, color = 'djp-blue', subtext }) {
  const colorMap = {
    'djp-blue': { icon: 'bg-djp-blue text-white', border: 'border-djp-blue/10', accent: 'from-djp-blue/12 to-djp-blue/3' },
    'success': { icon: 'bg-success text-white', border: 'border-success/15', accent: 'from-success/14 to-success/5' },
    'danger': { icon: 'bg-danger text-white', border: 'border-danger/15', accent: 'from-danger/14 to-danger/5' },
    'warning': { icon: 'bg-warning text-white', border: 'border-warning/15', accent: 'from-warning/14 to-warning/5' },
    'info': { icon: 'bg-info text-white', border: 'border-info/15', accent: 'from-info/14 to-info/5' },
    'djp-yellow': { icon: 'bg-djp-yellow text-djp-blue-dark', border: 'border-djp-yellow/20', accent: 'from-djp-yellow/18 to-djp-yellow/8' },
  };

  const c = colorMap[color] || colorMap['djp-blue'];

  return (
    <div
      className={`relative overflow-hidden rounded-[var(--radius-card)] border ${c.border} bg-gradient-to-br ${c.accent} p-5 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]`}
      style={{ borderColor: 'color-mix(in srgb, currentColor 10%, var(--color-border))' }}
    >
      <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-white/25 blur-2xl dark:bg-white/10" />
      <div className="relative flex items-center gap-4">
        <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl ${c.icon}`}>
          <Icon size={24} />
        </div>
        <div>
          <p className="text-3xl font-heading font-extrabold tracking-tight text-[color:var(--color-heading)]">{value}</p>
          <p className="mt-1 text-sm font-semibold text-[color:var(--color-text-muted)]">{label}</p>
          {subtext && <p className="mt-1 text-xs text-[color:var(--color-text-soft)]">{subtext}</p>}
        </div>
      </div>
    </div>
  );
}
