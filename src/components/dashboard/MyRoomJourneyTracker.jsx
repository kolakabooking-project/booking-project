import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useRoomBooking } from '../../contexts/RoomBookingContext';
import { formatDateShort, formatTime } from '../../utils/helpers';
import {
  Building2, CalendarCheck, PlayCircle, Flag,
  Plus, ChevronDown, MonitorPlay
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './MyJourneyTracker.css';

/* ── Room Item ── */

function RoomItem({ booking, variant, onClick }) {
  const roomLabel = booking.roomName
    ? booking.roomName.split('(')[0]?.trim()
    : 'Ruangan';

  return (
    <div
      className={`mjt-vehicle mjt-vehicle--${variant}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(); }}
    >
      <div className="mjt-tooltip">
        <div className="mjt-tooltip-title">{booking.keperluan?.slice(0, 35)}{booking.keperluan?.length > 35 ? '…' : ''}</div>
        <div className="mjt-tooltip-sub">
          {formatDateShort(booking.startTime)} • {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
        </div>
        {booking.roomName && (
          <div className="mjt-tooltip-sub">🏢 {booking.roomName}</div>
        )}
      </div>
      <MonitorPlay size={30} className="text-blue-600 dark:text-blue-400" />
      <span className="mjt-vehicle-label">{roomLabel}</span>
    </div>
  );
}

/* ── Shared Animations ── */

const cardVariants = {
  expanded: { 
    opacity: 1, 
    height: 'auto', 
    paddingTop: '0.875rem', 
    paddingBottom: '0.875rem',
    transitionEnd: { overflow: 'visible' }
  },
  collapsed: { 
    opacity: 0, 
    height: 0, 
    paddingTop: 0, 
    paddingBottom: 0,
    overflow: 'hidden'
  },
};

const iconVariants = {
  expanded: { opacity: 1, scale: 1, rotateY: 0 },
  collapsed: { opacity: 0, scale: 0.2, rotateY: -90 },
};

const countVariants = {
  expanded: { opacity: 0, scale: 0.2, rotateY: 90 },
  collapsed: { opacity: 1, scale: 1, rotateY: 0 },
};

/* ══════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════ */

export default function MyRoomJourneyTracker({ onNewBooking }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getUserRoomBookings } = useRoomBooking();
  const [isExpanded, setIsExpanded] = useState(true);

  const journeyData = useMemo(() => {
    const myBookings = getUserRoomBookings(user.id);
    const now = new Date();
    
    const upcoming = myBookings.filter((b) => {
      if (b.status !== 'Disetujui') return false;
      return new Date(b.startTime) > now;
    });
    
    const ongoing = myBookings.filter((b) => {
      if (b.status === 'Berlangsung') return true;
      if (b.status === 'Disetujui') {
        const start = new Date(b.startTime);
        const end = new Date(b.endTime);
        return now >= start && now <= end;
      }
      return false;
    });
    
    const completed = myBookings.filter((b) =>
      ['Selesai', 'Selesai dengan Catatan'].includes(b.status)
    );
    
    return { upcoming, ongoing, completed };
  }, [getUserRoomBookings, user.id]);

  const { upcoming, ongoing, completed } = journeyData;

  const handleNavigateBookings = (filterStatus) => {
    navigate('/user/room/my-bookings', { state: { filterStatus } });
  };

  return (
    <div className={`mjt-root ${!isExpanded ? 'mjt-root--collapsed' : ''}`}>
      {/* Toggle */}
      <button
        className="mjt-toggle-btn bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800/30"
        onClick={() => setIsExpanded((v) => !v)}
        type="button"
        aria-expanded={isExpanded}
      >
        <span className="mjt-toggle-text">Tracking Ruangan</span>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown size={14} />
        </motion.div>
      </button>

      <div className="mjt-scroll-wrapper">
        <div className="mjt-track">

          {/* ═══ POS 1: DASHBOARD ═══ */}
          <div className="mjt-checkpoint mjt-checkpoint--start">
            <div className="mjt-node border-blue-200">
              <span className="mjt-node-icon text-blue-600"><Building2 /></span>
            </div>
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  variants={cardVariants}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="mjt-checkpoint-card border border-blue-100 shadow-sm"
                >
                  <div className="mjt-checkpoint-label text-blue-900 dark:text-blue-100">Dashboard</div>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                    Mulai dari sini
                  </div>
                  <button className="mjt-cta-btn bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 mt-3" onClick={onNewBooking} type="button">
                    <Plus size={16} /> Booking Ruang
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.div 
            className="mjt-road bg-blue-100" 
            animate={{ width: isExpanded ? 48 : 32 }}
            transition={{ duration: 0.3 }}
          />

          {/* ═══ POS 2: UPCOMING (DISETUJUI) ═══ */}
          <div className="mjt-checkpoint mjt-checkpoint--approved">
            <div className="mjt-node border-green-200">
              <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <motion.span
                  className="mjt-node-icon text-green-600"
                  style={{ position: 'absolute' }}
                  variants={iconVariants}
                  initial="expanded"
                  animate={isExpanded ? 'expanded' : 'collapsed'}
                  transition={{ duration: 0.3 }}
                >
                  <CalendarCheck />
                </motion.span>
                <motion.span
                  className="mjt-node-count text-green-700"
                  style={{ position: 'absolute' }}
                  variants={countVariants}
                  initial="collapsed"
                  animate={isExpanded ? 'expanded' : 'collapsed'}
                  transition={{ duration: 0.3 }}
                >
                  {upcoming.length}
                </motion.span>
              </div>
            </div>
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  variants={cardVariants}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="mjt-checkpoint-card border border-green-100 shadow-sm hover:border-green-300"
                  onClick={() => handleNavigateBookings('Disetujui')}
                  role="button" tabIndex={0}
                >
                  <div className="mjt-checkpoint-label text-green-800">Akan Datang</div>
                  <div className="mjt-counter text-green-600">{upcoming.length}</div>
                  <div className="mjt-counter-label">Jadwal Rapat</div>
                  {upcoming.length > 0 ? (
                    <div className="mjt-vehicles">
                      {upcoming.slice(0, 3).map((b) => (
                        <RoomItem key={b.id} booking={b} variant="approved"
                          onClick={() => handleNavigateBookings('Disetujui')} />
                      ))}
                      {upcoming.length > 3 && <span className="mjt-empty-text">+{upcoming.length - 3} lainnya</span>}
                    </div>
                  ) : (
                    <div className="mjt-empty-text text-green-600/60">Belum ada jadwal</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.div 
            className="mjt-road bg-green-100" 
            animate={{ width: isExpanded ? 48 : 32 }}
            transition={{ duration: 0.3 }}
          />

          {/* ═══ POS 3: ONGOING (BERLANGSUNG) ═══ */}
          <div className="mjt-checkpoint mjt-checkpoint--ongoing">
            <div className="mjt-node border-purple-200">
              <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <motion.span
                  className="mjt-node-icon text-purple-600"
                  style={{ position: 'absolute' }}
                  variants={iconVariants}
                  initial="expanded"
                  animate={isExpanded ? 'expanded' : 'collapsed'}
                  transition={{ duration: 0.3 }}
                >
                  <PlayCircle />
                </motion.span>
                <motion.span
                  className="mjt-node-count text-purple-700"
                  style={{ position: 'absolute' }}
                  variants={countVariants}
                  initial="collapsed"
                  animate={isExpanded ? 'expanded' : 'collapsed'}
                  transition={{ duration: 0.3 }}
                >
                  {ongoing.length}
                </motion.span>
              </div>
            </div>
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  variants={cardVariants}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="mjt-checkpoint-card border border-purple-100 shadow-sm hover:border-purple-300"
                  onClick={() => handleNavigateBookings('Berlangsung')}
                  role="button" tabIndex={0}
                >
                  <div className="mjt-checkpoint-label text-purple-800">Sedang Pakai</div>
                  <div className="mjt-counter text-purple-600">{ongoing.length}</div>
                  <div className="mjt-counter-label">Ruangan Aktif</div>
                  {ongoing.length > 0 ? (
                    <div className="mjt-vehicles">
                      {ongoing.slice(0, 3).map((b) => (
                        <RoomItem key={b.id} booking={b} variant="ongoing"
                          onClick={() => handleNavigateBookings('Berlangsung')} />
                      ))}
                    </div>
                  ) : (
                    <div className="mjt-empty-text text-purple-600/60">Tidak ada pemakaian</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.div 
            className="mjt-road bg-purple-100" 
            animate={{ width: isExpanded ? 48 : 32 }}
            transition={{ duration: 0.3 }}
          />

          {/* ═══ POS 4: COMPLETED (SELESAI) ═══ */}
          <div className="mjt-checkpoint mjt-checkpoint--done">
            <div className="mjt-node border-orange-200">
              <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <motion.span
                  className="mjt-node-icon text-orange-600"
                  style={{ position: 'absolute' }}
                  variants={iconVariants}
                  initial="expanded"
                  animate={isExpanded ? 'expanded' : 'collapsed'}
                  transition={{ duration: 0.3 }}
                >
                  <Flag />
                </motion.span>
                <motion.span
                  className="mjt-node-count text-orange-700"
                  style={{ position: 'absolute' }}
                  variants={countVariants}
                  initial="collapsed"
                  animate={isExpanded ? 'expanded' : 'collapsed'}
                  transition={{ duration: 0.3 }}
                >
                  {completed.length}
                </motion.span>
              </div>
            </div>
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  variants={cardVariants}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="mjt-checkpoint-card border border-orange-100 shadow-sm hover:border-orange-300"
                  onClick={() => handleNavigateBookings('Selesai')}
                  role="button" tabIndex={0}
                >
                  <div className="mjt-sparkles">
                    <span className="mjt-sparkle-dot bg-orange-400" />
                    <span className="mjt-sparkle-dot bg-orange-400" />
                    <span className="mjt-sparkle-dot bg-orange-400" />
                    <span className="mjt-sparkle-dot bg-orange-400" />
                  </div>
                  <div className="mjt-checkpoint-label text-orange-800">Selesai</div>
                  <div className="mjt-flag"><span style={{ fontSize: '1.5rem' }}>🏁</span></div>
                  <div className="mjt-counter text-orange-600" style={{ marginTop: '0.25rem' }}>{completed.length}</div>
                  <div className="mjt-counter-label">Total Booking</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
}
