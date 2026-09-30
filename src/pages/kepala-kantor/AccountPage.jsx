import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLoading } from '../../contexts/LoadingContext';
import { useNavigate, Link } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import { 
  LogOut, 
  ChevronRight, 
  Moon, 
  Sun, 
  Settings, 
  Info, 
  CalendarDays, 
  Car, 
  Building2, 
  FileText, 
  Shield, 
  Bell, 
  ArrowLeft, 
  Loader2 
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import usePasswordChange from '../../hooks/usePasswordChange';
import usePushNotification from '../../hooks/usePushNotification';
import ProfileCard from '../../components/settings/ProfileCard';
import PasswordChangeModal from '../../components/settings/PasswordChangeModal';
import AboutAppModal from '../../components/settings/AboutAppModal';
import { formatRole } from '../../utils/constants';

export default function KepalaKantorAccountPage() {
  const { user, logout, switchRole } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Shared hooks
  const passwordProps = usePasswordChange({
    showLoading,
    hideLoading,
    onSuccess: () => setPasswordOpen(false),
  });

  const {
    isSupported: pushSupported,
    isSubscribed: pushEnabled,
    isLoading: pushLoading,
    toggleSubscription: handlePushToggle,
  } = usePushNotification();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    showLoading('Melakukan logout...');
    try {
      await logout();
    } finally {
      hideLoading();
      setIsLoggingOut(false);
      navigate('/login');
    }
  };

  const handleSwitchToSuperadmin = () => {
    switchRole('superadmin');
    navigate('/superadmin/dashboard');
  };

  return (
    <div className="pb-10 max-w-4xl mx-auto">
      <PageHeader 
        title="Akun Kepala Kantor" 
        subtitle="Informasi profil dan preferensi pimpinan." 
      />

      <ProfileCard 
        user={user} 
        variant="teal" 
        fallbackJabatan="Kepala Kantor KPP Pratama Kolaka" 
        badgeText={formatRole(user?.role)} 
      />

      {/* Settings List */}
      <div className="mt-8 space-y-6">
        {/* Mobile Navigation to Other 4 Services */}
        <div className="md:hidden">
          <h3 className="px-2 text-xs font-bold uppercase tracking-widest text-[color:var(--color-text-soft)] mb-3">
            Layanan Kantor (Mobile)
          </h3>
          <div className="rounded-3xl border overflow-hidden" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
            <Link 
              to="/kepala-kantor/jadwal"
              className="w-full flex items-center justify-between p-4 border-b transition-colors hover:bg-[color:var(--color-surface-muted)]"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <CalendarDays size={18} />
                </div>
                <div>
                  <span className="font-semibold text-[color:var(--color-heading)] text-sm block">Kalender Jadwal Pimpinan</span>
                  <span className="text-[11px] text-[color:var(--color-text-soft)]">Agenda dinas & surat tugas (ST)</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-[color:var(--color-text-muted)]" />
            </Link>

            <Link 
              to="/user/dashboard"
              className="w-full flex items-center justify-between p-4 border-b transition-colors hover:bg-[color:var(--color-surface-muted)]"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-djp-blue/10 text-djp-blue">
                  <Car size={18} />
                </div>
                <div>
                  <span className="font-semibold text-[color:var(--color-heading)] text-sm block">Peminjaman Kendaraan (KDO)</span>
                  <span className="text-[11px] text-[color:var(--color-text-soft)]">Pantau status armada & jadwal mobil</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-[color:var(--color-text-muted)]" />
            </Link>

            <Link 
              to="/user/room/dashboard"
              className="w-full flex items-center justify-between p-4 border-b transition-colors hover:bg-[color:var(--color-surface-muted)]"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  <Building2 size={18} />
                </div>
                <div>
                  <span className="font-semibold text-[color:var(--color-heading)] text-sm block">Peminjaman Ruang Rapat</span>
                  <span className="text-[11px] text-[color:var(--color-text-soft)]">Pantau ketersediaan ruang rapat kantor</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-[color:var(--color-text-muted)]" />
            </Link>

            <Link 
              to="/user/tracking/dashboard"
              className="w-full flex items-center justify-between p-4 transition-colors hover:bg-[color:var(--color-surface-muted)]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <FileText size={18} />
                </div>
                <div>
                  <span className="font-semibold text-[color:var(--color-heading)] text-sm block">Tracking Perjalanan Dinas (SPD)</span>
                  <span className="text-[11px] text-[color:var(--color-text-soft)]">Pantau status berkas & realisasi SPD</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-[color:var(--color-text-muted)]" />
            </Link>
          </div>
        </div>

        {/* Preferensi */}
        <div>
          <h3 className="px-2 text-xs font-bold uppercase tracking-widest text-[color:var(--color-text-soft)] mb-3">Preferensi</h3>
          <div className="rounded-3xl border overflow-hidden" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
            <button 
              onClick={toggleTheme}
              className="w-full flex items-center justify-between p-4 border-b transition-colors hover:bg-[color:var(--color-surface-muted)]"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  {isDark ? <Moon size={18} /> : <Sun size={18} />}
                </div>
                <span className="font-semibold text-[color:var(--color-heading)] text-sm">Mode Tampilan</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[color:var(--color-text-soft)]">{isDark ? 'Gelap' : 'Terang'}</span>
                <ChevronRight size={16} className="text-[color:var(--color-text-muted)]" />
              </div>
            </button>

            {!pushSupported ? (
              <div 
                className="w-full flex items-center justify-between p-4 border-b text-left opacity-60"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-surface-muted)' }}>
                    <Bell size={18} className="text-gray-400" />
                  </div>
                  <div>
                    <span className="font-semibold text-[color:var(--color-heading)] text-sm block">Notifikasi Sistem</span>
                    <span className="text-[10px] text-danger block">Tidak didukung di browser/koneksi non-HTTPS ini</span>
                  </div>
                </div>
              </div>
            ) : (
              <button 
                onClick={handlePushToggle}
                disabled={pushLoading}
                className="w-full flex items-center justify-between p-4 border-b transition-colors hover:bg-[color:var(--color-surface-muted)] text-left"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-teal-500/10 text-teal-600 dark:text-teal-400">
                    <Bell size={18} />
                  </div>
                  <div>
                    <span className="font-semibold text-[color:var(--color-heading)] text-sm block">Notifikasi Sistem</span>
                    <span className="text-[10px] text-[color:var(--color-text-soft)] block">Terima notifikasi jadwal pimpinan secara langsung</span>
                  </div>
                </div>
                <div className="flex items-center flex-shrink-0 pl-2">
                  <div
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      pushEnabled ? 'bg-teal-600' : 'bg-gray-300 dark:bg-gray-700'
                    } ${pushLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        pushEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </div>
                </div>
              </button>
            )}

            <button 
              onClick={() => { setPasswordOpen(true); passwordProps.resetForm(); }}
              className="w-full flex items-center justify-between p-4 transition-colors hover:bg-[color:var(--color-surface-muted)]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <Settings size={18} />
                </div>
                <span className="font-semibold text-[color:var(--color-heading)] text-sm">Ubah Password</span>
              </div>
              <ChevronRight size={16} className="text-[color:var(--color-text-muted)]" />
            </button>
          </div>
        </div>

        {/* Informasi */}
        <div>
          <h3 className="px-2 text-xs font-bold uppercase tracking-widest text-[color:var(--color-text-soft)] mb-3">Informasi</h3>
          <div className="rounded-3xl border overflow-hidden" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
            <button 
              onClick={() => setInfoOpen(true)}
              className="w-full flex items-center justify-between p-4 transition-colors hover:bg-[color:var(--color-surface-muted)]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <Info size={18} />
                </div>
                <span className="font-semibold text-[color:var(--color-heading)] text-sm">Tentang Aplikasi</span>
              </div>
              <ChevronRight size={16} className="text-[color:var(--color-text-muted)]" />
            </button>
          </div>
        </div>

        {/* Action Switches */}
        {user?.role === 'superadmin' && (
          <button
            onClick={handleSwitchToSuperadmin}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-3xl border border-red-500/30 text-red-500 bg-red-500/10 font-semibold transition-all hover:bg-red-500 hover:text-white"
          >
            <Shield size={18} />
            Mode Superadmin
          </button>
        )}

        <button
          onClick={() => navigate('/select-service')}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-3xl border border-teal-500/30 text-teal-600 bg-teal-500/10 font-semibold transition-all hover:bg-teal-600 hover:text-white dark:text-teal-400 dark:hover:bg-teal-500 dark:hover:text-white"
        >
          <ArrowLeft size={18} />
          Ganti Layanan
        </button>

        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-3xl border border-danger/30 text-danger bg-danger/5 font-semibold transition-all hover:bg-danger hover:text-white disabled:opacity-50"
        >
          {isLoggingOut ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
          {isLoggingOut ? 'Keluar dari Akun...' : 'Keluar dari Akun'}
        </button>
      </div>

      <PasswordChangeModal 
        isOpen={passwordOpen} 
        onClose={() => { setPasswordOpen(false); passwordProps.resetForm(); }} 
        accentColor="teal"
        {...passwordProps}
      />

      <AboutAppModal 
        isOpen={infoOpen} 
        onClose={() => setInfoOpen(false)} 
        showProcessSteps={true}
        accentColor="teal"
        role="kepala_kantor"
      />
    </div>
  );
}
