import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Building2, Home, RefreshCw, Calendar, CalendarPlus } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useWfoSchedule } from '../../../hooks/useWfo';
import WfoScheduleModal from '../../../components/tracking/WfoScheduleModal';

// Helper to get next friday date
function getNextFriday() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const distanceToFriday = (5 + 7 - dayOfWeek) % 7;
  const nextFriday = new Date(today);
  nextFriday.setDate(today.getDate() + distanceToFriday);
  return nextFriday.toISOString().split('T')[0];
}

export default function JadwalJumatPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('Semua'); // 'Semua', 'WFO', 'WFH'
  const [selectedDate, setSelectedDate] = useState(getNextFriday());
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: result, isLoading, isError, refetch, isFetching } = useWfoSchedule(selectedDate);

  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const allData = result?.isConfigured ? (result?.data || []) : [];

  const handleRefresh = async () => {
    refetch();
  };

  const handleModalRefresh = (date) => {
    if (date === selectedDate) {
      refetch();
    } else {
      setSelectedDate(date);
    }
  };

  // Generate date options for the dropdown (3 previous weeks + This week + 3 next weeks)
  const dateOptions = useMemo(() => {
    const fridays = [];
    const today = new Date();
    const dayOfWeek = today.getDay();
    const distanceToFriday = (5 + 7 - dayOfWeek) % 7;
    let nextFriday = new Date(today);
    nextFriday.setDate(today.getDate() + distanceToFriday);

    for (let i = -3; i <= 3; i++) {
      const d = new Date(nextFriday);
      d.setDate(nextFriday.getDate() + i * 7);
      const dateString = d.toISOString().split('T')[0];
      
      let label = `Jumat, ${dateString}`;
      if (i === 0) {
        label = `Jumat Minggu Ini (${dateString})`;
      } else if (i === -1) {
        label = `Jumat Minggu Lalu (${dateString})`;
      } else if (i < -1) {
        label = `Jumat, ${dateString} (${Math.abs(i)} minggu lalu)`;
      } else if (i === 1) {
        label = `Jumat Minggu Depan (${dateString})`;
      } else if (i > 1) {
        label = `Jumat, ${dateString} (${i} minggu ke depan)`;
      }

      fridays.push({
        value: dateString,
        label
      });
    }
    return fridays;
  }, []);

  // Filter based on active tab and search term
  const filteredData = allData.filter((item) => {
    const matchTab = activeTab === 'Semua' ? true : item.tipe === activeTab;
    const matchSearch = item.namaPegawai.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       (item.nip && item.nip.includes(searchTerm));
    return matchTab && matchSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-[color:var(--color-heading)]">Jadwal Jumat</h1>
          <p className="text-sm text-[color:var(--color-text-soft)] mt-1">
            Daftar jadwal Work From Office (WFO) dan Work From Home (WFH) hari Jumat.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-700 active:scale-95"
          >
            <CalendarPlus size={18} />
            <span>Buat / Edit Jadwal</span>
          </button>
        )}
      </div>

      <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
          
          <div className="flex gap-4 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
            <div className="flex bg-[color:var(--color-surface-muted)] p-1 rounded-xl shrink-0">
              {['Semua', 'WFO', 'WFH'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === tab 
                      ? 'bg-emerald-600 text-white shadow-md' 
                      : 'text-[color:var(--color-text-muted)] hover:text-[color:var(--color-heading)]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="relative shrink-0 min-w-[200px]">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-text-soft)]" size={16} />
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full rounded-xl border pl-9 pr-8 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                style={{
                  borderColor: 'var(--color-border)',
                  background: 'var(--color-bg-shell)',
                  color: 'var(--color-text-main)'
                }}
              >
                {dateOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-text-soft)]" size={16} />
              <input
                type="text"
                placeholder="Cari nama, NIP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                style={{
                  borderColor: 'var(--color-border)',
                  background: 'var(--color-bg-shell)',
                  color: 'var(--color-text-main)'
                }}
              />
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={isFetching}
              className="flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-heading font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors disabled:opacity-50 shrink-0"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
          <table className="w-full text-left text-sm">
            <thead className="bg-[color:var(--color-surface-muted)] text-[color:var(--color-text-soft)] font-heading">
              <tr>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">No</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">Nama & NIP</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">Jabatan / Golongan</th>
                <th className="px-6 py-4 font-semibold text-center whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 w-6 rounded bg-[color:var(--color-surface-muted)]" /></td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="h-4 w-32 rounded bg-[color:var(--color-surface-muted)]" />
                        <div className="h-3 w-24 rounded bg-[color:var(--color-surface-muted)]" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="h-4 w-40 rounded bg-[color:var(--color-surface-muted)]" />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="h-6 w-16 mx-auto rounded-full bg-[color:var(--color-surface-muted)]" />
                    </td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-red-500">
                    Gagal memuat data jadwal.
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-[color:var(--color-text-soft)]">
                    {result?.isConfigured === false 
                      ? 'Belum diinput oleh SUKI' 
                      : 'Tidak ada jadwal ditemukan pada tanggal ini.'}
                  </td>
                </tr>
              ) : (
                filteredData.map((item, index) => (
                  <motion.tr 
                    key={`${item.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.05, 0.5) }}
                    className="hover:bg-[color:var(--color-surface-muted)]/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-[color:var(--color-text-soft)]">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-heading font-semibold text-[color:var(--color-heading)]">{item.namaPegawai}</div>
                      <div className="text-xs text-[color:var(--color-text-soft)] mt-0.5">{item.nip || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-[color:var(--color-text-main)]">{item.jabatan || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.tipe === 'WFO' ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-500/20">
                          <Building2 size={12} /> WFO
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                          <Home size={12} /> WFH
                        </div>
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <WfoScheduleModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onRefresh={handleModalRefresh}
        initialDate={selectedDate}
      />
    </div>
  );
}
