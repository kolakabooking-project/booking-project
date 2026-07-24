import { useState, useMemo, useContext } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid, TableProperties, Search, Download, Car, User } from 'lucide-react';
import { getDaysInMonth, getFirstDayOfMonth, MONTH_NAMES, DAY_NAMES, isPastDate, isToday, formatDateShort, formatTime } from '../../utils/helpers';
import { useAuth } from '../../contexts/AuthContext';
import { BookingContext } from '../../contexts/BookingContext';
import Badge from '../ui/Badge';
import { toast } from 'sonner';

export default function Calendar({ 
  onDateClick, 
  onMandatoryBookingClick, 
  allowPastClick = false,
  getBookingsForDate,
  totalResources = 0,
  bookings: propBookings
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [activeTab, setActiveTab] = useState('grid'); // 'grid' | 'excel'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'my' | 'approved' | 'pending'
  
  const { user } = useAuth();
  const bookingContext = useContext(BookingContext);

  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const firstDay = useMemo(() => getFirstDayOfMonth(year, month), [year, month]);

  // Konsumsi seluruh data peminjaman dari prop atau context
  const allBookings = useMemo(() => {
    return propBookings || bookingContext?.bookings || [];
  }, [propBookings, bookingContext?.bookings]);

  // Hitung seluruh peminjaman pada bulan dan tahun terpilih untuk tampilan Tabel Excel
  const monthBookings = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1, 0, 0, 0, 0);
    const lastDayOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

    return allBookings.filter((b) => {
      if (b.status === 'Dibatalkan') return false;
      if (b.status === 'Ditolak') {
        const isMyBooking = b.userId === user?.id;
        const isAdminOrSuper = user?.role === 'admin' || user?.role === 'superadmin';
        if (!isMyBooking && !isAdminOrSuper) return false;
      }
      if (!b.startTime || !b.endTime) return false;
      const start = new Date(b.startTime);
      const end = new Date(b.endTime);
      return start <= lastDayOfMonth && end >= firstDayOfMonth;
    }).sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }, [allBookings, year, month, user?.id, user?.role]);

  const filteredExcelBookings = useMemo(() => {
    return monthBookings.filter((b) => {
      if (statusFilter === 'my' && b.userId !== user?.id) return false;
      if (statusFilter === 'approved' && b.status !== 'Disetujui') return false;
      if (statusFilter === 'pending' && b.status !== 'Pending') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchUser = (b.userName || '').toLowerCase().includes(q);
        const matchFor = (b.bookingFor || '').toLowerCase().includes(q);
        const matchVehicle = (b.vehicleName || '').toLowerCase().includes(q);
        const matchKeperluan = (b.keperluan || '').toLowerCase().includes(q);
        const matchDriver = (b.driverName || '').toLowerCase().includes(q);
        return matchUser || matchFor || matchVehicle || matchKeperluan || matchDriver;
      }
      return true;
    }).sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
  }, [monthBookings, statusFilter, searchQuery, user?.id]);

  const getDateStatus = (date) => {
    if (isPastDate(date)) return 'past';
    return 'future';
  };

  const getBadgeStatus = (date) => {
    const bookingsForDay = getBookingsForDate ? getBookingsForDate(date) : [];
    const uniqueResources = new Set(bookingsForDay.map((b) => b.vehicleId || b.roomId).filter(Boolean));
    if (totalResources > 0 && uniqueResources.size >= totalResources) return 'full';
    if (bookingsForDay.length > 0) return 'partial';
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

  const badgeColor = (status) => {
    if (status === 'full') return 'bg-danger/15 text-danger border border-danger/25';
    if (status === 'partial') return 'bg-djp-yellow/15 text-djp-yellow-dark border border-djp-yellow/25';
    return '';
  };

  const exportToExcel = async () => {
    try {
      const { utils, writeFile } = await import('xlsx');
      const data = filteredExcelBookings.map((b, idx) => ({
        'No': idx + 1,
        'Tanggal Mulai': formatDateShort(b.startTime),
        'Tanggal Selesai': formatDateShort(b.endTime),
        'Waktu': `${formatTime(b.startTime)} - ${formatTime(b.endTime)}`,
        'Peminjam': b.userName || '-',
        'Booking Atas Nama': b.bookingFor || '-',
        'Kendaraan': b.vehicleName || 'Belum dialokasikan',
        'Jenis Kendaraan': b.jenisKendaraan || 'Mobil',
        'Pengemudi': b.driverName || (b.perluSopir ? 'Perlu Sopir (Belum ditugaskan)' : 'Tanpa Sopir'),
        'Keperluan': b.keperluan || '-',
        'Status': b.status || '-',
        'Catatan': b.catatan || '-'
      }));

      const ws = utils.json_to_sheet(data);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, `Rekap ${MONTH_NAMES[month]} ${year}`);

      const colWidths = Object.keys(data[0] || {}).map((k) => ({ wch: Math.max(k.length, 18) }));
      ws['!cols'] = colWidths;

      const filename = `Rekap_BOOKOLAKA_${MONTH_NAMES[month]}_${year}.xlsx`;
      writeFile(wb, filename);
      toast.success(`File ${filename} berhasil diunduh`);
    } catch (err) {
      console.error('Error exporting excel:', err);
      toast.error('Gagal mengunduh file Excel');
    }
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  return (
    <div className="surface-card overflow-hidden">
      {/* Header Card */}
      <div className="flex flex-col gap-4 border-b px-5 py-5 lg:flex-row lg:items-center lg:justify-between" style={{ borderColor: 'var(--color-border)' }}>
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-heading font-bold text-[color:var(--color-heading)]">Kalender BOOKOLAKA</h3>
            
            {/* View Switcher Pills */}
            <div className="inline-flex items-center rounded-xl p-1 bg-[color:var(--color-surface-muted)] border" style={{ borderColor: 'var(--color-border)' }}>
              <button
                type="button"
                onClick={() => setActiveTab('grid')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-heading font-semibold transition-all ${
                  activeTab === 'grid'
                    ? 'bg-djp-blue text-white shadow-sm'
                    : 'text-[color:var(--color-text-soft)] hover:text-[color:var(--color-heading)]'
                }`}
              >
                <LayoutGrid size={14} />
                <span>Kalender</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('excel')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-heading font-semibold transition-all ${
                  activeTab === 'excel'
                    ? 'bg-djp-blue text-white shadow-sm'
                    : 'text-[color:var(--color-text-soft)] hover:text-[color:var(--color-heading)]'
                }`}
              >
                <TableProperties size={14} />
                <span>Tabel Excel Bulanan</span>
              </button>
            </div>
          </div>
          <p className="mt-1.5 text-sm text-[color:var(--color-text-soft)]">
            {activeTab === 'grid' 
              ? 'Pilih tanggal untuk melihat aktivitas dan ketersediaan kendaraan harian.'
              : `Transparansi total daftar peminjaman armada selama bulan ${MONTH_NAMES[month]} ${year}.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-heading font-bold text-[color:var(--color-heading)]">
            {MONTH_NAMES[month]} {year}
          </h2>
          <div className="ml-0 flex items-center gap-1 sm:ml-2">
            <button type="button" onClick={prevMonth} className="rounded-xl border p-2 text-[color:var(--color-text-soft)] transition-colors hover:bg-[color:var(--color-surface-muted)] hover:text-[color:var(--color-heading)]" style={{ borderColor: 'var(--color-border)' }}>
              <ChevronLeft size={18} />
            </button>
            <button type="button" onClick={nextMonth} className="rounded-xl border p-2 text-[color:var(--color-text-soft)] transition-colors hover:bg-[color:var(--color-surface-muted)] hover:text-[color:var(--color-heading)]" style={{ borderColor: 'var(--color-border)' }}>
              <ChevronRight size={18} />
            </button>
          </div>
          <button type="button" onClick={goToday} className="rounded-full border border-djp-blue/10 bg-djp-blue/5 px-3 py-1.5 text-sm font-heading font-semibold text-djp-blue transition-colors hover:bg-djp-blue hover:text-white">
            Hari ini
          </button>
        </div>
      </div>

      {activeTab === 'grid' ? (
        <>
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

            {days.map((date) => {
              const status = getDateStatus(date);
              const bookingsForDay = getBookingsForDate ? getBookingsForDate(date) : [];
              const myBookingsCount = bookingsForDay.filter(b => b.userId === user?.id).length;
              const otherBookingsCount = bookingsForDay.filter(b => b.userId !== user?.id).length;
              const totalBookingsCount = bookingsForDay.length;

              const isTodayDate = isToday(date);
              const badgeStatus = getBadgeStatus(date);

              return (
                <div
                  key={date.toISOString()}
                  onClick={() => {
                    if (status === 'past' && !allowPastClick && !isAdmin) return;
                    onDateClick?.(date);
                  }}
                  className={`
                    relative min-h-[70px] sm:min-h-[96px] border-b border-r p-1.5 sm:p-2 transition-all
                    ${(status === 'past' && !allowPastClick && !isAdmin) ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:bg-[color:var(--color-surface-muted)] active:bg-djp-blue/5'}
                    ${isTodayDate ? 'bg-djp-blue/5' : ''}
                  `}
                  style={{ borderColor: 'color-mix(in srgb, var(--color-border) 70%, transparent)' }}
                >
                  <div className="flex items-start justify-between">
                    <span className={`
                      flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full text-xs font-heading font-bold
                      ${isTodayDate ? 'bg-djp-blue text-white shadow-md shadow-djp-blue/30' : 'text-[color:var(--color-heading)]'}
                    `}>
                      {date.getDate()}
                    </span>
                    
                    <div className="flex flex-col gap-1 items-end">
                      {isAdmin && (status !== 'past' || allowPastClick) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
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
                      {totalBookingsCount > 0 && (
                        <span className={`flex items-center justify-center rounded-md px-1.5 py-0.5 text-[10px] font-bold ${badgeColor(badgeStatus)}`}>
                          {totalBookingsCount}
                        </span>
                      )}
                    </div>
                  </div>

                  {(totalBookingsCount > 0 && (status !== 'past' || allowPastClick)) && (
                    <div className="mt-1 sm:mt-2 flex flex-col gap-1 items-center sm:items-start">
                      {myBookingsCount > 0 && (
                        <span className="inline-block truncate max-w-full rounded-md sm:rounded-full px-1 py-0.5 sm:px-2 sm:py-0.5 text-[9px] sm:text-[10px] font-heading font-semibold text-center sm:text-left bg-djp-blue/15 text-djp-blue border border-djp-blue/25">
                          {myBookingsCount === totalBookingsCount ? (
                            <span className="hidden sm:inline">Pribadi</span>
                          ) : (
                            <>{myBookingsCount} <span className="hidden sm:inline">Pribadi</span></>
                          )}
                          {myBookingsCount === totalBookingsCount && <span className="sm:hidden">{myBookingsCount}</span>}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick link banner at bottom of grid */}
          {monthBookings.length > 0 && (
            <div 
              onClick={() => setActiveTab('excel')}
              className="px-5 py-3.5 border-t bg-djp-blue/5 hover:bg-djp-blue/10 cursor-pointer transition-colors flex items-center justify-between text-xs sm:text-sm font-heading text-djp-blue font-semibold"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <span>Ada {monthBookings.length} peminjaman armada terdaftar pada bulan {MONTH_NAMES[month]} {year}.</span>
              <span className="flex items-center gap-1.5 underline decoration-djp-blue/40 underline-offset-4">
                <TableProperties size={15} />
                Buka Tabel Excel
              </span>
            </div>
          )}
        </>
      ) : (
        /* Excel Table View */
        <div>
          {/* Toolbar Search & Filter */}
          <div className="p-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[color:var(--color-surface-muted)]" style={{ borderColor: 'var(--color-border)' }}>
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--color-text-soft)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari peminjam, atas nama, kendaraan, tujuan..."
                className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm border bg-[color:var(--color-surface-strong)] text-[color:var(--color-heading)] placeholder:text-[color:var(--color-text-soft)] focus:outline-none focus:ring-2 focus:ring-djp-blue/30 focus:border-djp-blue transition-all"
                style={{ borderColor: 'var(--color-border)' }}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
                {[
                  { id: 'all', label: `Semua (${monthBookings.length})` },
                  { id: 'my', label: `Pribadi (${monthBookings.filter(b => b.userId === user?.id).length})` },
                  { id: 'approved', label: `Disetujui (${monthBookings.filter(b => b.status === 'Disetujui').length})` },
                  { id: 'pending', label: `Pending (${monthBookings.filter(b => b.status === 'Pending').length})` },
                ].map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setStatusFilter(chip.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-heading font-semibold whitespace-nowrap transition-all ${
                      statusFilter === chip.id
                        ? 'bg-djp-blue text-white shadow-sm'
                        : 'bg-[color:var(--color-surface-strong)] text-[color:var(--color-text-soft)] border hover:text-[color:var(--color-heading)]'
                    }`}
                    style={{ borderColor: statusFilter === chip.id ? 'transparent' : 'var(--color-border)' }}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={exportToExcel}
                disabled={filteredExcelBookings.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-success text-white hover:bg-success-dark disabled:opacity-50 disabled:cursor-not-allowed text-xs font-heading font-bold shadow-sm transition-all whitespace-nowrap"
              >
                <Download size={14} />
                <span>Unduh .xlsx</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto max-h-[600px] border-t" style={{ borderColor: 'var(--color-border)' }}>
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead
                className="sticky top-0 z-20 border-b text-[11px] uppercase tracking-[0.15em] font-heading font-bold text-[color:var(--color-text-soft)] shadow-sm bg-[color:var(--color-surface-strong)]"
                style={{ backgroundColor: 'var(--color-surface-strong)', borderColor: 'var(--color-border)' }}
              >
                <tr>
                  <th className="py-3.5 px-4 w-40 sticky top-0 z-20 bg-[color:var(--color-surface-strong)]" style={{ backgroundColor: 'var(--color-surface-strong)' }}>Tanggal & Waktu</th>
                  <th className="py-3.5 px-4 w-52 sticky top-0 z-20 bg-[color:var(--color-surface-strong)]" style={{ backgroundColor: 'var(--color-surface-strong)' }}>Peminjam</th>
                  <th className="py-3.5 px-4 w-48 sticky top-0 z-20 bg-[color:var(--color-surface-strong)]" style={{ backgroundColor: 'var(--color-surface-strong)' }}>Kendaraan & Plat</th>
                  <th className="py-3.5 px-4 w-40 sticky top-0 z-20 bg-[color:var(--color-surface-strong)]" style={{ backgroundColor: 'var(--color-surface-strong)' }}>Pengemudi</th>
                  <th className="py-3.5 px-4 sticky top-0 z-20 bg-[color:var(--color-surface-strong)]" style={{ backgroundColor: 'var(--color-surface-strong)' }}>Keperluan / Tujuan</th>
                  <th className="py-3.5 px-4 w-32 text-center sticky top-0 z-20 bg-[color:var(--color-surface-strong)]" style={{ backgroundColor: 'var(--color-surface-strong)' }}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs sm:text-sm font-body text-[color:var(--color-text)]" style={{ borderColor: 'var(--color-border)' }}>
                {filteredExcelBookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-[color:var(--color-text-soft)]">
                        <TableProperties size={36} className="opacity-30" />
                        <p className="font-heading font-medium text-sm mt-1">
                          {searchQuery || statusFilter !== 'all'
                            ? 'Tidak ada peminjaman yang sesuai dengan pencarian atau filter.'
                            : `Belum ada peminjaman armada terdaftar pada bulan ${MONTH_NAMES[month]} ${year}.`}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredExcelBookings.map((b) => {
                    const isMyBooking = b.userId === user?.id;
                    return (
                      <tr
                        key={b.id}
                        onClick={() => {
                          if (b.startTime) {
                            onDateClick?.(new Date(b.startTime));
                          }
                        }}
                        className={`hover:bg-djp-blue/5 cursor-pointer transition-colors ${
                          isMyBooking ? 'bg-djp-blue/[0.03]' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 whitespace-nowrap align-top">
                          <div className="font-heading font-bold text-[color:var(--color-heading)]">
                            {new Date(b.startTime).toDateString() === new Date(b.endTime).toDateString()
                              ? formatDateShort(b.startTime)
                              : `${formatDateShort(b.startTime)} - ${formatDateShort(b.endTime)}`}
                          </div>
                          <div className="text-xs text-[color:var(--color-text-soft)] mt-0.5 font-mono">
                            {formatTime(b.startTime)} - {formatTime(b.endTime)}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 align-top">
                          <div className="flex items-center gap-1.5">
                            <span className="font-heading font-bold text-[color:var(--color-heading)]">
                              {b.userName || '-'}
                            </span>
                            {isMyBooking && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-heading font-bold bg-djp-blue/15 text-djp-blue border border-djp-blue/25">
                                Saya
                              </span>
                            )}
                          </div>
                          {b.bookingFor && (
                            <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-djp-yellow/15 text-djp-yellow-dark border border-djp-yellow/25 text-[11px] font-semibold">
                              <User size={11} />
                              <span>Untuk: {b.bookingFor}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 align-top">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-[color:var(--color-surface-muted)] text-[color:var(--color-text-soft)]">
                              <Car size={15} />
                            </div>
                            <div>
                              <div className="font-heading font-semibold text-[color:var(--color-heading)]">
                                {b.vehicleName || 'Belum dialokasikan'}
                              </div>
                              <div className="text-[11px] text-[color:var(--color-text-soft)]">
                                {b.jenisKendaraan || 'Mobil'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          <div className="font-medium text-[color:var(--color-heading)]">
                            {b.driverName || (b.perluSopir ? 'Perlu Sopir (Belum)' : 'Tanpa Sopir')}
                          </div>
                          {b.perluSopir && !b.driverName && (
                            <span className="text-[10px] text-warning font-semibold block mt-0.5">Menunggu plot sopir</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 align-top">
                          <p className="text-sm leading-snug text-[color:var(--color-text)] max-w-xs break-words">
                            {b.keperluan || '-'}
                          </p>
                          {b.catatan && (
                            <p className="text-xs text-[color:var(--color-text-soft)] mt-1 italic">
                              Catatan: "{b.catatan}"
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 align-top text-center whitespace-nowrap">
                          <Badge status={b.status} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

