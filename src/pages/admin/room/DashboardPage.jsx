import { useState } from 'react';
import { useRoomBooking } from '../../../contexts/RoomBookingContext';
import Card from '../../../components/ui/Card';
import PageHeader from '../../../components/ui/PageHeader';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Badge from '../../../components/ui/Badge';
import RoomBookingModalFlow from '../../../components/shared/RoomBookingModalFlow';
import Calendar from '../../../components/shared/Calendar';
import RoomCommandCenter from '../../../components/dashboard/RoomCommandCenter';
import RoomTimetableBoard from '../../../components/dashboard/RoomTimetableBoard';
import { ROOM_STATUS } from '../../../utils/constants';
import { formatDateShort, formatTime } from '../../../utils/helpers';
import { Plus, Building2 } from 'lucide-react';

export default function AdminDashboardPage() {
  const { rooms, roomBookings, getRoomBookingsForDate } = useRoomBooking();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [bookingFlowDate, setBookingFlowDate] = useState(null);

  const dayBookings = selectedDate ? getRoomBookingsForDate(selectedDate) : [];

  return (
    <div>
      <PageHeader
        title="Ringkasan Operasional Ruangan"
        subtitle="Awasi antrean booking ruangan, penggunaan ruangan, dan kalender."
        actions={
          <Button onClick={() => setIsModalOpen(true)} variant="primary" size="md">
            <Plus size={16} className="mr-1.5" />
            <span className="hidden sm:inline">Buat Peminjaman (Mandatory)</span>
            <span className="sm:hidden">+ Mandatory</span>
          </Button>
        }
      />

      {/* Interactive Room Command Center */}
      <RoomCommandCenter />

      {/* Dynamic Gantt Chart Room Occupancy Timetable Board */}
      <RoomTimetableBoard />

      {/* Calendar + Insight Card */}
      <div className="mb-6 sm:mb-8 grid gap-5 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <Calendar 
          onDateClick={(date) => setSelectedDate(date)} 
          onMandatoryBookingClick={(date) => {
            setBookingFlowDate(date);
            setIsModalOpen(true);
          }}
          allowPastClick={true} 
          getBookingsForDate={getRoomBookingsForDate}
          bookings={roomBookings}
          totalResources={rooms.filter(r => r.status !== 'Dalam Perawatan').length}
        />
        <Card className="p-6">
          <span className="page-kicker">Insight Hari Ini</span>
          <h2 className="mt-4 text-xl font-heading font-bold text-[color:var(--color-heading)]">Prioritas admin</h2>
          <div className="mt-6 space-y-3">
            <div className="surface-muted p-4">
              <p className="text-sm font-semibold text-[color:var(--color-text-muted)]">Antrean persetujuan</p>
              <p className="mt-1 text-sm leading-6 text-[color:var(--color-text-soft)]">
                {roomBookings.filter(b => b.status === 'Pending').length} permintaan perlu diproses agar jadwal ruangan tetap lancar.
              </p>
            </div>
            <div className="surface-muted p-4">
              <p className="text-sm font-semibold text-[color:var(--color-text-muted)]">Ruangan aktif hari ini</p>
              <p className="mt-1 text-sm leading-6 text-[color:var(--color-text-soft)]">
                {roomBookings.filter(b => {
                  const s = new Date(b.startTime);
                  const today = new Date();
                  return (b.status === 'Disetujui' || b.status === 'Sedang Digunakan') && 
                    s.getDate() === today.getDate() && s.getMonth() === today.getMonth() && s.getFullYear() === today.getFullYear();
                }).length} ruangan sedang digunakan atau sudah dialokasikan untuk hari ini.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Date Detail Modal */}
      <Modal isOpen={!!selectedDate} onClose={() => setSelectedDate(null)} title={selectedDate ? `Booking: ${formatDateShort(selectedDate)}` : ''} size="md">
        <div className="space-y-4">
          {dayBookings.length === 0 ? (
            <div className="py-8 text-center text-[color:var(--color-text-soft)] font-medium">Tidak ada peminjaman ruangan di hari ini.</div>
          ) : (
            <div className="space-y-3">
              {dayBookings.map(b => {
                const room = rooms.find(r => r.id === b.roomId);
                return (
                  <div key={b.id} className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-muted)' }}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-heading font-bold text-[color:var(--color-heading)]">{b.userName}</span>
                      <Badge status={b.status} />
                    </div>
                    <div className="text-sm text-[color:var(--color-text-muted)]">
                      <p><span className="font-semibold">Waktu:</span> {formatTime(b.startTime)} - {formatTime(b.endTime)}</p>
                      <p><span className="font-semibold">Keperluan:</span> {b.keperluan}</p>
                      <p><span className="font-semibold">Ruangan:</span> {room ? room.name : 'Belum dialokasikan'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
            <Button
              variant="primary"
              onClick={() => {
                const dateToUse = selectedDate;
                setSelectedDate(null);
                setBookingFlowDate(dateToUse);
                setIsModalOpen(true);
              }}
              className="w-full sm:w-auto"
            >
              + Buat Peminjaman (Mandatory)
            </Button>
            <Button variant="secondary" onClick={() => setSelectedDate(null)} className="w-full sm:w-auto">
              Tutup
            </Button>
          </div>
        </div>
      </Modal>

      <RoomBookingModalFlow
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setBookingFlowDate(null);
        }}
        selectedDate={bookingFlowDate}
        isAdmin={true}
      />
    </div>
  );
}
