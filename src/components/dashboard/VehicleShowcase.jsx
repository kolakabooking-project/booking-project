import { useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useBooking } from '../../contexts/BookingContext';
import { BOOKING_STATUS, VEHICLE_STATUS } from '../../utils/constants';
import { formatTime } from '../../utils/helpers';
import Modal from '../ui/Modal';
import Card from '../ui/Card';
import { Car, Wrench } from 'lucide-react';
import { CarIcon as CarSVG, MotorcycleIcon as MotorcycleSVG } from '../icons/VehicleIcons';
import './VehicleShowcase.css';

/* ─────────── Helper: Office Hours ─────────── */
const OFFICE_START = 7;  // 07:00
const OFFICE_END = 18;   // 18:00
const TOTAL_HOURS = OFFICE_END - OFFICE_START;
const HOUR_LABELS = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => {
  const h = OFFICE_START + i;
  return h < 10 ? `0${h}` : `${h}`;
});

/* ─────────── Main Component ─────────── */

export default function VehicleShowcase() {
  const { user } = useAuth();
  const { vehicles, bookings } = useBooking();
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Get today's bookings for all vehicles (active/approved/ongoing only)
  const todayBookings = useMemo(() => {
    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(now);
    dayEnd.setHours(23, 59, 59, 999);

    return bookings.filter((b) => {
      if ([BOOKING_STATUS.REJECTED, BOOKING_STATUS.CANCELLED].includes(b.status)) return false;
      if (b.status === BOOKING_STATUS.COMPLETED || b.status === BOOKING_STATUS.COMPLETED_WITH_NOTES) return false;
      const start = new Date(b.startTime);
      const end = new Date(b.endTime);
      return start <= dayEnd && end >= dayStart;
    });
  }, [bookings]);

  // For selected vehicle — get today's schedule
  const vehicleSchedule = useMemo(() => {
    if (!selectedVehicle) return [];
    return todayBookings
      .filter((b) => b.vehicleId === selectedVehicle.id)
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }, [selectedVehicle, todayBookings]);

  // Determine which vehicles are currently in use right now
  const activeVehicleIds = useMemo(() => {
    const now = new Date();
    const activeIds = new Set();
    todayBookings.forEach(b => {
      if (b.status === BOOKING_STATUS.ONGOING) {
        if (b.vehicleId) activeIds.add(b.vehicleId);
      } else if (b.status === BOOKING_STATUS.APPROVED) {
        if (now >= new Date(b.startTime) && now <= new Date(b.endTime)) {
          if (b.vehicleId) activeIds.add(b.vehicleId);
        }
      }
    });
    return activeIds;
  }, [todayBookings]);

  const getStatusClass = (v) => {
    if (activeVehicleIds.has(v.id)) return 'in-use';
    if (v.status === VEHICLE_STATUS.MAINTENANCE) return 'maintenance';
    return 'available';
  };

  const getStatusLabel = (v) => {
    if (activeVehicleIds.has(v.id)) return 'Dipakai';
    if (v.status === VEHICLE_STATUS.MAINTENANCE) return 'Perawatan';
    return 'Tersedia';
  };

  const isMotorcycle = (v) => v.tipe === 'Motor';

  // Calculate timeline position for a booking
  const getSlotStyle = (booking) => {
    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);

    let startHour = start.getHours() + start.getMinutes() / 60;
    let endHour = end.getHours() + end.getMinutes() / 60;

    // Clamp to office hours
    startHour = Math.max(startHour, OFFICE_START);
    endHour = Math.min(endHour, OFFICE_END);

    const leftPercent = ((startHour - OFFICE_START) / TOTAL_HOURS) * 100;
    const widthPercent = ((endHour - startHour) / TOTAL_HOURS) * 100;

    return {
      left: `${leftPercent}%`,
      width: `${Math.max(widthPercent, 2)}%`,
    };
  };

  // Current time indicator position
  const nowPosition = useMemo(() => {
    const now = new Date();
    const hour = now.getHours() + now.getMinutes() / 60;
    if (hour < OFFICE_START || hour > OFFICE_END) return null;
    return ((hour - OFFICE_START) / TOTAL_HOURS) * 100;
  }, []);

  return (
    <Card className="p-6 vs-root">
      <div className="vs-header">
        <div className="vs-header-text">
          <h2>Etalase Kendaraan Hari Ini</h2>
          <p>Klik kendaraan untuk melihat jadwal ketersediaan di hari ini.</p>
        </div>
        <div className="vs-header-icon">
          <Car size={20} />
        </div>
      </div>

      <div className="vs-grid">
        {vehicles.map((v) => {
          const statusCls = getStatusClass(v);
          return (
            <div
              key={v.id}
              className={`vs-card vs-card--${statusCls}`}
              onClick={() => statusCls !== 'maintenance' && setSelectedVehicle(v)}
              role="button"
              tabIndex={statusCls !== 'maintenance' ? 0 : -1}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && statusCls !== 'maintenance') setSelectedVehicle(v);
              }}
            >
              <div className="vs-card-svg">
                {isMotorcycle(v) ? <MotorcycleSVG size={40} /> : <CarSVG size={48} />}
              </div>
              <div className="vs-card-name">{v.merek}</div>
              <div className="vs-card-plate">{v.platNomor}</div>
              <div className={`vs-card-status vs-card-status--${statusCls}`}>
                <span className="vs-card-status-dot" />
                {getStatusLabel(v)}
              </div>
              {statusCls === 'maintenance' && (
                <Wrench size={12} style={{
                  position: 'absolute', top: 6, right: 6,
                  color: 'var(--color-text-soft)', opacity: 0.5
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Availability Timeline Modal ── */}
      <Modal
        isOpen={!!selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        title={`Ketersediaan: ${selectedVehicle?.merek || ''}`}
        size="md"
      >
        {selectedVehicle && (
          <div>
            {/* Vehicle info header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{
                width: 56, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '0.75rem', background: 'var(--color-surface-muted)'
              }}>
                {isMotorcycle(selectedVehicle) ? <MotorcycleSVG size={36} /> : <CarSVG size={42} />}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--color-heading)', fontSize: '0.9375rem' }}>
                  {selectedVehicle.merek}
                </div>
                <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-brand)' }}>
                  {selectedVehicle.platNomor}
                </div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <div className={`vs-card-status vs-card-status--${getStatusClass(selectedVehicle)}`}>
                  <span className="vs-card-status-dot" />
                  {getStatusLabel(selectedVehicle)}
                </div>
              </div>
            </div>

            {/* Timeline bar */}
            <div className="vs-timeline">
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-heading)', fontFamily: 'var(--font-heading)' }}>
                Jadwal Hari Ini
              </p>

              <div className="vs-timeline-bar-wrapper">
                <div className="vs-timeline-hours">
                  {HOUR_LABELS.filter((_, i) => i % 2 === 0).map((h) => (
                    <span key={h}>{h}:00</span>
                  ))}
                </div>
                <div className="vs-timeline-bar">
                  {vehicleSchedule.map((b) => (
                    <div
                      key={b.id}
                      className={`vs-timeline-slot ${b.userId === user.id ? 'vs-timeline-slot--mine' : 'vs-timeline-slot--booked'}`}
                      style={getSlotStyle(b)}
                      title={`${formatTime(b.startTime)}-${formatTime(b.endTime)}: ${b.keperluan}`}
                    >
                      {b.userName?.split(' ')[0]}
                    </div>
                  ))}
                  {nowPosition !== null && (
                    <div className="vs-timeline-now" style={{ left: `${nowPosition}%` }} />
                  )}
                </div>
              </div>

              {/* Legend */}
              <div className="vs-timeline-legend">
                <div className="vs-timeline-legend-item">
                  <span className="vs-timeline-legend-dot" style={{ background: 'rgba(16,185,129,0.3)' }} />
                  Tersedia
                </div>
                <div className="vs-timeline-legend-item">
                  <span className="vs-timeline-legend-dot" style={{ background: 'rgba(59,130,246,0.7)' }} />
                  Booking Saya
                </div>
                <div className="vs-timeline-legend-item">
                  <span className="vs-timeline-legend-dot" style={{ background: 'rgba(239,68,68,0.7)' }} />
                  Sudah Dipesan
                </div>
              </div>
            </div>

            {/* Booking detail list */}
            {vehicleSchedule.length > 0 ? (
              <div className="vs-booking-list">
                <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-text-soft)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.5rem' }}>
                  Detail Peminjaman
                </p>
                {vehicleSchedule.map((b) => (
                  <div key={b.id} className="vs-booking-item">
                    <span className="vs-booking-item-time">
                      {formatTime(b.startTime)} — {formatTime(b.endTime)}
                    </span>
                    <span className="vs-booking-item-desc">{b.keperluan}</span>
                    <span className="vs-booking-item-user">{b.userName}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="vs-empty-timeline">
                Kendaraan ini tersedia sepanjang hari.
              </div>
            )}
          </div>
        )}
      </Modal>
    </Card>
  );
}
