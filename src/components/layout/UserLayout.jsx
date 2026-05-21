import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useBooking } from '../../contexts/BookingContext';
import { NAV_USER } from '../../utils/constants';
import { LogOut, ChevronDown, LayoutDashboard, CalendarPlus, ClipboardList, Bell, Home, CalendarDays, MessageSquareText, CircleUser, Car, Plus } from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle';
import ThemeLogo from '../ui/ThemeLogo';
import { useTheme } from '../../contexts/ThemeContext';
import { getInitials } from '../../utils/helpers';
import ChatWidget from '../chat/ChatWidget';
import BookingModalFlow from '../shared/BookingModalFlow';

const iconMap = { LayoutDashboard, CalendarPlus, ClipboardList };

export default function UserLayout({ children }) {
  const { user, logout, switchRole } = useAuth();
  const { getUserBookings } = useBooking();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const { isDark } = useTheme();

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const myBookings = user ? getUserBookings(user.id) : [];
  const notifBookings = myBookings.filter(b => b.status === 'Disetujui' || b.status === 'Ditolak').slice(0, 5);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSwitchToAdmin = () => {
    switchRole('admin');
    navigate('/admin/dashboard');
  };

  const handleNotifClick = (bookingId) => {
    setNotifOpen(false);
    navigate('/user/my-bookings', { state: { openBookingId: bookingId } });
  };

  return (
    <div className="min-h-screen bg-[color:var(--color-bg-main)] min-w-0 overflow-x-hidden pb-24 md:pb-0">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-40 border-b backdrop-blur-xl shadow-[var(--shadow-navbar)] pt-[max(env(safe-area-inset-top),0px)]" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-shell)' }}>
        <div className="app-shell relative">
          <div className="flex min-h-[4rem] flex-wrap items-center justify-between gap-3 py-2 md:py-3">
            <div className="flex items-center gap-3">
              <Link to="/user/dashboard" aria-label="Kembali ke home" className="inline-flex items-center rounded-lg focus:outline-none focus:ring-2 focus:ring-djp-blue/30">
                <ThemeLogo className="h-8 md:h-10" />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2 rounded-full border p-1.5" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-muted)' }}>
              {NAV_USER.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `relative inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-heading font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-[color:var(--color-surface-elevated)] text-[color:var(--color-brand)] shadow-sm'
                        : 'text-[color:var(--color-text-muted)] hover:text-[color:var(--color-brand)]'
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
                      {isActive && <span className="absolute inset-x-5 -bottom-1 h-0.5 rounded-full bg-djp-yellow" />}
                    </>
                  )}
                </NavLink>
              ))}
            </div>

            {/* Desktop Profile & Notif */}
            <div className="hidden md:flex items-center gap-3 relative">
              <button 
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative flex h-11 w-11 items-center justify-center rounded-full border text-[color:var(--color-text-soft)] transition-colors hover:text-djp-blue"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
              >
                <Bell size={18} />
                {notifBookings.length > 0 && (
                  <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-danger border-2 border-[color:var(--color-surface-elevated)] animate-pulse" />
                )}
              </button>

              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-3 rounded-full border px-3 py-2 text-[color:var(--color-text-muted)] transition-colors hover:border-djp-blue/20"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-djp-blue/10">
                    <span className="text-sm font-heading font-bold text-djp-blue">{getInitials(user?.name)}</span>
                  </div>
                  <div className="text-left">
                    <p className="max-w-[100px] truncate text-sm font-heading font-bold text-[color:var(--color-heading)]">{user?.name}</p>
                    <p className="max-w-[100px] truncate text-xs text-[color:var(--color-text-soft)]">{user?.jabatan || 'Seksi Umum'}</p>
                  </div>
                  <ChevronDown size={14} className={`transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {profileOpen && (
                  <>
                    <div className="absolute right-0 top-[3.75rem] z-20 w-64 rounded-3xl border p-2 shadow-2xl animate-scale-in" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
                      <Link 
                        to="/user/account"
                        onClick={() => setProfileOpen(false)}
                        className="block rounded-2xl px-4 py-3 transition-colors hover:bg-[color:var(--color-surface)] border border-transparent hover:border-[color:var(--color-border)]" 
                        style={{ background: 'var(--color-surface-muted)' }}
                      >
                        <p className="truncate text-sm font-heading font-bold text-[color:var(--color-heading)] group-hover:text-djp-blue transition-colors">{user?.name}</p>
                        <p className="mt-1 text-xs leading-5 text-[color:var(--color-text-soft)]">{user?.jabatan}</p>
                      </Link>
                      {user?.role === 'admin' && (
                        <button
                          onClick={handleSwitchToAdmin}
                          className="mt-2 flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-djp-blue bg-djp-yellow hover:bg-yellow-400 transition-colors"
                        >
                          <CircleUser size={16} />
                          Mode Admin
                        </button>
                      )}
                      <button
                        onClick={handleLogout}
                        className="mt-2 flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-danger transition-colors hover:bg-danger-light"
                      >
                        <LogOut size={16} />
                        Keluar
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Mobile Top Header (Notifications) */}
            <div className="flex items-center gap-2 md:hidden">
              <button 
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative flex h-10 w-10 items-center justify-center rounded-full border text-[color:var(--color-text-soft)] transition-colors hover:text-djp-blue"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
              >
                <Bell size={18} />
                {notifBookings.length > 0 && (
                  <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-danger border-2 border-[color:var(--color-surface-elevated)] animate-pulse" />
                )}
              </button>
            </div>
            
            {/* Shared Notification Dropdown (Desktop & Mobile) */}
            {notifOpen && (
              <>
                <div ref={notifRef} className="absolute right-4 md:right-0 top-[4.5rem] md:top-[110%] z-50 w-80 overflow-hidden rounded-3xl border shadow-2xl animate-fade-in" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
                  <div className="border-b px-4 py-3" style={{ borderColor: 'var(--color-border)', background: 'color-mix(in srgb, var(--color-surface-muted) 65%, transparent)' }}>
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-heading font-bold text-[color:var(--color-heading)]">Notifikasi</h3>
                        <p className="text-xs text-[color:var(--color-text-soft)]">Status persetujuan terbaru</p>
                      </div>
                    </div>
                  </div>
                  <div className="max-h-[60vh] md:max-h-80 overflow-y-auto">
                    {notifBookings.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-[color:var(--color-text-soft)]">
                        Tidak ada notifikasi baru
                      </div>
                    ) : (
                      notifBookings.map((req) => (
                        <button
                          key={req.id}
                          onClick={() => handleNotifClick(req.id)}
                          className="w-full border-b p-4 text-left transition-colors last:border-0 hover:bg-[color:var(--color-surface-muted)]"
                          style={{ borderColor: 'color-mix(in srgb, var(--color-border) 55%, transparent)' }}
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-heading font-semibold text-[color:var(--color-heading)]">#{req.id.slice(-6)}</p>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${req.status === 'Disetujui' ? 'bg-success-light text-success' : 'bg-danger-light text-danger'}`}>
                              {req.status}
                            </span>
                          </div>
                          <p className="mt-1 line-clamp-1 text-xs font-medium text-[color:var(--color-text-muted)]">{req.keperluan}</p>
                          <div className="mt-1 flex items-center justify-between text-[11px] text-[color:var(--color-text-soft)]">
                            <span>Jadwal: {new Date(req.startTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                            <span>{new Date(req.updatedAt || req.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="app-shell overflow-x-hidden py-6 md:py-8 animate-fade-in relative z-10">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40">
        <div className="relative flex justify-around items-center h-[4.5rem] bg-[color:var(--color-surface-elevated)] border-t rounded-t-[1.5rem] shadow-[0_-8px_20px_rgba(0,0,0,0.08)] px-2 pb-safe" style={{ borderColor: 'var(--color-border)' }}>
          {/* 1. Beranda */}
          <NavLink to="/user/dashboard" className={({ isActive }) => `flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${isActive ? 'text-djp-blue' : 'text-[color:var(--color-text-soft)] hover:text-[color:var(--color-text-muted)]'}`}>
            <Home size={20} strokeWidth={2.5} />
            <span className="text-[10px] font-bold">Beranda</span>
          </NavLink>
          
          {/* 2. Agenda */}
          <NavLink to="/user/my-bookings" className={({ isActive }) => `flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${isActive ? 'text-djp-blue' : 'text-[color:var(--color-text-soft)] hover:text-[color:var(--color-text-muted)]'}`}>
            <CalendarDays size={20} strokeWidth={2.5} />
            <span className="text-[10px] font-bold">Agenda</span>
          </NavLink>

          {/* Spacer for center button */}
          <div className="w-16"></div>

          {/* 3. Central Prominent Button */}
          <button 
            onClick={() => setBookingModalOpen(true)}
            className="absolute left-1/2 -top-6 -translate-x-1/2 flex h-[4.2rem] w-[4.2rem] items-center justify-center rounded-full bg-gradient-to-b from-djp-blue to-blue-600 text-white shadow-xl shadow-djp-blue/40 border-[6px] transition-transform active:scale-95"
            style={{ borderColor: 'var(--color-bg-main)' }}
          >
            <div className="relative flex items-center justify-center">
              <Car size={28} strokeWidth={2} className="text-white relative z-10" />
              <div className="absolute -top-1 -right-2 bg-djp-yellow text-djp-blue-dark rounded-full shadow-sm z-20" style={{ padding: '2px' }}>
                <Plus size={12} strokeWidth={4} />
              </div>
            </div>
          </button>

          {/* 4. Chat */}
          <NavLink to="/user/chat" className={({ isActive }) => `flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${isActive ? 'text-djp-blue' : 'text-[color:var(--color-text-soft)] hover:text-[color:var(--color-text-muted)]'}`}>
            <MessageSquareText size={20} strokeWidth={2.5} />
            <span className="text-[10px] font-bold">Chat</span>
          </NavLink>

          {/* 5. Akun */}
          <NavLink to="/user/account" className={({ isActive }) => `flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${isActive ? 'text-djp-blue' : 'text-[color:var(--color-text-soft)] hover:text-[color:var(--color-text-muted)]'}`}>
            <CircleUser size={20} strokeWidth={2.5} />
            <span className="text-[10px] font-bold">Akun</span>
          </NavLink>
        </div>
      </div>

      {/* Floating Theme Toggle (Desktop only) */}
      <div className="hidden md:block fixed bottom-6 left-6 z-50">
        <ThemeToggle iconOnly={true} className="shadow-xl shadow-black/5 hover:-translate-y-1 transition-all duration-300" />
      </div>
      
      {/* Desktop Chat Widget */}
      <div className="hidden md:block">
        <ChatWidget />
      </div>

      {/* Global Booking Modal for Mobile Center Button */}
      <BookingModalFlow 
        isOpen={bookingModalOpen} 
        onClose={() => setBookingModalOpen(false)} 
        selectedDate={null} 
        dateBookings={[]} 
      />
    </div>
  );
}
