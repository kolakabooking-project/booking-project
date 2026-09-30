import { Shield } from 'lucide-react';
import { getInitials } from '../../utils/helpers';

export default function ProfileCard({ 
  user, 
  variant = 'default', // 'default' (blue), 'superadmin' (red), or 'teal'
  fallbackJabatan = 'Administrator Sistem',
  badgeText = 'Administrator'
}) {
  const isSuperadmin = variant === 'superadmin';
  const isTeal = variant === 'teal';

  let iconBg = 'bg-djp-blue/10';
  let iconText = 'text-djp-blue';
  let badgeClass = 'bg-djp-blue/10 text-djp-blue';

  if (isSuperadmin) {
    iconBg = 'bg-red-500/10';
    iconText = 'text-red-500';
    badgeClass = 'bg-red-500/10 text-red-500';
  } else if (isTeal) {
    iconBg = 'bg-teal-500/10';
    iconText = 'text-teal-600 dark:text-teal-400';
    badgeClass = 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20';
  }
  
  return (
    <div className="mt-4 rounded-[2rem] p-6 shadow-sm flex items-center gap-5 border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
      <div className={`w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        {isSuperadmin ? (
          <Shield size={32} strokeWidth={2} className="text-red-500" />
        ) : (
          <span className={`text-2xl font-heading font-bold ${iconText}`}>{getInitials(user?.name)}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-xl font-heading font-bold text-[color:var(--color-heading)] truncate">{user?.name}</h2>
        <p className="text-sm text-[color:var(--color-text-soft)] truncate">{user?.jabatan || fallbackJabatan}</p>
        <div className={`mt-2 inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${badgeClass}`}>
          {badgeText}
        </div>
      </div>
    </div>
  );
}
