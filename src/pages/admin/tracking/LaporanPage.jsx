import { useState, useMemo } from 'react';
import { useSPDSummary, useSPDRankings, useRefreshCache } from '../../../hooks/useSheetData';
import {
  FileText, Calendar, MapPin, CheckCircle,
  ChevronRight, Search, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLoading } from '../../../contexts/LoadingContext';
import { toast } from 'sonner';
import Modal from '../../../components/ui/Modal';
import { getInitials } from '../../../utils/helpers';

const STAT_CONFIG = [
  { key: 'totalSpd', label: 'Total SPD', icon: FileText },
  { key: 'totalHariPerjalanan', label: 'Total Hari Perjalanan', icon: Calendar },
  { key: 'jumlahWilayah', label: 'Wilayah Tujuan', icon: MapPin },
  { key: 'inputSikkaSelesai', label: 'Input SIKKA Selesai', icon: CheckCircle },
];

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border p-5 space-y-3" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 rounded bg-[color:var(--color-surface-muted)]" />
        <div className="h-9 w-9 rounded-xl bg-[color:var(--color-surface-muted)]" />
      </div>
      <div className="h-8 w-20 rounded bg-[color:var(--color-surface-muted)]" />
    </div>
  );
}

function SkeletonPodium() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-52 rounded-2xl border p-5 space-y-4" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
          <div className="h-4 w-1/4 rounded bg-[color:var(--color-surface-muted)]" />
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-[color:var(--color-surface-muted)]" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-3/4 rounded bg-[color:var(--color-surface-muted)]" />
              <div className="h-3 w-1/2 rounded bg-[color:var(--color-surface-muted)]" />
            </div>
          </div>
          <div className="h-16 rounded-xl bg-[color:var(--color-surface-muted)]" />
        </div>
      ))}
    </div>
  );
}

export default function LaporanPage() {
  const { data: summaryData, isLoading: isSummaryLoading } = useSPDSummary();
  const refreshCache = useRefreshCache();
  const { showLoading, hideLoading } = useLoading();

  // Filters for Rankings
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [startMonth, setStartMonth] = useState('');
  const [endMonth, setEndMonth] = useState('');
  const [activePreset, setActivePreset] = useState('all'); // 'all', 'q1', 'q2', 'q3', 'q4', 'custom'

  // Modal detail
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [modalSearch, setModalSearch] = useState('');
  const [showAllRankings, setShowAllRankings] = useState(false);

  const rankingsParams = useMemo(() => {
    const p = { year: selectedYear };
    if (startMonth) p.startMonth = parseInt(startMonth, 10);
    if (endMonth) p.endMonth = parseInt(endMonth, 10);
    return p;
  }, [selectedYear, startMonth, endMonth]);

  const { data: rankingsData, isLoading: isRankingsLoading } = useSPDRankings(rankingsParams);

  const rankings = rankingsData?.rankings || [];
  const top3 = rankings.slice(0, 3);
  const others = rankings.slice(3);
  const availableYears = rankingsData?.availableYears || [new Date().getFullYear()];

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

  const handlePresetChange = (preset) => {
    setActivePreset(preset);
    if (preset === 'all') {
      setStartMonth('');
      setEndMonth('');
    } else if (preset === 'q1') {
      setStartMonth('1');
      setEndMonth('3');
    } else if (preset === 'q2') {
      setStartMonth('4');
      setEndMonth('6');
    } else if (preset === 'q3') {
      setStartMonth('7');
      setEndMonth('9');
    } else if (preset === 'q4') {
      setStartMonth('10');
      setEndMonth('12');
    }
  };

  const filteredModalSpdList = useMemo(() => {
    if (!selectedEmployee) return [];
    if (!modalSearch.trim()) return selectedEmployee.spdList;
    const q = modalSearch.toLowerCase().trim();
    return selectedEmployee.spdList.filter(
      (s) =>
        s.perihalTugas?.toLowerCase().includes(q) ||
        s.wilayahTugas?.toLowerCase().includes(q) ||
        s.nomorST?.toLowerCase().includes(q) ||
        String(s.nomorSpd).includes(q)
    );
  }, [selectedEmployee, modalSearch]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-[color:var(--color-heading)]">Laporan SPD</h1>
          <p className="text-sm text-[color:var(--color-text-soft)] mt-1">
            Ringkasan data perjalanan dinas dan frekuensi penugasan pegawai
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshCache.isPending}
          className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-xs font-heading font-semibold text-[color:var(--color-text-muted)] hover:text-[color:var(--color-heading)] hover:bg-[color:var(--color-surface-muted)] transition-colors disabled:opacity-50 self-start sm:self-auto"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
        >
          <RefreshCw size={14} className={refreshCache.isPending ? 'animate-spin' : ''} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isSummaryLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          STAT_CONFIG.map((stat) => {
            const Icon = stat.icon;
            const value = summaryData?.[stat.key] ?? 0;
            return (
              <div
                key={stat.key}
                className="rounded-2xl border p-5"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-heading font-semibold text-[color:var(--color-text-soft)] uppercase tracking-wider">{stat.label}</p>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--color-surface-muted)] text-[color:var(--color-text-muted)] border" style={{ borderColor: 'var(--color-border)' }}>
                    <Icon size={16} />
                  </div>
                </div>
                <p className="text-3xl font-heading font-bold text-[color:var(--color-heading)]">
                  {value.toLocaleString('id-ID')}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* ─── Top 3 Pegawai Teraktif SPD Section ─── */}
      <div
        className="rounded-2xl border p-6 space-y-6"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
      >
        {/* Section Title & Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div>
            <h2 className="text-lg font-heading font-bold text-[color:var(--color-heading)]">
              Frekuensi SPD Pegawai Tertinggi
            </h2>
            <p className="text-xs text-[color:var(--color-text-soft)] mt-1">
              Top 3 pegawai dengan jumlah pelaksanaan perjalanan dinas terbanyak
            </p>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Year Selector */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="rounded-lg border px-3 py-1.5 text-xs font-heading font-semibold bg-[color:var(--color-surface)] text-[color:var(--color-heading)] focus:outline-none"
              style={{ borderColor: 'var(--color-border)' }}
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>

            {/* Presets Pills */}
            <div className="inline-flex rounded-lg border p-0.5 bg-[color:var(--color-surface-muted)] overflow-x-auto max-w-full" style={{ borderColor: 'var(--color-border)' }}>
              {[
                { id: 'all', label: 'Semua' },
                { id: 'q1', label: 'Q1 (Jan-Mar)' },
                { id: 'q2', label: 'Q2 (Apr-Jun)' },
                { id: 'q3', label: 'Q3 (Jul-Sep)' },
                { id: 'q4', label: 'Q4 (Okt-Des)' },
                { id: 'custom', label: 'Rentang' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePresetChange(p.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-heading font-semibold whitespace-nowrap transition-all ${
                    activePreset === p.id
                      ? 'bg-[color:var(--color-surface-strong)] text-[color:var(--color-heading)] shadow-xs border'
                      : 'text-[color:var(--color-text-soft)] hover:text-[color:var(--color-heading)]'
                  }`}
                  style={{ borderColor: activePreset === p.id ? 'var(--color-border)' : 'transparent' }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom Range Dropdowns */}
            {activePreset === 'custom' && (
              <div className="flex items-center gap-1.5">
                <select
                  value={startMonth}
                  onChange={(e) => setStartMonth(e.target.value)}
                  className="rounded-lg border px-2.5 py-1.5 text-xs font-heading font-medium bg-[color:var(--color-surface)] text-[color:var(--color-heading)]"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <option value="">Bulan Awal</option>
                  {MONTH_NAMES.map((m, idx) => (
                    <option key={idx + 1} value={idx + 1}>{m}</option>
                  ))}
                </select>
                <span className="text-xs text-[color:var(--color-text-soft)]">–</span>
                <select
                  value={endMonth}
                  onChange={(e) => setEndMonth(e.target.value)}
                  className="rounded-lg border px-2.5 py-1.5 text-xs font-heading font-medium bg-[color:var(--color-surface)] text-[color:var(--color-heading)]"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <option value="">Bulan Akhir</option>
                  {MONTH_NAMES.map((m, idx) => (
                    <option key={idx + 1} value={idx + 1}>{m}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Top 3 Cards */}
        {isRankingsLoading ? (
          <SkeletonPodium />
        ) : top3.length === 0 ? (
          <div className="py-12 text-center text-xs text-[color:var(--color-text-soft)]">
            Tidak ada data SPD pada periode yang dipilih.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
            {top3.map((emp) => (
              <div
                key={emp.namaPegawai}
                onClick={() => {
                  setSelectedEmployee(emp);
                  setModalSearch('');
                }}
                className="rounded-2xl border p-5 flex flex-col justify-between cursor-pointer transition-all hover:border-[color:var(--color-heading)]/40 hover:shadow-sm"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
              >
                <div>
                  {/* Rank & Subtitle */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md border bg-[color:var(--color-surface-muted)] text-[color:var(--color-heading)]" style={{ borderColor: 'var(--color-border)' }}>
                      #{String(emp.rank).padStart(2, '0')}
                    </span>
                    <span className="text-[11px] font-heading font-medium text-[color:var(--color-text-soft)]">
                      {emp.spdList.length} penugasan
                    </span>
                  </div>

                  {/* Profile Name & Initial */}
                  <div className="flex items-center gap-3 my-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl font-heading font-bold text-xs bg-[color:var(--color-surface-muted)] text-[color:var(--color-heading)] border shrink-0" style={{ borderColor: 'var(--color-border)' }}>
                      {getInitials(emp.namaPegawai)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-heading font-bold text-sm text-[color:var(--color-heading)] truncate" title={emp.namaPegawai}>
                        {emp.namaPegawai}
                      </h3>
                      <p className="text-xs text-[color:var(--color-text-soft)] truncate mt-0.5">
                        {emp.wilayahList.slice(0, 2).join(', ')}{emp.wilayahList.length > 2 ? ` +${emp.wilayahList.length - 2} wilayah` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Metrics Box */}
                  <div className="grid grid-cols-2 gap-2 mt-4 p-3 rounded-xl border bg-[color:var(--color-surface-muted)]" style={{ borderColor: 'var(--color-border)' }}>
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--color-text-soft)] block">Total SPD</span>
                      <p className="text-lg font-heading font-bold text-[color:var(--color-heading)] mt-0.5">
                        {emp.totalSpd} <span className="text-xs font-normal text-[color:var(--color-text-soft)]">kali</span>
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--color-text-soft)] block">Total Hari</span>
                      <p className="text-lg font-heading font-bold text-[color:var(--color-heading)] mt-0.5">
                        {emp.totalHari} <span className="text-xs font-normal text-[color:var(--color-text-soft)]">hari</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs font-heading font-semibold text-[color:var(--color-text-muted)] hover:text-[color:var(--color-heading)] group" style={{ borderColor: 'var(--color-border)' }}>
                  <span>Lihat Riwayat SPD</span>
                  <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Expand / Collapse Peringkat Lainnya */}
        {others.length > 0 && (
          <div className="pt-2">
            <button
              onClick={() => setShowAllRankings(!showAllRankings)}
              className="flex items-center gap-1.5 text-xs font-heading font-semibold text-[color:var(--color-text-soft)] hover:text-[color:var(--color-heading)] transition-colors py-1.5"
            >
              <span>{showAllRankings ? 'Sembunyikan daftar lainnya' : `Tampilkan peringkat lainnya (${others.length} pegawai)`}</span>
              {showAllRankings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            <AnimatePresence>
              {showAllRankings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 overflow-hidden rounded-xl border overflow-x-auto"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <table className="w-full text-left text-xs min-w-[600px]">
                    <thead className="border-b" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-muted)' }}>
                      <tr>
                        <th className="px-4 py-2.5 font-heading font-semibold text-[color:var(--color-text-soft)] w-16">No</th>
                        <th className="px-4 py-2.5 font-heading font-semibold text-[color:var(--color-text-soft)]">Nama Pegawai</th>
                        <th className="px-4 py-2.5 font-heading font-semibold text-[color:var(--color-text-soft)]">Wilayah Tujuan</th>
                        <th className="px-4 py-2.5 text-center font-heading font-semibold text-[color:var(--color-text-soft)]">Total SPD</th>
                        <th className="px-4 py-2.5 text-center font-heading font-semibold text-[color:var(--color-text-soft)]">Total Hari</th>
                        <th className="px-4 py-2.5 text-right font-heading font-semibold text-[color:var(--color-text-soft)]">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                      {others.map((emp) => (
                        <tr
                          key={emp.namaPegawai}
                          onClick={() => {
                            setSelectedEmployee(emp);
                            setModalSearch('');
                          }}
                          className="hover:bg-[color:var(--color-surface-muted)] cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-2.5 font-mono text-[color:var(--color-text-soft)]">#{String(emp.rank).padStart(2, '0')}</td>
                          <td className="px-4 py-2.5 font-heading font-semibold text-[color:var(--color-heading)]">{emp.namaPegawai}</td>
                          <td className="px-4 py-2.5 text-[color:var(--color-text-soft)]">{emp.wilayahList.slice(0, 3).join(', ') || '—'}</td>
                          <td className="px-4 py-2.5 text-center font-heading font-bold text-[color:var(--color-heading)]">{emp.totalSpd}</td>
                          <td className="px-4 py-2.5 text-center text-[color:var(--color-text-muted)]">{emp.totalHari} hari</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-[color:var(--color-text-muted)]">Lihat ➔</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ─── Detail SPD Modal ─── */}
      <Modal
        isOpen={!!selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        title={selectedEmployee ? `Daftar SPD: ${selectedEmployee.namaPegawai}` : 'Detail SPD'}
        size="lg"
      >
        {selectedEmployee && (
          <div className="space-y-4">
            {/* Header Summary */}
            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl border bg-[color:var(--color-surface-muted)]" style={{ borderColor: 'var(--color-border)' }}>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--color-text-soft)]">Peringkat</span>
                <p className="text-base font-heading font-bold text-[color:var(--color-heading)]">
                  #{String(selectedEmployee.rank).padStart(2, '0')}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--color-text-soft)]">Total SPD</span>
                <p className="text-base font-heading font-bold text-[color:var(--color-heading)]">
                  {selectedEmployee.totalSpd} Penugasan
                </p>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--color-text-soft)]">Total Hari</span>
                <p className="text-base font-heading font-bold text-[color:var(--color-heading)]">
                  {selectedEmployee.totalHari} Hari
                </p>
              </div>
            </div>

            {/* Search filter in modal */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-text-soft)]" />
              <input
                type="text"
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                placeholder="Cari perihal, nomor ST, nomor SPD, wilayah..."
                className="w-full rounded-xl border py-2 pl-9 pr-3 text-xs font-heading bg-[color:var(--color-surface)] text-[color:var(--color-heading)] placeholder:text-[color:var(--color-text-soft)] focus:outline-none"
                style={{ borderColor: 'var(--color-border)' }}
              />
            </div>

            {/* List of SPDs */}
            <div className="max-h-96 overflow-y-auto space-y-2.5 pr-1">
              {filteredModalSpdList.length === 0 ? (
                <p className="py-8 text-center text-xs text-[color:var(--color-text-soft)]">Tidak ada SPD yang cocok dengan pencarian.</p>
              ) : (
                filteredModalSpdList.map((spd, idx) => (
                  <div
                    key={`${spd.nomorSpd}-${idx}`}
                    className="rounded-xl border p-3.5 hover:bg-[color:var(--color-surface-muted)] transition-colors"
                    style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[color:var(--color-heading)]">
                          SPD #{spd.nomorSpd || idx + 1}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-md border font-medium bg-[color:var(--color-surface-muted)] text-[color:var(--color-text-muted)]" style={{ borderColor: 'var(--color-border)' }}>
                          {spd.wilayahTugas || '—'}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-[color:var(--color-text-soft)]">
                        {spd.jumlahHariSpd || `${spd.jumlahHariSpdNumeric} Hari`}
                      </span>
                    </div>

                    <p className="font-heading font-medium text-xs text-[color:var(--color-heading)] mt-2">
                      {spd.perihalTugas || '—'}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2.5 pt-2 border-t text-[11px] text-[color:var(--color-text-soft)]" style={{ borderColor: 'var(--color-border)' }}>
                      <div>
                        <span className="font-medium text-[color:var(--color-text-muted)]">No. ST:</span> {spd.nomorST || '—'}
                      </div>
                      <div>
                        <span className="font-medium text-[color:var(--color-text-muted)]">Periode:</span> {spd.tanggalMulai || '—'} s/d {spd.tanggalAkhir || '—'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
