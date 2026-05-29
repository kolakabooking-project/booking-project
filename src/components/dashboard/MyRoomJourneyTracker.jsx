import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useRoomBooking } from '../../contexts/RoomBookingContext';
import { formatDateShort, formatTime } from '../../utils/helpers';
import {
  Building2, CalendarCheck, PlayCircle, Flag,
  Plus, MonitorPlay
} from 'lucide-react';
import JourneyTracker from './JourneyTracker';
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

export default function MyRoomJourneyTracker({ onNewBooking }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getUserRoomBookings } = useRoomBooking();

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

  const config = {
    title: "Tracking Ruangan",
    toggleButtonClass: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800/30",
    checkpoints: [
      {
        id: 'start',
        type: 'static',
        icon: Building2,
        checkpointClass: 'mjt-checkpoint--start',
        nodeClass: 'border-blue-200',
        iconClass: 'text-blue-600',
        cardClass: 'border-blue-100 shadow-sm',
        roadClass: 'bg-blue-100',
        renderCardContent: () => (
          <>
            <div className="mjt-checkpoint-label text-blue-900 dark:text-blue-100">Dashboard</div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
              Mulai dari sini
            </div>
            <button className="mjt-cta-btn bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 mt-3" onClick={onNewBooking} type="button">
              <Plus size={16} /> Booking Ruang
            </button>
          </>
        )
      },
      {
        id: 'approved',
        type: 'dynamic',
        icon: CalendarCheck,
        count: upcoming.length,
        checkpointClass: 'mjt-checkpoint--approved',
        nodeClass: 'border-green-200',
        iconClass: 'text-green-600',
        countClass: 'text-green-700',
        cardClass: 'border-green-100 shadow-sm hover:border-green-300',
        roadClass: 'bg-green-100',
        onClick: () => handleNavigateBookings('Disetujui'),
        renderCardContent: () => (
          <>
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
          </>
        )
      },
      {
        id: 'ongoing',
        type: 'dynamic',
        icon: PlayCircle,
        count: ongoing.length,
        checkpointClass: 'mjt-checkpoint--ongoing',
        nodeClass: 'border-purple-200',
        iconClass: 'text-purple-600',
        countClass: 'text-purple-700',
        cardClass: 'border-purple-100 shadow-sm hover:border-purple-300',
        roadClass: 'bg-purple-100',
        onClick: () => handleNavigateBookings('Berlangsung'),
        renderCardContent: () => (
          <>
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
          </>
        )
      },
      {
        id: 'completed',
        type: 'dynamic',
        icon: Flag,
        count: completed.length,
        checkpointClass: 'mjt-checkpoint--done',
        nodeClass: 'border-orange-200',
        iconClass: 'text-orange-600',
        countClass: 'text-orange-700',
        cardClass: 'border-orange-100 shadow-sm hover:border-orange-300',
        onClick: () => handleNavigateBookings('Selesai'),
        renderCardContent: () => (
          <>
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
          </>
        )
      }
    ]
  };

  return <JourneyTracker config={config} />;
}
