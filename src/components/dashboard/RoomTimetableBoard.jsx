import { useState, useMemo, useCallback } from 'react';
import { useRoomBooking } from '../../contexts/RoomBookingContext';
import { useAuth } from '../../contexts/AuthContext';
import { CalendarRange, ChevronLeft, ChevronRight, Clock, User, MapPin, Wrench, Info, ChevronDown, Users } from 'lucide-react';
import { formatDateShort, formatTime } from '../../utils/helpers';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import './RoomTimetableBoard.css';

export default function RoomTimetableBoard() {
  const { user } = useAuth();
  const { rooms, roomBookings } = useRoomBooking();
  const [targetDate, setTargetDate] = useState(new Date());
  const [detailBooking, setDetailBooking] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);

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

    // Define operational timeline (07:00 to 18:00)
    const timelineStart = new Date(date);
    timelineStart.setHours(7, 0, 0, 0);
    const timelineEnd = new Date(date);
    timelineEnd.setHours(18, 0, 0, 0);

    // Clamp values to operational hours
    const activeStart = bookingStart < timelineStart ? timelineStart : bookingStart;
    const activeEnd = bookingEnd > timelineEnd ? timelineEnd : bookingEnd;

    if (activeStart >= activeEnd) {
      return null;
    }

    const startDecimal = activeStart.getHours() + activeStart.getMinutes() / 60;
    const endDecimal = activeEnd.getHours() + activeEnd.getMinutes() / 60;

    // Calculate width & left percentages based on an 11-hour timeline (7 to 18)
    const left = ((startDecimal - 7) / 11) * 100;
    const width = ((endDecimal - startDecimal) / 11) * 100;

    return {
      left,
      width,
      booking,
    };
  }, []);

  // Map each room to its parsed bookings for the target date
  const mappedRooms = useMemo(() => {
    return rooms.map((r) => {
      // Filter active / approved bookings for this room on this targetDate
      const activeBookings = roomBookings
        .filter((b) => {
          if (b.roomId !== r.id || b.status === 'Dibatalkan') return false;
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
        ...r,
        dayBookings: activeBookings,
      };
    });
  }, [rooms, roomBookings, targetDate, getBookingOverlapOnDate, user?.id, user?.role]);

  // Generate ticks for 7:00 to 17:00 (11 ticks)
  const hourTicks = useMemo(() => {
    const ticks = [];
    for (let h = 7; h <= 17; h++) {
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
    <div className={`rtb-card ${!isExpanded ? 'rtb-card--collapsed' : ''}`}>
      {/* HEADER SECTION */}
      <div className="rtb-header" style={{ cursor: 'pointer', paddingBottom: isExpanded ? undefined : '1.5rem' }} onClick={() => setIsExpanded(!isExpanded)}>
        <div className="rtb-title-area">
          <CalendarRange className="rtb-title-icon" size={24} />
          <h2 className="rtb-title">Gantt Chart Jadwal Ruangan</h2>
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }} style={{ marginLeft: '12px', display: 'flex', alignItems: 'center' }}>
            <ChevronDown size={18} className="text-[color:var(--color-text-soft)]" />
          </motion.div>
        </div>

        {/* DATE CONTROLS */}
        <div className="rtb-controls" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={handlePrevDay}>
            <ChevronLeft size={16} />
          </Button>
          <span className="rtb-date-display">{dateTitle}</span>
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
            <div className="rtb-timeline-wrap">
              <div className="rtb-grid-container">
                {/* HEADER HOUR TICKS ROW */}
                <div className="rtb-row-header">
                  <div className="rtb-room-col-title">Ruangan</div>
                  <div className="rtb-hours-col">
                    {hourTicks.map((tick, idx) => (
                      <div key={idx} className="rtb-hour-tick">
                        {tick}
                      </div>
                    ))}
                  </div>
                </div>

                {/* ROOM GRID ROWS */}
                {mappedRooms.length === 0 ? (
                  <div className="py-8 text-center text-[color:var(--color-text-soft)]">
                    Tidak ada data ruangan terdaftar.
                  </div>
                ) : (
                  mappedRooms.map((r) => (
                    <div key={r.id} className="rtb-row-room">
                      {/* LEFT ROOM PROFILE */}
                      <div className="rtb-room-info">
                        <span className="rtb-room-name">{r.name}</span>
                        <span className="rtb-room-sub">{r.location}</span>
                      </div>

                      {/* RIGHT GRID CELLS TRACK */}
                      <div className="rtb-timeline-track">
                        {/* Backdrop Grid Cells */}
                        {Array.from({ length: 11 }).map((_, idx) => (
                          <div key={idx} className="rtb-grid-cell" />
                        ))}

                        {/* ACTIVE TIMELINE BARS */}
                        <div className="rtb-bars-container">
                          {r.status === 'Dalam Perawatan' ? (
                            <div className="rtb-maintenance-bar">
                              <Wrench size={12} style={{ marginRight: '6px' }} />
                              Dalam Perawatan
                            </div>
                          ) : (
                            r.dayBookings.map(({ left, width, booking }) => (
                              <motion.div
                                key={booking.id}
                                className={`rtb-booking-bar rtb-booking-bar--${getBarClassSuffix(
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
                                <span className="truncate">{booking.keperluan || 'Rapat'}</span>

                                {/* FLOATING HOVER TOOLTIP */}
                                <div className="rtb-bar-tooltip">
                                  <div className="rtb-tooltip-header">
                                    {booking.userName}
                                  </div>
                                  <div className="rtb-tooltip-line">
                                    <span className="rtb-tooltip-label">Waktu: </span>
                                    {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                                  </div>
                                  <div className="rtb-tooltip-line">
                                    <span className="rtb-tooltip-label">Keperluan: </span>
                                    {booking.keperluan || 'Rapat'}
                                  </div>
                                  {booking.peserta && (
                                    <div className="rtb-tooltip-line">
                                      <span className="rtb-tooltip-label">Peserta: </span>
                                      {booking.peserta} Orang
                                    </div>
                                  )}
                                  <div className="rtb-tooltip-line">
                                    <span className="rtb-tooltip-label">Status: </span>
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
            <div className="rtb-legend">
              <div className="rtb-legend-item">
                <div className="rtb-legend-color rtb-legend-color--pending" />
                <span>Pending Approval</span>
              </div>
              <div className="rtb-legend-item">
                <div className="rtb-legend-color rtb-legend-color--approved" />
                <span>Disetujui / Berlangsung</span>
              </div>
              <div className="rtb-legend-item">
                <div className="rtb-legend-color rtb-legend-color--selesai" />
                <span>Selesai</span>
              </div>
              <div className="rtb-legend-item">
                <div className="rtb-legend-color rtb-legend-color--maintenance" />
                <span>Perawatan Ruangan</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DETAIL BOOKING DIALOG MODAL */}
      <Modal
        isOpen={!!detailBooking}
        onClose={() => setDetailBooking(null)}
        title="Detail Jadwal Ruangan"
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
                  {new Date(detailBooking.startTime).toDateString() === new Date(detailBooking.endTime).toDateString()
                    ? `${formatDateShort(detailBooking.startTime)} (${formatTime(detailBooking.startTime)} - ${formatTime(detailBooking.endTime)})`
                    : `${formatDateShort(detailBooking.startTime)} - ${formatDateShort(detailBooking.endTime)} (${formatTime(detailBooking.startTime)} - ${formatTime(detailBooking.endTime)})`}
                </p>
              </div>

              <div>
                <span className="font-semibold text-[color:var(--color-text-soft)] flex items-center gap-1">
                  <MapPin size={14} /> Ruangan
                </span>
                <p className="mt-1 text-djp-blue font-semibold">
                  {rooms.find(r => r.id === detailBooking.roomId)?.name || 'Belum ditentukan'}
                </p>
              </div>

              {detailBooking.peserta && (
                <div>
                  <span className="font-semibold text-[color:var(--color-text-soft)] flex items-center gap-1">
                    <Users size={14} /> Jumlah Peserta
                  </span>
                  <p className="mt-1 text-[color:var(--color-heading)]">
                    {detailBooking.peserta} Orang
                  </p>
                </div>
              )}

              <div className="col-span-2 border-t pt-3" style={{ borderColor: 'var(--color-border)' }}>
                <span className="font-semibold text-[color:var(--color-text-soft)]">
                  Tujuan & Keperluan
                </span>
                <p className="mt-1 text-[color:var(--color-heading)] leading-relaxed">
                  {detailBooking.keperluan || 'Rapat'}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <Button variant="secondary" onClick={() => setDetailBooking(null)}>
                Tutup Detail
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
