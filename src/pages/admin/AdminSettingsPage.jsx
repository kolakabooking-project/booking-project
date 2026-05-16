import { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authApi } from '../../lib/api';
import { useNavigate, Link } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { getInitials } from '../../utils/helpers';
import { LogOut, ChevronRight, Moon, Sun, Settings, Info, Lock, Eye, EyeOff, Check, X as XIcon, CircleUser, Car, Users } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { toast } from 'sonner';

// ─── Password strength rules ───
const PASSWORD_RULES = [
  { id: 'length', label: 'Minimal 8 karakter', test: (v) => v.length >= 8 },
  { id: 'upper', label: 'Mengandung huruf besar (A-Z)', test: (v) => /[A-Z]/.test(v) },
  { id: 'lower', label: 'Mengandung huruf kecil (a-z)', test: (v) => /[a-z]/.test(v) },
  { id: 'number', label: 'Mengandung angka (0-9)', test: (v) => /[0-9]/.test(v) },
];

function PasswordField({ label, id, value, onChange, required = true }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-heading font-semibold text-[color:var(--color-text-muted)]">
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={visible ? 'text' : 'password'}
          required={required}
          autoComplete={id === 'oldPwd' ? 'current-password' : 'new-password'}
          value={value}
          onChange={onChange}
          className="form-control font-body pr-12"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-[color:var(--color-text-soft)] hover:text-[color:var(--color-heading)] transition-colors"
          aria-label={visible ? 'Sembunyikan password' : 'Tampilkan password'}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [pwdForm, setPwdForm] = useState({ old: '', new: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSwitchToUser = () => {
    switchRole('user');
    navigate('/user/dashboard');
  };

  // ─── Password validation ───
  const passwordStrength = PASSWORD_RULES.map((rule) => ({
    ...rule,
    passed: rule.test(pwdForm.new),
  }));
  const allRulesPassed = passwordStrength.every((r) => r.passed);
  const passwordsMatch = pwdForm.new.length > 0 && pwdForm.new === pwdForm.confirm;
  const canSubmit = pwdForm.old.length > 0 && allRulesPassed && passwordsMatch;

  const resetForm = useCallback(() => {
    setPwdForm({ old: '', new: '', confirm: '' });
  }, []);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    // Client-side guards
    if (!allRulesPassed) {
      toast.error('Password baru belum memenuhi semua persyaratan keamanan');
      return;
    }
    if (pwdForm.new !== pwdForm.confirm) {
      toast.error('Password baru dan konfirmasi tidak cocok');
      return;
    }
    if (pwdForm.old === pwdForm.new) {
      toast.error('Password baru tidak boleh sama dengan password lama');
      return;
    }

    setLoading(true);
    try {
      await authApi.changePassword(pwdForm.old, pwdForm.new);
      toast.success('Password berhasil diperbarui');
      setPasswordOpen(false);
      resetForm();
    } catch (err) {
      const msg = err.message || 'Gagal mengubah password';
      if (msg.toLowerCase().includes('incorrect') || msg.toLowerCase().includes('wrong') || msg.toLowerCase().includes('invalid')) {
        toast.error('Password lama salah. Silakan coba lagi.');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-10">
      <PageHeader title="Pengaturan Admin" subtitle="Kelola profil, preferensi, dan konfigurasi aplikasi." />

      {/* Profile Card */}
      <div className="mt-4 rounded-[2rem] p-6 shadow-sm flex items-center gap-5 border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
        <div className="w-16 h-16 rounded-full bg-djp-blue/10 flex items-center justify-center flex-shrink-0">
          <span className="text-2xl font-heading font-bold text-djp-blue">{getInitials(user?.name)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-heading font-bold text-[color:var(--color-heading)] truncate">{user?.name}</h2>
          <p className="text-sm text-[color:var(--color-text-soft)] truncate">{user?.jabatan || 'Administrator Sistem'}</p>
          <div className="mt-2 inline-block px-2.5 py-1 rounded-md bg-djp-blue/10 text-djp-blue text-[10px] font-bold uppercase tracking-widest">
            {user?.role === 'admin' ? 'Administrator' : 'Pengguna'}
          </div>
        </div>
      </div>

      {/* Settings List */}
      <div className="mt-8 space-y-6">
        <div className="md:hidden">
          <h3 className="px-2 text-xs font-bold uppercase tracking-widest text-[color:var(--color-text-soft)] mb-3">Manajemen (Mobile)</h3>
          <div className="rounded-3xl border overflow-hidden" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
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
            <button 
              onClick={() => { setPasswordOpen(true); resetForm(); }}
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

        <button
          onClick={handleSwitchToUser}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-3xl border border-djp-blue/30 text-djp-blue bg-djp-yellow/10 font-semibold transition-all hover:bg-djp-yellow hover:text-djp-blue-dark"
        >
          <CircleUser size={18} />
          Masuk Mode Pegawai
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-3xl border border-danger/30 text-danger bg-danger/5 font-semibold transition-all hover:bg-danger hover:text-white"
        >
          <LogOut size={18} />
          Keluar dari Akun
        </button>
      </div>

      {/* ── Password Change Modal ── */}
      <Modal isOpen={passwordOpen} onClose={() => { setPasswordOpen(false); resetForm(); }} title="Ubah Password" size="sm">
        <form onSubmit={handlePasswordSubmit} className="space-y-5">
          <div className="flex justify-center mb-4 mt-2">
            <div className="w-16 h-16 rounded-full bg-djp-blue/10 flex items-center justify-center">
              <Lock size={24} className="text-djp-blue" />
            </div>
          </div>

          <PasswordField
            label="Password Lama"
            id="oldPwd"
            value={pwdForm.old}
            onChange={(e) => setPwdForm({ ...pwdForm, old: e.target.value })}
          />
          <PasswordField
            label="Password Baru"
            id="newPwd"
            value={pwdForm.new}
            onChange={(e) => setPwdForm({ ...pwdForm, new: e.target.value })}
          />

          {pwdForm.new.length > 0 && (
            <div className="rounded-2xl p-3 space-y-1.5" style={{ background: 'var(--color-surface-muted)' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text-soft)] mb-2">Persyaratan Keamanan</p>
              {passwordStrength.map((rule) => (
                <div key={rule.id} className="flex items-center gap-2 text-xs">
                  {rule.passed ? (
                    <Check size={14} className="text-success flex-shrink-0" />
                  ) : (
                    <XIcon size={14} className="text-danger flex-shrink-0" />
                  )}
                  <span className={rule.passed ? 'text-success' : 'text-[color:var(--color-text-soft)]'}>
                    {rule.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          <PasswordField
            label="Konfirmasi Password Baru"
            id="confirmPwd"
            value={pwdForm.confirm}
            onChange={(e) => setPwdForm({ ...pwdForm, confirm: e.target.value })}
          />

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

      {/* ── Info Modal ── */}
      <Modal isOpen={infoOpen} onClose={() => setInfoOpen(false)} title="Tentang Aplikasi" size="sm">
        <div className="space-y-4 text-center pb-4">
          <div className="mx-auto w-20 h-20 rounded-[1.5rem] flex items-center justify-center mb-6">
            <img src="/logoweb.png" alt="Bookolaka" className="w-full h-full object-contain" />
          </div>
          <h3 className="text-xl font-heading font-bold text-[color:var(--color-heading)]">Bookolaka</h3>
          <p className="text-sm text-[color:var(--color-text-soft)] leading-relaxed px-4">
            Sistem Informasi Manajemen Kendaraan Dinas Operasional (KDO) di lingkungan KPP Pratama Kolaka. 
          </p>

          <div className="mt-4 space-y-3 text-left">
            <div className="p-4 rounded-2xl" style={{ background: 'var(--color-surface-muted)' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text-soft)] mb-2">Alur Proses Bisnis</p>
              <ol className="space-y-2 text-[13px] text-[color:var(--color-heading)]">
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-djp-blue text-white text-[10px] font-bold flex items-center justify-center">1</span>
                  <span>User mengajukan permohonan peminjaman kendaraan dinas.</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-djp-blue text-white text-[10px] font-bold flex items-center justify-center">2</span>
                  <span>Admin meninjau dan menyetujui/menolak permohonan.</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-djp-blue text-white text-[10px] font-bold flex items-center justify-center">3</span>
                  <span>Kendaraan digunakan dan perjalanan dimulai.</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-djp-blue text-white text-[10px] font-bold flex items-center justify-center">4</span>
                  <span>User mengembalikan kendaraan dan mengisi laporan akhir perjalanan.</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-djp-blue text-white text-[10px] font-bold flex items-center justify-center">5</span>
                  <span>Data terdokumentasi untuk pelaporan dan audit.</span>
                </li>
              </ol>
            </div>
          </div>

          <div className="pt-4">
            <p className="text-xs text-[color:var(--color-text-soft)]">Versi 1.0.0 &copy; 2026 KPP Pratama Kolaka</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
