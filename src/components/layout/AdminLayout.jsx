import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Realtime } from 'ably';
import { useAuth } from '../../contexts/AuthContext';
import { useBooking } from '../../contexts/BookingContext';
import { NAV_ADMIN } from '../../utils/constants';
import ThemeToggle from '../ui/ThemeToggle';
import ThemeLogo from '../ui/ThemeLogo';
import { useTheme } from '../../contexts/ThemeContext';
import {
  Menu, LogOut, ChevronLeft, Bell, Home, ChevronRight,
  LayoutDashboard, ClipboardCheck, Car, Users, FileSpreadsheet, MessageCircle,
} from 'lucide-react';

const iconMap = { LayoutDashboard, ClipboardCheck, Car, Users, FileSpreadsheet, MessageCircle };

// Map path to breadcrumb label
const breadcrumbMap = {
  '/admin/dashboard': 'Beranda',
  '/admin/requests': 'Persetujuan',
  '/admin/fleet': 'Manajemen Armada',
  '/admin/drivers': 'Manajemen Pengemudi',
  '/admin/reports': 'Laporan & Ekspor',
};

function SidebarContent({ collapsed, isMobile = false, user, handleLogout, setMobileOpen, hasUnreadChat, handleSwitchToUser }) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pb-2 pt-6 flex justify-center items-center min-h-[5rem]">
        <Link to="/" aria-label="Kembali ke home" className="inline-flex items-center rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30">
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
        <div className="mb-2">
          <ThemeToggle 
            className={`transition-all duration-300 ${
              collapsed && !isMobile 
                ? 'w-11 px-0 justify-center [&>span:last-child]:!hidden' 
                : 'w-full justify-start'
            } border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white hover:border-white/20`}
          />
        </div>
        {(!collapsed || isMobile) && (
          <div className="rounded-[1.2rem] border border-white/8 bg-white/6 px-4 py-3 backdrop-blur-sm">
            <p className="truncate text-sm font-heading font-bold text-white">{user?.name || 'Administrator'}</p>
            <p className="mt-1 truncate text-xs font-semibold text-djp-yellow">{user?.role === 'admin' ? 'Admin' : 'Pegawai'}</p>
            <p className="mt-1 truncate text-[10px] uppercase tracking-widest text-white/45">{user?.jabatan || 'Subbagian Umum'}</p>
          </div>
        )}
        {user?.role === 'admin' && (
          <button
            onClick={handleSwitchToUser}
            title={collapsed ? 'Mode Pegawai' : undefined}
            className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-djp-blue bg-djp-yellow hover:bg-yellow-400 transition-colors ${collapsed && !isMobile ? 'justify-center' : ''}`}
          >
            <Users size={20} className="flex-shrink-0" />
            {(!collapsed || isMobile) && <span>Mode Pegawai</span>}
          </button>
        )}
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
  const { getPendingBookings, getReviewNotifications, markReviewAsRead } = useBooking();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);
  const { isDark } = useTheme();

  useEffect(() => {
    if (location.pathname === '/admin/chat') {
      setHasUnreadChat(false);
    }
  }, [location.pathname]);

  const ablyRef = useRef(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    if (!ablyRef.current) {
      const realtime = new Realtime({
        authCallback: async (tokenParams, callback) => {
          try {
            const response = await fetch('/api/ably/auth', { credentials: 'include' });
            if (!response.ok) throw new Error('Ably auth failed');
            const tokenRequest = await response.json();
            callback(null, tokenRequest);
          } catch (err) {
            callback(err, null);
          }
        }
      });

      const channel = realtime.channels.get('chat:admin');
      channel.subscribe('new_message', (msg) => {
        const newMsg = msg.data;
        if (newMsg.senderId !== user.id && window.location.pathname !== '/admin/chat') {
          setHasUnreadChat(true);
        }
      });

      ablyRef.current = realtime;
    }

    return () => {
      if (ablyRef.current) {
        // Wait a bit before closing to avoid strict mode promise rejection on pending auth
        const currentAbly = ablyRef.current;
        setTimeout(() => {
           if (currentAbly.connection.state !== 'closed') {
             currentAbly.close();
           }
        }, 1000);
        ablyRef.current = null;
      }
    };
  }, [user]);

  const pending = getPendingBookings();
  const reviewNotifs = getReviewNotifications();
  const totalNotifs = pending.length + reviewNotifs.length;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSwitchToUser = () => {
    switchRole('user');
    navigate('/user/dashboard');
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
      <aside
        className={`fixed left-0 top-0 z-30 hidden h-screen flex-col bg-[linear-gradient(180deg,#182553_0%,#101b3d_100%)] shadow-[var(--shadow-sidebar)] transition-all duration-300 lg:flex ${collapsed ? 'w-[72px]' : 'w-[250px]'
          }`}
      >
        <SidebarContent collapsed={collapsed} user={user} handleLogout={handleLogout} setMobileOpen={setMobileOpen} hasUnreadChat={hasUnreadChat} handleSwitchToUser={handleSwitchToUser} />
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
          <SidebarContent collapsed={collapsed} isMobile user={user} handleLogout={handleLogout} setMobileOpen={setMobileOpen} hasUnreadChat={hasUnreadChat} handleSwitchToUser={handleSwitchToUser} />
        </aside>
      </div>

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-[250px]'}`}>
        <header className="sticky top-0 z-20 flex min-h-20 flex-wrap items-center justify-between gap-4 border-b px-4 py-3 shadow-[var(--shadow-navbar)] backdrop-blur-xl sm:px-6" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-shell)' }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-xl border p-2 text-[color:var(--color-text-soft)] hover:bg-[color:var(--color-surface-muted)] lg:hidden"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <Menu size={22} />
            </button>
            <Link to="/admin/dashboard" className="mr-2 inline-flex items-center lg:hidden">
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
          <div className="flex items-center gap-3 relative">
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
              <div className="fixed inset-0 z-40 sm:hidden" onClick={() => setNotifOpen(false)} />
            )}
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

        <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
