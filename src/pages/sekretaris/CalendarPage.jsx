import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { jadwalKepalaApi } from '../../lib/api';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  FileText, 
  Info, 
  Loader2, 
  CalendarDays,
  Plus,
  Edit2,
  Trash2,
  X,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Button from '../../components/ui/Button';
import { getInitials } from '../../utils/helpers';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_NAMES = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export default function SekretarisCalendarPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [calendarData, setCalendarData] = useState({ kegiatan: [], st: [] });
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [selectedDate, setSelectedDate] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // ST Detail Modal State
  const [selectedST, setSelectedST] = useState(null);
  const [stDetailModalOpen, setStDetailModalOpen] = useState(false);

  // Form Modals State
  const [kegiatanModalOpen, setKegiatanModalOpen] = useState(false);
  const [stModalOpen, setStModalOpen] = useState(false);
  const [editingKegiatan, setEditingKegiatan] = useState(null);
  const [editingST, setEditingST] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirm State
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'kegiatan' | 'st', id, title }

  // Form states
  const [kegiatanForm, setKegiatanForm] = useState({
    tanggal: '',
    waktuMulai: '09:00',
    waktuSelesai: '',
    agenda: '',
    tempat: '',
  });

  const [stForm, setStForm] = useState({
    tentang: '',
    tempat: '',
    tanggal: '',
    tanggalSelesai: '',
  });

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const fetchCalendar = async () => {
    setLoading(true);
    try {
      const res = await jadwalKepalaApi.getCalendar({ month: currentMonth, year: currentYear });
      if (res?.data) {
        setCalendarData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch calendar:', err);
      toast.error('Gagal memuat jadwal kegiatan kepala kantor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, [currentMonth, currentYear]);

  // Calendar calculations
  const { daysList, startOffset } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysCount = new Date(year, month + 1, 0).getDate();
    let firstDay = new Date(year, month, 1).getDay();
    let offset = firstDay === 0 ? 6 : firstDay - 1;

    const days = [];
    for (let i = 1; i <= daysCount; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ dayNumber: i, dateStr });
    }

    return { daysList: days, startOffset: offset };
  }, [currentDate]);

  // Group events by date string (handling multi-day ST spanning)
  const eventsByDate = useMemo(() => {
    const map = {};
    if (filterType === 'all' || filterType === 'kegiatan') {
      calendarData.kegiatan?.forEach((item) => {
        if (!map[item.tanggal]) map[item.tanggal] = { kegiatan: [], st: [] };
        map[item.tanggal].kegiatan.push(item);
      });
    }
    if (filterType === 'all' || filterType === 'st') {
      calendarData.st?.forEach((item) => {
        const startStr = item.tanggal;
        const endStr = item.tanggalSelesai || item.tanggal;
        daysList.forEach((day) => {
          if (day.dateStr >= startStr && day.dateStr <= endStr) {
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

  // Open Create Kegiatan
  const handleOpenCreateKegiatan = (defaultDate = '') => {
    setEditingKegiatan(null);
    setKegiatanForm({
      tanggal: defaultDate || selectedDate || `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
      waktuMulai: '09:00',
      waktuSelesai: '',
      agenda: '',
      tempat: '',
    });
    setKegiatanModalOpen(true);
  };

  // Open Edit Kegiatan
  const handleOpenEditKegiatan = (item) => {
    setEditingKegiatan(item);
    setKegiatanForm({
      tanggal: item.tanggal,
      waktuMulai: item.waktuMulai,
      waktuSelesai: item.waktuSelesai || '',
      agenda: item.agenda,
      tempat: item.tempat,
    });
    setKegiatanModalOpen(true);
  };

  // Submit Kegiatan
  const handleKegiatanSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingKegiatan) {
        await jadwalKepalaApi.updateKegiatan(editingKegiatan.id, kegiatanForm);
        toast.success('Agenda kegiatan berhasil diperbarui');
      } else {
        await jadwalKepalaApi.createKegiatan(kegiatanForm);
        toast.success('Agenda kegiatan baru berhasil ditambahkan');
      }
      setKegiatanModalOpen(false);
      await fetchCalendar();
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan agenda kegiatan');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Create ST
  const handleOpenCreateST = (defaultDate = '') => {
    setEditingST(null);
    setStForm({
      tentang: '',
      tempat: '',
      tanggal: defaultDate || selectedDate || `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
      tanggalSelesai: '',
    });
    setStModalOpen(true);
  };

  // Open Edit ST
  const handleOpenEditST = (item) => {
    setEditingST(item);
    setStForm({
      tentang: item.tentang,
      tempat: item.tempat,
      tanggal: item.tanggal,
      tanggalSelesai: item.tanggalSelesai || '',
    });
    setStModalOpen(true);
  };

  // Submit ST
  const handleSTSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingST) {
        await jadwalKepalaApi.updateST(editingST.id, stForm);
        toast.success('Surat Tugas berhasil diperbarui');
      } else {
        await jadwalKepalaApi.createST(stForm);
        toast.success('Surat Tugas berhasil ditambahkan');
      }
      setStModalOpen(false);
      await fetchCalendar();
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan Surat Tugas');
    } finally {
      setSubmitting(false);
    }
  };

  // Open create modal if action query param is present
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'kegiatan') {
      handleOpenCreateKegiatan();
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('action');
      setSearchParams(newParams, { replace: true });
    } else if (action === 'st') {
      handleOpenCreateST();
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('action');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams]);

  // Delete Target Confirm
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'kegiatan') {
        await jadwalKepalaApi.deleteKegiatan(deleteTarget.id);
        toast.success('Agenda kegiatan berhasil dihapus');
      } else {
        await jadwalKepalaApi.deleteST(deleteTarget.id);
        toast.success('Surat Tugas berhasil dihapus');
      }
      setDeleteTarget(null);
      await fetchCalendar();
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus data');
    }
  };

  const formatReadableDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    const dt = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    const dayName = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][dt.getDay()];
    return `${dayName}, ${parseInt(d)} ${MONTH_NAMES[parseInt(m) - 1]} ${y}`;
  };

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const kepalaKantor = calendarData?.kepalaKantor || { name: 'HELMY AFRUL', nip: '60078203', jabatan: 'Kepala Kantor' };

  return (
    <div className="space-y-6">
      {/* Top Banner with Action Buttons & Informasi Kepala Kantor */}
      <div className="relative overflow-hidden rounded-3xl border p-6 sm:p-8" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-[color:var(--color-heading)] tracking-tight">
                Kelola Kalender Jadwal Kepala Kantor
              </h1>
              <p className="mt-1 text-sm text-[color:var(--color-text-muted)] max-w-xl">
                Tambah, perbarui, dan atur jadwal kegiatan maupun Surat Tugas (ST) Kepala Kantor yang tampil pada akun beliau.
              </p>
            </div>

            {/* Informasi Kepala Kantor */}
            <div className="inline-flex items-center gap-3.5 px-4 py-2.5 rounded-2xl border border-teal-500/25 bg-teal-500/5 dark:bg-teal-500/10 backdrop-blur-sm shadow-sm max-w-full">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-white flex items-center justify-center font-heading font-bold text-sm shadow-sm flex-shrink-0">
                {getInitials(kepalaKantor?.name || 'HELMY AFRUL')}
              </div>
              <div className="text-left min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                    {kepalaKantor?.jabatan || 'Kepala Kantor'}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                    NIP: {kepalaKantor?.nip || '60078203'}
                  </span>
                </div>
                <p className="text-sm sm:text-base font-heading font-bold text-[color:var(--color-heading)] truncate">
                  {kepalaKantor?.name || 'HELMY AFRUL'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleOpenCreateKegiatan()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-heading font-bold shadow-md shadow-teal-600/20 active:scale-95 transition-all"
            >
              <Plus size={16} />
              <span>Tambah Kegiatan</span>
            </button>
            <button
              onClick={() => handleOpenCreateST()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-heading font-bold shadow-md shadow-amber-600/20 active:scale-95 transition-all"
            >
              <Plus size={16} />
              <span>Tambah Surat Tugas (ST)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Controls & Filters */}
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
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-heading font-semibold transition-all ${
              filterType === 'all'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-[color:var(--color-text-muted)] hover:text-teal-600'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilterType('kegiatan')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-heading font-semibold transition-all ${
              filterType === 'kegiatan'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-[color:var(--color-text-muted)] hover:text-teal-600'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-teal-300" />
            Kegiatan ({calendarData.kegiatan?.length || 0})
          </button>
          <button
            onClick={() => setFilterType('st')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-heading font-semibold transition-all ${
              filterType === 'st'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-[color:var(--color-text-muted)] hover:text-amber-600'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-300" />
            ST ({calendarData.st?.length || 0})
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-3xl border overflow-hidden shadow-sm" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
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

        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            <p className="text-xs text-[color:var(--color-text-soft)]">Memuat kalender kegiatan...</p>
          </div>
        ) : (
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {Array.from({ length: startOffset }).map((_, i) => (
              <div
                key={`offset-${i}`}
                className="min-h-[120px] sm:min-h-[145px] p-2 bg-[color:var(--color-surface-muted)]/40 opacity-40 cursor-default"
                style={{ borderColor: 'var(--color-border)' }}
              />
            ))}

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
                        title={`${keg.waktuMulai} - ${keg.agenda}`}
                      >
                        <span className="font-bold mr-1.5 text-xs">{keg.waktuMulai}</span>
                        <span className="text-xs">{keg.agenda}</span>
                      </div>
                    ))}

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

      {/* Date Detail Drawer Modal */}
      {detailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-in"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-muted)' }}>
              <div>
                <h3 className="text-base font-heading font-bold text-[color:var(--color-heading)]">
                  Jadwal: {formatReadableDate(selectedDate)}
                </h3>
                <p className="text-xs text-[color:var(--color-text-soft)]">
                  {selectedEvents.kegiatan.length} Agenda Kegiatan &bull; {selectedEvents.st.length} Surat Tugas
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setDetailModalOpen(false);
                    handleOpenCreateKegiatan(selectedDate);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-xs font-bold hover:bg-teal-100 transition-colors flex items-center gap-1 border border-teal-200/60 dark:border-teal-800/60"
                >
                  <Plus size={14} />
                  Kegiatan
                </button>
                <button
                  onClick={() => {
                    setDetailModalOpen(false);
                    handleOpenCreateST(selectedDate);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-bold hover:bg-amber-100 transition-colors flex items-center gap-1 border border-amber-200/60 dark:border-amber-800/60"
                >
                  <Plus size={14} />
                  ST
                </button>
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-[color:var(--color-surface)] text-[color:var(--color-text-muted)] transition-colors ml-2"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {selectedEvents.kegiatan.length === 0 && selectedEvents.st.length === 0 ? (
                <div className="py-10 text-center">
                  <Info size={36} className="mx-auto text-[color:var(--color-text-soft)] mb-2" />
                  <p className="text-sm font-semibold text-[color:var(--color-heading)]">Belum ada agenda pada tanggal ini</p>
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <button
                      onClick={() => {
                        setDetailModalOpen(false);
                        handleOpenCreateKegiatan(selectedDate);
                      }}
                      className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Plus size={14} /> Tambah Agenda Kegiatan
                    </button>
                    <button
                      onClick={() => {
                        setDetailModalOpen(false);
                        handleOpenCreateST(selectedDate);
                      }}
                      className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Plus size={14} /> Tambah Surat Tugas
                    </button>
                  </div>
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
                              <div>
                                <h5 className="font-heading font-bold text-[color:var(--color-heading)] text-base">
                                  {item.tentang}
                                </h5>
                                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[color:var(--color-text-muted)]">
                                  <span className="flex items-center gap-1">
                                    <MapPin size={13} className="text-amber-500" />
                                    {item.tempat}
                                  </span>
                                  {item.tanggalSelesai && (
                                    <span className="text-[11px] text-[color:var(--color-text-soft)]">
                                      Sampai: {formatReadableDate(item.tanggalSelesai)}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button
                                  onClick={() => {
                                    setDetailModalOpen(false);
                                    handleOpenSTDetail(item);
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors shadow-xs"
                                  title="Lihat Rincian Lengkap ST"
                                >
                                  Detail
                                </button>
                                <button
                                  onClick={() => {
                                    setDetailModalOpen(false);
                                    handleOpenEditST(item);
                                  }}
                                  className="p-2 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-950/60 text-amber-700 dark:text-amber-400 transition-colors"
                                  title="Edit ST"
                                >
                                  <Edit2 size={15} />
                                </button>
                                <button
                                  onClick={() => {
                                    setDeleteTarget({ type: 'st', id: item.id, title: item.tentang });
                                  }}
                                  className="p-2 rounded-xl hover:bg-danger/10 text-danger transition-colors"
                                  title="Hapus ST"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Kegiatan List */}
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
                              <div>
                                <h5 className="font-heading font-bold text-[color:var(--color-heading)] text-base">
                                  {item.agenda}
                                </h5>
                                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[color:var(--color-text-muted)]">
                                  <span className="inline-flex items-center gap-1 font-bold text-teal-600 dark:text-teal-400">
                                    <Clock size={12} />
                                    {item.waktuMulai} {item.waktuSelesai ? `- ${item.waktuSelesai}` : ''}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MapPin size={13} className="text-teal-500" />
                                    {item.tempat}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button
                                  onClick={() => {
                                    setDetailModalOpen(false);
                                    handleOpenEditKegiatan(item);
                                  }}
                                  className="p-2 rounded-xl hover:bg-teal-50 dark:hover:bg-teal-950/60 text-teal-600 dark:text-teal-400 transition-colors"
                                  title="Edit Kegiatan"
                                >
                                  <Edit2 size={15} />
                                </button>
                                <button
                                  onClick={() => {
                                    setDeleteTarget({ type: 'kegiatan', id: item.id, title: item.agenda });
                                  }}
                                  className="p-2 rounded-xl hover:bg-danger/10 text-danger transition-colors"
                                  title="Hapus Kegiatan"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="px-6 py-3 border-t flex justify-end" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-muted)' }}>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[color:var(--color-text-muted)] hover:text-[color:var(--color-heading)]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated ST Detail Modal for Sekretaris */}
      {stDetailModalOpen && selectedST && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-in"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
          >
            {/* Header */}
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

            {/* Content */}
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

            {/* Footer with Edit and Delete triggers */}
            <div className="px-6 py-3.5 border-t flex items-center justify-between" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-muted)' }}>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const st = selectedST;
                    setStDetailModalOpen(false);
                    handleOpenEditST(st);
                  }}
                  className="px-3 py-1.5 rounded-xl border bg-[color:var(--color-surface)] text-amber-700 dark:text-amber-300 border-amber-300/80 dark:border-amber-800 text-xs font-bold hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors flex items-center gap-1.5"
                >
                  <Edit2 size={13} />
                  Edit ST
                </button>
                <button
                  onClick={() => {
                    const st = selectedST;
                    setStDetailModalOpen(false);
                    setDeleteTarget({ type: 'st', id: st.id, title: st.tentang });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-danger/10 text-danger text-xs font-bold hover:bg-danger/20 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 size={13} />
                  Hapus
                </button>
              </div>

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

      {/* Modal Form Tambah / Edit Kegiatan */}
      {kegiatanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col animate-scale-in"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
          >
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-muted)' }}>
              <h3 className="text-base font-heading font-bold text-[color:var(--color-heading)]">
                {editingKegiatan ? 'Edit Agenda Kegiatan' : 'Tambah Agenda Kegiatan Kepala Kantor'}
              </h3>
              <button onClick={() => setKegiatanModalOpen(false)} className="p-1.5 rounded-full hover:bg-[color:var(--color-surface)]">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleKegiatanSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-heading font-semibold text-[color:var(--color-text-muted)] mb-1">
                  Hari / Tanggal <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  value={kegiatanForm.tanggal}
                  onChange={(e) => setKegiatanForm({ ...kegiatanForm, tanggal: e.target.value })}
                  className="form-control"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-heading font-semibold text-[color:var(--color-text-muted)] mb-1">
                    Waktu Mulai <span className="text-danger">*</span>
                  </label>
                  <input
                    type="time"
                    value={kegiatanForm.waktuMulai}
                    onChange={(e) => setKegiatanForm({ ...kegiatanForm, waktuMulai: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-heading font-semibold text-[color:var(--color-text-muted)] mb-1">
                    Waktu Selesai (Opsional)
                  </label>
                  <input
                    type="time"
                    value={kegiatanForm.waktuSelesai}
                    onChange={(e) => setKegiatanForm({ ...kegiatanForm, waktuSelesai: e.target.value })}
                    className="form-control"
                    placeholder="Selesai"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-heading font-semibold text-[color:var(--color-text-muted)] mb-1">
                  Agenda Kegiatan <span className="text-danger">*</span>
                </label>
                <textarea
                  value={kegiatanForm.agenda}
                  onChange={(e) => setKegiatanForm({ ...kegiatanForm, agenda: e.target.value })}
                  rows={3}
                  className="form-control"
                  placeholder="Contoh: Rapat Koordinasi dengan Kanwil DJP Sulselbartra..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-heading font-semibold text-[color:var(--color-text-muted)] mb-1">
                  Tempat Pelaksanaan <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={kegiatanForm.tempat}
                  onChange={(e) => setKegiatanForm({ ...kegiatanForm, tempat: e.target.value })}
                  className="form-control"
                  placeholder="Contoh: Ruang Rapat Lt. 2 KPP Pratama Kolaka / Zoom Meeting"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <Button type="button" variant="ghost" onClick={() => setKegiatanModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" loading={submitting}>
                  {editingKegiatan ? 'Simpan Perubahan' : 'Tambah Agenda'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Form Tambah / Edit ST */}
      {stModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col animate-scale-in"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
          >
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-muted)' }}>
              <h3 className="text-base font-heading font-bold text-[color:var(--color-heading)]">
                {editingST ? 'Edit Surat Tugas' : 'Tambah Surat Tugas (ST) Kepala Kantor'}
              </h3>
              <button onClick={() => setStModalOpen(false)} className="p-1.5 rounded-full hover:bg-[color:var(--color-surface)]">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSTSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-heading font-semibold text-[color:var(--color-text-muted)] mb-1">
                  ST Tentang Apa <span className="text-danger">*</span>
                </label>
                <textarea
                  value={stForm.tentang}
                  onChange={(e) => setStForm({ ...stForm, tentang: e.target.value })}
                  rows={3}
                  className="form-control"
                  placeholder="Contoh: Menghadiri Rapat Pimpinan Terbatas Tingkat Wilayah..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-heading font-semibold text-[color:var(--color-text-muted)] mb-1">
                  Dimana (Tempat / Wilayah Tugas) <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={stForm.tempat}
                  onChange={(e) => setStForm({ ...stForm, tempat: e.target.value })}
                  className="form-control"
                  placeholder="Contoh: Makassar, Sulawesi Selatan"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-heading font-semibold text-[color:var(--color-text-muted)] mb-1">
                    Harinya Kapan (Tanggal Mulai) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    value={stForm.tanggal}
                    onChange={(e) => setStForm({ ...stForm, tanggal: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-heading font-semibold text-[color:var(--color-text-muted)] mb-1">
                    Sampai Tanggal (Opsional)
                  </label>
                  <input
                    type="date"
                    value={stForm.tanggalSelesai}
                    onChange={(e) => setStForm({ ...stForm, tanggalSelesai: e.target.value })}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <Button type="button" variant="ghost" onClick={() => setStModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" loading={submitting}>
                  {editingST ? 'Simpan Perubahan' : 'Tambah Surat Tugas'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={deleteTarget?.type === 'kegiatan' ? 'Hapus Agenda Kegiatan' : 'Hapus Surat Tugas'}
        message={`Apakah Anda yakin ingin menghapus "${deleteTarget?.title}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        variant="danger"
      />
    </div>
  );
}
