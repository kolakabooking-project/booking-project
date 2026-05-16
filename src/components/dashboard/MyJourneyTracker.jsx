import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useBooking } from '../../contexts/BookingContext';
import { BOOKING_STATUS } from '../../utils/constants';
import { formatDateShort, formatTime } from '../../utils/helpers';
import {
  Building2, Clock, ShieldCheck, Navigation, Flag,
  Plus, ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CarIcon, MotorcycleIcon } from '../icons/VehicleIcons';
import './MyJourneyTracker.css';

/* ── Vehicle Item ── */

function VehicleItem({ booking, variant, onClick }) {
  const isMotorcycle = booking.jenisKendaraan === 'Motor' || booking.vehicleName?.toLowerCase().includes('motor') || booking.vehicleName?.toLowerCase().includes('beat') || booking.vehicleName?.toLowerCase().includes('vario');
  const vehicleLabel = booking.vehicleName
    ? booking.vehicleName.split('(')[0]?.trim().split(' ').pop()
    : booking.jenisKendaraan || 'KDO';

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
        {booking.vehicleName && (
          <div className="mjt-tooltip-sub">{isMotorcycle ? '🏍️' : '🚗'} {booking.vehicleName}</div>
        )}
      </div>
      {isMotorcycle ? <MotorcycleIcon size={30} /> : <CarIcon size={34} />}
      <span className="mjt-vehicle-label">{vehicleLabel}</span>
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

export default function MyJourneyTracker({ onNewBooking }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getUserBookings } = useBooking();
  const [isExpanded, setIsExpanded] = useState(true);

  const journeyData = useMemo(() => {
    const myBookings = getUserBookings(user.id);
    const pending = myBookings.filter((b) => b.status === BOOKING_STATUS.PENDING);
    const now = new Date();
    const approved = myBookings.filter((b) => {
      if (b.status !== BOOKING_STATUS.APPROVED) return false;
      return new Date(b.startTime) > now;
    });
    const ongoing = myBookings.filter((b) => {
      if (b.status === BOOKING_STATUS.ONGOING) return true;
      if (b.status === BOOKING_STATUS.APPROVED) {
        const start = new Date(b.startTime);
        const end = new Date(b.endTime);
        return now >= start && now <= end;
      }
      return false;
    });
    const completed = myBookings.filter((b) =>
      b.status === BOOKING_STATUS.COMPLETED || b.status === BOOKING_STATUS.COMPLETED_WITH_NOTES
    );
    return { pending, approved, ongoing, completed };
  }, [getUserBookings, user.id]);

  const { pending, approved, ongoing, completed } = journeyData;

  const handleNavigateBookings = (filterStatus) => {
    navigate('/user/my-bookings', { state: { filterStatus } });
  };

  return (
    <div className={`mjt-root ${!isExpanded ? 'mjt-root--collapsed' : ''}`}>
      {/* Toggle */}
      <button
        className="mjt-toggle-btn"
        onClick={() => setIsExpanded((v) => !v)}
        type="button"
        aria-expanded={isExpanded}
      >
        <span className="mjt-toggle-text">Perjalanan Saya</span>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown size={14} />
        </motion.div>
      </button>

      <div className="mjt-scroll-wrapper">
        <div className="mjt-track">

          {/* ═══ POS 1: KANTOR ═══ */}
          <div className="mjt-checkpoint mjt-checkpoint--start">
            <div className="mjt-node">
              <span className="mjt-node-icon"><Building2 /></span>
            </div>
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  variants={cardVariants}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="mjt-checkpoint-card"
                >
                  <div className="mjt-checkpoint-label">Kantor</div>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                    Mulai dari sini
                  </div>
                  <button className="mjt-cta-btn" onClick={onNewBooking} type="button">
                    <Plus /> Buat Booking
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.div 
            className="mjt-road" 
            animate={{ width: isExpanded ? 48 : 32 }}
            transition={{ duration: 0.3 }}
          />

          {/* ═══ POS 2: ANTRIAN ═══ */}
          <div className="mjt-checkpoint mjt-checkpoint--pending">
            <div className="mjt-node">
              <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <motion.span
                  className="mjt-node-icon"
                  style={{ position: 'absolute' }}
                  variants={iconVariants}
                  initial="expanded"
                  animate={isExpanded ? 'expanded' : 'collapsed'}
                  transition={{ duration: 0.3 }}
                >
                  <Clock />
                </motion.span>
                <motion.span
                  className="mjt-node-count"
                  style={{ position: 'absolute' }}
                  variants={countVariants}
                  initial="collapsed"
                  animate={isExpanded ? 'expanded' : 'collapsed'}
                  transition={{ duration: 0.3 }}
                >
                  {pending.length}
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
                  className="mjt-checkpoint-card"
                  onClick={() => handleNavigateBookings(BOOKING_STATUS.PENDING)}
                  role="button" tabIndex={0}
                >
                  <div className="mjt-checkpoint-label">Pos Antrian</div>
                  <div className="mjt-counter">{pending.length}</div>
                  <div className="mjt-counter-label">Menunggu</div>
                  {pending.length > 0 ? (
                    <div className="mjt-vehicles">
                      {pending.slice(0, 3).map((b) => (
                        <VehicleItem key={b.id} booking={b} variant="pending"
                          onClick={() => handleNavigateBookings(BOOKING_STATUS.PENDING)} />
                      ))}
                      {pending.length > 3 && <span className="mjt-empty-text">+{pending.length - 3} lainnya</span>}
                    </div>
                  ) : (
                    <div className="mjt-empty-text">Tidak ada antrian</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.div 
            className="mjt-road" 
            animate={{ width: isExpanded ? 48 : 32 }}
            transition={{ duration: 0.3 }}
          />

          {/* ═══ POS 3: GERBANG ═══ */}
          <div className="mjt-checkpoint mjt-checkpoint--approved">
            <div className="mjt-node">
              <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <motion.span
                  className="mjt-node-icon"
                  style={{ position: 'absolute' }}
                  variants={iconVariants}
                  initial="expanded"
                  animate={isExpanded ? 'expanded' : 'collapsed'}
                  transition={{ duration: 0.3 }}
                >
                  <ShieldCheck />
                </motion.span>
                <motion.span
                  className="mjt-node-count"
                  style={{ position: 'absolute' }}
                  variants={countVariants}
                  initial="collapsed"
                  animate={isExpanded ? 'expanded' : 'collapsed'}
                  transition={{ duration: 0.3 }}
                >
                  {approved.length}
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
                  className="mjt-checkpoint-card"
                  onClick={() => handleNavigateBookings(BOOKING_STATUS.APPROVED)}
                  role="button" tabIndex={0}
                >
                  <div className="mjt-checkpoint-label">Gerbang Keluar</div>
                  <div className="mjt-counter">{approved.length}</div>
                  <div className="mjt-counter-label">Siap Berangkat</div>
                  {approved.length > 0 ? (
                    <div className="mjt-vehicles">
                      {approved.slice(0, 3).map((b) => (
                        <VehicleItem key={b.id} booking={b} variant="approved"
                          onClick={() => handleNavigateBookings(BOOKING_STATUS.APPROVED)} />
                      ))}
                      {approved.length > 3 && <span className="mjt-empty-text">+{approved.length - 3} lainnya</span>}
                    </div>
                  ) : (
                    <div className="mjt-empty-text">Belum ada yang siap</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.div 
            className="mjt-road" 
            animate={{ width: isExpanded ? 48 : 32 }}
            transition={{ duration: 0.3 }}
          />

          {/* ═══ POS 4: JALAN RAYA ═══ */}
          <div className="mjt-checkpoint mjt-checkpoint--ongoing">
            <div className="mjt-node">
              <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <motion.span
                  className="mjt-node-icon"
                  style={{ position: 'absolute' }}
                  variants={iconVariants}
                  initial="expanded"
                  animate={isExpanded ? 'expanded' : 'collapsed'}
                  transition={{ duration: 0.3 }}
                >
                  <Navigation />
                </motion.span>
                <motion.span
                  className="mjt-node-count"
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
                  className="mjt-checkpoint-card"
                  onClick={() => handleNavigateBookings(BOOKING_STATUS.ONGOING)}
                  role="button" tabIndex={0}
                >
                  <div className="mjt-checkpoint-label">Jalan Raya</div>
                  <div className="mjt-counter">{ongoing.length}</div>
                  <div className="mjt-counter-label">Sedang Bertugas</div>
                  {ongoing.length > 0 ? (
                    <div className="mjt-vehicles">
                      {ongoing.slice(0, 3).map((b) => (
                        <VehicleItem key={b.id} booking={b} variant="ongoing"
                          onClick={() => handleNavigateBookings(BOOKING_STATUS.ONGOING)} />
                      ))}
                    </div>
                  ) : (
                    <div className="mjt-empty-text">Belum ada misi aktif</div>
                  )}
                  <div className="mjt-mini-road" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.div 
            className="mjt-road" 
            animate={{ width: isExpanded ? 48 : 32 }}
            transition={{ duration: 0.3 }}
          />

          {/* ═══ POS 5: MISI SELESAI ═══ */}
          <div className="mjt-checkpoint mjt-checkpoint--done">
            <div className="mjt-node">
              <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <motion.span
                  className="mjt-node-icon"
                  style={{ position: 'absolute' }}
                  variants={iconVariants}
                  initial="expanded"
                  animate={isExpanded ? 'expanded' : 'collapsed'}
                  transition={{ duration: 0.3 }}
                >
                  <Flag />
                </motion.span>
                <motion.span
                  className="mjt-node-count"
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
                  className="mjt-checkpoint-card"
                  onClick={() => handleNavigateBookings(BOOKING_STATUS.COMPLETED)}
                  role="button" tabIndex={0}
                >
                  <div className="mjt-sparkles">
                    <span className="mjt-sparkle-dot" />
                    <span className="mjt-sparkle-dot" />
                    <span className="mjt-sparkle-dot" />
                    <span className="mjt-sparkle-dot" />
                  </div>
                  <div className="mjt-checkpoint-label">Misi Selesai</div>
                  <div className="mjt-flag"><span style={{ fontSize: '1.5rem' }}>🏁</span></div>
                  <div className="mjt-counter" style={{ marginTop: '0.25rem' }}>{completed.length}</div>
                  <div className="mjt-counter-label">Total Perjalanan</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
}
