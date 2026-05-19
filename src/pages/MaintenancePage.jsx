import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, WrenchIcon, RefreshCw } from 'lucide-react';
import { useState } from 'react';

export default function MaintenancePage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleRefresh = () => {
    setChecking(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--color-surface)' }}>
      <div className="max-w-md w-full text-center space-y-8">
        {/* Animated Icon */}
        <div className="relative mx-auto w-28 h-28">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-500/20 animate-pulse" />
          <div className="absolute inset-3 rounded-full bg-gradient-to-br from-amber-400/30 to-orange-500/30 flex items-center justify-center">
            <WrenchIcon size={40} className="text-amber-500 animate-bounce" style={{ animationDuration: '2s' }} />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-3xl font-heading font-extrabold text-[color:var(--color-heading)]">
            Sistem Dalam Perbaikan
          </h1>
          <p className="text-[color:var(--color-text-soft)] leading-relaxed">
            Mohon maaf atas ketidaknyamanan yang terjadi. Sistem Bookolaka sedang dalam proses pemeliharaan dan perbaikan untuk memberikan layanan yang lebih baik.
          </p>
        </div>

        {/* Info Card */}
        <div className="rounded-2xl border p-5 text-left" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-amber-500 text-sm">⏳</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-[color:var(--color-heading)]">
                Estimasi Downtime
              </p>
              <p className="text-xs text-[color:var(--color-text-soft)] mt-1">
                Sistem akan segera aktif kembali. Halaman ini akan otomatis memeriksa status setiap 30 detik.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleRefresh}
            disabled={checking}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl font-semibold text-sm transition-all bg-djp-blue text-white hover:bg-djp-blue-dark disabled:opacity-50"
          >
            <RefreshCw size={16} className={checking ? 'animate-spin' : ''} />
            {checking ? 'Memeriksa...' : 'Periksa Ulang Status'}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border border-danger/30 text-danger bg-danger/5 font-semibold text-sm transition-all hover:bg-danger hover:text-white"
          >
            <LogOut size={16} />
            Keluar dari Akun
          </button>
        </div>

        {/* Footer */}
        <p className="text-[10px] font-heading font-bold uppercase tracking-[0.32em] text-[color:var(--color-text-soft)]">
          © 2026 KPP PRATAMA KOLAKA
        </p>
      </div>
    </div>
  );
}
