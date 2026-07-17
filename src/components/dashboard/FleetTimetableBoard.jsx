import { useState, useMemo, useCallback } from 'react';
import { useBooking } from '../../contexts/BookingContext';
import { useAuth } from '../../contexts/AuthContext';
import { CalendarRange, ChevronLeft, ChevronRight, Clock, User, MapPin, Wrench, Info, ChevronDown, FlagTriangleRight, AlertTriangle } from 'lucide-react';
import { formatDateShort, formatTime } from '../../utils/helpers';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import FormInput from '../ui/FormInput';
import { toast } from 'sonner';
import { useLoading } from '../../contexts/LoadingContext';
import { BOOKING_STATUS } from '../../utils/constants';
import { motion, AnimatePresence } from 'framer-motion';
import './FleetTimetableBoard.css';

export default function FleetTimetableBoard() {
  const { user } = useAuth();
  const { vehicles, bookings, completeBookingEarly } = useBooking();
  const { showLoading, hideLoading } = useLoading();
  const [targetDate, setTargetDate] = useState(new Date());
  const [detailBooking, setDetailBooking] = useState(null);
  const [completeEarlyNotes, setCompleteEarlyNotes] = useState('');
  const [showCompleteEarly, setShowCompleteEarly] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleCompleteEarly = async () => {
    if (!detailBooking) return;
    showLoading('Menyelesaikan peminjaman sebelum waktunya...');
    try {
      await completeBookingEarly(detailBooking.id, completeEarlyNotes);
      toast.success(`Peminjaman ${detailBooking.userName} telah diselesaikan`);
      setDetailBooking(null);
      setShowCompleteEarly(false);
    } catch (err) {
      toast.error(err.message || 'Gagal menyelesaikan peminjaman');
    } finally {
      hideLoading();
    }
  };

  // Date Navigation Helpers
  const handlePrevDay = () => {
    setTargetDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() - 1);
      return next;
    });
  };

  const handleNextDay = () => {
    setTargetDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 1);
      return next;
    });
  };

  const handleToday = () => {
    setTargetDate(new Date());
  };

  // Check if a date is today
  const isTargetDateToday = useMemo(() => {
    const today = new Date();
    return (
      targetDate.getDate() === today.getDate() &&
      targetDate.getMonth() === today.getMonth() &&
      targetDate.getFullYear() === today.getFullYear()
    );
  }, [targetDate]);

  // Formatted date title
  const dateTitle = useMemo(() => {
    return targetDate.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [targetDate]);

  // Overlap and percentage calculator
  const getBookingOverlapOnDate = useCallback((booking, date) => {
    const targetStart = new Date(date);
    targetStart.setHours(0, 0, 0, 0);
    const targetEnd = new Date(date);
    targetEnd.setHours(23, 59, 59, 999);

    const bookingStart = new Date(booking.startTime);
    const bookingEnd = new Date(booking.endTime);

    // No overlap
    if (bookingStart > targetEnd || bookingEnd < targetStart) {
      return null;
    }

    // Define operational timeline (06:00 to 22:00)
    const timelineStart = new Date(date);
    timelineStart.setHours(6, 0, 0, 0);
    const timelineEnd = new Date(date);
    timelineEnd.setHours(22, 0, 0, 0);

    // Clamp values to operational hours
    const activeStart = bookingStart < timelineStart ? timelineStart : bookingStart;
    const activeEnd = bookingEnd > timelineEnd ? timelineEnd : bookingEnd;

    if (activeStart >= activeEnd) {
      return null;
    }

    const startDecimal = activeStart.getHours() + activeStart.getMinutes() / 60;
    const endDecimal = activeEnd.getHours() + activeEnd.getMinutes() / 60;

    // Calculate width & left percentages based on a 16-hour timeline (6 to 22)
    const left = ((startDecimal - 6) / 16) * 100;
    const width = ((endDecimal - startDecimal) / 16) * 100;

    return {
      left,
      width,
      booking,
    };
  }, []);

  // Map each vehicle to its parsed bookings for the target date
  const mappedVehicles = useMemo(() => {
    return vehicles.map((v) => {
      // Filter active / approved bookings for this vehicle on this targetDate
      const activeBookings = bookings
        .filter((b) => {
          if (b.vehicleId !== v.id || b.status === 'Dibatalkan') return false;
          if (b.status === 'Ditolak') {
            const isMyBooking = b.userId === user?.id;
            const isAdminOrSuper = user?.role === 'admin' || user?.role === 'superadmin';
            if (!isMyBooking && !isAdminOrSuper) return false;
          }
          return true;
        })
        .map((b) => getBookingOverlapOnDate(b, targetDate))
        .filter(Boolean);

      return {
        ...v,
        dayBookings: activeBookings,
      };
    });
  }, [vehicles, bookings, targetDate, getBookingOverlapOnDate, user?.id, user?.role]);

  // Generate ticks for 6:00 to 22:00
  const hourTicks = useMemo(() => {
    const ticks = [];
    for (let h = 6; h <= 22; h++) {
      ticks.push(`${String(h).padStart(2, '0')}:00`);
    }
    return ticks;
  }, []);

  // Determine booking class suffix based on status
  const getBarClassSuffix = (status) => {
    if (status === 'Sedang Digunakan' || status === 'Disetujui') {
      return 'approved';
    }
    if (status === 'Pending') return 'pending';
    if (status === 'Selesai' || status === 'Selesai dengan Catatan') return 'selesai';
    return 'approved';
  };

  const bodyVariants = {
    expanded: { 
      opacity: 1, 
      height: 'auto',
      transitionEnd: { overflow: 'visible' }
    },
    collapsed: { 
      opacity: 0, 
      height: 0,
      overflow: 'hidden'
    },
  };

  const rollDownTransition = { 
    duration: 0.5, 
    ease: [0.25, 1, 0.5, 1] 
  };

  return (
    <div className={`ftb-card ${!isExpanded ? 'ftb-card--collapsed' : ''}`}>
      {/* HEADER SECTION */}
      <div className="ftb-header" style={{ cursor: 'pointer', paddingBottom: isExpanded ? undefined : '1.5rem' }} onClick={() => setIsExpanded(!isExpanded)}>
        <div className="ftb-title-area">
          <CalendarRange className="ftb-title-icon" size={24} />
          <h2 className="ftb-title">Gantt Chart Jadwal KDO</h2>
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }} style={{ marginLeft: '12px', display: 'flex', alignItems: 'center' }}>
            <ChevronDown size={18} className="text-[color:var(--color-text-soft)]" />
          </motion.div>
        </div>

        {/* DATE CONTROLS */}
        <div className="ftb-controls" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={handlePrevDay}>
            <ChevronLeft size={16} />
          </Button>
          <span className="ftb-date-display">{dateTitle}</span>
          <Button variant="ghost" size="sm" onClick={handleNextDay}>
            <ChevronRight size={16} />
          </Button>
          {!isTargetDateToday && (
            <Button variant="outline" size="sm" onClick={handleToday} style={{ marginLeft: '0.25rem' }}>
              Hari Ini
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            variants={bodyVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            transition={rollDownTransition}
            style={{ originY: 0 }}
          >
            {/* TIMETABLE TIMELINE BOARD */}
            <div className="ftb-timeline-wrap">
        <div className="ftb-grid-container">
          {/* HEADER HOUR TICKS ROW */}
          <div className="ftb-row-header">
            <div className="ftb-vehicle-col-title">Armada / KDO</div>
            <div className="ftb-hours-col">
              {hourTicks.map((tick, idx) => (
                <div key={idx} className="ftb-hour-tick">
                  {tick}
                </div>
              ))}
            </div>
          </div>

          {/* VEHICLE GRID ROWS */}
          {mappedVehicles.length === 0 ? (
            <div className="py-8 text-center text-[color:var(--color-text-soft)]">
              Tidak ada data kendaraan dinas terdaftar.
            </div>
          ) : (
            mappedVehicles.map((v) => (
              <div key={v.id} className="ftb-row-vehicle">
                {/* LEFT VEHICLE PROFILE */}
                <div className="ftb-vehicle-info">
                  <span className="ftb-vehicle-merek">{v.merek}</span>
                  <span className="ftb-vehicle-sub">{v.platNomor} • {v.tipe}</span>
                </div>

                {/* RIGHT GRID CELLS TRACK */}
                <div className="ftb-timeline-track">
                  {/* Backdrop Grid Cells */}
                  {Array.from({ length: 16 }).map((_, idx) => (
                    <div key={idx} className="ftb-grid-cell" />
                  ))}

                  {/* ACTIVE TIMELINE BARS */}
                  <div className="ftb-bars-container">
                    {v.status === 'Dalam Perawatan' ? (
                      <div className="ftb-maintenance-bar">
                        <Wrench size={12} style={{ marginRight: '6px' }} />
                        Dalam Perawatan (Bengkel KPP)
                      </div>
                    ) : (
                      v.dayBookings.map(({ left, width, booking }) => (
                        <motion.div
                          key={booking.id}
                          className={`ftb-booking-bar ftb-booking-bar--${getBarClassSuffix(
                            booking.status
                          )}`}
                          style={{
                            left: `${left}%`,
                            width: `${width}%`,
                          }}
                          onClick={() => setDetailBooking(booking)}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <span className="truncate">{booking.keperluan || 'Tugas Dinas'}</span>

                          {/* FLOATING HOVER TOOLTIP */}
                          <div className="ftb-bar-tooltip">
                            <div className="ftb-tooltip-header">
                              {booking.userName}
                            </div>
                            <div className="ftb-tooltip-line">
                              <span className="ftb-tooltip-label">Waktu: </span>
                              {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                            </div>
                            <div className="ftb-tooltip-line">
                              <span className="ftb-tooltip-label">Keperluan: </span>
                              {booking.keperluan}
                            </div>
                            <div className="ftb-tooltip-line">
                              <span className="ftb-tooltip-label">Status: </span>
                              {booking.status}
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* LEGEND SECTION */}
      <div className="ftb-legend">
        <div className="ftb-legend-item">
          <div className="ftb-legend-color ftb-legend-color--pending" />
          <span>Pending Approval</span>
        </div>
        <div className="ftb-legend-item">
          <div className="ftb-legend-color ftb-legend-color--approved" />
          <span>Disetujui / Ongoing</span>
        </div>
        <div className="ftb-legend-item">
          <div className="ftb-legend-color ftb-legend-color--selesai" />
          <span>Selesai Bertugas</span>
        </div>
        <div className="ftb-legend-item">
          <div className="ftb-legend-color ftb-legend-color--maintenance" />
          <span>Perawatan Armada</span>
        </div>
      </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DETAIL BOOKING DIALOG MODAL */}
      <Modal
        isOpen={!!detailBooking}
        onClose={() => {
          setDetailBooking(null);
          setShowCompleteEarly(false);
          setCompleteEarlyNotes('');
        }}
        title="Detail Jadwal Okupansi"
        size="md"
      >
        {detailBooking && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <span className="font-semibold text-[color:var(--color-text-soft)] flex items-center gap-1">
                  <User size={14} /> Pegawai Peminjam
                </span>
                <p className="mt-1 text-[color:var(--color-heading)] font-semibold">
                  {detailBooking.userName}
                </p>
              </div>

              <div>
                <span className="font-semibold text-[color:var(--color-text-soft)] flex items-center gap-1">
                  <Info size={14} /> Status Peminjaman
                </span>
                <div className="mt-1">
                  <Badge status={detailBooking.status} />
                </div>
              </div>

              <div>
                <span className="font-semibold text-[color:var(--color-text-soft)] flex items-center gap-1">
                  <Clock size={14} /> Waktu Okupansi
                </span>
                <p className="mt-1 text-[color:var(--color-heading)]">
                  {formatDateShort(detailBooking.startTime)} ({formatTime(detailBooking.startTime)} - {formatTime(detailBooking.endTime)})
                </p>
              </div>

              <div>
                <span className="font-semibold text-[color:var(--color-text-soft)] flex items-center gap-1">
                  <MapPin size={14} /> Kendaraan
                </span>
                <p className="mt-1 text-djp-blue font-semibold">
                  {detailBooking.vehicleName || 'Belum ditentukan'}
                </p>
              </div>

              <div className="col-span-2 border-t pt-3" style={{ borderColor: 'var(--color-border)' }}>
                <span className="font-semibold text-[color:var(--color-text-soft)]">
                  Tujuan & Keperluan
                </span>
                <p className="mt-1 text-[color:var(--color-heading)] leading-relaxed">
                  {detailBooking.keperluan || '-'}
                </p>
              </div>
            </div>

            {(user?.role === 'admin' || user?.role === 'superadmin') &&
              (detailBooking.status === BOOKING_STATUS.APPROVED || detailBooking.status === BOOKING_STATUS.ONGOING) && (
              <div className="border-t pt-4 space-y-4" style={{ borderColor: 'var(--color-border)' }}>
                {!showCompleteEarly ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/30">
                    <div>
                      <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                        <FlagTriangleRight size={16} /> Kendaraan Sudah Kembali?
                      </p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                        Jika kendaraan sudah kembali ke kantor sebelum jadwal selesai, Anda dapat mengakhiri booking ini lebih awal.
                      </p>
                    </div>
                    <Button variant="success" onClick={() => setShowCompleteEarly(true)} className="flex-shrink-0">
                      <FlagTriangleRight size={16} /> Selesaikan Lebih Awal
                    </Button>
                  </div>
                ) : (
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-900/30 space-y-4">
                    <div className="flex items-start gap-3 bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200 p-3.5 rounded-xl border border-amber-300 dark:border-amber-800/40">
                      <AlertTriangle size={20} className="flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                      <div className="text-xs space-y-1">
                        <p className="font-bold text-sm">Pastikan Kendaraan Sudah Balik ke Kantor!</p>
                        <p>
                          Sebelum menyelesaikan dan mengakhiri booking ini lebih awal, pastikan fisik kendaraan dinas telah kembali berada di kantor dan kunci kendaraan beserta STNK telah diserahkan.
                        </p>
                      </div>
                    </div>
                    <FormInput
                      label="Catatan Penyelesaian Lebih Awal (Opsional)"
                      id="ftb-complete-early-notes"
                      type="textarea"
                      value={completeEarlyNotes}
                      onChange={(e) => setCompleteEarlyNotes(e.target.value)}
                      placeholder="Contoh: Kendaraan dikembalikan tanggal 5 dalam kondisi baik, BBM terisi penuh..."
                    />
                    <div className="flex gap-3 justify-end pt-1">
                      <Button variant="ghost" onClick={() => setShowCompleteEarly(false)}>Kembali</Button>
                      <Button variant="success" onClick={handleCompleteEarly}>
                        <FlagTriangleRight size={16} /> Konfirmasi Selesaikan
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <Button variant="secondary" onClick={() => { setDetailBooking(null); setShowCompleteEarly(false); }}>
                Tutup Jadwal
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
