import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getDaysInMonth, getFirstDayOfMonth, MONTH_NAMES, DAY_NAMES, isPastDate, isToday } from '../../utils/helpers';
import { useBooking } from '../../contexts/BookingContext';
import { useAuth } from '../../contexts/AuthContext';

export default function Calendar({ onDateClick, onMandatoryBookingClick, allowPastClick = false }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const { getBookingsForDate, vehicles } = useBooking();
  const { user } = useAuth();

  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const firstDay = useMemo(() => getFirstDayOfMonth(year, month), [year, month]);

  const totalVehicles = vehicles.filter((v) => v.status !== 'Dalam Perawatan').length;

  const getDateStatus = (date) => {
    if (isPastDate(date)) return 'past';
    return 'future';
  };

  const getBadgeStatus = (date) => {
    const bookings = getBookingsForDate(date);
    const uniqueVehicles = new Set(bookings.map((b) => b.vehicleId).filter(Boolean));
    if (uniqueVehicles.size >= totalVehicles) return 'full';
    if (bookings.length > 0) return 'partial';
    return 'available';
  };

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const goToday = () => {
    setMonth(today.getMonth());
    setYear(today.getFullYear());
  };

  // Booking count badge color per status
  const badgeColor = (status) => {
    if (status === 'full') return 'bg-danger/15 text-danger border border-danger/25';
    if (status === 'partial') return 'bg-djp-yellow/15 text-djp-yellow-dark border border-djp-yellow/25';
    return '';
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  return (
    <div className="surface-card overflow-hidden">
      <div className="flex flex-col gap-4 border-b px-5 py-5 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: 'var(--color-border)' }}>
        <div>
          <h3 className="text-lg font-heading font-bold text-[color:var(--color-heading)]">Kalender BOOKOLAKA</h3>
          <p className="mt-1 text-sm text-[color:var(--color-text-soft)]">Pilih tanggal untuk melihat booking aktif dan ketersediaan kendaraan.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-heading font-bold text-[color:var(--color-heading)]">
            {MONTH_NAMES[month]} {year}
          </h2>
          <div className="ml-0 flex items-center gap-1 sm:ml-2">
            <button onClick={prevMonth} className="rounded-xl border p-2 text-[color:var(--color-text-soft)] transition-colors hover:bg-[color:var(--color-surface-muted)] hover:text-[color:var(--color-heading)]" style={{ borderColor: 'var(--color-border)' }}>
              <ChevronLeft size={18} />
            </button>
            <button onClick={nextMonth} className="rounded-xl border p-2 text-[color:var(--color-text-soft)] transition-colors hover:bg-[color:var(--color-surface-muted)] hover:text-[color:var(--color-heading)]" style={{ borderColor: 'var(--color-border)' }}>
              <ChevronRight size={18} />
            </button>
          </div>
          <button onClick={goToday} className="rounded-full border border-djp-blue/10 bg-djp-blue/5 px-3 py-1.5 text-sm font-heading font-semibold text-djp-blue transition-colors hover:bg-djp-blue hover:text-white">
            Hari ini
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b" style={{ borderColor: 'var(--color-border)' }}>
        {DAY_NAMES.map((d) => (
          <div key={d} className="py-2 text-center text-[10px] font-heading font-bold uppercase tracking-[0.1em] text-[color:var(--color-text-soft)] sm:py-3 sm:text-[11px] sm:tracking-[0.2em]">
            <span className="sm:hidden">{d.slice(0, 1)}</span>
            <span className="hidden sm:inline">{d}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[70px] border-b border-r sm:min-h-[96px]" style={{ borderColor: 'color-mix(in srgb, var(--color-border) 70%, transparent)', background: 'color-mix(in srgb, var(--color-surface-muted) 70%, transparent)' }} />
        ))}

        {days.map((date, idx) => {
          const status = getDateStatus(date);
          const bookings = getBookingsForDate(date);
          const myBookingsCount = bookings.filter(b => b.userId === user?.id).length;
          const otherBookingsCount = bookings.filter(b => b.userId !== user?.id).length;
          const totalBookingsCount = bookings.length;
          const isT = isToday(date);
          const colIdx = (firstDay + idx) % 7;

          return (
            <div
              key={date.toISOString()}
              onClick={() => {
                if (status !== 'past' || allowPastClick) {
                  onDateClick?.(date);
                }
              }}
              className={`
                group relative min-h-[70px] overflow-hidden border-b border-r p-1.5 transition-colors duration-150 sm:min-h-[96px] sm:p-3
                ${(status === 'past' && !allowPastClick) ? 'cursor-default' : 'cursor-pointer hover:bg-djp-blue/[0.04] dark:hover:bg-djp-blue/10'}
                ${isT ? 'bg-djp-blue/[0.04] dark:bg-djp-blue/10' : ''}
                ${colIdx === 6 ? 'border-r-0' : ''}
              `}
              style={{
                borderColor: 'color-mix(in srgb, var(--color-border) 70%, transparent)',
                background: status === 'past'
                  ? 'color-mix(in srgb, var(--color-surface-muted) 72%, transparent)'
                  : undefined,
              }}
            >
              <div className="flex flex-row items-center justify-between gap-1">
                <div className="flex items-center gap-1.5">
                  <span className={`
                    inline-flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full text-xs sm:text-sm font-heading font-semibold
                    ${isT ? 'bg-djp-blue text-white' : status === 'past' ? 'text-[color:var(--color-text-soft)]' : 'text-[color:var(--color-text-main)]'}
                  `}>
                    {date.getDate()}
                  </span>
                  {isT && (
                    <span className="text-[8px] sm:text-[10px] font-heading font-bold uppercase tracking-wider sm:tracking-[0.18em] text-djp-blue hidden sm:block">Today</span>
                  )}
                  {isT && (
                    <span className="w-1.5 h-1.5 rounded-full bg-djp-blue sm:hidden"></span>
                  )}
                </div>

                {/* Admin Mode - Mandatory Booking Button (+ Icon) — Hidden on mobile, hover revealed on desktop */}
                {isAdmin && (status !== 'past' || allowPastClick) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Stop click from bubbling up to cell detailing
                      onMandatoryBookingClick?.(date);
                    }}
                    className="
                      hidden sm:inline-flex opacity-0 group-hover:opacity-100 transition-opacity duration-150
                      h-6 w-6 items-center justify-center rounded-full bg-djp-blue text-white hover:bg-djp-blue-dark shadow-sm
                      text-xs font-bold leading-none hover:scale-105 active:scale-95 transition-transform
                    "
                    title="Buat Peminjaman Mandatori"
                    type="button"
                  >
                    +
                  </button>
                )}
              </div>

              {(totalBookingsCount > 0 && (status !== 'past' || allowPastClick)) && (
                <div className="mt-1 sm:mt-2 flex flex-col gap-1 items-center sm:items-start">
                  {myBookingsCount > 0 && (
                    <span className="inline-block truncate max-w-full rounded-md sm:rounded-full px-1 py-0.5 sm:px-2 sm:py-0.5 text-[9px] sm:text-[10px] font-heading font-semibold text-center sm:text-left bg-djp-blue/15 text-djp-blue border border-djp-blue/25">
                      {myBookingsCount} <span className="hidden sm:inline">Pribadi</span>
                    </span>
                  )}
                  {otherBookingsCount > 0 && (
                    <span className="inline-block truncate max-w-full rounded-md sm:rounded-full px-1 py-0.5 sm:px-2 sm:py-0.5 text-[9px] sm:text-[10px] font-heading font-semibold text-center sm:text-left bg-djp-yellow/15 text-djp-yellow-dark border border-djp-yellow/25">
                      {otherBookingsCount} <span className="hidden sm:inline">Lainnya</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
