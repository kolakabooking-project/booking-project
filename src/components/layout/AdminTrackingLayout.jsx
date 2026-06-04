import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useLoading } from '../../contexts/LoadingContext';
import { useRefreshCache } from '../../hooks/useSheetData';
import { NAV_TRACKING_ADMIN } from '../../utils/constants';
import { toast } from 'sonner';
import ThemeToggle from '../ui/ThemeToggle';
import ThemeLogo from '../ui/ThemeLogo';
import { useTheme } from '../../contexts/ThemeContext';
import {
  LogOut, ChevronLeft, Home, ChevronRight,
  BarChart3, FileText, PieChart,
  Settings, Shield, ArrowLeft, Users, CalendarDays, RefreshCw
} from 'lucide-react';
import SkipLink from '../ui/SkipLink';

const iconMap = { BarChart3, FileText, PieChart, CalendarDays };

const breadcrumbMap = {
  '/admin/tracking/monitoring-spd': 'Monitoring SPD',
  '/admin/tracking/perjadin': 'Perjadin',
  '/admin/tracking/laporan': 'Laporan',
  '/admin/tracking/jadwal-jumat': 'Jadwal Jumat',
};

function SidebarContent({ collapsed, isMobile = false, user, handleLogout, setMobileOpen, handleSwitchToUser, handleSwitchToSuperadmin }) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pb-2 pt-6 flex justify-center items-center min-h-[5rem]">
        <Link to="/admin/tracking/monitoring-spd" aria-label="Kembali ke home" className="inline-flex items-center rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30">
          <img
            src={collapsed && !isMobile ? "/djp.png" : "/logo.png"}
            alt="Logo BOOKOLAKA"
            className={`object-contain transition-all duration-300 ${collapsed && !isMobile ? 'h-8' : 'h-12 w-auto'}`}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='80' viewBox='0 0 240 80'%3E%3Crect width='240' height='80' rx='12' fill='rgba(255,255,255,0.1)' stroke='rgba(255,255,255,0.2)' stroke-width='2'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' font-weight='bold' fill='rgba(255,255,255,0.6)'%3ELogo%3C/text%3E%3C/svg%3E";
            }}
          />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_TRACKING_ADMIN.map((item) => {
          const Icon = iconMap[item.icon];
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={isMobile ? () => setMobileOpen(false) : undefined}
              title={collapsed && !isMobile ? item.label : undefined}
              className={({ isActive }) =>
                `relative flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-heading font-semibold transition-all duration-200 ${isActive
                  ? 'bg-emerald-600/30 text-white shadow-lg shadow-black/10'
                  : 'text-white/70 hover:bg-emerald-600/20 hover:text-white'
                } ${collapsed && !isMobile ? 'justify-center' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-emerald-400" />
                  )}
                  {Icon && (
                    <div className="relative flex-shrink-0">
                      <Icon size={20} />
                    </div>
                  )}
                  {(!collapsed || isMobile) && <span>{item.label}</span>}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-white/8 px-3 py-4">
        {(!collapsed || isMobile) && (
          <Link to="/admin/tracking/settings" onClick={isMobile ? () => setMobileOpen(false) : undefined} className="block rounded-[1.2rem] border border-white/8 bg-white/6 px-4 py-3 backdrop-blur-sm transition-colors hover:bg-white/10">
            <p className="truncate text-sm font-heading font-bold text-white">{user?.name || 'Administrator'}</p>
            <p className="mt-1 truncate text-xs font-semibold text-emerald-400">{user?.role === 'superadmin' ? 'Superadmin (Admin Mode)' : user?.role === 'admin' ? 'Admin' : 'Pegawai'}</p>
            <p className="mt-1 truncate text-[10px] uppercase tracking-widest text-white/45">{user?.jabatan || 'Subbagian Umum'}</p>
          </Link>
        )}
        {user?.role === 'admin' && (
          <button
            onClick={handleSwitchToUser}
            title={collapsed ? 'Mode Pegawai' : undefined}
            className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 transition-colors ${collapsed && !isMobile ? 'justify-center' : ''}`}
          >
            <Users size={20} className="flex-shrink-0" />
            {(!collapsed || isMobile) && <span>Mode Pegawai</span>}
          </button>
        )}
        {user?.role === 'superadmin' && (
          <button
            onClick={handleSwitchToSuperadmin}
            title={collapsed ? 'Mode Superadmin' : undefined}
            className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-white bg-red-500/80 hover:bg-red-500 transition-colors ${collapsed && !isMobile ? 'justify-center' : ''}`}
          >
            <Shield size={20} className="flex-shrink-0" />
            {(!collapsed || isMobile) && <span>Mode Superadmin</span>}
          </button>
        )}
        <Link
          to="/select-service"
          title={collapsed ? 'Ganti Layanan' : undefined}
          className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-white/80 bg-white/10 hover:bg-white/20 hover:text-white transition-colors ${collapsed && !isMobile ? 'justify-center' : ''}`}
        >
          <ArrowLeft size={20} className="flex-shrink-0" />
          {(!collapsed || isMobile) && <span>Ganti Layanan</span>}
        </Link>
        <button
          onClick={handleLogout}
          title={collapsed ? 'Keluar' : undefined}
          className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-white/60 transition-colors hover:bg-white/10 hover:text-white ${collapsed && !isMobile ? 'justify-center' : ''
            }`}
        >
          <LogOut size={20} className="flex-shrink-0" />
          {(!collapsed || isMobile) && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}

export default function AdminTrackingLayout({ children }) {
  const { user, switchRole, logout } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [trackingMenuOpen, setTrackingMenuOpen] = useState(false);
  const trackingMenuRef = useRef(null);
  const refreshCache = useRefreshCache();

  useEffect(() => {
    function handleClickOutside(event) {
      if (trackingMenuRef.current && !trackingMenuRef.current.contains(event.target)) {
        setTrackingMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    navigate('/user/tracking/dashboard');
  };

  const handleSwitchToSuperadmin = () => {
    switchRole('superadmin');
    navigate('/superadmin/dashboard');
  };

  const handleRefreshCache = async () => {
    try {
      showLoading('Memperbarui data dari Google Sheets...');
      await refreshCache.mutateAsync();
      toast.success('Data berhasil di-refresh dari Google Sheets');
    } catch {
      toast.error('Gagal me-refresh data');
    } finally {
      hideLoading();
    }
  };

  const currentLabel = breadcrumbMap[location.pathname] || 'Monitoring SPD';

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-[color:var(--color-bg-main)]">
      <SkipLink />
      <aside
        className={`fixed left-0 top-0 z-30 hidden h-screen flex-col bg-[linear-gradient(180deg,#0f4c3a_0%,#0a3328_100%)] shadow-[var(--shadow-sidebar)] transition-all duration-300 lg:flex ${collapsed ? 'w-[72px]' : 'w-[250px]'
          }`}
      >
        <SidebarContent collapsed={collapsed} user={user} handleLogout={handleLogout} setMobileOpen={setMobileOpen} handleSwitchToUser={handleSwitchToUser} handleSwitchToSuperadmin={handleSwitchToSuperadmin} />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 flex h-7 w-7 items-center justify-center rounded-full border shadow-sm transition-colors text-[color:var(--color-text-soft)] hover:text-[color:var(--color-heading)]"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
        >
          <ChevronLeft size={12} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </aside>

      <div className={`lg:hidden fixed inset-0 z-40 transition-visibility ${mobileOpen ? 'visible' : 'invisible'}`}>
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={`absolute left-0 top-0 h-full w-[280px] bg-[linear-gradient(180deg,#0f4c3a_0%,#0a3328_100%)] shadow-2xl transition-transform duration-300 ease-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <SidebarContent collapsed={collapsed} isMobile user={user} handleLogout={handleLogout} setMobileOpen={setMobileOpen} handleSwitchToUser={handleSwitchToUser} handleSwitchToSuperadmin={handleSwitchToSuperadmin} />
        </aside>
      </div>

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-[250px]'}`}>
        <header className="sticky top-0 z-20 flex min-h-[4.5rem] flex-wrap items-center justify-between gap-4 border-b px-4 pb-3 pt-[max(env(safe-area-inset-top),12px)] shadow-[var(--shadow-navbar)] backdrop-blur-xl sm:px-6" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-shell)' }}>
          <div className="flex items-center gap-3">
            <Link to="/admin/tracking/monitoring-spd" className="mr-2 inline-flex items-center lg:hidden focus:outline-none focus:ring-2 focus:ring-emerald-500/30 rounded-lg">
              <ThemeLogo className="h-8" />
            </Link>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5 text-sm">
                <Home size={14} className="text-[color:var(--color-text-soft)]" />
                <ChevronRight size={12} className="text-[color:var(--color-text-soft)]" />
                <span className="font-heading font-semibold text-[color:var(--color-text-muted)]">Tracking SPD</span>
                <ChevronRight size={12} className="text-[color:var(--color-text-soft)]" />
                <span className="font-heading font-semibold text-emerald-600 dark:text-emerald-400">{currentLabel}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Theme Toggle removed to prevent duplication with floating button */}
          </div>
        </header>

        <main id="main-content" tabIndex={-1} className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8 pb-32 lg:pb-8 relative z-10">
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
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[9999]">
        <div className="relative flex justify-around items-center h-[4.5rem] bg-[color:var(--color-surface-elevated)]/90 backdrop-blur-xl border-t rounded-t-[1.5rem] shadow-[0_-8px_20px_rgba(0,0,0,0.08)] px-2 pb-safe" style={{ borderColor: 'var(--color-border)' }}>
          
          {/* Tracking with Drop-up */}
          <div ref={trackingMenuRef} className="relative flex h-full items-center justify-center w-12">
            <button 
              onClick={() => setTrackingMenuOpen(!trackingMenuOpen)}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${['/admin/tracking/monitoring-spd', '/admin/tracking/perjadin'].includes(location.pathname) ? 'text-emerald-600' : 'text-[color:var(--color-text-soft)] hover:text-[color:var(--color-text-muted)]'}`}
            >
              <motion.div whileTap={{ scale: 0.85 }} className="flex flex-col items-center justify-center w-full h-full gap-1">
                <BarChart3 size={20} strokeWidth={2.5} />
                <span className="text-[10px] font-bold">Tracking</span>
              </motion.div>
            </button>

            {/* Drop-up Menu */}
            <AnimatePresence>
              {trackingMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-[calc(100%+10px)] left-0 w-44 rounded-2xl border p-2 shadow-2xl"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
                >
                  <NavLink
                    to="/admin/tracking/monitoring-spd"
                    onClick={() => setTrackingMenuOpen(false)}
                    className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${isActive ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'text-[color:var(--color-heading)] hover:bg-[color:var(--color-surface-muted)]'}`}
                  >
                    <BarChart3 size={16} /> SPD
                  </NavLink>
                  <NavLink
                    to="/admin/tracking/perjadin"
                    onClick={() => setTrackingMenuOpen(false)}
                    className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors mt-1 ${isActive ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'text-[color:var(--color-heading)] hover:bg-[color:var(--color-surface-muted)]'}`}
                  >
                    <FileText size={16} /> Perjadin
                  </NavLink>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Jadwal */}
          <NavLink to="/admin/tracking/jadwal-jumat" className={({ isActive }) => `flex flex-col items-center justify-center w-12 h-full transition-colors ${isActive ? 'text-emerald-600' : 'text-[color:var(--color-text-soft)] hover:text-[color:var(--color-text-muted)]'}`}>
            <motion.div whileTap={{ scale: 0.85 }} className="flex flex-col items-center justify-center w-full h-full gap-1">
              <CalendarDays size={20} strokeWidth={2.5} />
              <span className="text-[10px] font-bold">Jadwal</span>
            </motion.div>
          </NavLink>

          {/* Spacer for center button */}
          <div className="w-16"></div>

          {/* Central Prominent Button for Refresh */}
          <button 
            onClick={handleRefreshCache}
            disabled={refreshCache.isPending}
            className="absolute left-1/2 -top-6 -translate-x-1/2 rounded-full border-[6px]"
            style={{ borderColor: 'var(--color-bg-main)' }}
          >
            <motion.div whileTap={{ scale: 0.9 }} className="flex h-[4.2rem] w-[4.2rem] items-center justify-center rounded-full bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-xl shadow-emerald-500/40">
              <div className="relative flex items-center justify-center">
                <RefreshCw size={24} strokeWidth={2.5} className={`text-white relative z-10 ${refreshCache.isPending ? 'animate-spin' : ''}`} />
              </div>
            </motion.div>
          </button>

          <NavLink to="/admin/tracking/laporan" className={({ isActive }) => `flex flex-col items-center justify-center w-12 h-full transition-colors ${isActive ? 'text-emerald-600' : 'text-[color:var(--color-text-soft)] hover:text-[color:var(--color-text-muted)]'}`}>
            <motion.div whileTap={{ scale: 0.85 }} className="flex flex-col items-center justify-center w-full h-full gap-1">
              <PieChart size={20} strokeWidth={2.5} />
              <span className="text-[10px] font-bold">Laporan</span>
            </motion.div>
          </NavLink>

          <NavLink to="/admin/tracking/settings" className={({ isActive }) => `flex flex-col items-center justify-center w-12 h-full transition-colors ${isActive ? 'text-emerald-600' : 'text-[color:var(--color-text-soft)] hover:text-[color:var(--color-text-muted)]'}`}>
            <motion.div whileTap={{ scale: 0.85 }} className="flex flex-col items-center justify-center w-full h-full gap-1">
              <Settings size={20} strokeWidth={2.5} />
              <span className="text-[10px] font-bold">Settings</span>
            </motion.div>
          </NavLink>
        </div>
      </div>

      {/* Floating Theme Toggle */}
      <div className="hidden lg:block fixed bottom-6 right-6 z-50">
        <ThemeToggle iconOnly={true} className="shadow-xl shadow-black/10 hover:-translate-y-1 transition-all duration-300 bg-[color:var(--color-surface-elevated)] border-[color:var(--color-border)]" />
      </div>
    </div>
  );
}
