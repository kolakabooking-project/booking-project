import { useAuth } from '../../contexts/AuthContext';
import { useBooking } from '../../contexts/BookingContext';
import { BOOKING_STATUS, VEHICLE_STATUS } from '../../utils/constants';
import { formatTime } from '../../utils/helpers';
import { Car, Wrench } from 'lucide-react';
import { CarIcon as CarSVG, MotorcycleIcon as MotorcycleSVG } from '../icons/VehicleIcons';
import VehiclePhoto from '../ui/VehiclePhoto';
import ResourceShowcase from './ResourceShowcase';
import './VehicleShowcase.css';

export default function VehicleShowcase() {
  const { user } = useAuth();
  const { vehicles, bookings } = useBooking();

  const isMotorcycle = (v) => v.tipe === 'Motor';

  const config = {
    title: 'Etalase Kendaraan Hari Ini',
    subtitle: 'Klik kendaraan untuk melihat jadwal ketersediaan di hari ini.',
    headerIcon: Car,
    getResourceId: (v) => v.id,
    getBookingResourceId: (b) => b.vehicleId,
    getResourceName: (v) => v.merek,
    isMaintenance: (v) => v.status === VEHICLE_STATUS.MAINTENANCE,
    isBookingOngoing: (b) => b.status === BOOKING_STATUS.ONGOING,
    isBookingApproved: (b) => b.status === BOOKING_STATUS.APPROVED,
    isBookingCompletedOrCancelled: (b) => 
      [BOOKING_STATUS.REJECTED, BOOKING_STATUS.CANCELLED, BOOKING_STATUS.COMPLETED, BOOKING_STATUS.COMPLETED_WITH_NOTES].includes(b.status),
    
    // UI Renderers
    renderCard: (v, statusCls, statusLabel) => (
      <div className={`vs-vehicle-card vs-vehicle-card--${v.hasFoto ? 'has-photo' : 'no-photo'} vs-vehicle-card--${statusCls}`}>
        <div className="vs-vehicle-card-bg">
          {v.hasFoto ? (
            <>
              <VehiclePhoto
                vehicleId={v.id}
                hasFoto={v.hasFoto}
                alt={v.merek}
                className="vs-vehicle-card-img"
                fallback={
                  <div className="vs-vehicle-card-fallback">
                    <div className="vs-vehicle-fallback-icon-wrapper">
                      {isMotorcycle(v) ? <MotorcycleSVG size={48} /> : <CarSVG size={56} />}
                    </div>
                  </div>
                }
              />
              <div className="vs-vehicle-card-overlay" />
            </>
          ) : (
            <div className="vs-vehicle-card-fallback">
              <div className="vs-vehicle-fallback-icon-wrapper">
                {isMotorcycle(v) ? <MotorcycleSVG size={48} /> : <CarSVG size={56} />}
              </div>
            </div>
          )}
        </div>
        <div className="vs-vehicle-card-content">
          <div className="vs-vehicle-card-name">{v.merek}</div>
          <div className="vs-vehicle-card-plate">{v.platNomor}</div>
          <div className={`vs-card-status vs-card-status--${statusCls}`}>
            <span className="vs-card-status-dot" />
            {statusLabel}
          </div>
        </div>
        {statusCls === 'maintenance' && (
          <Wrench size={14} style={{
            position: 'absolute', top: 10, right: 10, zIndex: 10,
            color: 'var(--color-text-soft)', opacity: 0.8
          }} />
        )}
      </div>
    ),
    
    renderModalHeader: (v, statusCls, statusLabel) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{
          width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: '0.875rem', background: 'var(--color-surface-muted)', overflow: 'hidden', flexShrink: 0
        }}>
          <VehiclePhoto
            vehicleId={v.id}
            hasFoto={v.hasFoto}
            alt={v.merek}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            fallback={isMotorcycle(v) ? <MotorcycleSVG size={36} /> : <CarSVG size={42} />}
          />
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--color-heading)', fontSize: '0.9375rem' }}>
            {v.merek}
          </div>
          <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-brand)' }}>
            {v.platNomor}
          </div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <div className={`vs-card-status vs-card-status--${statusCls}`}>
            <span className="vs-card-status-dot" />
            {statusLabel}
          </div>
        </div>
      </div>
    ),

    getSlotClassName: (b, isMine) => 
      isMine ? 'vs-timeline-slot--mine' : 'vs-timeline-slot--booked',

    renderTimelineLegend: () => (
      <>
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
      </>
    ),

    renderBookingItem: (b) => (
      <>
        <span className="vs-booking-item-time">
          {formatTime(b.startTime)} — {formatTime(b.endTime)}
        </span>
        <span className="vs-booking-item-desc">{b.keperluan}</span>
        <span className="vs-booking-item-user">{b.userName}</span>
      </>
    ),

    emptyTimelineText: "Kendaraan ini tersedia sepanjang hari."
  };

  return (
    <ResourceShowcase
      currentUserId={user.id}
      resources={vehicles}
      bookings={bookings}
      config={config}
    />
  );
}
