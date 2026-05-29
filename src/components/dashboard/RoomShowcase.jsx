import { useAuth } from '../../contexts/AuthContext';
import { useRoomBooking } from '../../contexts/RoomBookingContext';
import { formatTime } from '../../utils/helpers';
import { Building2, Wrench } from 'lucide-react';
import ResourceShowcase from './ResourceShowcase';
import './VehicleShowcase.css';

export default function RoomShowcase() {
  const { user } = useAuth();
  const { rooms, roomBookings } = useRoomBooking();

  const config = {
    title: 'Etalase Ruangan Hari Ini',
    subtitle: 'Klik ruangan untuk melihat jadwal penggunaan pada hari ini.',
    headerIcon: Building2,
    headerIconClassName: 'bg-blue-500/10 text-blue-600',
    getResourceId: (r) => r.id,
    getBookingResourceId: (b) => b.roomId,
    getResourceName: (r) => r.name,
    isMaintenance: (r) => r.status === 'Dalam Perawatan',
    isBookingOngoing: (b) => b.status === 'Berlangsung',
    isBookingApproved: (b) => b.status === 'Disetujui',
    isBookingCompletedOrCancelled: (b) => 
      ['Dibatalkan', 'Selesai', 'Selesai dengan Catatan'].includes(b.status),
    
    // Custom tailwind classes for the Room modal
    timelineContainerClassName: "vs-timeline bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm",
    timelineBarClassName: "vs-timeline-bar bg-gray-100 dark:bg-gray-800 border-none",
    timelineLegendClassName: "vs-timeline-legend mt-4 pt-4 border-t border-gray-100 dark:border-gray-800",
    bookingListClassName: "vs-booking-list mt-4 bg-gray-50 dark:bg-gray-800/30 rounded-2xl p-4 border border-gray-100 dark:border-gray-800",
    bookingItemClassName: "vs-booking-item bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-3 mb-2 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2",
    emptyTimelineClassName: "vs-empty-timeline mt-4 bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 p-4 rounded-2xl text-center text-sm font-medium border border-green-100 dark:border-green-900/30",
    
    // UI Renderers
    renderCard: (r, statusCls, statusLabel) => (
      <div className={`vs-card vs-card--${statusCls} border border-transparent hover:border-blue-200 shadow-sm`}>
        <div className="vs-card-svg text-blue-500">
          {r.photo ? (
            <img src={r.photo} alt={r.name} className="w-12 h-12 rounded-lg object-cover mx-auto mb-2" />
          ) : (
            <Building2 size={40} className="mx-auto mb-2 opacity-80" />
          )}
        </div>
        <div className="vs-card-name font-bold text-gray-800 dark:text-gray-200">{r.name}</div>
        <div className={`vs-card-status vs-card-status--${statusCls} mt-2`}>
          <span className="vs-card-status-dot" />
          {statusLabel}
        </div>
        {statusCls === 'maintenance' && (
          <Wrench size={12} style={{
            position: 'absolute', top: 6, right: 6,
            color: 'var(--color-text-soft)', opacity: 0.5
          }} />
        )}
      </div>
    ),
    
    renderModalHeader: (r, statusCls, statusLabel) => (
      <div className="flex items-center gap-4 mb-6 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
        <div className="w-16 h-16 flex items-center justify-center rounded-xl bg-blue-100 text-blue-600 border border-blue-200 shadow-sm overflow-hidden">
          {r.photo ? (
            <img src={r.photo} alt={r.name} className="w-full h-full object-cover" />
          ) : (
            <Building2 size={32} />
          )}
        </div>
        <div className="flex-1">
          <div className="font-heading font-extrabold text-gray-900 dark:text-white text-lg">
            {r.name}
          </div>
        </div>
        <div>
          <div className={`vs-card-status vs-card-status--${statusCls} shadow-sm`}>
            <span className="vs-card-status-dot" />
            {statusLabel}
          </div>
        </div>
      </div>
    ),

    getSlotClassName: (b, isMine) => 
      isMine ? 'bg-blue-500 shadow-blue-500/30 shadow-md text-white' : 'bg-red-500 shadow-red-500/30 shadow-md text-white',
      
    getTimelineNowClassName: () => 'vs-timeline-now bg-djp-yellow shadow-sm',

    renderTimelineLegend: () => (
      <>
        <div className="vs-timeline-legend-item text-xs font-medium text-gray-600">
          <span className="vs-timeline-legend-dot bg-gray-200" />
          Tersedia
        </div>
        <div className="vs-timeline-legend-item text-xs font-medium text-gray-600">
          <span className="vs-timeline-legend-dot bg-blue-500" />
          Booking Saya
        </div>
        <div className="vs-timeline-legend-item text-xs font-medium text-gray-600">
          <span className="vs-timeline-legend-dot bg-red-500" />
          Sudah Dipesan
        </div>
      </>
    ),
    
    renderBookingListHeader: () => (
      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
        Detail Pemakaian Ruangan
      </p>
    ),

    renderBookingItem: (b) => (
      <>
        <span className="vs-booking-item-time font-mono text-sm text-blue-600 font-bold bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md">
          {formatTime(b.startTime)} — {formatTime(b.endTime)}
        </span>
        <span className="vs-booking-item-desc flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">{b.keperluan}</span>
        <span className="vs-booking-item-user text-xs font-bold text-gray-500 uppercase tracking-wider">{b.userName}</span>
      </>
    ),

    emptyTimelineText: "Ruangan ini tersedia sepanjang hari."
  };

  return (
    <ResourceShowcase
      currentUserId={user.id}
      resources={rooms}
      bookings={roomBookings}
      config={config}
    />
  );
}
