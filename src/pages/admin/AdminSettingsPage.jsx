import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLoading } from '../../contexts/LoadingContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import { LogOut, ChevronRight, Moon, Sun, Settings, Info, CircleUser, Car, Users, Shield, Bell, ArrowLeft, Building2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import usePasswordChange from '../../hooks/usePasswordChange';
import usePushNotification from '../../hooks/usePushNotification';
import ProfileCard from '../../components/settings/ProfileCard';
import PasswordChangeModal from '../../components/settings/PasswordChangeModal';
import AboutAppModal from '../../components/settings/AboutAppModal';

export default function AdminSettingsPage() {
  const { user, logout, switchRole } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  // ─── Shared hooks ───
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
    showLoading('Melakukan logout...');
    try {
      await logout();
    } finally {
      hideLoading();
      navigate('/login');
    }
  };

  const handleSwitchToUser = () => {
    switchRole('user');
    navigate('/user/dashboard');
  };

  const handleSwitchToSuperadmin = () => {
    switchRole('superadmin');
    navigate('/superadmin/dashboard');
  };

  return (
    <div className="pb-10">
      <PageHeader title="Pengaturan Admin" subtitle="Kelola profil, preferensi, dan konfigurasi aplikasi." />

      <ProfileCard 
        user={user} 
        variant="default" 
        fallbackJabatan="Administrator Sistem" 
        badgeText={user?.role === 'admin' ? 'Administrator' : 'Pengguna'} 
      />

      {/* Settings List */}
      <div className="mt-8 space-y-6">
        <div className="md:hidden">
          <h3 className="px-2 text-xs font-bold uppercase tracking-widest text-[color:var(--color-text-soft)] mb-3">Manajemen (Mobile)</h3>
          <div className="rounded-3xl border overflow-hidden" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
            {location.pathname.includes('/room/') ? (
              <Link 
                to="/admin/room/rooms"
                className="w-full flex items-center justify-between p-4 transition-colors hover:bg-[color:var(--color-surface-muted)]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--color-surface-muted)' }}>
                    <Building2 size={18} className="text-djp-blue" />
                  </div>
                  <span className="font-semibold text-[color:var(--color-heading)] text-sm">Manajemen Ruangan</span>
                </div>
                <ChevronRight size={16} className="text-[color:var(--color-text-muted)]" />
              </Link>
            ) : (
              <>
                <Link 
                  to="/admin/fleet"
                  className="w-full flex items-center justify-between p-4 border-b transition-colors hover:bg-[color:var(--color-surface-muted)]"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--color-surface-muted)' }}>
                      <Car size={18} className="text-djp-blue" />
                    </div>
                    <span className="font-semibold text-[color:var(--color-heading)] text-sm">Manajemen Kendaraan</span>
                  </div>
                  <ChevronRight size={16} className="text-[color:var(--color-text-muted)]" />
                </Link>
                <Link 
                  to="/admin/drivers"
                  className="w-full flex items-center justify-between p-4 transition-colors hover:bg-[color:var(--color-surface-muted)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--color-surface-muted)' }}>
                      <Users size={18} className="text-djp-blue" />
                    </div>
                    <span className="font-semibold text-[color:var(--color-heading)] text-sm">Manajemen Pengemudi</span>
                  </div>
                  <ChevronRight size={16} className="text-[color:var(--color-text-muted)]" />
                </Link>
              </>
            )}
          </div>
        </div>

        <div>
          <h3 className="px-2 text-xs font-bold uppercase tracking-widest text-[color:var(--color-text-soft)] mb-3">Preferensi</h3>
          <div className="rounded-3xl border overflow-hidden" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
            <button 
              onClick={toggleTheme}
              className="w-full flex items-center justify-between p-4 border-b transition-colors hover:bg-[color:var(--color-surface-muted)]"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--color-surface-muted)' }}>
                  {isDark ? <Moon size={18} className="text-djp-blue" /> : <Sun size={18} className="text-djp-blue" />}
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
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-surface-muted)' }}>
                    <Bell size={18} className="text-djp-blue" />
                  </div>
                  <div>
                    <span className="font-semibold text-[color:var(--color-heading)] text-sm block">Notifikasi Sistem</span>
                    <span className="text-[10px] text-[color:var(--color-text-soft)] block">Terima notifikasi status booking secara real-time</span>
                  </div>
                </div>
                <div className="flex items-center flex-shrink-0 pl-2">
                  <div
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      pushEnabled ? 'bg-djp-blue' : 'bg-gray-300 dark:bg-gray-700'
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
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--color-surface-muted)' }}>
                  <Settings size={18} className="text-djp-blue" />
                </div>
                <span className="font-semibold text-[color:var(--color-heading)] text-sm">Ubah Password</span>
              </div>
              <ChevronRight size={16} className="text-[color:var(--color-text-muted)]" />
            </button>
          </div>
        </div>

        <div>
          <h3 className="px-2 text-xs font-bold uppercase tracking-widest text-[color:var(--color-text-soft)] mb-3">Informasi</h3>
          <div className="rounded-3xl border overflow-hidden" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
            <button 
              onClick={() => setInfoOpen(true)}
              className="w-full flex items-center justify-between p-4 transition-colors hover:bg-[color:var(--color-surface-muted)]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--color-surface-muted)' }}>
                  <Info size={18} className="text-djp-blue" />
                </div>
                <span className="font-semibold text-[color:var(--color-heading)] text-sm">Tentang Aplikasi</span>
              </div>
              <ChevronRight size={16} className="text-[color:var(--color-text-muted)]" />
            </button>
          </div>
        </div>

        {user?.role === 'admin' && (
          <button
            onClick={handleSwitchToUser}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-3xl border border-djp-blue/30 text-djp-blue bg-djp-yellow/10 font-semibold transition-all hover:bg-djp-yellow hover:text-djp-blue-dark"
          >
            <CircleUser size={18} />
            Masuk Mode Pegawai
          </button>
        )}

        {user?.role === 'superadmin' && (
          <button
            onClick={handleSwitchToSuperadmin}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-3xl border border-red-500/30 text-red-500 bg-red-500/10 font-semibold transition-all hover:bg-red-500 hover:text-white"
          >
            <Shield size={18} />
            Kembali Mode Superadmin
          </button>
        )}

        <button
          onClick={() => navigate('/select-service')}
          className="md:hidden w-full flex items-center justify-center gap-2 p-4 rounded-3xl border border-djp-blue/30 text-djp-blue bg-djp-blue/5 font-semibold transition-all hover:bg-djp-blue hover:text-white"
        >
          <ArrowLeft size={18} />
          Ganti Layanan
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-3xl border border-danger/30 text-danger bg-danger/5 font-semibold transition-all hover:bg-danger hover:text-white"
        >
          <LogOut size={18} />
          Keluar dari Akun
        </button>
      </div>

      <PasswordChangeModal 
        isOpen={passwordOpen} 
        onClose={() => { setPasswordOpen(false); passwordProps.resetForm(); }} 
        accentColor="djp-blue"
        {...passwordProps}
      />

      <AboutAppModal 
        isOpen={infoOpen} 
        onClose={() => setInfoOpen(false)} 
        showProcessSteps={true}
        accentColor="djp-blue"
      />
    </div>
  );
}
