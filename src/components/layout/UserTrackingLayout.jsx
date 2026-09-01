import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useLoading } from '../../contexts/LoadingContext';
import { NAV_TRACKING_USER } from '../../utils/constants';
import { LogOut, ChevronDown, LayoutDashboard, FileText, Home, CircleUser, ArrowLeft, CalendarDays, CalendarOff, Loader2 } from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle';
import ThemeLogo from '../ui/ThemeLogo';
import NotificationBell from '../ui/NotificationBell';
import { useTheme } from '../../contexts/ThemeContext';
import { getInitials } from '../../utils/helpers';
import SkipLink from '../ui/SkipLink';

const iconMap = { LayoutDashboard, FileText, CalendarDays, CalendarOff };

export default function UserTrackingLayout({ children }) {
  const { user, logout, switchRole } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { isDark } = useTheme();

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
    navigate('/admin/tracking/monitoring-spd');
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
              <Link to="/user/tracking/dashboard" aria-label="Kembali ke home" className="inline-flex items-center rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30">
                <ThemeLogo className="h-8 md:h-10" />
              </Link>
            </div>

            {/* Mobile Notifications (Visible only on small screens) */}
            <div className="flex md:hidden items-center">
              <NotificationBell />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2 rounded-full border p-1.5" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-muted)' }}>
              {NAV_TRACKING_USER.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `relative inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-heading font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-[color:var(--color-surface-elevated)] text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'text-[color:var(--color-text-muted)] hover:text-emerald-600 dark:hover:text-emerald-400'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {item.icon && (() => {
                        const Icon = iconMap[item.icon];
                        return Icon ? <Icon size={16} /> : null;
                      })()}
                      {item.label}
                      {isActive && <span className="absolute inset-x-5 -bottom-1 h-0.5 rounded-full bg-emerald-500" />}
                    </>
                  )}
                </NavLink>
              ))}
            </div>

            {/* Desktop Profile & Notifications */}
            <div className="hidden md:flex items-center gap-3 relative">
              <NotificationBell />
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-3 rounded-full border px-3 py-2 text-[color:var(--color-text-muted)] transition-colors hover:border-emerald-500/20"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10">
                    <span className="text-sm font-heading font-bold text-emerald-600 dark:text-emerald-400">{getInitials(user?.name)}</span>
                  </div>
                  <div className="text-left">
                    <p className="max-w-[100px] truncate text-sm font-heading font-bold text-[color:var(--color-heading)]">{user?.name}</p>
                    <p className="max-w-[100px] truncate text-xs text-[color:var(--color-text-soft)]">{user?.jabatan || 'Seksi Umum'}</p>
                  </div>
                  <ChevronDown size={14} className={`transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-[3.75rem] z-20 w-64 rounded-3xl border p-2 shadow-2xl animate-scale-in" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
                    <Link 
                      to="/user/tracking/account"
                      onClick={() => setProfileOpen(false)}
                      className="block rounded-2xl px-4 py-3 transition-colors hover:bg-[color:var(--color-surface)] border border-transparent hover:border-[color:var(--color-border)]" 
                      style={{ background: 'var(--color-surface-muted)' }}
                    >
                      <p className="truncate text-sm font-heading font-bold text-[color:var(--color-heading)]">{user?.name}</p>
                      <p className="mt-1 text-xs leading-5 text-[color:var(--color-text-soft)]">{user?.jabatan}</p>
                    </Link>
                    {(user?.role === 'admin' || user?.role === 'superadmin') && (
                      <button
                        onClick={handleSwitchToAdmin}
                        className="mt-2 flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 transition-colors dark:text-emerald-300 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50"
                      >
                        <CircleUser size={16} />
                        Mode Admin
                      </button>
                    )}
                    {user?.role === 'superadmin' && (
                      <button
                        onClick={handleSwitchToSuperadmin}
                        className="mt-2 flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-900 bg-purple-200 hover:bg-purple-300 transition-colors dark:bg-purple-900/40 dark:text-purple-200 dark:hover:bg-purple-800/50"
                      >
                        <CircleUser size={16} />
                        Mode Superadmin
                      </button>
                    )}
                    <Link
                      to="/select-service"
                      onClick={() => setProfileOpen(false)}
                      className="mt-2 flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
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
      </nav>

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
        <div className="relative flex justify-around items-center min-h-[4.5rem] bg-[color:var(--color-surface-elevated)]/90 backdrop-blur-xl border-t rounded-t-[1.5rem] shadow-[0_-8px_20px_rgba(0,0,0,0.08)] px-2 pt-3 pb-3 pb-safe" style={{ borderColor: 'var(--color-border)', minHeight: '4.5rem', paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
          <NavLink to="/user/tracking/dashboard" className={({ isActive }) => `flex flex-col items-center justify-center w-16 h-full transition-colors ${isActive ? 'text-emerald-600' : 'text-[color:var(--color-text-soft)] hover:text-[color:var(--color-text-muted)]'}`}>
            <motion.div whileTap={{ scale: 0.85 }} className="flex flex-col items-center justify-center w-full h-full gap-1">
              <Home size={20} strokeWidth={2.5} />
              <span className="text-[10px] font-bold">Beranda</span>
            </motion.div>
          </NavLink>

          <NavLink to="/user/tracking/spd-saya" className={({ isActive }) => `flex flex-col items-center justify-center w-14 h-full transition-colors ${isActive ? 'text-emerald-600' : 'text-[color:var(--color-text-soft)] hover:text-[color:var(--color-text-muted)]'}`}>
            <motion.div whileTap={{ scale: 0.85 }} className="flex flex-col items-center justify-center w-full h-full gap-1">
              <FileText size={20} strokeWidth={2.5} />
              <span className="text-[10px] font-bold">SPD Saya</span>
            </motion.div>
          </NavLink>

          <NavLink to="/user/tracking/pegawai-cuti" className={({ isActive }) => `flex flex-col items-center justify-center w-14 h-full transition-colors ${isActive ? 'text-emerald-600' : 'text-[color:var(--color-text-soft)] hover:text-[color:var(--color-text-muted)]'}`}>
            <motion.div whileTap={{ scale: 0.85 }} className="flex flex-col items-center justify-center w-full h-full gap-1">
              <CalendarOff size={20} strokeWidth={2.5} />
              <span className="text-[10px] font-bold">Cuti</span>
            </motion.div>
          </NavLink>

          <NavLink to="/user/tracking/jadwal-jumat" className={({ isActive }) => `flex flex-col items-center justify-center w-14 h-full transition-colors ${isActive ? 'text-emerald-600' : 'text-[color:var(--color-text-soft)] hover:text-[color:var(--color-text-muted)]'}`}>
            <motion.div whileTap={{ scale: 0.85 }} className="flex flex-col items-center justify-center w-full h-full gap-1">
              <CalendarDays size={20} strokeWidth={2.5} />
              <span className="text-[10px] font-bold">Jadwal</span>
            </motion.div>
          </NavLink>

          <NavLink to="/user/tracking/account" className={({ isActive }) => `flex flex-col items-center justify-center w-14 h-full transition-colors ${isActive ? 'text-emerald-600' : 'text-[color:var(--color-text-soft)] hover:text-[color:var(--color-text-muted)]'}`}>
            <motion.div whileTap={{ scale: 0.85 }} className="flex flex-col items-center justify-center w-full h-full gap-1">
              <CircleUser size={20} strokeWidth={2.5} />
              <span className="text-[10px] font-bold">Akun</span>
            </motion.div>
          </NavLink>
        </div>
      </div>

      {/* Floating Theme Toggle */}
      <div className="hidden md:block fixed bottom-6 right-24 z-50">
        <ThemeToggle iconOnly={true} className="shadow-xl shadow-black/10 hover:-translate-y-1 transition-all duration-300 bg-[color:var(--color-surface-elevated)] border-[color:var(--color-border)]" />
      </div>
    </div>
  );
}
