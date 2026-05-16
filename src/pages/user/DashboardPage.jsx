import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useBooking } from '../../contexts/BookingContext';
import Calendar from '../../components/shared/Calendar';
import MyJourneyTracker from '../../components/dashboard/MyJourneyTracker';
import VehicleShowcase from '../../components/dashboard/VehicleShowcase';
import BookingModalFlow from '../../components/shared/BookingModalFlow';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import { VEHICLE_STATUS } from '../../utils/constants';

export default function DashboardPage() {
  const { user } = useAuth();
  const { vehicles, getBookingsForDate } = useBooking();
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const availableToday = vehicles.filter((v) => v.status === VEHICLE_STATUS.AVAILABLE).length;

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setModalOpen(true);
  };

  /* When user clicks "Buat Booking" from Journey Tracker (not from calendar),
     open the modal with today as default date (not locked). */
  const handleNewBookingFromTracker = () => {
    setSelectedDate(null); // null = today as default, not locked
    setModalOpen(true);
  };

  const dateBookings = selectedDate ? getBookingsForDate(selectedDate) : [];

  return (
    <div>
      <PageHeader
        title={`Selamat datang, ${user.name}`}
        subtitle="Pantau peminjaman aktif, cek kapasitas kendaraan hari ini, dan buat permintaan baru."
      />

      {/* Interactive Journey Tracker */}
      <MyJourneyTracker onNewBooking={handleNewBookingFromTracker} />

      <div className="flex flex-col gap-8 mb-8">
        {/* On Mobile: below calendar. On Desktop: above calendar */}
        <div className="order-2 2xl:order-1 w-full grid gap-5 2xl:grid-cols-[minmax(0,1.15fr)_420px]">
          <VehicleShowcase />

          {/* Agenda Card - Hidden on mobile, visible on desktop */}
          <Card className="hidden 2xl:block overflow-hidden p-0">
            <div className="border-b px-6 py-5" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-xl font-heading font-bold text-[color:var(--color-heading)]">Agenda hari terpilih</h2>
              <p className="mt-2 text-sm text-[color:var(--color-text-soft)]">Klik tanggal pada kalender untuk melihat detail booking pada hari tersebut.</p>
            </div>
            <div className="p-6">
              <div className="surface-muted p-5 rounded-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-soft)]">Insight</p>
                <p className="mt-3 text-3xl font-heading font-extrabold text-[color:var(--color-heading)]">{availableToday}</p>
                <p className="mt-1 text-sm text-[color:var(--color-text-soft)]">kendaraan tersedia untuk kebutuhan operasional hari ini.</p>
              </div>
            </div>
          </Card>
        </div>

        {/* On Mobile: above vehicle showcase. On Desktop: below vehicle showcase */}
        <div className="order-1 2xl:order-2 w-full">
          <Calendar onDateClick={handleDateClick} />
        </div>
      </div>

      <BookingModalFlow
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedDate={selectedDate}
        dateBookings={dateBookings}
      />
    </div>
  );
}
