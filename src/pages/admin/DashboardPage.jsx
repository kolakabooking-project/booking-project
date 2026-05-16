import { useState } from 'react';
import { useBooking } from '../../contexts/BookingContext';
import FleetCommandCenter from '../../components/dashboard/FleetCommandCenter';
import Button from '../../components/ui/Button';
import Calendar from '../../components/shared/Calendar';
import BookingModalFlow from '../../components/shared/BookingModalFlow';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/ui/PageHeader';
import { BOOKING_STATUS, VEHICLE_STATUS } from '../../utils/constants';
import { isToday, formatDateShort, formatTime } from '../../utils/helpers';

export default function AdminDashboardPage() {
  const { bookings, vehicles, getPendingBookings, getBookingsForDate } = useBooking();
  const [selectedDate, setSelectedDate] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const pending = getPendingBookings();
  const inUseToday = bookings.filter((b) => {
    const s = new Date(b.startTime);
    return (b.status === BOOKING_STATUS.ONGOING || b.status === BOOKING_STATUS.APPROVED) && isToday(s);
  });

  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  const dayBookings = selectedDate ? getBookingsForDate(selectedDate) : [];

  return (
    <div>
      <PageHeader
        title="Ringkasan operasional kendaraan"
        subtitle="Awasi antrean booking, pemakaian kendaraan, dan kalender."
        actions={<Button onClick={() => setIsBookingModalOpen(true)} variant="primary" size="md"><span className="hidden sm:inline">Buat Peminjaman (Mandatory)</span><span className="sm:hidden">+ Mandatory</span></Button>}
      />

      {/* Interactive Fleet Command Center */}
      <FleetCommandCenter />

      <div className="mb-6 sm:mb-8 grid gap-5 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <Calendar onDateClick={handleDateClick} allowPastClick={true} />
        <Card className="p-6">
          <span className="page-kicker">Insight Hari Ini</span>
          <h2 className="mt-4 text-xl font-heading font-bold text-[color:var(--color-heading)]">Prioritas admin</h2>
          <div className="mt-6 space-y-3">
            <div className="surface-muted p-4">
              <p className="text-sm font-semibold text-[color:var(--color-text-muted)]">Antrean persetujuan</p>
              <p className="mt-1 text-sm leading-6 text-[color:var(--color-text-soft)]">{pending.length} permintaan perlu diproses agar jadwal armada tetap lancar.</p>
            </div>
            <div className="surface-muted p-4">
              <p className="text-sm font-semibold text-[color:var(--color-text-muted)]">Penggunaan aktif</p>
              <p className="mt-1 text-sm leading-6 text-[color:var(--color-text-soft)]">{inUseToday.length} kendaraan sedang digunakan atau sudah dialokasikan untuk hari ini.</p>
            </div>
          </div>
        </Card>
      </div>

      <Modal isOpen={!!selectedDate} onClose={() => setSelectedDate(null)} title={selectedDate ? `Booking: ${formatDateShort(selectedDate)}` : ''} size="md">
        <div className="space-y-4">
          {dayBookings.length === 0 ? (
            <div className="py-8 text-center text-[color:var(--color-text-soft)]">Tidak ada peminjaman di hari ini.</div>
          ) : (
            dayBookings.map(b => (
              <div key={b.id} className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-muted)' }}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-heading font-bold text-[color:var(--color-heading)]">{b.userName}</span>
                  <Badge status={b.status} />
                </div>
                <div className="text-sm text-[color:var(--color-text-muted)]">
                  <p><span className="font-semibold">Waktu:</span> {formatTime(b.startTime)} - {formatTime(b.endTime)}</p>
                  <p><span className="font-semibold">Tujuan:</span> {b.keperluan}</p>
                  <p><span className="font-semibold">Kendaraan:</span> {b.vehicleName || 'Belum dialokasikan'}</p>
                </div>
              </div>
            ))
          )}
          <div className="flex justify-end mt-6">
            <Button variant="secondary" onClick={() => setSelectedDate(null)}>Tutup</Button>
          </div>
        </div>
      </Modal>

      <BookingModalFlow
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        isAdmin={true}
        dateBookings={[]}
      />
    </div>
  );
}
