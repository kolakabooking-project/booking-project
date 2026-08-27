import { useState } from 'react';
import { usePegawaiCuti, useRefreshCache } from '../../../hooks/useSheetData';
import { Search, RefreshCw, Calendar, CalendarOff, ChevronLeft, ChevronRight, UserCheck, Clock, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLoading } from '../../../contexts/LoadingContext';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'sonner';
import Modal from '../../../components/ui/Modal';
import ActiveCutiWidget from '../../../components/dashboard/ActiveCutiWidget';

function getLeaveStatus(tanggalMulai, tanggalSelesai) {
  if (!tanggalMulai || !tanggalSelesai) return { label: '—', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', icon: Clock };
  
  const start = new Date(tanggalMulai);
  const end = new Date(tanggalSelesai);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { label: '—', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', icon: Clock };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  if (today >= start && today <= end) {
    return {
      label: 'Sedang Cuti',
      color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-500/20',
      icon: CalendarOff
    };
  } else if (today < start) {
    return {
      label: 'Akan Datang',
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-500/20',
      icon: Clock
    };
  } else {
    return {
      label: 'Selesai',
      color: 'bg-gray-100 text-gray-600 dark:bg-gray-700/30 dark:text-gray-400',
      icon: CheckCircle2
    };
  }
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div className="h-4 rounded-lg bg-[color:var(--color-surface-muted)]" />
        </td>
      ))}
    </tr>
  );
}

function SkeletonCard() {
  return (
    <div
      className="animate-pulse rounded-2xl border p-4 space-y-3"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
    >
      <div className="h-4 w-1/3 rounded-lg bg-[color:var(--color-surface-muted)]" />
      <div className="h-3 w-2/3 rounded-lg bg-[color:var(--color-surface-muted)]" />
      <div className="h-3 w-1/2 rounded-lg bg-[color:var(--color-surface-muted)]" />
    </div>
  );
}

export default function PegawaiCutiPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const limit = 15;

  const { user } = useAuth();
  const activeRole = localStorage.getItem('booking_active_role') || user?.role;
  const isAdmin = activeRole === 'admin' || activeRole === 'superadmin';

  const { data, isLoading, isFetching } = usePegawaiCuti({ search, page, limit });
  const refreshCache = useRefreshCache();
  const { showLoading, hideLoading } = useLoading();

  const records = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-[color:var(--color-heading)]">
          Pegawai Cuti
        </h1>
        <p className="text-sm text-[color:var(--color-text-soft)] mt-1">
          Daftar rekapitulasi cuti pegawai dari Google Sheets
        </p>
      </div>

      {/* Live Active Cuti Widget */}
      <ActiveCutiWidget />

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--color-text-soft)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari nama pegawai atau tanggal..."
            className="w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm font-heading bg-[color:var(--color-surface-elevated)] text-[color:var(--color-heading)] placeholder:text-[color:var(--color-text-soft)] focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            style={{ borderColor: 'var(--color-border)' }}
          />
        </div>
        {isAdmin && (
          <button
            onClick={handleRefresh}
            disabled={refreshCache.isPending}
            className="flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-heading font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors disabled:opacity-50"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <RefreshCw size={16} className={refreshCache.isPending ? 'animate-spin' : ''} />
            <span>Refresh Data</span>
          </button>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-heading font-semibold text-[color:var(--color-text-soft)]">
          {total} data cuti ditemukan {isFetching && !isLoading && <span className="text-amber-500 ml-2">• Memuat...</span>}
        </p>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border" style={{ borderColor: 'var(--color-border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-muted)' }}>
              <th className="px-4 py-3 text-left font-heading font-bold text-[color:var(--color-text-muted)] w-16">No</th>
              <th className="px-4 py-3 text-left font-heading font-bold text-[color:var(--color-text-muted)]">Nama Pegawai</th>
              <th className="px-4 py-3 text-left font-heading font-bold text-[color:var(--color-text-muted)]">Tanggal Mulai</th>
              <th className="px-4 py-3 text-left font-heading font-bold text-[color:var(--color-text-muted)]">Tanggal Selesai</th>
              <th className="px-4 py-3 text-center font-heading font-bold text-[color:var(--color-text-muted)]">Lama Cuti</th>
              <th className="px-4 py-3 text-center font-heading font-bold text-[color:var(--color-text-muted)]">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center">
                  <UserCheck size={40} className="mx-auto mb-3 text-[color:var(--color-text-soft)] opacity-40" />
                  <p className="font-heading font-semibold text-[color:var(--color-text-muted)]">Tidak ada data pegawai cuti</p>
                  <p className="text-xs text-[color:var(--color-text-soft)] mt-1">Belum ada entri cuti yang terdaftar di spreadsheet</p>
                </td>
              </tr>
            ) : (
              records.map((r, i) => {
                const status = getLeaveStatus(r.tanggalMulai, r.tanggalSelesai);
                const StatusIcon = status.icon;

                return (
                  <motion.tr
                    key={`${r.namaPegawai}-${r.tanggalMulai}-${i}`}
                    onClick={() => setSelectedRecord(r)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b transition-colors hover:bg-[color:var(--color-surface-muted)] cursor-pointer"
                    style={{ borderColor: 'color-mix(in srgb, var(--color-border) 50%, transparent)' }}
                  >
                    <td className="px-4 py-3.5 font-heading font-bold text-[color:var(--color-heading)]">{r.no || i + 1}</td>
                    <td className="px-4 py-3.5 font-heading font-semibold text-[color:var(--color-heading)]">{r.namaPegawai}</td>
                    <td className="px-4 py-3.5 text-[color:var(--color-text-muted)] text-xs">{r.tanggalMulai}</td>
                    <td className="px-4 py-3.5 text-[color:var(--color-text-muted)] text-xs">{r.tanggalSelesai}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-bold">
                        {r.lamaCuti} Hari
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${status.color}`}>
                        <StatusIcon size={12} /> {status.label}
                      </span>
                    </td>
                  </motion.tr>
                );
              })
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
            <UserCheck size={40} className="mx-auto mb-3 text-[color:var(--color-text-soft)] opacity-40" />
            <p className="font-heading font-semibold text-[color:var(--color-text-muted)]">Tidak ada data pegawai cuti</p>
          </div>
        ) : (
          records.map((r, i) => {
            const status = getLeaveStatus(r.tanggalMulai, r.tanggalSelesai);
            const StatusIcon = status.icon;

            return (
              <motion.div
                key={`${r.namaPegawai}-${r.tanggalMulai}-${i}`}
                onClick={() => setSelectedRecord(r)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border p-4 cursor-pointer hover:shadow-md transition-shadow"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-heading font-bold text-sm text-[color:var(--color-heading)]">{r.namaPegawai}</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${status.color}`}>
                    <StatusIcon size={10} /> {status.label}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3 text-xs text-[color:var(--color-text-soft)]">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> {r.tanggalMulai} – {r.tanggalSelesai}
                  </span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">{r.lamaCuti} hari</span>
                </div>
              </motion.div>
            );
          })
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
        title="Detail Pegawai Cuti"
        size="md"
      >
        {selectedRecord && (
          <div className="space-y-5 text-sm text-[color:var(--color-heading)]">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-[10px] font-bold text-[color:var(--color-text-soft)] uppercase tracking-widest mb-1">Nama Pegawai</span>
                <p className="font-heading font-bold text-base">{selectedRecord.namaPegawai}</p>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-[color:var(--color-text-soft)] uppercase tracking-widest mb-1">Status Cuti</span>
                {(() => {
                  const status = getLeaveStatus(selectedRecord.tanggalMulai, selectedRecord.tanggalSelesai);
                  const StatusIcon = status.icon;
                  return (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${status.color}`}>
                      <StatusIcon size={12} /> {status.label}
                    </span>
                  );
                })()}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 p-4 rounded-xl border bg-[color:var(--color-surface)]" style={{ borderColor: 'var(--color-border)' }}>
              <div>
                <span className="block text-[10px] font-bold text-[color:var(--color-text-soft)] uppercase tracking-widest mb-1">Mulai Cuti</span>
                <p className="text-xs font-semibold">{selectedRecord.tanggalMulai}</p>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-[color:var(--color-text-soft)] uppercase tracking-widest mb-1">Selesai Cuti</span>
                <p className="text-xs font-semibold">{selectedRecord.tanggalSelesai}</p>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-[color:var(--color-text-soft)] uppercase tracking-widest mb-1">Total Durasi</span>
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400">{selectedRecord.lamaCuti} Hari</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
