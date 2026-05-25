import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRoomBooking } from '../../../contexts/RoomBookingContext';
// import RoomCalendar from '../../../components/shared/RoomCalendar';
import MyRoomJourneyTracker from '../../../components/dashboard/MyRoomJourneyTracker';
import RoomShowcase from '../../../components/dashboard/RoomShowcase';
import RoomBookingModalFlow from '../../../components/shared/RoomBookingModalFlow';
import Card from '../../../components/ui/Card';
import PageHeader from '../../../components/ui/PageHeader';
import { ROOM_STATUS } from '../../../utils/constants';

export default function DashboardPage() {
  const { user } = useAuth();
  const { rooms, getRoomBookingsForDate } = useRoomBooking();
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const availableToday = rooms.filter((r) => r.status === ROOM_STATUS.AVAILABLE).length;

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setModalOpen(true);
  };

  const handleNewBookingFromTracker = () => {
    setSelectedDate(null);
    setModalOpen(true);
  };

  const dateBookings = selectedDate ? getRoomBookingsForDate(selectedDate) : [];

  return (
    <div>
      <PageHeader
        title={`Selamat datang, ${user.name}`}
        subtitle="Pantau peminjaman aktif, cek kapasitas ruangan hari ini, dan buat permintaan baru."
      />



      <div className="flex flex-col gap-8 mb-8">
        {/* On Mobile: below calendar. On Desktop: above calendar */}
        <div className="order-2 2xl:order-1 w-full grid gap-5 2xl:grid-cols-[minmax(0,1.15fr)_420px]">
          <RoomShowcase />

          {/* Agenda Card */}
          <Card className="hidden 2xl:block overflow-hidden p-0">
            <div className="border-b px-6 py-5" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-xl font-heading font-bold text-[color:var(--color-heading)]">Agenda hari terpilih</h2>
              <p className="mt-2 text-sm text-[color:var(--color-text-soft)]">Klik tanggal pada kalender untuk melihat detail booking pada hari tersebut.</p>
            </div>
            <div className="p-6">
              <div className="surface-muted p-5 rounded-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-soft)]">Insight</p>
                <p className="mt-3 text-3xl font-heading font-extrabold text-[color:var(--color-heading)]">{availableToday}</p>
                <p className="mt-1 text-sm text-[color:var(--color-text-soft)]">ruangan tersedia untuk kebutuhan hari ini.</p>
              </div>
            </div>
          </Card>
        </div>

        {/* On Mobile: above vehicle showcase. On Desktop: below vehicle showcase */}
        <div className="order-1 2xl:order-2 w-full">
          <MyRoomJourneyTracker onNewBooking={() => setModalOpen(true)} />
        </div>
      </div>

      <RoomBookingModalFlow
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedDate={selectedDate}
        dateBookings={dateBookings}
      />
    </div>
  );
}
