import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useLoading } from '../../contexts/LoadingContext';
import { NAV_SEKRETARIS_JADWAL } from '../../utils/constants';
import { 
  LogOut, 
  ChevronDown, 
  CalendarDays, 
  ClipboardList, 
  FileText, 
  Loader2, 
  Shield, 
  ArrowLeft,
  CircleUser,
  Plus
} from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle';
import ThemeLogo from '../ui/ThemeLogo';
import NotificationBell from '../ui/NotificationBell';
import { getInitials } from '../../utils/helpers';
import SkipLink from '../ui/SkipLink';

const iconMap = {
  CalendarDays,
  ClipboardList,
  FileText,
};

export default function SekretarisJadwalLayout({ children }) {
  const { user, logout, switchRole } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleSwitchToAdmin = () => {
    switchRole('admin');
    navigate('/admin/dashboard');
  };

  const handleSwitchToSuperadmin = () => {
    switchRole('superadmin');
    navigate('/superadmin/dashboard');
  };

  return (
    <div className="min-h-screen bg-[color:var(--color-bg-main)] min-w-0 overflow-x-hidden pb-32 md:pb-0">
      <SkipLink />
      {/* Top Navigation */}
      <nav role="navigation" aria-label="Navigasi utama" className="sticky top-0 z-40 border-b backdrop-blur-xl shadow-[var(--shadow-navbar)] pt-[max(env(safe-area-inset-top),0px)]" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-shell)' }}>
        <div className="app-shell relative">
          <div className="flex min-h-[4rem] flex-wrap items-center justify-between gap-3 py-2 md:py-3">
            <div className="flex items-center gap-3">
              <Link to="/sekretaris/jadwal/calendar" aria-label="Kembali ke jadwal" className="inline-flex items-center rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30">
                <ThemeLogo className="h-8 md:h-10" />
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1.5 rounded-full border p-1" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-muted)' }}>
              {NAV_SEKRETARIS_JADWAL.map((item) => {
                const Icon = iconMap[item.icon] || CalendarDays;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-heading font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-[color:var(--color-surface-elevated)] text-teal-600 dark:text-teal-400 shadow-sm'
                          : 'text-[color:var(--color-text-muted)] hover:text-teal-600 dark:hover:text-teal-400'
                      }`
                    }
                  >
                    <Icon size={15} />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>

            {/* Mobile Actions (Notification & Profile Trigger & Theme Toggle) */}
            <div className="flex md:hidden items-center gap-1.5">
              <ThemeToggle iconOnly={true} className="h-9 w-9 p-0 flex items-center justify-center rounded-full border shadow-none" />
              <NotificationBell />
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold text-xs border border-teal-500/20"
                aria-label="Menu profil"
              >
                {getInitials(user?.name)}
              </button>
            </div>

            {/* Desktop Profile & Notifications */}
            <div className="hidden md:flex items-center gap-3 relative">
              <NotificationBell />

              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-3 rounded-full border px-3 py-2 text-[color:var(--color-text-muted)] transition-colors hover:border-teal-500/20"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-500/10">
                    <span className="text-sm font-heading font-bold text-teal-600 dark:text-teal-400">{getInitials(user?.name)}</span>
                  </div>
                  <div className="text-left">
                    <p className="max-w-[120px] truncate text-sm font-heading font-bold text-[color:var(--color-heading)]">{user?.name}</p>
                    <p className="max-w-[120px] truncate text-xs text-teal-600 dark:text-teal-400 font-medium">{user?.jabatan || 'Sekretaris'}</p>
                  </div>
                  <ChevronDown size={14} className={`transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-[3.75rem] z-50 w-64 rounded-3xl border p-2 shadow-2xl animate-scale-in" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
                    <Link
                      to="/sekretaris/jadwal/settings"
                      onClick={() => setProfileOpen(false)}
                      className="block rounded-2xl px-4 py-3 transition-colors hover:bg-[color:var(--color-surface)] border border-transparent hover:border-[color:var(--color-border)]"
                      style={{ background: 'var(--color-surface-muted)' }}
                    >
                      <p className="truncate text-sm font-heading font-bold text-[color:var(--color-heading)]">{user?.name}</p>
                      <p className="mt-1 text-xs leading-5 text-[color:var(--color-text-soft)]">{user?.jabatan || 'Sekretaris Kepala Kantor'}</p>
                    </Link>

                    {/* Mode Admin button */}
                    <button
                      onClick={handleSwitchToAdmin}
                      className="mt-2 flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-900 bg-djp-yellow hover:bg-yellow-400 transition-colors"
                    >
                      <CircleUser size={16} />
                      Mode Admin
                    </button>

                    {user?.role === 'superadmin' && (
                      <button
                        onClick={handleSwitchToSuperadmin}
                        className="mt-2 flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
                      >
                        <Shield size={16} />
                        Mode Superadmin
                      </button>
                    )}

                    <Link
                      to="/select-service"
                      onClick={() => setProfileOpen(false)}
                      className="mt-2 flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-teal-600 bg-teal-500/10 hover:bg-teal-500/20 transition-colors"
                    >
                      <ArrowLeft size={16} />
                      Ganti Layanan
                    </Link>

                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="mt-2 flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-danger transition-colors hover:bg-danger-light disabled:opacity-50"
                    >
                      {isLoggingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                      {isLoggingOut ? 'Keluar...' : 'Keluar'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu when profileOpen */}
        {profileOpen && (
          <div className="md:hidden border-t px-4 py-3 space-y-2 animate-fade-in" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
            <Link
              to="/sekretaris/jadwal/settings"
              onClick={() => setProfileOpen(false)}
              className="block rounded-2xl p-3"
              style={{ background: 'var(--color-surface-muted)' }}
            >
              <p className="text-sm font-bold text-[color:var(--color-heading)]">{user?.name}</p>
              <p className="text-xs text-[color:var(--color-text-soft)]">{user?.jabatan || 'Sekretaris'}</p>
            </Link>
            <button
              onClick={handleSwitchToAdmin}
              className="flex w-full items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-900 bg-djp-yellow"
            >
              <CircleUser size={16} />
              Mode Admin
            </button>
            <Link
              to="/select-service"
              onClick={() => setProfileOpen(false)}
              className="flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-teal-600 bg-teal-500/10"
            >
              <ArrowLeft size={16} />
              Ganti Layanan
            </Link>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex w-full items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-danger bg-danger/10"
            >
              {isLoggingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
              Keluar
            </button>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main id="main-content" tabIndex={-1} className="app-shell overflow-x-hidden py-6 md:py-8 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[9999]">
        <div 
          className="relative flex justify-around items-center min-h-[4.5rem] bg-[color:var(--color-surface-elevated)]/90 backdrop-blur-xl border-t rounded-t-[1.5rem] shadow-[0_-8px_20px_rgba(0,0,0,0.08)] px-2 pt-3 pb-3 pb-safe"
          style={{ borderColor: 'var(--color-border)', minHeight: '4.5rem', paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
        >
          {/* 1. Kalender */}
          <NavLink 
            to="/sekretaris/jadwal/calendar" 
            className={({ isActive }) => `flex flex-col items-center justify-center w-14 h-full transition-colors ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-[color:var(--color-text-soft)] hover:text-[color:var(--color-text-muted)]'}`}
          >
            <motion.div whileTap={{ scale: 0.85 }} className="flex flex-col items-center justify-center w-full h-full gap-1">
              <CalendarDays size={20} strokeWidth={2.5} />
              <span className="text-[10px] font-bold">Kalender</span>
            </motion.div>
          </NavLink>

          {/* 2. Kegiatan */}
          <NavLink 
            to="/sekretaris/jadwal/kegiatan" 
            className={({ isActive }) => `flex flex-col items-center justify-center w-14 h-full transition-colors ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-[color:var(--color-text-soft)] hover:text-[color:var(--color-text-muted)]'}`}
          >
            <motion.div whileTap={{ scale: 0.85 }} className="flex flex-col items-center justify-center w-full h-full gap-1">
              <ClipboardList size={20} strokeWidth={2.5} />
              <span className="text-[10px] font-bold">Kegiatan</span>
            </motion.div>
          </NavLink>

          {/* Spacer for center elevated button */}
          <div className="w-16"></div>

          {/* 3. Center Elevated Action Button */}
          <button 
            onClick={() => setActionModalOpen(true)}
            aria-label="Tambah jadwal baru"
            className="absolute left-1/2 -top-6 -translate-x-1/2 rounded-full border-[6px]"
            style={{ borderColor: 'var(--color-bg-main)' }}
          >
            <motion.div whileTap={{ scale: 0.9 }} className="flex h-[4.2rem] w-[4.2rem] items-center justify-center rounded-full bg-gradient-to-b from-teal-600 to-teal-700 text-white shadow-xl shadow-teal-600/40">
              <div className="relative flex items-center justify-center">
                <CalendarDays size={26} strokeWidth={2.2} className="text-white relative z-10" />
                <div className="absolute -top-1 -right-2 bg-amber-400 text-slate-900 rounded-full shadow-sm z-20" style={{ padding: '2px' }}>
                  <Plus size={12} strokeWidth={4} />
                </div>
              </div>
            </motion.div>
          </button>

          {/* 4. Surat Tugas (ST) */}
          <NavLink 
            to="/sekretaris/jadwal/surat-tugas" 
            className={({ isActive }) => `flex flex-col items-center justify-center w-14 h-full transition-colors ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-[color:var(--color-text-soft)] hover:text-[color:var(--color-text-muted)]'}`}
          >
            <motion.div whileTap={{ scale: 0.85 }} className="flex flex-col items-center justify-center w-full h-full gap-1">
              <FileText size={20} strokeWidth={2.5} />
              <span className="text-[10px] font-bold">ST</span>
            </motion.div>
          </NavLink>

          {/* 5. Akun */}
          <NavLink 
            to="/sekretaris/jadwal/settings" 
            className={({ isActive }) => `flex flex-col items-center justify-center w-14 h-full transition-colors ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-[color:var(--color-text-soft)] hover:text-[color:var(--color-text-muted)]'}`}
          >
            <motion.div whileTap={{ scale: 0.85 }} className="flex flex-col items-center justify-center w-full h-full gap-1">
              <CircleUser size={20} strokeWidth={2.5} />
              <span className="text-[10px] font-bold">Akun</span>
            </motion.div>
          </NavLink>
        </div>
      </div>

      {/* Action Modal */}
      {actionModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-end justify-center sm:items-center sm:p-4">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-fade-in" 
            onClick={() => setActionModalOpen(false)} 
          />
          <div className="relative w-full rounded-t-3xl bg-[color:var(--color-surface)] sm:w-96 sm:rounded-3xl p-6 pb-safe shadow-2xl animate-slide-up sm:animate-scale-in">
            <div className="w-12 h-1.5 bg-[color:var(--color-border)] rounded-full mx-auto mb-6 sm:hidden" />
            <h3 className="text-lg font-heading font-bold mb-6 text-[color:var(--color-heading)] text-center">Tambah Jadwal Pimpinan</h3>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => {
                  setActionModalOpen(false);
                  if (location.pathname.includes('/kegiatan')) {
                    navigate('/sekretaris/jadwal/kegiatan?action=new');
                  } else {
                    navigate('/sekretaris/jadwal/calendar?action=kegiatan');
                  }
                }} 
                className="flex flex-col items-center gap-3 p-4 rounded-[1.25rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface-elevated)] hover:bg-teal-500/5 hover:border-teal-500/30 transition-all active:scale-95"
              >
                <div className="w-12 h-12 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400">
                  <ClipboardList size={24} />
                </div>
                <span className="text-sm font-semibold text-center text-[color:var(--color-heading)]">Agenda<br/>Kegiatan</span>
              </button>
              <button 
                onClick={() => {
                  setActionModalOpen(false);
                  if (location.pathname.includes('/surat-tugas')) {
                    navigate('/sekretaris/jadwal/surat-tugas?action=new');
                  } else {
                    navigate('/sekretaris/jadwal/calendar?action=st');
                  }
                }} 
                className="flex flex-col items-center gap-3 p-4 rounded-[1.25rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface-elevated)] hover:bg-amber-500/5 hover:border-amber-500/30 transition-all active:scale-95"
              >
                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <FileText size={24} />
                </div>
                <span className="text-sm font-semibold text-center text-[color:var(--color-heading)]">Surat Tugas<br/>(ST)</span>
              </button>
            </div>
            <button 
              onClick={() => setActionModalOpen(false)} 
              className="mt-6 w-full py-3.5 rounded-2xl font-bold text-[color:var(--color-text-muted)] bg-[color:var(--color-surface-muted)] hover:bg-[color:var(--color-border)] transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Floating Theme Toggle (exact same as template) */}
      <div className="hidden md:block fixed bottom-6 right-24 z-50">
        <ThemeToggle iconOnly={true} className="shadow-xl shadow-black/10 hover:-translate-y-1 transition-all duration-300 bg-[color:var(--color-surface-elevated)] border-[color:var(--color-border)]" />
      </div>
    </div>
  );
}
