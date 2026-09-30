import { useState, useRef, useEffect, useMemo } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useLoading } from '../../contexts/LoadingContext';
import { useQuery } from '@tanstack/react-query';
import { jadwalKepalaApi } from '../../lib/api';
import { 
  LogOut, 
  ChevronDown, 
  CalendarDays, 
  CalendarCheck,
  Calendar,
  Loader2, 
  ArrowLeft, 
  Clock, 
  FileText, 
  CircleUser,
  MessageSquareText,
  MapPin,
  X 
} from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle';
import ThemeLogo from '../ui/ThemeLogo';
import NotificationBell from '../ui/NotificationBell';
import ChatWidget from '../chat/ChatWidget';
import { getInitials } from '../../utils/helpers';
import SkipLink from '../ui/SkipLink';

const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function formatHariTanggal(date) {
  const d = new Date(date);
  return `${DAYS_ID[d.getDay()]}, ${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
}

function formatRentangST(startDateStr, endDateStr) {
  if (!startDateStr) return '—';
  if (!endDateStr || endDateStr === startDateStr) {
    const d = new Date(startDateStr);
    return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
  }
  const s = new Date(startDateStr);
  const e = new Date(endDateStr);
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${s.getDate()} - ${e.getDate()} ${MONTHS_ID[e.getMonth()]} ${e.getFullYear()}`;
  }
  return `${s.getDate()} ${MONTHS_ID[s.getMonth()]} - ${e.getDate()} ${MONTHS_ID[e.getMonth()]} ${e.getFullYear()}`;
}

export default function KepalaKantorJadwalLayout({ children }) {
  const { user, logout } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const currentFilter = searchParams.get('filter') || 'all';
  const [profileOpen, setProfileOpen] = useState(false);
  const [todayModalOpen, setTodayModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const profileRef = useRef(null);

  // Today's Date & Events for Center Button
  const today = useMemo(() => new Date(), []);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const todayStr = useMemo(() => {
    return `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }, [currentYear, currentMonth, today]);

  const { data: calendarData, isLoading: loadingToday } = useQuery({
    queryKey: ['jadwal-kepala', 'calendar', currentMonth, currentYear],
    queryFn: () => jadwalKepalaApi.getCalendar({ month: currentMonth, year: currentYear }).then(res => res.data),
    staleTime: 60 * 1000,
  });

  const todayKegiatan = useMemo(() => {
    return (calendarData?.kegiatan || []).filter(item => item.tanggal === todayStr);
  }, [calendarData, todayStr]);

  const todayST = useMemo(() => {
    return (calendarData?.st || []).filter(item => {
      const start = item.tanggal;
      const end = item.tanggalSelesai || item.tanggal;
      return todayStr >= start && todayStr <= end;
    });
  }, [calendarData, todayStr]);

  const todayTotalCount = todayKegiatan.length + todayST.length;

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

  return (
    <div className="min-h-screen bg-[color:var(--color-bg-main)] min-w-0 overflow-x-hidden pb-32 md:pb-0">
      <SkipLink />
      {/* Top Navigation */}
      <nav role="navigation" aria-label="Navigasi utama" className="sticky top-0 z-40 border-b backdrop-blur-xl shadow-[var(--shadow-navbar)] pt-[max(env(safe-area-inset-top),0px)]" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-shell)' }}>
        <div className="app-shell relative">
          <div className="flex min-h-[4rem] flex-wrap items-center justify-between gap-3 py-2 md:py-3">
            <div className="flex items-center gap-3">
              <Link to="/kepala-kantor/jadwal" aria-label="Kembali ke jadwal" className="inline-flex items-center rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30">
                <ThemeLogo className="h-8 md:h-10" />
              </Link>
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
                    <p className="max-w-[120px] truncate text-xs text-teal-600 dark:text-teal-400 font-medium">{user?.jabatan || 'Kepala Kantor'}</p>
                  </div>
                  <ChevronDown size={14} className={`transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-[3.75rem] z-50 w-64 rounded-3xl border p-2 shadow-2xl animate-scale-in" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
                    <Link
                      to="/kepala-kantor/jadwal/account"
                      onClick={() => setProfileOpen(false)}
                      className="block rounded-2xl px-4 py-3 transition-colors hover:bg-[color:var(--color-surface)] border border-transparent hover:border-[color:var(--color-border)]"
                      style={{ background: 'var(--color-surface-muted)' }}
                    >
                      <p className="truncate text-sm font-heading font-bold text-[color:var(--color-heading)]">{user?.name}</p>
                      <p className="mt-1 text-xs leading-5 text-[color:var(--color-text-soft)]">{user?.jabatan || 'Kepala KPP Pratama Kolaka'}</p>
                    </Link>

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
              to="/kepala-kantor/jadwal/account"
              onClick={() => setProfileOpen(false)}
              className="block rounded-2xl p-3"
              style={{ background: 'var(--color-surface-muted)' }}
            >
              <p className="text-sm font-bold text-[color:var(--color-heading)]">{user?.name}</p>
              <p className="text-xs text-[color:var(--color-text-soft)]">{user?.jabatan || 'Kepala Kantor'}</p>
            </Link>
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
            to="/kepala-kantor/jadwal" 
            end
            className={({ isActive }) => `flex flex-col items-center justify-center w-14 h-full transition-colors ${
              isActive && !location.search.includes('filter=')
                ? 'text-teal-600 dark:text-teal-400' 
                : 'text-[color:var(--color-text-soft)] hover:text-[color:var(--color-text-muted)]'
            }`}
          >
            <motion.div whileTap={{ scale: 0.85 }} className="flex flex-col items-center justify-center w-full h-full gap-1">
              <CalendarDays size={20} strokeWidth={2.5} />
              <span className="text-[10px] font-bold">Kalender</span>
            </motion.div>
          </NavLink>

          {/* 2. Chat */}
          <NavLink 
            to="/kepala-kantor/jadwal/chat" 
            className={({ isActive }) => `flex flex-col items-center justify-center w-14 h-full transition-colors ${
              isActive 
                ? 'text-teal-600 dark:text-teal-400' 
                : 'text-[color:var(--color-text-soft)] hover:text-[color:var(--color-text-muted)]'
            }`}
          >
            <motion.div whileTap={{ scale: 0.85 }} className="flex flex-col items-center justify-center w-full h-full gap-1">
              <MessageSquareText size={20} strokeWidth={2.5} />
              <span className="text-[10px] font-bold">Chat</span>
            </motion.div>
          </NavLink>

          {/* Spacer for center elevated button */}
          <div className="flex flex-col items-center justify-end w-16 h-full pb-1 pointer-events-none">
            <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 mt-auto">Hari Ini</span>
          </div>

          {/* 3. Center Elevated Action Button - Kegiatan Hari Ini */}
          <button 
            onClick={() => setTodayModalOpen(true)}
            aria-label="Kegiatan & ST Hari Ini"
            className="absolute left-1/2 -top-6 -translate-x-1/2 rounded-full border-[6px]"
            style={{ borderColor: 'var(--color-bg-main)' }}
          >
            <motion.div 
              whileTap={{ scale: 0.9 }} 
              className="flex h-[4.2rem] w-[4.2rem] items-center justify-center rounded-full bg-gradient-to-b from-teal-600 to-teal-700 text-white shadow-xl shadow-teal-600/40 relative"
            >
              <div className="relative flex items-center justify-center">
                <CalendarCheck size={26} strokeWidth={2.2} className="text-white relative z-10" />
                {todayTotalCount > 0 && (
                  <span className="absolute -top-2 -right-2.5 flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-amber-400 text-slate-900 text-[10px] font-extrabold shadow-sm border border-white/20 z-20 animate-pulse">
                    {todayTotalCount}
                  </span>
                )}
              </div>
            </motion.div>
          </button>

          {/* 4. Layanan (Pilih Layanan Lain) */}
          <Link 
            to="/select-service" 
            className={`flex flex-col items-center justify-center w-14 h-full transition-colors ${
              location.pathname === '/select-service'
                ? 'text-teal-600 dark:text-teal-400' 
                : 'text-[color:var(--color-text-soft)] hover:text-[color:var(--color-text-muted)]'
            }`}
          >
            <motion.div whileTap={{ scale: 0.85 }} className="flex flex-col items-center justify-center w-full h-full gap-1">
              <ArrowLeft size={20} strokeWidth={2.5} />
              <span className="text-[10px] font-bold">Layanan</span>
            </motion.div>
          </Link>

          {/* 5. Akun */}
          <NavLink 
            to="/kepala-kantor/jadwal/account" 
            className={({ isActive }) => `flex flex-col items-center justify-center w-14 h-full transition-colors ${
              isActive 
                ? 'text-teal-600 dark:text-teal-400' 
                : 'text-[color:var(--color-text-soft)] hover:text-[color:var(--color-text-muted)]'
            }`}
          >
            <motion.div whileTap={{ scale: 0.85 }} className="flex flex-col items-center justify-center w-full h-full gap-1">
              <CircleUser size={20} strokeWidth={2.5} />
              <span className="text-[10px] font-bold">Akun</span>
            </motion.div>
          </NavLink>
        </div>
      </div>

      {/* Popup Kegiatan & ST Hari Ini Modal */}
      <AnimatePresence>
        {todayModalOpen && (
          <div className="fixed inset-0 z-[10000] flex items-end justify-center sm:items-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
              onClick={() => setTodayModalOpen(false)} 
            />
            <motion.div 
              initial={{ y: '100%', opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-full max-w-lg rounded-t-[2rem] sm:rounded-3xl border shadow-2xl overflow-hidden z-10 max-h-[85vh] flex flex-col"
              style={{
                background: 'var(--color-surface-elevated)',
                borderColor: 'var(--color-border)',
                paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)'
              }}
            >
              {/* Drag bar for mobile */}
              <div className="pt-3 pb-1 flex justify-center sm:hidden">
                <div className="w-12 h-1.5 rounded-full bg-[color:var(--color-border)]" />
              </div>

              {/* Modal Header */}
              <div className="px-5 py-4 border-b flex items-start justify-between gap-3" style={{ borderColor: 'var(--color-border)' }}>
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                      <CalendarCheck size={18} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-lg font-heading font-bold text-[color:var(--color-heading)]">
                      Agenda & ST Hari Ini
                    </h3>
                  </div>
                  <p className="text-xs text-[color:var(--color-text-soft)] mt-1 font-medium flex items-center gap-1.5">
                    <span>{formatHariTanggal(today)}</span>
                    <span className="inline-block w-1 h-1 rounded-full bg-[color:var(--color-text-soft)]" />
                    <span className="font-semibold text-teal-600 dark:text-teal-400">
                      {todayTotalCount} Total Agenda
                    </span>
                  </p>
                </div>

                <button
                  onClick={() => setTodayModalOpen(false)}
                  className="p-2 rounded-xl text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-muted)] transition-colors"
                  aria-label="Tutup popup"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Modal Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {loadingToday ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2">
                    <Loader2 size={28} className="animate-spin text-teal-600" />
                    <p className="text-xs text-[color:var(--color-text-soft)]">Memuat agenda hari ini...</p>
                  </div>
                ) : todayTotalCount === 0 ? (
                  <div className="py-10 px-4 text-center flex flex-col items-center justify-center">
                    <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-3">
                      <CalendarCheck size={28} />
                    </div>
                    <h4 className="font-heading font-bold text-sm text-[color:var(--color-heading)]">
                      Tidak Ada Agenda Hari Ini
                    </h4>
                    <p className="text-xs text-[color:var(--color-text-soft)] mt-1 max-w-xs leading-relaxed">
                      Kepala Kantor tidak memiliki agenda rapat kedinasan maupun Surat Tugas (ST) yang dijadwalkan untuk hari ini.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Section 1: Agenda Kegiatan */}
                    {todayKegiatan.length > 0 && (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-heading font-bold text-teal-700 dark:text-teal-400">
                            <Clock size={14} />
                            <span>AGENDA KEGIATAN ({todayKegiatan.length})</span>
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          {todayKegiatan.map((item) => (
                            <div
                              key={item.id}
                              className="p-4 rounded-2xl border bg-[color:var(--color-surface)] shadow-xs transition-all"
                              style={{ borderColor: 'var(--color-border)' }}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                                  <Clock size={11} />
                                  {item.waktuMulai ? `${item.waktuMulai}${item.waktuSelesai ? ` - ${item.waktuSelesai}` : ''} WITA` : (item.waktu || 'Waktu Belum Ditentukan')}
                                </span>
                              </div>
                              <h4 className="font-heading font-bold text-sm text-[color:var(--color-heading)] leading-snug">
                                {item.agenda}
                              </h4>
                              <div className="mt-2.5 flex items-center gap-1.5 text-xs text-[color:var(--color-text-soft)]">
                                <MapPin size={13} className="text-teal-600 shrink-0" />
                                <span className="truncate">{item.tempat || 'Tempat belum ditentukan'}</span>
                              </div>
                              {item.keterangan && (
                                <p className="mt-2.5 text-xs text-[color:var(--color-text-muted)] p-2.5 rounded-xl bg-[color:var(--color-surface-muted)] leading-relaxed">
                                  {item.keterangan}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Section 2: Surat Tugas (ST) */}
                    {todayST.length > 0 && (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-heading font-bold text-amber-700 dark:text-amber-400">
                            <FileText size={14} />
                            <span>SURAT TUGAS - ST ({todayST.length})</span>
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          {todayST.map((item) => (
                            <div
                              key={item.id}
                              className="p-4 rounded-2xl border bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40 shadow-xs transition-all"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                                  <FileText size={11} />
                                  Surat Tugas
                                </span>
                                {item.tanggalSelesai && item.tanggalSelesai !== item.tanggal && (
                                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">
                                    Multi-Hari
                                  </span>
                                )}
                              </div>
                              <h4 className="font-heading font-bold text-sm text-[color:var(--color-heading)] leading-snug">
                                {item.tentang || item.perihal || item.agenda || 'Penugasan Luar Kantor'}
                              </h4>
                              <div className="mt-2.5 flex items-center gap-1.5 text-xs text-[color:var(--color-text-soft)]">
                                <MapPin size={13} className="text-amber-600 shrink-0" />
                                <span className="truncate">{item.tempat || item.wilayah || 'Lokasi tugas'}</span>
                              </div>
                              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[color:var(--color-text-muted)]">
                                <Calendar size={12} className="text-amber-600 shrink-0" />
                                <span>
                                  {formatRentangST(item.tanggal, item.tanggalSelesai)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t flex items-center gap-3" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-muted)' }}>
                <button
                  onClick={() => setTodayModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-heading font-bold bg-[color:var(--color-surface)] border text-[color:var(--color-heading)] hover:bg-[color:var(--color-surface-elevated)] transition-colors text-center"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Theme Toggle */}
      <div className="hidden md:block fixed bottom-6 right-24 z-50">
        <ThemeToggle iconOnly={true} className="shadow-xl shadow-black/10 hover:-translate-y-1 transition-all duration-300 bg-[color:var(--color-surface-elevated)] border-[color:var(--color-border)]" />
      </div>

      {/* Desktop Chat Widget */}
      <div className="hidden md:block">
        <ChatWidget />
      </div>
    </div>
  );
}
