import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAbly } from '../../contexts/AblyProvider';
import { useAuth } from '../../contexts/AuthContext';
import { useBooking } from '../../contexts/BookingContext';
import { useLoading } from '../../contexts/LoadingContext';
import { NAV_ADMIN } from '../../utils/constants';
import ThemeToggle from '../ui/ThemeToggle';
import ThemeLogo from '../ui/ThemeLogo';
import { useTheme } from '../../contexts/ThemeContext';
import {
  Menu, LogOut, ChevronLeft, Bell, Home, ChevronRight,
  LayoutDashboard, ClipboardCheck, Car, Users, FileSpreadsheet, MessageCircle,
  Settings, Plus, Shield, ArrowLeft,
} from 'lucide-react';
import BookingModalFlow from '../shared/BookingModalFlow';
import SkipLink from '../ui/SkipLink';

const iconMap = { LayoutDashboard, ClipboardCheck, Car, Users, FileSpreadsheet, MessageCircle };

// Map path to breadcrumb label
const breadcrumbMap = {
  '/admin/dashboard': 'Beranda',
  '/admin/requests': 'Persetujuan',
  '/admin/fleet': 'Manajemen Armada',
  '/admin/drivers': 'Manajemen Pengemudi',
  '/admin/reports': 'Laporan & Ekspor',
};

function SidebarContent({ collapsed, isMobile = false, user, handleLogout, setMobileOpen, hasUnreadChat, handleSwitchToUser, handleSwitchToSuperadmin }) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pb-2 pt-6 flex justify-center items-center min-h-[5rem]">
        <Link to="/admin/dashboard" aria-label="Kembali ke home" className="inline-flex items-center rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30">
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
        {NAV_ADMIN.map((item) => {
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
                    <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-djp-yellow" />
                  )}
                  {Icon && (
                    <div className="relative flex-shrink-0">
                      <Icon size={20} />
                      {item.path === '/admin/chat' && hasUnreadChat && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      )}
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
        <div className="mb-2 hidden">
        </div>
        {(!collapsed || isMobile) && (
          <Link to="/admin/settings" onClick={isMobile ? () => setMobileOpen(false) : undefined} className="block rounded-[1.2rem] border border-white/8 bg-white/6 px-4 py-3 backdrop-blur-sm transition-colors hover:bg-white/10">
            <p className="truncate text-sm font-heading font-bold text-white">{user?.name || 'Administrator'}</p>
            <p className="mt-1 truncate text-xs font-semibold text-djp-yellow">{user?.role === 'superadmin' ? 'Superadmin (Admin Mode)' : user?.role === 'admin' ? 'Admin' : 'Pegawai'}</p>
            <p className="mt-1 truncate text-[10px] uppercase tracking-widest text-white/45">{user?.jabatan || 'Subbagian Umum'}</p>
          </Link>
        )}
        {user?.role === 'admin' && (
          <button
            onClick={handleSwitchToUser}
            title={collapsed ? 'Mode Pegawai' : undefined}
            className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-slate-900 bg-djp-yellow hover:bg-yellow-400 transition-colors ${collapsed && !isMobile ? 'justify-center' : ''}`}
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

export default function AdminLayout({ children }) {
  const { user, switchRole, logout } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  const { getPendingBookings, getReviewNotifications, markReviewAsRead } = useBooking();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const { isDark } = useTheme();

  const notifRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (location.pathname === '/admin/chat') {
      setHasUnreadChat(false);
    }
  }, [location.pathname]);

  const { subscribe } = useAbly();

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) return;

    const unsubscribe = subscribe('chat:admin', 'new_message', (msg) => {
      const newMsg = msg.data;
      if (newMsg.senderId !== user.id && window.location.pathname !== '/admin/chat') {
        setHasUnreadChat(true);
      }
    });

    return unsubscribe;
  }, [user, subscribe]);

  const pending = getPendingBookings();
  const reviewNotifs = getReviewNotifications();
  const totalNotifs = pending.length + reviewNotifs.length;

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

  const handleNotifClick = (bookingId) => {
    setNotifOpen(false);
    navigate('/admin/requests', { state: { openBookingId: bookingId } });
  };

  const handleReviewNotifClick = async (bookingId) => {
    await markReviewAsRead(bookingId);
    setNotifOpen(false);
    navigate('/admin/requests', { state: { openBookingId: bookingId } });
  };

  const currentLabel = breadcrumbMap[location.pathname] || 'Beranda';

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-[color:var(--color-bg-main)]">
      <SkipLink />
      <aside
        className={`fixed left-0 top-0 z-30 hidden h-screen flex-col bg-[linear-gradient(180deg,#182553_0%,#101b3d_100%)] shadow-[var(--shadow-sidebar)] transition-all duration-300 lg:flex ${collapsed ? 'w-[72px]' : 'w-[250px]'
          }`}
      >
        <SidebarContent collapsed={collapsed} user={user} handleLogout={handleLogout} setMobileOpen={setMobileOpen} hasUnreadChat={hasUnreadChat} handleSwitchToUser={handleSwitchToUser} handleSwitchToSuperadmin={handleSwitchToSuperadmin} />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 flex h-7 w-7 items-center justify-center rounded-full border shadow-sm transition-colors text-[color:var(--color-text-soft)] hover:text-[color:var(--color-heading)]"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
        >
          <ChevronLeft size={12} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </aside>

      {/* Mobile sidebar — always in DOM, uses transform to slide */}
      <div
        className={`lg:hidden fixed inset-0 z-40 transition-visibility ${mobileOpen ? 'visible' : 'invisible'}`}
      >
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={`absolute left-0 top-0 h-full w-[280px] bg-[linear-gradient(180deg,#182553_0%,#101b3d_100%)] shadow-2xl transition-transform duration-300 ease-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <SidebarContent collapsed={collapsed} isMobile user={user} handleLogout={handleLogout} setMobileOpen={setMobileOpen} hasUnreadChat={hasUnreadChat} handleSwitchToUser={handleSwitchToUser} handleSwitchToSuperadmin={handleSwitchToSuperadmin} />
        </aside>
      </div>

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-[250px]'}`}>
        <header className="sticky top-0 z-20 flex min-h-[4.5rem] flex-wrap items-center justify-between gap-4 border-b px-4 pb-3 pt-[max(env(safe-area-inset-top),12px)] shadow-[var(--shadow-navbar)] backdrop-blur-xl sm:px-6" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-shell)' }}>
          <div className="flex items-center gap-3">
            <Link to="/admin/dashboard" className="mr-2 inline-flex items-center lg:hidden focus:outline-none focus:ring-2 focus:ring-djp-blue/30 rounded-lg">
              <ThemeLogo className="h-8" />
            </Link>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5 text-sm">
                <Home size={14} className="text-[color:var(--color-text-soft)]" />
                <ChevronRight size={12} className="text-[color:var(--color-text-soft)]" />
                <span className="font-heading font-semibold text-[color:var(--color-text-muted)]">Admin</span>
                <ChevronRight size={12} className="text-[color:var(--color-text-soft)]" />
                <span className="font-heading font-semibold text-[color:var(--color-brand)]">{currentLabel}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative flex h-11 w-11 items-center justify-center rounded-full border text-[color:var(--color-text-soft)] transition-colors hover:text-djp-blue"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
            >
              <Bell size={20} />
              {totalNotifs > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-danger rounded-full border-2 border-[color:var(--color-surface-elevated)] animate-pulse" />
              )}
            </button>

            {notifOpen && (
              <div className="fixed left-2 right-2 top-20 z-50 sm:absolute sm:left-auto sm:right-0 sm:top-14 w-auto sm:w-80 overflow-hidden rounded-3xl border shadow-2xl animate-fade-in" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
                <div className="border-b px-4 py-3" style={{ borderColor: 'var(--color-border)', background: 'color-mix(in srgb, var(--color-surface-muted) 65%, transparent)' }}>
                  <h3 className="font-heading font-bold text-[color:var(--color-heading)]">Notifikasi</h3>
                  <p className="text-xs text-[color:var(--color-text-soft)]">{totalNotifs} notifikasi baru</p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {totalNotifs === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-[color:var(--color-text-soft)]">
                      Tidak ada notifikasi baru
                    </div>
                  ) : (
                    <>
                      {pending.map((req) => (
                        <button
                          key={req.id}
                          onClick={() => handleNotifClick(req.id)}
                          className="w-full border-b p-4 text-left transition-colors hover:bg-[color:var(--color-surface-muted)]"
                          style={{ borderColor: 'color-mix(in srgb, var(--color-border) 55%, transparent)' }}
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-heading font-semibold text-[color:var(--color-heading)]">{req.userName}</p>
                            <span className="text-[10px] text-[color:var(--color-text-soft)]">#{req.id.slice(-6)}</span>
                          </div>
                          <p className="mt-1 text-xs font-medium text-djp-blue line-clamp-1">{req.keperluan}</p>
                          <div className="mt-1 flex items-center justify-between text-[11px] text-[color:var(--color-text-soft)]">
                            <span>Menunggu persetujuan</span>
                            <span>{new Date(req.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </button>
                      ))}
                      {reviewNotifs.map((req) => (
                        <button
                          key={`rev-${req.id}`}
                          onClick={() => handleReviewNotifClick(req.id)}
                          className="w-full border-b p-4 text-left transition-colors last:border-0 hover:bg-[color:var(--color-surface-muted)]"
                          style={{ borderColor: 'color-mix(in srgb, var(--color-border) 55%, transparent)' }}
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-heading font-semibold text-[color:var(--color-heading)]">{req.userName}</p>
                            <span className="text-[10px] text-[color:var(--color-text-soft)]">#{req.id.slice(-6)}</span>
                          </div>
                          <p className="mt-1 text-xs font-medium text-purple-600 line-clamp-1">Review: {req.reviewNotes}</p>
                          <div className="mt-1 flex items-center justify-between text-[11px] text-[color:var(--color-text-soft)]">
                            <span>Selesai dengan Catatan</span>
                            <span>{new Date(req.updatedAt || req.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        <main id="main-content" tabIndex={-1} className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8 animate-fade-in pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40">
        <div className="relative flex justify-around items-center h-[4.5rem] bg-[color:var(--color-surface-elevated)]/90 backdrop-blur-xl border-t rounded-t-[1.5rem] shadow-[0_-8px_20px_rgba(0,0,0,0.08)] px-2 pb-safe" style={{ borderColor: 'var(--color-border)' }}>
          <NavLink to="/admin/dashboard" className={({ isActive }) => `flex flex-col items-center justify-center w-14 h-full transition-colors ${isActive ? 'text-djp-blue' : 'text-[color:var(--color-text-soft)] hover:text-[color:var(--color-text-muted)]'}`}>
            <motion.div whileTap={{ scale: 0.85 }} className="flex flex-col items-center justify-center w-full h-full gap-1">
              <Home size={20} strokeWidth={2.5} />
              <span className="text-[10px] font-bold">Beranda</span>
            </motion.div>
          </NavLink>
          
          <NavLink to="/admin/chat" className={({ isActive }) => `flex flex-col items-center justify-center w-14 h-full transition-colors ${isActive ? 'text-djp-blue' : 'text-[color:var(--color-text-soft)] hover:text-[color:var(--color-text-muted)]'}`}>
            <motion.div whileTap={{ scale: 0.85 }} className="flex flex-col items-center justify-center w-full h-full gap-1">
              <div className="relative">
                <MessageCircle size={20} strokeWidth={2.5} />
                {hasUnreadChat && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
              </div>
              <span className="text-[10px] font-bold">Chat</span>
            </motion.div>
          </NavLink>

          <div className="w-16"></div>

          <button 
            onClick={() => setActionModalOpen(true)}
            className="absolute left-1/2 -top-6 -translate-x-1/2 rounded-full border-[6px]"
            style={{ borderColor: 'var(--color-bg-main)' }}
          >
            <motion.div whileTap={{ scale: 0.9 }} className="flex h-[4.2rem] w-[4.2rem] items-center justify-center rounded-full bg-gradient-to-b from-djp-blue to-blue-600 text-white shadow-xl shadow-djp-blue/40">
              <div className="relative flex items-center justify-center">
                 <Car size={28} strokeWidth={2} className="text-white relative z-10" />
                 <div className="absolute -top-1 -right-2 bg-djp-yellow text-djp-blue-dark rounded-full shadow-sm z-20" style={{ padding: '2px' }}>
                   <Plus size={12} strokeWidth={4} />
                 </div>
              </div>
            </motion.div>
          </button>

          <NavLink to="/admin/reports" className={({ isActive }) => `flex flex-col items-center justify-center w-14 h-full transition-colors ${isActive ? 'text-djp-blue' : 'text-[color:var(--color-text-soft)] hover:text-[color:var(--color-text-muted)]'}`}>
            <motion.div whileTap={{ scale: 0.85 }} className="flex flex-col items-center justify-center w-full h-full gap-1">
              <FileSpreadsheet size={20} strokeWidth={2.5} />
              <span className="text-[10px] font-bold">Laporan</span>
            </motion.div>
          </NavLink>

          <NavLink to="/admin/settings" className={({ isActive }) => `flex flex-col items-center justify-center w-14 h-full transition-colors ${isActive ? 'text-djp-blue' : 'text-[color:var(--color-text-soft)] hover:text-[color:var(--color-text-muted)]'}`}>
            <motion.div whileTap={{ scale: 0.85 }} className="flex flex-col items-center justify-center w-full h-full gap-1">
              <Settings size={20} strokeWidth={2.5} />
              <span className="text-[10px] font-bold">Settings</span>
            </motion.div>
          </NavLink>
        </div>
      </div>

      {/* Action Modal */}
      {actionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-fade-in" onClick={() => setActionModalOpen(false)} />
          <div className="relative w-full rounded-t-3xl bg-[color:var(--color-surface)] sm:w-96 sm:rounded-3xl p-6 pb-safe shadow-2xl animate-slide-up sm:animate-scale-in">
            <div className="w-12 h-1.5 bg-[color:var(--color-border)] rounded-full mx-auto mb-6 sm:hidden" />
            <h3 className="text-lg font-heading font-bold mb-6 text-[color:var(--color-heading)] text-center">Pilih Tindakan</h3>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => { setActionModalOpen(false); setBookingModalOpen(true); }} className="flex flex-col items-center gap-3 p-4 rounded-[1.25rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface-elevated)] hover:bg-djp-blue/5 hover:border-djp-blue/30 transition-all active:scale-95">
                <div className="w-12 h-12 rounded-full bg-djp-blue/10 flex items-center justify-center text-djp-blue"><Car size={24} /></div>
                <span className="text-sm font-semibold text-center text-[color:var(--color-heading)]">Peminjaman<br/>(Mandatory)</span>
              </button>
              <button onClick={() => { setActionModalOpen(false); navigate('/admin/requests'); }} className="flex flex-col items-center gap-3 p-4 rounded-[1.25rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface-elevated)] hover:bg-djp-blue/5 hover:border-djp-blue/30 transition-all active:scale-95">
                <div className="w-12 h-12 rounded-full bg-djp-blue/10 flex items-center justify-center text-djp-blue"><ClipboardCheck size={24} /></div>
                <span className="text-sm font-semibold text-center text-[color:var(--color-heading)]">Daftar<br/>Persetujuan</span>
              </button>
            </div>
            <button onClick={() => setActionModalOpen(false)} className="mt-6 w-full py-3.5 rounded-2xl font-bold text-[color:var(--color-text-muted)] bg-[color:var(--color-surface-muted)] hover:bg-[color:var(--color-border)] transition-colors">Batal</button>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      <BookingModalFlow 
        isOpen={bookingModalOpen} 
        onClose={() => setBookingModalOpen(false)} 
        selectedDate={null} 
        dateBookings={[]} 
        isAdmin={true}
      />
      {/* Floating Theme Toggle (Bottom Right) */}
      <div className="hidden lg:block fixed bottom-6 right-6 z-50">
        <ThemeToggle iconOnly={true} className="shadow-xl shadow-black/10 hover:-translate-y-1 transition-all duration-300 bg-[color:var(--color-surface-elevated)] border-[color:var(--color-border)]" />
      </div>
    </div>
  );
}
