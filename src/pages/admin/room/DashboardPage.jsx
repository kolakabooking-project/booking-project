import { useState } from 'react';
import { useRoomBooking } from '../../../contexts/RoomBookingContext';
import Card from '../../../components/ui/Card';
import PageHeader from '../../../components/ui/PageHeader';
import { ROOM_STATUS } from '../../../utils/constants';

export default function AdminDashboardPage() {
  const { rooms } = useRoomBooking();

  const availableRooms = rooms.filter(r => r.status === ROOM_STATUS.AVAILABLE).length;

  return (
    <div>
      <PageHeader
        title="Ringkasan Operasional Ruangan"
        subtitle="Awasi antrean booking ruangan dan penggunaan ruangan."
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card className="p-6 border-blue-500/20 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 mb-2">Total Ruangan</h3>
          <p className="text-3xl font-bold text-gray-800 dark:text-white">{rooms.length}</p>
        </Card>
        <Card className="p-6 border-green-500/20 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 mb-2">Ruangan Tersedia</h3>
          <p className="text-3xl font-bold text-green-600">{availableRooms}</p>
        </Card>
      </div>

      <Card className="p-8 text-center text-gray-500 border-dashed border-2 min-h-[300px] flex items-center justify-center">
        <div>
          <h3 className="text-xl font-bold mb-3 text-gray-700 dark:text-gray-300">Room Command Center (WIP)</h3>
          <p>Akan menampilkan tabel antrean booking ruangan yang menunggu persetujuan dan jadwal penggunaan ruangan harian.</p>
        </div>
      </Card>
    </div>
  );
}
