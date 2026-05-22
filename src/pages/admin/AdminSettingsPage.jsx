import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLoading } from '../../contexts/LoadingContext';
import { authApi } from '../../lib/api';
import { useNavigate, Link } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { getInitials } from '../../utils/helpers';
import { LogOut, ChevronRight, Moon, Sun, Settings, Info, Lock, Eye, EyeOff, Check, X as XIcon, CircleUser, Car, Users, Shield, Bell } from 'lucide-react';
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
  const { showLoading, hideLoading } = useLoading();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [pwdForm, setPwdForm] = useState({ old: '', new: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  // ─── Push Notification settings ───
  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setPushSupported(true);
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setPushEnabled(!!sub);
        });
      });
    }
  }, []);

  const handlePushToggle = async () => {
    if (!pushSupported || pushLoading) return;
    setPushLoading(true);

    try {
      const reg = await navigator.serviceWorker.ready;
      
      if (pushEnabled) {
        // Unsubscribe
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          // Notify backend — credentials: 'include' wajib agar cookie sesi terkirim
          await fetch('/api/push/unsubscribe', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
        }
        setPushEnabled(false);
        toast.success('Notifikasi sistem dinonaktifkan.');
      } else {
        // Subscribe
        // 1. Request permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          toast.error('Izin notifikasi ditolak. Harap aktifkan izin notifikasi di setelan browser Anda.');
          setPushLoading(false);
          return;
        }

        // 2. Fetch VAPID public key from server
        const keyRes = await fetch('/api/push/vapid-public-key', {
          credentials: 'include',
        });
        if (!keyRes.ok) throw new Error('Gagal mengambil VAPID key dari server');
        const { publicKey } = await keyRes.json();

        // 3. Subscribe to push manager
        const subscribeOptions = {
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        };
        const newSub = await reg.pushManager.subscribe(subscribeOptions);

        // 4. Send subscription to backend
        const subData = JSON.parse(JSON.stringify(newSub));
        const registerRes = await fetch('/api/push/subscribe', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ subscription: subData }),
        });

        if (!registerRes.ok) throw new Error('Gagal mengirim data subscription ke server');

        setPushEnabled(true);
        toast.success('Notifikasi sistem berhasil diaktifkan!');
      }
    } catch (err) {
      console.error('[PushToggle] Error toggling push notifications:', err);
      toast.error(err.message || 'Gagal mengubah pengaturan notifikasi.');
    } finally {
      setPushLoading(false);
    }
  };

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

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
    showLoading('Memperbarui password Anda...');
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
      hideLoading();
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
            <img src="/logoweb.png" alt="Bookolaka" className="w-full h-full object-contain" loading="lazy" />
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
