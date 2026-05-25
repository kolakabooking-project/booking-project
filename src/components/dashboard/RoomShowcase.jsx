import { useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRoomBooking } from '../../contexts/RoomBookingContext';
import { formatTime } from '../../utils/helpers';
import Modal from '../ui/Modal';
import Card from '../ui/Card';
import { Building2, Wrench, Users, Wifi, Tv } from 'lucide-react';
import './VehicleShowcase.css'; // Reusing similar CSS styles

const OFFICE_START = 7;  // 07:00
const OFFICE_END = 18;   // 18:00
const TOTAL_HOURS = OFFICE_END - OFFICE_START;
const HOUR_LABELS = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => {
  const h = OFFICE_START + i;
  return h < 10 ? `0${h}` : `${h}`;
});

export default function RoomShowcase() {
  const { user } = useAuth();
  const { rooms, roomBookings } = useRoomBooking();
  const [selectedRoom, setSelectedRoom] = useState(null);

  const todayBookings = useMemo(() => {
    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(now);
    dayEnd.setHours(23, 59, 59, 999);

    return roomBookings.filter((b) => {
      if (['Dibatalkan', 'Selesai', 'Selesai dengan Catatan'].includes(b.status)) return false;
      const start = new Date(b.startTime);
      const end = new Date(b.endTime);
      return start <= dayEnd && end >= dayStart;
    });
  }, [roomBookings]);

  const roomSchedule = useMemo(() => {
    if (!selectedRoom) return [];
    return todayBookings
      .filter((b) => b.roomId === selectedRoom.id)
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }, [selectedRoom, todayBookings]);

  const activeRoomIds = useMemo(() => {
    const now = new Date();
    const activeIds = new Set();
    todayBookings.forEach(b => {
      if (b.status === 'Berlangsung') {
        if (b.roomId) activeIds.add(b.roomId);
      } else if (b.status === 'Disetujui') {
        if (now >= new Date(b.startTime) && now <= new Date(b.endTime)) {
          if (b.roomId) activeIds.add(b.roomId);
        }
      }
    });
    return activeIds;
  }, [todayBookings]);

  const getStatusClass = (r) => {
    if (activeRoomIds.has(r.id)) return 'in-use';
    if (r.status === 'Dalam Perawatan') return 'maintenance';
    return 'available';
  };

  const getStatusLabel = (r) => {
    if (activeRoomIds.has(r.id)) return 'Dipakai';
    if (r.status === 'Dalam Perawatan') return 'Perawatan';
    return 'Tersedia';
  };

  const getSlotStyle = (booking) => {
    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);

    let startHour = start.getHours() + start.getMinutes() / 60;
    let endHour = end.getHours() + end.getMinutes() / 60;

    startHour = Math.max(startHour, OFFICE_START);
    endHour = Math.min(endHour, OFFICE_END);

    const leftPercent = ((startHour - OFFICE_START) / TOTAL_HOURS) * 100;
    const widthPercent = ((endHour - startHour) / TOTAL_HOURS) * 100;

    return {
      left: `${leftPercent}%`,
      width: `${Math.max(widthPercent, 2)}%`,
    };
  };

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
          <h2>Etalase Ruangan Hari Ini</h2>
          <p>Klik ruangan untuk melihat jadwal penggunaan pada hari ini.</p>
        </div>
        <div className="vs-header-icon bg-blue-500/10 text-blue-600">
          <Building2 size={24} />
        </div>
      </div>

      <div className="vs-grid">
        {rooms.map((r) => {
          const statusCls = getStatusClass(r);
          return (
            <div
              key={r.id}
              className={`vs-card vs-card--${statusCls} border border-transparent hover:border-blue-200 shadow-sm`}
              onClick={() => statusCls !== 'maintenance' && setSelectedRoom(r)}
              role="button"
              tabIndex={statusCls !== 'maintenance' ? 0 : -1}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && statusCls !== 'maintenance') setSelectedRoom(r);
              }}
            >
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
                {getStatusLabel(r)}
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

      <Modal
        isOpen={!!selectedRoom}
        onClose={() => setSelectedRoom(null)}
        title={`Ketersediaan: ${selectedRoom?.name || ''}`}
        size="md"
      >
        {selectedRoom && (
          <div>
            <div className="flex items-center gap-4 mb-6 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="w-16 h-16 flex items-center justify-center rounded-xl bg-blue-100 text-blue-600 border border-blue-200 shadow-sm overflow-hidden">
                {selectedRoom.photo ? (
                  <img src={selectedRoom.photo} alt={selectedRoom.name} className="w-full h-full object-cover" />
                ) : (
                  <Building2 size={32} />
                )}
              </div>
              <div className="flex-1">
                <div className="font-heading font-extrabold text-gray-900 dark:text-white text-lg">
                  {selectedRoom.name}
                </div>
              </div>
              <div>
                <div className={`vs-card-status vs-card-status--${getStatusClass(selectedRoom)} shadow-sm`}>
                  <span className="vs-card-status-dot" />
                  {getStatusLabel(selectedRoom)}
                </div>
              </div>
            </div>

            <div className="vs-timeline bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200 font-heading mb-3">
                Jadwal Hari Ini
              </p>

              <div className="vs-timeline-bar-wrapper">
                <div className="vs-timeline-hours">
                  {HOUR_LABELS.filter((_, i) => i % 2 === 0).map((h) => (
                    <span key={h}>{h}:00</span>
                  ))}
                </div>
                <div className="vs-timeline-bar bg-gray-100 dark:bg-gray-800 border-none">
                  {roomSchedule.map((b) => (
                    <div
                      key={b.id}
                      className={`vs-timeline-slot ${b.userId === user.id ? 'bg-blue-500 shadow-blue-500/30' : 'bg-red-500 shadow-red-500/30'} shadow-md text-white`}
                      style={getSlotStyle(b)}
                      title={`${formatTime(b.startTime)}-${formatTime(b.endTime)}: ${b.keperluan}`}
                    >
                      {b.userName?.split(' ')[0]}
                    </div>
                  ))}
                  {nowPosition !== null && (
                    <div className="vs-timeline-now bg-djp-yellow shadow-sm" style={{ left: `${nowPosition}%`, width: '2px', zIndex: 10 }} />
                  )}
                </div>
              </div>

              <div className="vs-timeline-legend mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
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
              </div>
            </div>

            {roomSchedule.length > 0 ? (
              <div className="vs-booking-list mt-4 bg-gray-50 dark:bg-gray-800/30 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                  Detail Pemakaian Ruangan
                </p>
                {roomSchedule.map((b) => (
                  <div key={b.id} className="vs-booking-item bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-3 mb-2 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="vs-booking-item-time font-mono text-sm text-blue-600 font-bold bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md">
                      {formatTime(b.startTime)} — {formatTime(b.endTime)}
                    </span>
                    <span className="vs-booking-item-desc flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">{b.keperluan}</span>
                    <span className="vs-booking-item-user text-xs font-bold text-gray-500 uppercase tracking-wider">{b.userName}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="vs-empty-timeline mt-4 bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 p-4 rounded-2xl text-center text-sm font-medium border border-green-100 dark:border-green-900/30">
                Ruangan ini tersedia sepanjang hari.
              </div>
            )}
          </div>
        )}
      </Modal>
    </Card>
  );
}
