import { useState, useMemo, useCallback } from 'react';
import { useBooking } from '../../contexts/BookingContext';
import { CalendarRange, ChevronLeft, ChevronRight, Clock, User, MapPin, Warehouse, Wrench, Info } from 'lucide-react';
import { formatDateShort, formatTime } from '../../utils/helpers';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import './FleetTimetableBoard.css';

export default function FleetTimetableBoard() {
  const { vehicles, bookings } = useBooking();
  const [targetDate, setTargetDate] = useState(new Date());
  const [detailBooking, setDetailBooking] = useState(null);

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
        .filter(
          (b) =>
            b.vehicleId === v.id &&
            !['Ditolak', 'Dibatalkan'].includes(b.status)
        )
        .map((b) => getBookingOverlapOnDate(b, targetDate))
        .filter(Boolean);

      return {
        ...v,
        dayBookings: activeBookings,
      };
    });
  }, [vehicles, bookings, targetDate, getBookingOverlapOnDate]);

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
      const now = new Date();
      return 'approved';
    }
    if (status === 'Pending') return 'pending';
    if (status === 'Selesai' || status === 'Selesai dengan Catatan') return 'selesai';
    return 'approved';
  };

  return (
    <div className="ftb-card">
      {/* HEADER SECTION */}
      <div className="ftb-header">
        <div className="ftb-title-area">
          <CalendarRange className="ftb-title-icon" size={24} />
          <h2 className="ftb-title">Gantt Chart Jadwal KDO</h2>
        </div>

        {/* DATE CONTROLS */}
        <div className="ftb-controls">
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

      {/* DETAIL BOOKING DIALOG MODAL */}
      <Modal
        isOpen={!!detailBooking}
        onClose={() => setDetailBooking(null)}
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

            <div className="flex justify-end pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <Button variant="secondary" onClick={() => setDetailBooking(null)}>
                Tutup Jadwal
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
