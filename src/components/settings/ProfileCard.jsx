import { Shield } from 'lucide-react';
import { getInitials } from '../../utils/helpers';

export default function ProfileCard({ 
  user, 
  variant = 'default', // 'default' (blue) or 'superadmin' (red)
  fallbackJabatan = 'Administrator Sistem',
  badgeText = 'Administrator'
}) {
  const isSuperadmin = variant === 'superadmin';
  const colorPrefix = isSuperadmin ? 'red-500' : 'djp-blue';
  
  return (
    <div className="mt-4 rounded-[2rem] p-6 shadow-sm flex items-center gap-5 border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
      <div className={`w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 ${isSuperadmin ? 'bg-red-500/10' : 'bg-djp-blue/10'}`}>
        {isSuperadmin ? (
          <Shield size={32} strokeWidth={2} className="text-red-500" />
        ) : (
          <span className="text-2xl font-heading font-bold text-djp-blue">{getInitials(user?.name)}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-xl font-heading font-bold text-[color:var(--color-heading)] truncate">{user?.name}</h2>
        <p className="text-sm text-[color:var(--color-text-soft)] truncate">{user?.jabatan || fallbackJabatan}</p>
        <div className={`mt-2 inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${isSuperadmin ? 'bg-red-500/10 text-red-500' : 'bg-djp-blue/10 text-djp-blue'}`}>
          {badgeText}
        </div>
      </div>
    </div>
  );
}
