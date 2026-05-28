import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLoading } from '../../contexts/LoadingContext';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import PasswordField from '../../components/ui/PasswordField';
import { LogOut, ChevronRight, Moon, Sun, Settings, Info, Lock, Check, X as XIcon, LayoutDashboard } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import usePasswordChange from '../../hooks/usePasswordChange';

export default function SuperadminSettingsPage() {
  const { user, logout, switchRole } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  // ─── Shared hooks ───
  const {
    pwdForm,
    setPwdForm,
    loading,
    passwordStrength,
    passwordsMatch,
    canSubmit,
    resetForm,
    handlePasswordSubmit,
  } = usePasswordChange({
    showLoading,
    hideLoading,
    onSuccess: () => setPasswordOpen(false),
  });

  const handleLogout = async () => {
    showLoading('Melakukan logout...');
    try {
      await logout();
    } finally {
      hideLoading();
      navigate('/login');
    }
  };
  const handleSwitchToAdmin = () => { switchRole('admin'); navigate('/admin/dashboard'); };

  return (
    <div className="pb-10">
      <PageHeader title="Pengaturan Superadmin" subtitle="Kelola profil dan preferensi akun superadmin." />

      {/* Profile Card */}
      <div className="mt-4 rounded-[2rem] p-6 shadow-sm flex items-center gap-5 border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
          <span className="text-2xl font-heading font-bold text-red-500">🛡️</span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-heading font-bold text-[color:var(--color-heading)] truncate">{user?.name}</h2>
          <p className="text-sm text-[color:var(--color-text-soft)] truncate">{user?.jabatan || 'Super Administrator Sistem'}</p>
          <div className="mt-2 inline-block px-2.5 py-1 rounded-md bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-widest">
            Superadmin
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="mt-8 space-y-6">
        <div>
          <h3 className="px-2 text-xs font-bold uppercase tracking-widest text-[color:var(--color-text-soft)] mb-3">Preferensi</h3>
          <div className="rounded-3xl border overflow-hidden" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
            <button onClick={toggleTheme} className="w-full flex items-center justify-between p-4 border-b transition-colors hover:bg-[color:var(--color-surface-muted)]" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--color-surface-muted)' }}>
                  {isDark ? <Moon size={18} className="text-red-400" /> : <Sun size={18} className="text-red-400" />}
                </div>
                <span className="font-semibold text-[color:var(--color-heading)] text-sm">Mode Tampilan</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[color:var(--color-text-soft)]">{isDark ? 'Gelap' : 'Terang'}</span>
                <ChevronRight size={16} className="text-[color:var(--color-text-muted)]" />
              </div>
            </button>
            <button onClick={() => { setPasswordOpen(true); resetForm(); }} className="w-full flex items-center justify-between p-4 transition-colors hover:bg-[color:var(--color-surface-muted)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--color-surface-muted)' }}>
                  <Settings size={18} className="text-red-400" />
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
            <button onClick={() => setInfoOpen(true)} className="w-full flex items-center justify-between p-4 transition-colors hover:bg-[color:var(--color-surface-muted)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--color-surface-muted)' }}>
                  <Info size={18} className="text-red-400" />
                </div>
                <span className="font-semibold text-[color:var(--color-heading)] text-sm">Tentang Aplikasi</span>
              </div>
              <ChevronRight size={16} className="text-[color:var(--color-text-muted)]" />
            </button>
          </div>
        </div>

        <button onClick={handleSwitchToAdmin} className="w-full flex items-center justify-center gap-2 p-4 rounded-3xl border border-djp-blue/30 text-djp-blue bg-djp-yellow/10 font-semibold transition-all hover:bg-djp-yellow hover:text-djp-blue-dark">
          <LayoutDashboard size={18} />
          Masuk Mode Admin
        </button>

        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-4 rounded-3xl border border-danger/30 text-danger bg-danger/5 font-semibold transition-all hover:bg-danger hover:text-white">
          <LogOut size={18} />
          Keluar dari Akun
        </button>
      </div>

      {/* Password Modal */}
      <Modal isOpen={passwordOpen} onClose={() => { setPasswordOpen(false); resetForm(); }} title="Ubah Password" size="sm">
        <form onSubmit={handlePasswordSubmit} className="space-y-5">
          <div className="flex justify-center mb-4 mt-2">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <Lock size={24} className="text-red-500" />
            </div>
          </div>
          <PasswordField label="Password Lama" id="oldPwd" value={pwdForm.old} onChange={(e) => setPwdForm({ ...pwdForm, old: e.target.value })} />
          <PasswordField label="Password Baru" id="newPwd" value={pwdForm.new} onChange={(e) => setPwdForm({ ...pwdForm, new: e.target.value })} />
          {pwdForm.new.length > 0 && (
            <div className="rounded-2xl p-3 space-y-1.5" style={{ background: 'var(--color-surface-muted)' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text-soft)] mb-2">Persyaratan Keamanan</p>
              {passwordStrength.map((rule) => (
                <div key={rule.id} className="flex items-center gap-2 text-xs">
                  {rule.passed ? <Check size={14} className="text-success flex-shrink-0" /> : <XIcon size={14} className="text-danger flex-shrink-0" />}
                  <span className={rule.passed ? 'text-success' : 'text-[color:var(--color-text-soft)]'}>{rule.label}</span>
                </div>
              ))}
            </div>
          )}
          <PasswordField label="Konfirmasi Password Baru" id="confirmPwd" value={pwdForm.confirm} onChange={(e) => setPwdForm({ ...pwdForm, confirm: e.target.value })} />
          {pwdForm.confirm.length > 0 && (
            <div className={`flex items-center gap-2 text-xs px-1 ${passwordsMatch ? 'text-success' : 'text-danger'}`}>
              {passwordsMatch ? <Check size={14} /> : <XIcon size={14} />}
              {passwordsMatch ? 'Password cocok' : 'Password tidak cocok'}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <Button type="button" variant="ghost" onClick={() => { setPasswordOpen(false); resetForm(); }}>Batal</Button>
            <Button type="submit" loading={loading} disabled={!canSubmit}>Simpan Perubahan</Button>
          </div>
        </form>
      </Modal>

      {/* Info Modal */}
      <Modal isOpen={infoOpen} onClose={() => setInfoOpen(false)} title="Tentang Aplikasi" size="sm">
        <div className="space-y-4 text-center pb-4">
          <div className="mx-auto w-20 h-20 rounded-[1.5rem] flex items-center justify-center mb-6">
            <img src="/logoweb.png" alt="Bookolaka" className="w-full h-full object-contain" loading="lazy" />
          </div>
          <h3 className="text-xl font-heading font-bold text-[color:var(--color-heading)]">Bookolaka</h3>
          <p className="text-sm text-[color:var(--color-text-soft)] leading-relaxed px-4">
            Sistem Informasi Manajemen Kendaraan Dinas Operasional (KDO) di lingkungan KPP Pratama Kolaka.
          </p>
          <div className="pt-4">
            <p className="text-xs text-[color:var(--color-text-soft)]">Versi 1.0.0 &copy; 2026 KPP Pratama Kolaka</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
