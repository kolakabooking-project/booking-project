import { useState } from 'react';
import { useRoomBooking } from '../../../contexts/RoomBookingContext';
import Card from '../../../components/ui/Card';
import PageHeader from '../../../components/ui/PageHeader';
import { ROOM_STATUS } from '../../../utils/constants';
import { isToday, formatTime } from '../../../utils/helpers';
import Badge from '../../../components/ui/Badge';
import { Building2, Clock, User } from 'lucide-react';
import RoomStatsCards from '../../../components/dashboard/RoomStatsCards';

export default function AdminDashboardPage() {
  const { rooms, roomBookings } = useRoomBooking();

  const availableRooms = rooms.filter(r => r.status === ROOM_STATUS.AVAILABLE).length;

  const todaysBookings = roomBookings
    .filter(b => b.status === 'Disetujui' && isToday(new Date(b.startTime)))
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  return (
    <div>
      <PageHeader
        title="Ringkasan Operasional Ruangan"
        subtitle="Awasi antrean booking ruangan dan penggunaan ruangan."
      />

      <RoomStatsCards />

      {/* Jadwal Penggunaan Hari Ini */}
      <Card className="p-6">
        <div className="mb-6 flex items-center justify-between border-b pb-4 dark:border-gray-700">
          <div>
            <h3 className="text-xl font-heading font-bold text-gray-800 dark:text-white">Jadwal Hari Ini</h3>
            <p className="text-sm text-gray-500 mt-1">Daftar ruangan yang telah disetujui untuk digunakan pada hari ini.</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600">
            <Building2 size={24} />
          </div>
        </div>

        {todaysBookings.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 text-gray-400">
              <Clock size={32} />
            </div>
            <p className="text-gray-500 font-medium">Tidak ada jadwal penggunaan hari ini.</p>
            <p className="text-sm text-gray-400 mt-1">Semua ruangan tersedia untuk dibooking.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {todaysBookings.map((booking) => {
              const room = rooms.find(r => r.id === booking.roomId);
              return (
                <div key={booking.id} className="group relative flex flex-col sm:flex-row gap-4 rounded-2xl border p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors dark:border-gray-700">
                  <div className="flex flex-col sm:w-48 shrink-0">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-md mt-2 w-fit">
                      {room ? room.name : 'Ruangan'}
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h4 className="font-heading font-bold text-gray-800 dark:text-white mb-1">{booking.keperluan}</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                      <User size={14} />
                      <span>{booking.userName}</span>
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <span>{booking.peserta || 1} Peserta</span>
                    </div>
                  </div>
                  <div className="flex items-start justify-end">
                    <Badge status={booking.status} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
