import { useState, useMemo } from 'react';
import { useAgendaST, useRefreshCache } from '../../../hooks/useSheetData';
import { Search, RefreshCw, MapPin, ChevronLeft, ChevronRight, FileText, Calendar, CheckCircle, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLoading } from '../../../contexts/LoadingContext';
import { toast } from 'sonner';
import Modal from '../../../components/ui/Modal';

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 11 }).map((_, i) => (
        <td key={i} className="px-3 py-4"><div className="h-4 rounded-lg bg-[color:var(--color-surface-muted)]" /></td>
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

function SikkaBadge({ value }) {
  if (value === 'SUDAH') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
        <CheckCircle size={10} /> Sudah
      </span>
    );
  }
  if (value === '-' || !value) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 dark:bg-gray-700/30 dark:text-gray-400">
        <Minus size={10} /> Belum
      </span>
    );
  }
  return <span className="text-xs text-[color:var(--color-text-soft)]">{value}</span>;
}

export default function PerjadinPage() {
  const [search, setSearch] = useState('');
  const [wilayah, setWilayah] = useState('');
  const [sikkaFilter, setSikkaFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const limit = 15;

  const { data, isLoading, isFetching } = useAgendaST({ search, wilayah, page, limit });
  const refreshCache = useRefreshCache();
  const { showLoading, hideLoading } = useLoading();

  let records = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  // Apply SIKKA filter client-side
  if (sikkaFilter === 'sudah') {
    records = records.filter((r) => r.inputSikka === 'SUDAH');
  } else if (sikkaFilter === 'belum') {
    records = records.filter((r) => r.inputSikka !== 'SUDAH');
  }

  const wilayahOptions = data?.uniqueWilayah || [];

  const handleRefresh = async () => {
    try {
      showLoading('Memperbarui seluruh data spreadsheet...');
      await refreshCache.mutateAsync();
      toast.success('Semua data berhasil diperbarui dari Google Sheets (SPD, Perjadin, Pegawai Cuti)');
    } catch {
      toast.error('Gagal me-refresh data spreadsheet');
    } finally {
      hideLoading();
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-[color:var(--color-heading)]">Perjalanan Dinas</h1>
        <p className="text-sm text-[color:var(--color-text-soft)] mt-1">Agenda Surat Tugas & Perjalanan Dinas</p>
      </div>

      {/* Filters */}
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
          {wilayahOptions.map((w) => (<option key={w} value={w}>{w}</option>))}
        </select>
        <select
          value={sikkaFilter}
          onChange={(e) => setSikkaFilter(e.target.value)}
          className="rounded-xl border py-2.5 px-4 text-sm font-heading bg-[color:var(--color-surface-elevated)] text-[color:var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <option value="">SIKKA: Semua</option>
          <option value="sudah">Sudah</option>
          <option value="belum">Belum</option>
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

      <div className="mb-4">
        <p className="text-xs font-heading font-semibold text-[color:var(--color-text-soft)]">
          {total} data ditemukan {isFetching && !isLoading && <span className="text-emerald-500 ml-2">• Memuat...</span>}
        </p>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto rounded-2xl border" style={{ borderColor: 'var(--color-border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-muted)' }}>
              <th className="px-3 py-3 text-left font-heading font-bold text-[color:var(--color-text-muted)]">No</th>
              <th className="px-3 py-3 text-left font-heading font-bold text-[color:var(--color-text-muted)]">Tgl Buat</th>
              <th className="px-3 py-3 text-left font-heading font-bold text-[color:var(--color-text-muted)]">Pegawai</th>
              <th className="px-3 py-3 text-left font-heading font-bold text-[color:var(--color-text-muted)]">Nomor ST</th>
              <th className="px-3 py-3 text-left font-heading font-bold text-[color:var(--color-text-muted)]">Perihal</th>
              <th className="px-3 py-3 text-left font-heading font-bold text-[color:var(--color-text-muted)]">Dari → Tujuan</th>
              <th className="px-3 py-3 text-center font-heading font-bold text-[color:var(--color-text-muted)]">ST</th>
              <th className="px-3 py-3 text-center font-heading font-bold text-[color:var(--color-text-muted)]">SPD</th>
              <th className="px-3 py-3 text-left font-heading font-bold text-[color:var(--color-text-muted)]">Berangkat</th>
              <th className="px-3 py-3 text-left font-heading font-bold text-[color:var(--color-text-muted)]">Kembali</th>
              <th className="px-3 py-3 text-center font-heading font-bold text-[color:var(--color-text-muted)]">SIKKA</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-16 text-center">
                  <FileText size={40} className="mx-auto mb-3 text-[color:var(--color-text-soft)] opacity-40" />
                  <p className="font-heading font-semibold text-[color:var(--color-text-muted)]">Tidak ada data perjadin</p>
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
                  <td className="px-3 py-3 font-heading font-bold text-[color:var(--color-heading)]">{r.nomorSpd || '-'}</td>
                  <td className="px-3 py-3 text-xs text-[color:var(--color-text-muted)]">{r.tanggalPembuatan}</td>
                  <td className="px-3 py-3 font-heading font-semibold text-[color:var(--color-heading)]">{r.namaPegawai}</td>
                  <td className="px-3 py-3 font-mono text-xs text-[color:var(--color-text-muted)]">{r.nomorST}</td>
                  <td className="px-3 py-3 text-[color:var(--color-text-muted)] max-w-[180px] truncate text-xs">{r.perihalKegiatan}</td>
                  <td className="px-3 py-3 text-xs text-[color:var(--color-text-muted)]">
                    <span>{r.berangkatDari}</span>
                    <span className="text-emerald-500 mx-1">→</span>
                    <span className="font-semibold">{r.wilayahTugas}</span>
                  </td>
                  <td className="px-3 py-3 text-center text-xs font-bold text-[color:var(--color-heading)]">{r.jumlahHariST}</td>
                  <td className="px-3 py-3 text-center text-xs font-bold text-emerald-600 dark:text-emerald-400">{r.jumlahHariSPD}</td>
                  <td className="px-3 py-3 text-xs text-[color:var(--color-text-muted)]">{r.tanggalBerangkat}</td>
                  <td className="px-3 py-3 text-xs text-[color:var(--color-text-muted)]">{r.tanggalKembali}</td>
                  <td className="px-3 py-3 text-center"><SikkaBadge value={r.inputSikka} /></td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : records.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={40} className="mx-auto mb-3 text-[color:var(--color-text-soft)] opacity-40" />
            <p className="font-heading font-semibold text-[color:var(--color-text-muted)]">Tidak ada data perjadin</p>
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
                <span className="font-heading font-bold text-[color:var(--color-heading)]">#{r.nomorSpd}</span>
                <SikkaBadge value={r.inputSikka} />
              </div>
              <p className="font-heading font-semibold text-sm text-[color:var(--color-heading)]">{r.namaPegawai}</p>
              <p className="text-xs text-[color:var(--color-text-muted)] mt-1 line-clamp-1">{r.perihalKegiatan}</p>
              <div className="flex items-center gap-1 mt-2 text-xs text-[color:var(--color-text-soft)]">
                <MapPin size={10} /> {r.berangkatDari} <span className="text-emerald-500">→</span> {r.wilayahTugas}
              </div>
              <div className="flex items-center justify-between mt-2 text-[11px] text-[color:var(--color-text-soft)]">
                <span className="flex items-center gap-1"><Calendar size={10} /> {r.tanggalBerangkat} - {r.tanggalKembali}</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{r.jumlahHariSPD}d SPD</span>
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
        title="Detail Perjalanan Dinas (Perjadin)"
        size="md"
      >
        {selectedRecord && (
          <div className="space-y-5 text-sm text-[color:var(--color-heading)]">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-[10px] font-bold text-[color:var(--color-text-soft)] uppercase tracking-widest mb-1">Status SIKKA</span>
                <SikkaBadge value={selectedRecord.inputSikka} />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-[color:var(--color-text-soft)] uppercase tracking-widest mb-1">Tgl Buat</span>
                <p className="text-sm font-medium">{selectedRecord.tanggalPembuatan}</p>
              </div>
            </div>
            
            <div>
              <span className="block text-[10px] font-bold text-[color:var(--color-text-soft)] uppercase tracking-widest mb-1">Nama Pegawai</span>
              <p className="font-heading font-semibold text-base">{selectedRecord.namaPegawai}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-[10px] font-bold text-[color:var(--color-text-soft)] uppercase tracking-widest mb-1">Nomor ST</span>
                <p className="font-mono text-sm bg-[color:var(--color-surface-muted)] px-3 py-2 rounded-xl border inline-block" style={{ borderColor: 'var(--color-border)' }}>
                  {selectedRecord.nomorST}
                </p>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-[color:var(--color-text-soft)] uppercase tracking-widest mb-1">No. SPD</span>
                <p className="font-heading font-bold text-lg">{selectedRecord.nomorSpd || '-'}</p>
              </div>
            </div>
            
            <div>
              <span className="block text-[10px] font-bold text-[color:var(--color-text-soft)] uppercase tracking-widest mb-1">Perihal Kegiatan</span>
              <div className="p-4 rounded-xl border bg-[color:var(--color-surface-muted)]" style={{ borderColor: 'var(--color-border)' }}>
                <p className="leading-relaxed whitespace-pre-wrap text-[13px]">{selectedRecord.perihalKegiatan}</p>
              </div>
            </div>

            <div>
              <span className="block text-[10px] font-bold text-[color:var(--color-text-soft)] uppercase tracking-widest mb-1">Rute Perjalanan</span>
              <div className="flex items-center gap-3 p-3 rounded-xl border bg-[color:var(--color-surface)]" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex-1">
                  <p className="text-xs text-[color:var(--color-text-soft)]">Berangkat Dari</p>
                  <p className="font-semibold text-sm">{selectedRecord.berangkatDari}</p>
                </div>
                <div className="text-emerald-500">
                  <ChevronRight size={20} />
                </div>
                <div className="flex-1 text-right">
                  <p className="text-xs text-[color:var(--color-text-soft)]">Wilayah Tugas</p>
                  <p className="font-semibold text-sm">{selectedRecord.wilayahTugas}</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl border bg-[color:var(--color-surface)]" style={{ borderColor: 'var(--color-border)' }}>
              <div>
                <span className="block text-[10px] font-bold text-[color:var(--color-text-soft)] uppercase tracking-widest mb-1">Berangkat</span>
                <p className="text-xs font-medium">{selectedRecord.tanggalBerangkat}</p>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-[color:var(--color-text-soft)] uppercase tracking-widest mb-1">Kembali</span>
                <p className="text-xs font-medium">{selectedRecord.tanggalKembali}</p>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-[color:var(--color-text-soft)] uppercase tracking-widest mb-1">Hari ST</span>
                <p className="text-xs font-bold">{selectedRecord.jumlahHariST} Hari</p>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-[color:var(--color-text-soft)] uppercase tracking-widest mb-1">Hari SPD</span>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{selectedRecord.jumlahHariSPD} Hari</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
