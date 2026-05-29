import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useBooking } from '../../contexts/BookingContext';
import { BOOKING_STATUS } from '../../utils/constants';
import { formatDateShort, formatTime } from '../../utils/helpers';
import {
  Building2, Clock, ShieldCheck, Navigation, Flag, Plus
} from 'lucide-react';
import { CarIcon, MotorcycleIcon } from '../icons/VehicleIcons';
import JourneyTracker from './JourneyTracker';
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

export default function MyJourneyTracker({ onNewBooking }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getUserBookings } = useBooking();

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

  const config = {
    title: "Perjalanan Saya",
    checkpoints: [
      {
        id: 'start',
        type: 'static',
        icon: Building2,
        checkpointClass: 'mjt-checkpoint--start',
        renderCardContent: () => (
          <>
            <div className="mjt-checkpoint-label">Kantor</div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
              Mulai dari sini
            </div>
            <button className="mjt-cta-btn" onClick={onNewBooking} type="button">
              <Plus /> Buat Booking
            </button>
          </>
        )
      },
      {
        id: 'pending',
        type: 'dynamic',
        icon: Clock,
        count: pending.length,
        checkpointClass: 'mjt-checkpoint--pending',
        onClick: () => handleNavigateBookings(BOOKING_STATUS.PENDING),
        renderCardContent: () => (
          <>
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
          </>
        )
      },
      {
        id: 'approved',
        type: 'dynamic',
        icon: ShieldCheck,
        count: approved.length,
        checkpointClass: 'mjt-checkpoint--approved',
        onClick: () => handleNavigateBookings(BOOKING_STATUS.APPROVED),
        renderCardContent: () => (
          <>
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
          </>
        )
      },
      {
        id: 'ongoing',
        type: 'dynamic',
        icon: Navigation,
        count: ongoing.length,
        checkpointClass: 'mjt-checkpoint--ongoing',
        onClick: () => handleNavigateBookings(BOOKING_STATUS.ONGOING),
        renderCardContent: () => (
          <>
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
          </>
        )
      },
      {
        id: 'completed',
        type: 'dynamic',
        icon: Flag,
        count: completed.length,
        checkpointClass: 'mjt-checkpoint--done',
        onClick: () => handleNavigateBookings(BOOKING_STATUS.COMPLETED),
        renderCardContent: () => (
          <>
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
          </>
        )
      }
    ]
  };

  return <JourneyTracker config={config} />;
}
