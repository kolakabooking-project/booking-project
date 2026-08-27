import { useState, useMemo } from 'react';
import { useRekapSPD, useRefreshCache } from '../../../hooks/useSheetData';
import { Search, RefreshCw, MapPin, ChevronLeft, ChevronRight, FileText, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLoading } from '../../../contexts/LoadingContext';
import { toast } from 'sonner';
import ActiveSTWidget from '../../../components/dashboard/ActiveSTWidget';
import Modal from '../../../components/ui/Modal';

const WILAYAH_COLORS = {
  kolaka: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  bombana: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  makassar: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  jakarta: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  kendari: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};

function getWilayahColor(wilayah) {
  const key = wilayah?.toLowerCase();
  for (const [k, v] of Object.entries(WILAYAH_COLORS)) {
    if (key?.includes(k)) return v;
  }
  return 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300';
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 9 }).map((_, i) => (
        <td key={i} className="px-4 py-4"><div className="h-4 rounded-lg bg-[color:var(--color-surface-muted)]" /></td>
      ))}
    </tr>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border p-4 space-y-3" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
      <div className="h-4 w-1/3 rounded-lg bg-[color:var(--color-surface-muted)]" />
      <div className="h-3 w-2/3 rounded-lg bg-[color:var(--color-surface-muted)]" />
      <div className="h-3 w-1/2 rounded-lg bg-[color:var(--color-surface-muted)]" />
    </div>
  );
}

export default function MonitoringSPDPage() {
  const [search, setSearch] = useState('');
  const [wilayah, setWilayah] = useState('');
  const [page, setPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const limit = 15;

  const { data, isLoading, isFetching } = useRekapSPD({ search, wilayah, page, limit });
  const refreshCache = useRefreshCache();
  const { showLoading, hideLoading } = useLoading();

  const records = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  // Extract unique wilayah values for filter from backend (ignores pagination limit)
  const wilayahOptions = data?.uniqueWilayah || [];

  const handleRefresh = async () => {
    try {
      showLoading('Memperbarui data SPD...');
      await refreshCache.mutateAsync();
      toast.success('Data berhasil di-refresh dari Google Sheets');
    } catch {
      toast.error('Gagal me-refresh data');
    } finally {
      hideLoading();
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-[color:var(--color-heading)]">Monitoring SPD</h1>
        <p className="text-sm text-[color:var(--color-text-soft)] mt-1">Rekap Surat Perjalanan Dinas dari Google Sheets</p>
      </div>

      {/* Sedang Dinas Hari Ini Widget */}
      <ActiveSTWidget />

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--color-text-soft)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari nama, nomor ST, perihal..."
            className="w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm font-heading bg-[color:var(--color-surface-elevated)] text-[color:var(--color-heading)] placeholder:text-[color:var(--color-text-soft)] focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            style={{ borderColor: 'var(--color-border)' }}
          />
        </div>
        <select
          value={wilayah}
          onChange={(e) => { setWilayah(e.target.value); setPage(1); }}
          className="rounded-xl border py-2.5 px-4 text-sm font-heading bg-[color:var(--color-surface-elevated)] text-[color:var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <option value="">Semua Wilayah</option>
          {wilayahOptions.map((w) => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>
        <button
          onClick={handleRefresh}
          disabled={refreshCache.isPending}
          className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-heading font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors disabled:opacity-50"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <RefreshCw size={16} className={refreshCache.isPending ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Results Count */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-heading font-semibold text-[color:var(--color-text-soft)]">
          {total} data ditemukan {isFetching && !isLoading && <span className="text-emerald-500 ml-2">• Memuat...</span>}
        </p>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border" style={{ borderColor: 'var(--color-border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-muted)' }}>
              <th className="px-4 py-3 text-left font-heading font-bold text-[color:var(--color-text-muted)]">No SPD</th>
              <th className="px-4 py-3 text-left font-heading font-bold text-[color:var(--color-text-muted)]">Nama Pegawai</th>
              <th className="px-4 py-3 text-left font-heading font-bold text-[color:var(--color-text-muted)]">Wilayah Tugas</th>
              <th className="px-4 py-3 text-left font-heading font-bold text-[color:var(--color-text-muted)]">Nomor ST</th>
              <th className="px-4 py-3 text-left font-heading font-bold text-[color:var(--color-text-muted)]">Perihal</th>
              <th className="px-4 py-3 text-center font-heading font-bold text-[color:var(--color-text-muted)]">Hari</th>
              <th className="px-4 py-3 text-left font-heading font-bold text-[color:var(--color-text-muted)]">Tgl Mulai</th>
              <th className="px-4 py-3 text-left font-heading font-bold text-[color:var(--color-text-muted)]">Tgl Akhir</th>
              <th className="px-4 py-3 text-left font-heading font-bold text-[color:var(--color-text-muted)]">Tgl Ditetapkan</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-16 text-center">
                  <FileText size={40} className="mx-auto mb-3 text-[color:var(--color-text-soft)] opacity-40" />
                  <p className="font-heading font-semibold text-[color:var(--color-text-muted)]">Tidak ada data SPD</p>
                  <p className="text-xs text-[color:var(--color-text-soft)] mt-1">Coba ubah filter pencarian Anda</p>
                </td>
              </tr>
            ) : (
              records.map((r, i) => (
                <motion.tr
                  key={`${r.nomorSpd}-${i}`}
                  onClick={() => setSelectedRecord(r)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b transition-colors hover:bg-[color:var(--color-surface-muted)] cursor-pointer"
                  style={{ borderColor: 'color-mix(in srgb, var(--color-border) 50%, transparent)' }}
                >
                  <td className="px-4 py-3.5 font-heading font-bold text-[color:var(--color-heading)]">{r.nomorSpd || '-'}</td>
                  <td className="px-4 py-3.5 font-heading font-semibold text-[color:var(--color-heading)]">{r.namaPegawai}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${getWilayahColor(r.wilayahTugas)}`}>
                      <MapPin size={10} /> {r.wilayahTugas}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-[color:var(--color-text-muted)] font-mono text-xs">{r.nomorST}</td>
                  <td className="px-4 py-3.5 text-[color:var(--color-text-muted)] max-w-[200px] truncate">{r.perihalTugas}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-bold">
                      {r.jumlahHariSpdNumeric}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-[color:var(--color-text-muted)] text-xs">{r.tanggalMulai}</td>
                  <td className="px-4 py-3.5 text-[color:var(--color-text-muted)] text-xs">{r.tanggalAkhir}</td>
                  <td className="px-4 py-3.5 text-[color:var(--color-text-muted)] text-xs">{r.tanggalDitetapkan}</td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : records.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={40} className="mx-auto mb-3 text-[color:var(--color-text-soft)] opacity-40" />
            <p className="font-heading font-semibold text-[color:var(--color-text-muted)]">Tidak ada data SPD</p>
          </div>
        ) : (
          records.map((r, i) => (
            <motion.div
              key={`${r.nomorSpd}-${i}`}
              onClick={() => setSelectedRecord(r)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border p-4 cursor-pointer hover:shadow-md transition-shadow"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-heading font-bold text-[color:var(--color-heading)]">SPD #{r.nomorSpd}</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${getWilayahColor(r.wilayahTugas)}`}>
                  <MapPin size={8} /> {r.wilayahTugas}
                </span>
              </div>
              <p className="font-heading font-semibold text-sm text-[color:var(--color-heading)]">{r.namaPegawai}</p>
              <p className="text-xs text-[color:var(--color-text-muted)] mt-1 line-clamp-1">{r.perihalTugas}</p>
              <div className="flex items-center gap-4 mt-3 text-[11px] text-[color:var(--color-text-soft)]">
                <span className="flex items-center gap-1"><Calendar size={10} /> {r.tanggalMulai}</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{r.jumlahHariSpdNumeric} hari</span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 rounded-xl border px-3 py-2 text-sm font-heading font-semibold text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-muted)] disabled:opacity-30 transition-colors"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <span className="text-sm font-heading font-bold text-[color:var(--color-heading)]">{page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1 rounded-xl border px-3 py-2 text-sm font-heading font-semibold text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-muted)] disabled:opacity-30 transition-colors"
            style={{ borderColor: 'var(--color-border)' }}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title="Detail Monitoring SPD"
        size="md"
      >
        {selectedRecord && (
          <div className="space-y-5 text-sm text-[color:var(--color-heading)]">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-[10px] font-bold text-[color:var(--color-text-soft)] uppercase tracking-widest mb-1">Nomor SPD</span>
                <p className="font-heading font-bold text-lg">{selectedRecord.nomorSpd || '-'}</p>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-[color:var(--color-text-soft)] uppercase tracking-widest mb-1">Wilayah Tugas</span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${getWilayahColor(selectedRecord.wilayahTugas)}`}>
                  <MapPin size={10} /> {selectedRecord.wilayahTugas}
                </span>
              </div>
            </div>
            
            <div>
              <span className="block text-[10px] font-bold text-[color:var(--color-text-soft)] uppercase tracking-widest mb-1">Nama Pegawai</span>
              <p className="font-heading font-semibold text-base">{selectedRecord.namaPegawai}</p>
            </div>
            
            <div>
              <span className="block text-[10px] font-bold text-[color:var(--color-text-soft)] uppercase tracking-widest mb-1">Nomor Surat Tugas</span>
              <p className="font-mono text-sm bg-[color:var(--color-surface-muted)] px-3 py-2 rounded-xl inline-block border" style={{ borderColor: 'var(--color-border)' }}>
                {selectedRecord.nomorST}
              </p>
            </div>
            
            <div>
              <span className="block text-[10px] font-bold text-[color:var(--color-text-soft)] uppercase tracking-widest mb-1">Perihal Kegiatan</span>
              <div className="p-4 rounded-xl border bg-[color:var(--color-surface-muted)]" style={{ borderColor: 'var(--color-border)' }}>
                <p className="leading-relaxed whitespace-pre-wrap text-[13px]">{selectedRecord.perihalTugas}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl border bg-[color:var(--color-surface)]" style={{ borderColor: 'var(--color-border)' }}>
              <div>
                <span className="block text-[10px] font-bold text-[color:var(--color-text-soft)] uppercase tracking-widest mb-1">Berangkat</span>
                <p className="text-xs font-medium">{selectedRecord.tanggalMulai}</p>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-[color:var(--color-text-soft)] uppercase tracking-widest mb-1">Kembali</span>
                <p className="text-xs font-medium">{selectedRecord.tanggalAkhir}</p>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-[color:var(--color-text-soft)] uppercase tracking-widest mb-1">Durasi</span>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{selectedRecord.jumlahHariSpdNumeric} Hari</p>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-[color:var(--color-text-soft)] uppercase tracking-widest mb-1">Ditetapkan</span>
                <p className="text-xs font-medium">{selectedRecord.tanggalDitetapkan}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
