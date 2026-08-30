import { useState, useMemo } from 'react';
import { usePegawaiCuti, useRefreshCache } from '../../../hooks/useSheetData';
import {
  Search, RefreshCw, Calendar, CalendarOff, ChevronLeft, ChevronRight,
  UserCheck, Clock, CheckCircle2, ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useLoading } from '../../../contexts/LoadingContext';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'sonner';
import Modal from '../../../components/ui/Modal';
import ActiveCutiWidget from '../../../components/dashboard/ActiveCutiWidget';
import { parseIndonesianDate } from '../../../utils/helpers';

function getLeaveStatus(tanggalMulai, tanggalSelesai) {
  if (!tanggalMulai || !tanggalSelesai) {
    return { key: 'unknown', label: '—', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', icon: Clock };
  }
  
  const start = new Date(tanggalMulai);
  const end = new Date(tanggalSelesai);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { key: 'unknown', label: '—', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', icon: Clock };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  if (today >= start && today <= end) {
    return {
      key: 'active',
      label: 'Sedang Cuti',
      color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-500/20',
      icon: CalendarOff
    };
  } else if (today < start) {
    return {
      key: 'upcoming',
      label: 'Akan Datang',
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-500/20',
      icon: Clock
    };
  } else {
    return {
      key: 'completed',
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
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'upcoming', 'completed'
  const [sortField, setSortField] = useState('default'); // 'default', 'namaPegawai', 'tanggalMulai', 'tanggalSelesai', 'lamaCuti'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [page, setPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const limit = 20;

  const { user } = useAuth();
  const activeRole = localStorage.getItem('booking_active_role') || user?.role;
  const isAdmin = activeRole === 'admin' || activeRole === 'superadmin';

  const { data, isLoading, isFetching } = usePegawaiCuti({ search, page, limit });
  const refreshCache = useRefreshCache();
  const { showLoading, hideLoading } = useLoading();

  const rawRecords = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  // Filter & Sort records client-side for immediate responsive control
  const processedRecords = useMemo(() => {
    let list = [...rawRecords];

    // Filter by status
    if (statusFilter !== 'all') {
      list = list.filter((r) => {
        const s = getLeaveStatus(r.tanggalMulai, r.tanggalSelesai);
        return s.key === statusFilter;
      });
    }

    // Sort if a custom sort field is selected
    if (sortField !== 'default') {
      list.sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        if (sortField === 'tanggalMulai' || sortField === 'tanggalSelesai') {
          valA = new Date(valA).getTime() || 0;
          valB = new Date(valB).getTime() || 0;
        } else if (sortField === 'lamaCuti' || sortField === 'no') {
          valA = Number(valA) || 0;
          valB = Number(valB) || 0;
        } else if (typeof valA === 'string') {
          valA = valA.toLowerCase();
          valB = (valB || '').toLowerCase();
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return list;
  }, [rawRecords, statusFilter, sortField, sortOrder]);

  const handleSort = (field) => {
    if (sortField === field) {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else {
        setSortField('default');
        setSortOrder('asc');
      }
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

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
          Daftar rekapitulasi cuti pegawai terurut rapi berdasarkan status dan jadwal pelaksanaan
        </p>
      </div>

      {/* Live Active Cuti Widget */}
      <ActiveCutiWidget />

      {/* Filter, Search & Status Tabs */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--color-text-soft)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari nama pegawai atau tanggal cuti..."
              className="w-full rounded-xl border py-2.5 pl-10 pr-4 text-xs sm:text-sm font-heading bg-[color:var(--color-surface-elevated)] text-[color:var(--color-heading)] placeholder:text-[color:var(--color-text-soft)] focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              style={{ borderColor: 'var(--color-border)' }}
            />
          </div>
          {isAdmin && (
            <button
              onClick={handleRefresh}
              disabled={refreshCache.isPending}
              className="flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs sm:text-sm font-heading font-semibold text-[color:var(--color-text-muted)] hover:text-[color:var(--color-heading)] hover:bg-[color:var(--color-surface-muted)] transition-colors disabled:opacity-50"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
            >
              <RefreshCw size={14} className={refreshCache.isPending ? 'animate-spin' : ''} />
              <span>Refresh Data</span>
            </button>
          )}
        </div>

        {/* Status Filter Chips */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="inline-flex rounded-xl border p-1 bg-[color:var(--color-surface-muted)] overflow-x-auto max-w-full" style={{ borderColor: 'var(--color-border)' }}>
            {[
              { id: 'all', label: 'Semua Status' },
              { id: 'active', label: 'Sedang Cuti' },
              { id: 'upcoming', label: 'Akan Datang' },
              { id: 'completed', label: 'Selesai' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-heading font-semibold whitespace-nowrap transition-all ${
                  statusFilter === tab.id
                    ? 'bg-[color:var(--color-surface-strong)] text-[color:var(--color-heading)] shadow-xs border'
                    : 'text-[color:var(--color-text-soft)] hover:text-[color:var(--color-heading)]'
                }`}
                style={{ borderColor: statusFilter === tab.id ? 'var(--color-border)' : 'transparent' }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <p className="text-xs font-heading font-medium text-[color:var(--color-text-soft)]">
            {processedRecords.length} data cuti {statusFilter !== 'all' ? `(filter ${statusFilter})` : ''} {isFetching && !isLoading && <span className="text-amber-500 ml-1">• Memuat...</span>}
          </p>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border" style={{ borderColor: 'var(--color-border)' }}>
        <table className="w-full text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b text-[11px] uppercase tracking-wider text-[color:var(--color-text-soft)]" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-muted)' }}>
              <th
                onClick={() => handleSort('no')}
                className="px-4 py-3 font-heading font-semibold cursor-pointer hover:text-[color:var(--color-heading)] w-16"
              >
                <div className="flex items-center gap-1">
                  <span>No</span>
                  {sortField === 'no' ? (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} className="opacity-40" />}
                </div>
              </th>
              <th
                onClick={() => handleSort('namaPegawai')}
                className="px-4 py-3 font-heading font-semibold cursor-pointer hover:text-[color:var(--color-heading)]"
              >
                <div className="flex items-center gap-1">
                  <span>Nama Pegawai</span>
                  {sortField === 'namaPegawai' ? (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} className="opacity-40" />}
                </div>
              </th>
              <th
                onClick={() => handleSort('tanggalMulai')}
                className="px-4 py-3 font-heading font-semibold cursor-pointer hover:text-[color:var(--color-heading)]"
              >
                <div className="flex items-center gap-1">
                  <span>Tanggal Mulai</span>
                  {sortField === 'tanggalMulai' ? (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} className="opacity-40" />}
                </div>
              </th>
              <th
                onClick={() => handleSort('tanggalSelesai')}
                className="px-4 py-3 font-heading font-semibold cursor-pointer hover:text-[color:var(--color-heading)]"
              >
                <div className="flex items-center gap-1">
                  <span>Tanggal Selesai</span>
                  {sortField === 'tanggalSelesai' ? (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} className="opacity-40" />}
                </div>
              </th>
              <th
                onClick={() => handleSort('lamaCuti')}
                className="px-4 py-3 text-center font-heading font-semibold cursor-pointer hover:text-[color:var(--color-heading)]"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Lama Cuti</span>
                  {sortField === 'lamaCuti' ? (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} className="opacity-40" />}
                </div>
              </th>
              <th className="px-4 py-3 text-center font-heading font-semibold">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y text-xs sm:text-sm" style={{ borderColor: 'color-mix(in srgb, var(--color-border) 50%, transparent)' }}>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : processedRecords.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center">
                  <UserCheck size={36} className="mx-auto mb-2.5 text-[color:var(--color-text-soft)] opacity-40" />
                  <p className="font-heading font-semibold text-sm text-[color:var(--color-text-muted)]">Tidak ada data pegawai cuti</p>
                  <p className="text-xs text-[color:var(--color-text-soft)] mt-1">
                    {search || statusFilter !== 'all' ? 'Coba ubah kata kunci atau filter status' : 'Belum ada entri cuti yang terdaftar'}
                  </p>
                </td>
              </tr>
            ) : (
              processedRecords.map((r, i) => {
                const status = getLeaveStatus(r.tanggalMulai, r.tanggalSelesai);
                const StatusIcon = status.icon;

                return (
                  <tr
                    key={`${r.namaPegawai}-${r.tanggalMulai}-${i}`}
                    onClick={() => setSelectedRecord(r)}
                    className="transition-colors hover:bg-[color:var(--color-surface-muted)] cursor-pointer"
                  >
                    <td className="px-4 py-3.5 font-mono text-xs text-[color:var(--color-text-soft)]">{r.no || i + 1}</td>
                    <td className="px-4 py-3.5 font-heading font-bold text-[color:var(--color-heading)]">{r.namaPegawai}</td>
                    <td className="px-4 py-3.5 text-[color:var(--color-text-muted)] text-xs font-mono">{r.tanggalMulai}</td>
                    <td className="px-4 py-3.5 text-[color:var(--color-text-muted)] text-xs font-mono">{r.tanggalSelesai}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-md border bg-[color:var(--color-surface-muted)] text-xs font-bold text-[color:var(--color-heading)]" style={{ borderColor: 'var(--color-border)' }}>
                        {r.lamaCuti} Hari
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${status.color}`}>
                        <StatusIcon size={12} /> {status.label}
                      </span>
                    </td>
                  </tr>
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
        ) : processedRecords.length === 0 ? (
          <div className="text-center py-12">
            <UserCheck size={36} className="mx-auto mb-2 text-[color:var(--color-text-soft)] opacity-40" />
            <p className="font-heading font-semibold text-sm text-[color:var(--color-text-muted)]">Tidak ada data pegawai cuti</p>
          </div>
        ) : (
          processedRecords.map((r, i) => {
            const status = getLeaveStatus(r.tanggalMulai, r.tanggalSelesai);
            const StatusIcon = status.icon;

            return (
              <div
                key={`${r.namaPegawai}-${r.tanggalMulai}-${i}`}
                onClick={() => setSelectedRecord(r)}
                className="rounded-2xl border p-4 cursor-pointer hover:bg-[color:var(--color-surface-muted)] transition-colors"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-heading font-bold text-sm text-[color:var(--color-heading)]">{r.namaPegawai}</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${status.color}`}>
                    <StatusIcon size={10} /> {status.label}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3 text-xs text-[color:var(--color-text-soft)]">
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar size={12} /> {r.tanggalMulai} – {r.tanggalSelesai}
                  </span>
                  <span className="font-bold text-[color:var(--color-heading)]">{r.lamaCuti} hari</span>
                </div>
              </div>
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
            className="flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-heading font-semibold text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-muted)] disabled:opacity-30 transition-colors"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <span className="text-xs font-heading font-bold text-[color:var(--color-heading)]">{page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-heading font-semibold text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-muted)] disabled:opacity-30 transition-colors"
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
          <div className="space-y-4 text-xs sm:text-sm text-[color:var(--color-heading)]">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-[10px] font-semibold text-[color:var(--color-text-soft)] uppercase tracking-wider mb-1">Nama Pegawai</span>
                <p className="font-heading font-bold text-base">{selectedRecord.namaPegawai}</p>
              </div>
              <div>
                <span className="block text-[10px] font-semibold text-[color:var(--color-text-soft)] uppercase tracking-wider mb-1">Status Cuti</span>
                {(() => {
                  const status = getLeaveStatus(selectedRecord.tanggalMulai, selectedRecord.tanggalSelesai);
                  const StatusIcon = status.icon;
                  return (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium ${status.color}`}>
                      <StatusIcon size={12} /> {status.label}
                    </span>
                  );
                })()}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl border bg-[color:var(--color-surface)]" style={{ borderColor: 'var(--color-border)' }}>
              <div>
                <span className="block text-[10px] font-semibold text-[color:var(--color-text-soft)] uppercase tracking-wider mb-1">Mulai Cuti</span>
                <p className="text-xs font-mono font-semibold">{selectedRecord.tanggalMulai}</p>
              </div>
              <div>
                <span className="block text-[10px] font-semibold text-[color:var(--color-text-soft)] uppercase tracking-wider mb-1">Selesai Cuti</span>
                <p className="text-xs font-mono font-semibold">{selectedRecord.tanggalSelesai}</p>
              </div>
              <div>
                <span className="block text-[10px] font-semibold text-[color:var(--color-text-soft)] uppercase tracking-wider mb-1">Total Durasi</span>
                <p className="text-xs font-bold text-[color:var(--color-heading)]">{selectedRecord.lamaCuti} Hari</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
