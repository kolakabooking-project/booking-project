import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { jadwalKepalaApi } from '../../lib/api';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  FileText, 
  Info, 
  Loader2, 
  CalendarDays,
  Layers,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import ActiveSTWidget from '../../components/dashboard/ActiveSTWidget';
import ActiveCutiWidget from '../../components/dashboard/ActiveCutiWidget';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_NAMES = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export default function KepalaKantorCalendarPage() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [calendarData, setCalendarData] = useState({ kegiatan: [], st: [] });
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const filterType = searchParams.get('filter') || 'all'; // 'all' | 'kegiatan' | 'st'
  const [selectedDate, setSelectedDate] = useState(null); // string YYYY-MM-DD
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedST, setSelectedST] = useState(null);
  const [stDetailModalOpen, setStDetailModalOpen] = useState(false);

  const handleFilterChange = (type) => {
    const next = new URLSearchParams(searchParams);
    if (type === 'all') {
      next.delete('filter');
    } else {
      next.set('filter', type);
    }
    setSearchParams(next, { replace: true });
  };

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // 1-12

  // Fetch calendar data when month/year changes
  useEffect(() => {
    let active = true;
    async function fetchData() {
      setLoading(true);
      try {
        const res = await jadwalKepalaApi.getCalendar({ month: currentMonth, year: currentYear });
        if (active && res?.data) {
          setCalendarData(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch calendar:', err);
        toast.error('Gagal memuat jadwal kegiatan kepala kantor');
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchData();
    return () => { active = false; };
  }, [currentMonth, currentYear]);

  // Calendar matrix calculations
  const { daysInMonth, startOffset, daysList } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysCount = new Date(year, month + 1, 0).getDate();
    
    // Day of week for 1st of month: 0 (Sun) to 6 (Sat)
    // Convert to Monday = 0, Sunday = 6
    let firstDay = new Date(year, month, 1).getDay();
    let offset = firstDay === 0 ? 6 : firstDay - 1;

    const days = [];
    for (let i = 1; i <= daysCount; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        dayNumber: i,
        dateStr,
      });
    }

    return {
      daysInMonth: daysCount,
      startOffset: offset,
      daysList: days,
    };
  }, [currentDate]);

  // Group events by date string (YYYY-MM-DD)
  // Multi-day STs will span every single day in their range [tanggal, tanggalSelesai]
  const eventsByDate = useMemo(() => {
    const map = {};

    // Group kegiatan (single date)
    if (filterType === 'all' || filterType === 'kegiatan') {
      calendarData.kegiatan?.forEach((item) => {
        if (!map[item.tanggal]) map[item.tanggal] = { kegiatan: [], st: [] };
        map[item.tanggal].kegiatan.push(item);
      });
    }

    // Group ST (spans date range: e.g. tanggal 1 - 10)
    if (filterType === 'all' || filterType === 'st') {
      calendarData.st?.forEach((item) => {
        const start = item.tanggal;
        const end = item.tanggalSelesai || item.tanggal;

        daysList.forEach((day) => {
          if (day.dateStr >= start && day.dateStr <= end) {
            if (!map[day.dateStr]) map[day.dateStr] = { kegiatan: [], st: [] };
            map[day.dateStr].st.push(item);
          }
        });
      });
    }

    return map;
  }, [calendarData, filterType, daysList]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setSelectedDate(todayStr);
  };

  const handleDayClick = (dateStr) => {
    setSelectedDate(dateStr);
    setDetailModalOpen(true);
  };

  const handleOpenSTDetail = (stItem) => {
    setSelectedST(stItem);
    setStDetailModalOpen(true);
  };

  // Selected date events (includes multi-day ST spanning this date)
  const selectedEvents = useMemo(() => {
    if (!selectedDate) return { kegiatan: [], st: [] };
    const keg = calendarData.kegiatan?.filter((k) => k.tanggal === selectedDate) || [];
    const s = calendarData.st?.filter((item) => {
      const start = item.tanggal;
      const end = item.tanggalSelesai || item.tanggal;
      return selectedDate >= start && selectedDate <= end;
    }) || [];
    return { kegiatan: keg, st: s };
  }, [selectedDate, calendarData]);

  // Format date readable
  const formatReadableDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    const dt = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    const dayName = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][dt.getDay()];
    return `${dayName}, ${parseInt(d)} ${MONTH_NAMES[parseInt(m) - 1]} ${y}`;
  };

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border p-6 sm:p-8" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-[color:var(--color-heading)] tracking-tight">
              Kalender Jadwal Kepala Kantor
            </h1>
            <p className="mt-1 text-sm text-[color:var(--color-text-muted)] max-w-xl">
              Memuat seluruh agenda rapat, kegiatan kedinasan, dan jadwal Surat Tugas (ST) Kepala Kantor KPP Pratama Kolaka.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border bg-[color:var(--color-surface)]" style={{ borderColor: 'var(--color-border)' }}>
              <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                <CalendarDays size={20} />
              </div>
              <div>
                <p className="text-xl font-bold font-heading text-[color:var(--color-heading)]">
                  {calendarData.kegiatan?.length || 0}
                </p>
                <p className="text-[11px] text-[color:var(--color-text-soft)]">Agenda Kegiatan</p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border bg-[color:var(--color-surface)]" style={{ borderColor: 'var(--color-border)' }}>
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <FileText size={20} />
              </div>
              <div>
                <p className="text-xl font-bold font-heading text-[color:var(--color-heading)]">
                  {calendarData.st?.length || 0}
                </p>
                <p className="text-[11px] text-[color:var(--color-text-soft)]">Surat Tugas (ST)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sedang Dinas Hari Ini Widget */}
      <ActiveSTWidget />

      {/* Sedang Cuti Hari Ini Widget */}
      <ActiveCutiWidget />

      {/* Calendar Controls & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Month Navigator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-2xl border p-1" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-xl text-[color:var(--color-text-muted)] hover:text-teal-600 hover:bg-[color:var(--color-surface-muted)] transition-colors"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="px-4 py-1 text-center min-w-[150px]">
              <span className="text-lg sm:text-xl font-heading font-bold text-[color:var(--color-heading)]">
                {MONTH_NAMES[currentDate.getMonth()]} {currentYear}
              </span>
            </div>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl text-[color:var(--color-text-muted)] hover:text-teal-600 hover:bg-[color:var(--color-surface-muted)] transition-colors"
              title="Bulan Berikutnya"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <button
            onClick={handleToday}
            className="px-4 py-2.5 rounded-2xl border text-xs sm:text-sm font-heading font-semibold text-[color:var(--color-text-muted)] hover:text-teal-600 hover:border-teal-400 transition-colors"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
          >
            Hari Ini
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-heading font-semibold transition-all ${
              filterType === 'all'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-[color:var(--color-text-muted)] hover:text-teal-600'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => handleFilterChange('kegiatan')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-heading font-semibold transition-all ${
              filterType === 'kegiatan'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-[color:var(--color-text-muted)] hover:text-teal-600'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-teal-300" />
            Agenda Kegiatan
          </button>
          <button
            onClick={() => handleFilterChange('st')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-heading font-semibold transition-all ${
              filterType === 'st'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-[color:var(--color-text-muted)] hover:text-amber-600'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-300" />
            Surat Tugas
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-3xl border overflow-hidden shadow-sm" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
        {/* Day Name Header */}
        <div className="grid grid-cols-7 border-b text-center" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-muted)' }}>
          {DAY_NAMES.map((day, idx) => (
            <div
              key={day}
              className={`py-3 sm:py-3.5 text-xs sm:text-sm md:text-base font-heading font-extrabold uppercase tracking-wider ${
                idx === 5 || idx === 6 ? 'text-red-500' : 'text-[color:var(--color-text-soft)]'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            <p className="text-xs text-[color:var(--color-text-soft)]">Memuat kalender kegiatan...</p>
          </div>
        ) : (
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {/* Blank offset days */}
            {Array.from({ length: startOffset }).map((_, i) => (
              <div
                key={`offset-${i}`}
                className="min-h-[120px] sm:min-h-[145px] p-2 bg-[color:var(--color-surface-muted)]/40 opacity-40 cursor-default"
                style={{ borderColor: 'var(--color-border)' }}
              />
            ))}

            {/* Days in Month */}
            {daysList.map((day) => {
              const isToday = day.dateStr === todayStr;
              const isSelected = day.dateStr === selectedDate;
              const events = eventsByDate[day.dateStr] || { kegiatan: [], st: [] };
              const totalEventsCount = events.kegiatan.length + events.st.length;
              const hasST = events.st.length > 0;

              return (
                <div
                  key={day.dateStr}
                  onClick={() => handleDayClick(day.dateStr)}
                  className={`min-h-[120px] sm:min-h-[145px] p-2 sm:p-2.5 transition-all cursor-pointer flex flex-col justify-between group relative ${
                    hasST
                      ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/40 hover:bg-amber-100/60 dark:hover:bg-amber-950/30'
                      : isToday
                      ? 'bg-teal-50/40 dark:bg-teal-950/20 hover:bg-teal-50/70 dark:hover:bg-teal-950/30'
                      : 'hover:bg-[color:var(--color-surface-muted)]/80'
                  } ${
                    isSelected ? 'ring-2 ring-teal-500 ring-inset' : ''
                  }`}
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  {/* Top Bar in Cell: Day number & count badge */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 text-sm sm:text-base font-heading font-bold rounded-full transition-transform group-hover:scale-110 ${
                        isToday
                          ? 'bg-teal-600 text-white shadow-md'
                          : hasST
                          ? 'text-amber-800 dark:text-amber-300 font-extrabold'
                          : 'text-[color:var(--color-heading)]'
                      }`}
                    >
                      {day.dayNumber}
                    </span>

                    {totalEventsCount > 0 && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                        hasST
                          ? 'bg-amber-200/70 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300'
                          : 'bg-gray-100 dark:bg-gray-800 text-[color:var(--color-text-soft)]'
                      }`}>
                        {totalEventsCount}
                      </span>
                    )}
                  </div>

                  {/* Events Space */}
                  <div className="flex-1 space-y-1 overflow-hidden">
                    {/* Multi-day Surat Tugas (ST) Ribbons */}
                    {hasST && (
                      <div className="space-y-1 mb-1">
                        {events.st.slice(0, 2).map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenSTDetail(s);
                            }}
                            className="w-full text-left flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-xs text-xs font-bold tracking-tight transition-all truncate"
                            title={`Surat Tugas: ${s.tentang} (${s.tempat}) - Klik untuk lihat rincian`}
                          >
                            <FileText size={13} className="flex-shrink-0" />
                            <span className="truncate">ST: {s.tentang}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Kegiatan Badges */}
                    {events.kegiatan.slice(0, 2).map((keg) => (
                      <div
                        key={keg.id}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-teal-50/90 text-teal-900 dark:bg-teal-950/80 dark:text-teal-200 border border-teal-200/80 dark:border-teal-800 truncate"
                        title={`${keg.waktuMulai} - ${keg.agenda} (${keg.tempat})`}
                      >
                        <span className="font-bold mr-1.5 text-xs">{keg.waktuMulai}</span>
                        <span className="text-xs">{keg.agenda}</span>
                      </div>
                    ))}

                    {/* Overflow count */}
                    {totalEventsCount > (hasST ? 3 : 4) && (
                      <p className="text-xs font-bold text-teal-600 dark:text-teal-400 pl-1.5">
                        +{totalEventsCount - (hasST ? 3 : 4)} lainnya...
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend & Guide */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border text-xs sm:text-sm text-[color:var(--color-text-muted)]" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-heading font-semibold text-[color:var(--color-heading)]">Keterangan:</span>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-md bg-teal-500" />
            <span>Agenda Kegiatan Pimpinan</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-md bg-amber-500" />
            <span>Surat Tugas (ST) & Rentang Hari Pelaksanaan</span>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-[color:var(--color-text-soft)]">
          Klik pada banner ST untuk rincian Surat Tugas, atau klik tanggal untuk seluruh agenda hari tersebut.
        </p>
      </div>

      {/* Date Details Modal */}
      {detailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-in"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-muted)' }}>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400">
                  <CalendarDays size={18} />
                </div>
                <div>
                  <h3 className="text-base font-heading font-bold text-[color:var(--color-heading)]">
                    Agenda: {formatReadableDate(selectedDate)}
                  </h3>
                  <p className="text-xs text-[color:var(--color-text-soft)]">
                    {selectedEvents.kegiatan.length} Agenda Kegiatan &bull; {selectedEvents.st.length} Surat Tugas
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="p-2 rounded-full hover:bg-[color:var(--color-surface)] text-[color:var(--color-text-muted)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {selectedEvents.kegiatan.length === 0 && selectedEvents.st.length === 0 ? (
                <div className="py-12 text-center">
                  <Info size={36} className="mx-auto text-[color:var(--color-text-soft)] mb-2" />
                  <p className="text-sm font-semibold text-[color:var(--color-heading)]">Tidak ada jadwal agenda</p>
                  <p className="text-xs text-[color:var(--color-text-soft)] mt-1">
                    Tidak ada agenda kegiatan maupun surat tugas yang tercatat pada tanggal ini.
                  </p>
                </div>
              ) : (
                <>
                  {/* ST Section First for prominent display */}
                  {selectedEvents.st.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-heading font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        Surat Tugas (ST) Aktif ({selectedEvents.st.length})
                      </h4>
                      <div className="space-y-3">
                        {selectedEvents.st.map((item) => (
                          <div
                            key={item.id}
                            className="p-4 rounded-2xl border bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/40 hover:border-amber-400 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <h5 className="font-heading font-bold text-[color:var(--color-heading)] text-base">
                                {item.tentang}
                              </h5>
                              <button
                                onClick={() => {
                                  setDetailModalOpen(false);
                                  handleOpenSTDetail(item);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white flex-shrink-0 transition-colors shadow-xs"
                              >
                                <FileText size={12} />
                                Lihat Detail ST
                              </button>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[color:var(--color-text-muted)]">
                              <div className="flex items-center gap-1.5">
                                <MapPin size={14} className="text-amber-500" />
                                <span>{item.tempat}</span>
                              </div>
                              {item.tanggalSelesai && (
                                <div className="text-[11px] text-[color:var(--color-text-soft)]">
                                  Periode: <span className="font-semibold">{formatReadableDate(item.tanggal)} s/d {formatReadableDate(item.tanggalSelesai)}</span>
                                </div>
                              )}
                              {item.creatorName && (
                                <div className="text-[11px] text-[color:var(--color-text-soft)]">
                                  Diinput oleh: <span className="font-semibold">{item.creatorName}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Kegiatan Section */}
                  {selectedEvents.kegiatan.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-heading font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-teal-500" />
                        Agenda Kegiatan ({selectedEvents.kegiatan.length})
                      </h4>
                      <div className="space-y-3">
                        {selectedEvents.kegiatan.map((item) => (
                          <div
                            key={item.id}
                            className="p-4 rounded-2xl border bg-[color:var(--color-surface)] hover:border-teal-400 transition-colors"
                            style={{ borderColor: 'var(--color-border)' }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <h5 className="font-heading font-bold text-[color:var(--color-heading)] text-base">
                                {item.agenda}
                              </h5>
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 flex-shrink-0">
                                <Clock size={12} className="text-teal-600 dark:text-teal-400" />
                                {item.waktuMulai} {item.waktuSelesai ? `- ${item.waktuSelesai}` : ''}
                              </span>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[color:var(--color-text-muted)]">
                              <div className="flex items-center gap-1.5">
                                <MapPin size={14} className="text-teal-500" />
                                <span>{item.tempat}</span>
                              </div>
                              {item.creatorName && (
                                <div className="text-[11px] text-[color:var(--color-text-soft)]">
                                  Diinput oleh: <span className="font-semibold">{item.creatorName}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t flex justify-end" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-muted)' }}>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[color:var(--color-text-muted)] hover:text-[color:var(--color-heading)] transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated ST Detail Modal */}
      {stDetailModalOpen && selectedST && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-in"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between bg-amber-500/10 border-amber-500/20">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
                  <FileText size={20} />
                </div>
                <div>
                  <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 mb-0.5">
                    Surat Tugas Pimpinan
                  </span>
                  <h3 className="text-base font-heading font-bold text-[color:var(--color-heading)]">
                    Rincian Surat Tugas (ST)
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setStDetailModalOpen(false)}
                className="p-2 rounded-full hover:bg-[color:var(--color-surface)] text-[color:var(--color-text-muted)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-sm">
              <div>
                <label className="text-xs font-heading font-bold uppercase tracking-wider text-[color:var(--color-text-soft)]">
                  ST Tentang Apa
                </label>
                <p className="mt-1.5 p-3.5 rounded-2xl border bg-[color:var(--color-surface)] font-medium text-[color:var(--color-heading)] leading-relaxed" style={{ borderColor: 'var(--color-border)' }}>
                  {selectedST.tentang}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-2xl border bg-[color:var(--color-surface)]" style={{ borderColor: 'var(--color-border)' }}>
                  <label className="text-xs font-heading font-bold uppercase tracking-wider text-[color:var(--color-text-soft)] flex items-center gap-1.5 mb-1.5">
                    <MapPin size={13} className="text-amber-500" />
                    Tempat / Tujuan
                  </label>
                  <p className="font-semibold text-[color:var(--color-heading)]">
                    {selectedST.tempat}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl border bg-[color:var(--color-surface)]" style={{ borderColor: 'var(--color-border)' }}>
                  <label className="text-xs font-heading font-bold uppercase tracking-wider text-[color:var(--color-text-soft)] flex items-center gap-1.5 mb-1.5">
                    <CalendarDays size={13} className="text-amber-500" />
                    Periode Tanggal
                  </label>
                  <p className="font-semibold text-[color:var(--color-heading)] text-xs">
                    {formatReadableDate(selectedST.tanggal)}
                    {selectedST.tanggalSelesai && selectedST.tanggalSelesai !== selectedST.tanggal && (
                      <span className="block mt-0.5 text-amber-600 dark:text-amber-400 font-bold">
                        s/d {formatReadableDate(selectedST.tanggalSelesai)}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {selectedST.creatorName && (
                <div className="p-3 rounded-xl bg-[color:var(--color-surface-muted)] text-xs text-[color:var(--color-text-soft)] flex items-center justify-between">
                  <span>Diinput oleh:</span>
                  <span className="font-semibold text-[color:var(--color-heading)]">{selectedST.creatorName}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t flex justify-end" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-muted)' }}>
              <button
                onClick={() => setStDetailModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[color:var(--color-surface)] border text-[color:var(--color-text-muted)] hover:text-[color:var(--color-heading)] transition-colors"
                style={{ borderColor: 'var(--color-border)' }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
