import { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLoading } from '../../contexts/LoadingContext';
import { NAV_SUPERADMIN } from '../../utils/constants';
import ThemeToggle from '../ui/ThemeToggle';
import ThemeLogo from '../ui/ThemeLogo';
import {
  Menu, LogOut, ChevronLeft, Home, ChevronRight,
  Shield, UserCog, Power, ScrollText, Settings, LayoutDashboard,
} from 'lucide-react';

const iconMap = { Shield, UsersCog: UserCog, Power, ScrollText };

const breadcrumbMap = {
  '/superadmin/dashboard': 'Dashboard',
  '/superadmin/accounts': 'Manajemen Akun',
  '/superadmin/service': 'Kontrol Layanan',
  '/superadmin/logs': 'Log Aktivitas',
  '/superadmin/settings': 'Pengaturan',
};

function SidebarContent({ collapsed, isMobile = false, user, handleLogout, setMobileOpen, handleSwitchToAdmin }) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pb-2 pt-6 flex justify-center items-center min-h-[5rem]">
        <Link to="/superadmin/dashboard" aria-label="Kembali ke dashboard" className="inline-flex items-center rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30">
          <img
            src={collapsed && !isMobile ? "/djp.png" : "/logo.png"}
            alt="Logo BOOKOLAKA"
            className={`object-contain transition-all duration-300 ${collapsed && !isMobile ? 'h-8' : 'h-12 w-auto'}`}
          />
        </Link>
      </div>

      {/* Superadmin Badge */}
      {(!collapsed || isMobile) && (
        <div className="mx-3 mb-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">
            🛡️ Superadmin Mode
          </span>
        </div>
      )}

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_SUPERADMIN.map((item) => {
          const Icon = iconMap[item.icon];
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={isMobile ? () => setMobileOpen(false) : undefined}
              title={collapsed && !isMobile ? item.label : undefined}
              className={({ isActive }) =>
                `relative flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-heading font-semibold transition-all duration-200 ${isActive
                  ? 'bg-white/15 text-white shadow-lg shadow-black/10'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
                } ${collapsed && !isMobile ? 'justify-center' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-red-400" />
                  )}
                  {Icon && <Icon size={20} className="flex-shrink-0" />}
                  {(!collapsed || isMobile) && <span>{item.label}</span>}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-white/8 px-3 py-4">
        <div className="mb-2 hidden">
        </div>
        {(!collapsed || isMobile) && (
          <Link to="/superadmin/settings" onClick={isMobile ? () => setMobileOpen(false) : undefined} className="block rounded-[1.2rem] border border-white/8 bg-white/6 px-4 py-3 backdrop-blur-sm transition-colors hover:bg-white/10">
            <p className="truncate text-sm font-heading font-bold text-white">{user?.name || 'Super Admin'}</p>
            <p className="mt-1 truncate text-xs font-semibold text-red-400">Superadmin</p>
          </Link>
        )}
        <button
          onClick={handleSwitchToAdmin}
          title={collapsed ? 'Mode Admin' : undefined}
          className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-djp-blue bg-djp-yellow hover:bg-yellow-400 transition-colors ${collapsed && !isMobile ? 'justify-center' : ''}`}
        >
          <LayoutDashboard size={20} className="flex-shrink-0" />
          {(!collapsed || isMobile) && <span>Mode Admin</span>}
        </button>
        <button
          onClick={handleLogout}
          title={collapsed ? 'Keluar' : undefined}
          className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-white/60 transition-colors hover:bg-white/10 hover:text-white ${collapsed && !isMobile ? 'justify-center' : ''}`}
        >
          <LogOut size={20} className="flex-shrink-0" />
          {(!collapsed || isMobile) && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}

export default function SuperadminLayout({ children }) {
  const { user, switchRole, logout } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    showLoading('Melakukan logout...');
    try {
      await logout();
    } finally {
      hideLoading();
      navigate('/login');
    }
  };

  const handleSwitchToAdmin = () => {
    switchRole('admin');
    navigate('/admin/dashboard');
  };

  const currentLabel = breadcrumbMap[location.pathname] || 'Dashboard';

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-[color:var(--color-bg-main)]">
      {/* Desktop Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-30 hidden h-screen flex-col shadow-[var(--shadow-sidebar)] transition-all duration-300 lg:flex ${collapsed ? 'w-[72px]' : 'w-[250px]'}`}
        style={{ background: 'linear-gradient(180deg, #3b1a2d 0%, #1a0f1f 100%)' }}
      >
        <SidebarContent collapsed={collapsed} user={user} handleLogout={handleLogout} setMobileOpen={setMobileOpen} handleSwitchToAdmin={handleSwitchToAdmin} />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 flex h-7 w-7 items-center justify-center rounded-full border shadow-sm transition-colors text-[color:var(--color-text-soft)] hover:text-[color:var(--color-heading)]"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
        >
          <ChevronLeft size={12} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-[250px]'}`}>
        <header className="sticky top-0 z-20 flex min-h-[4.5rem] flex-wrap items-center justify-between gap-4 border-b px-4 pb-3 pt-[max(env(safe-area-inset-top),12px)] shadow-[var(--shadow-navbar)] backdrop-blur-xl sm:px-6" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-shell)' }}>
          <div className="flex items-center gap-3">
            <Link to="/superadmin/dashboard" className="mr-2 inline-flex items-center lg:hidden focus:outline-none focus:ring-2 focus:ring-djp-blue/30 rounded-lg">
              <ThemeLogo className="h-8" />
            </Link>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5 text-sm">
                <Home size={14} className="text-[color:var(--color-text-soft)]" />
                <ChevronRight size={12} className="text-[color:var(--color-text-soft)]" />
                <span className="font-heading font-semibold text-red-500">Superadmin</span>
                <ChevronRight size={12} className="text-[color:var(--color-text-soft)]" />
                <span className="font-heading font-semibold text-[color:var(--color-brand)]">{currentLabel}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8 animate-fade-in pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40">
        <div className="relative flex justify-around items-center h-[4.5rem] bg-[color:var(--color-surface-elevated)] border-t rounded-t-[1.5rem] shadow-[0_-8px_20px_rgba(0,0,0,0.08)] px-2 pb-safe" style={{ borderColor: 'var(--color-border)' }}>
          <NavLink to="/superadmin/dashboard" className={({ isActive }) => `flex flex-col items-center justify-center w-14 h-full gap-1 transition-colors ${isActive ? 'text-red-500' : 'text-[color:var(--color-text-soft)]'}`}>
            <Shield size={20} strokeWidth={2.5} />
            <span className="text-[10px] font-bold">Beranda</span>
          </NavLink>
          <NavLink to="/superadmin/accounts" className={({ isActive }) => `flex flex-col items-center justify-center w-14 h-full gap-1 transition-colors ${isActive ? 'text-red-500' : 'text-[color:var(--color-text-soft)]'}`}>
            <UserCog size={20} strokeWidth={2.5} />
            <span className="text-[10px] font-bold">Akun</span>
          </NavLink>
          <div className="w-16"></div>

          <NavLink 
            to="/superadmin/service"
            className="absolute left-1/2 -top-6 -translate-x-1/2 flex h-[4.2rem] w-[4.2rem] items-center justify-center rounded-full bg-gradient-to-b from-djp-blue to-blue-600 text-white shadow-xl shadow-djp-blue/40 border-[6px] transition-transform active:scale-95"
            style={{ borderColor: 'var(--color-bg-main)' }}
          >
            <div className="relative flex items-center justify-center">
               <Power size={28} strokeWidth={2} className="text-white relative z-10" />
            </div>
          </NavLink>
          <NavLink to="/superadmin/logs" className={({ isActive }) => `flex flex-col items-center justify-center w-14 h-full gap-1 transition-colors ${isActive ? 'text-red-500' : 'text-[color:var(--color-text-soft)]'}`}>
            <ScrollText size={20} strokeWidth={2.5} />
            <span className="text-[10px] font-bold">Log</span>
          </NavLink>
          <NavLink to="/superadmin/settings" className={({ isActive }) => `flex flex-col items-center justify-center w-14 h-full gap-1 transition-colors ${isActive ? 'text-red-500' : 'text-[color:var(--color-text-soft)]'}`}>
            <Settings size={20} strokeWidth={2.5} />
            <span className="text-[10px] font-bold">Setting</span>
          </NavLink>
        </div>
      </div>
      {/* Floating Theme Toggle (Bottom Right) */}
      <div className="fixed bottom-24 right-4 lg:bottom-6 lg:right-6 z-50">
        <ThemeToggle iconOnly={true} className="shadow-xl shadow-black/10 hover:-translate-y-1 transition-all duration-300 bg-[color:var(--color-surface-elevated)] border-[color:var(--color-border)]" />
      </div>
    </div>
  );
}
