import { useState, useEffect, useCallback } from 'react';
import { superadminApi } from '../../lib/api';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import { Search, Download, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { getActionMeta, ACTION_FILTER_OPTIONS, ACTION_CONFIG } from '../../utils/actionConfig';

export default function ActivityLogPage() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [action, setAction] = useState('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await superadminApi.getLogs({ action, search, startDate, endDate, page, limit: 10 });
      setLogs(res.data?.logs || []);
      setPagination(res.data?.pagination || { page: 1, total: 0, totalPages: 1 });
    } catch {
      toast.error('Gagal memuat log aktivitas');
    } finally {
      setLoading(false);
    }
  }, [action, search, startDate, endDate, page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [action, search, startDate, endDate]);

  // Export to Excel (CSV)
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await superadminApi.exportLogs(startDate, endDate);
      const data = res.data || [];

      if (data.length === 0) {
        toast.error('Tidak ada data untuk diekspor');
        return;
      }

      // Build CSV
      const headers = ['Tanggal', 'Waktu', 'User', 'Aksi', 'Target', 'Detail', 'IP'];
      const rows = data.map((log) => [
        new Date(log.createdAt).toLocaleDateString('id-ID'),
        new Date(log.createdAt).toLocaleTimeString('id-ID'),
        log.userName,
        getActionMeta(log.action).label,
        log.targetName || '-',
        (log.detail || '-').replace(/,/g, ';'),
        log.ipAddress || '-',
      ]);

      const csv = [headers.join(','), ...rows.map((r) => r.map(c => `"${c}"`).join(','))].join('\n');
      const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
      const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      a.download = `log_aktivitas_${dateStr}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${data.length} log berhasil diekspor`);
    } catch (err) {
      toast.error('Gagal mengekspor log');
    } finally {
      setExporting(false);
    }
  };

  // Group logs by date
  const groupedLogs = logs.reduce((groups, log) => {
    const date = new Date(log.createdAt).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (!groups[date]) groups[date] = [];
    groups[date].push(log);
    return groups;
  }, {});

  return (
    <div className="pb-10">
      <PageHeader title="Log Aktivitas" subtitle="Pantau semua aktivitas sistem secara real-time." />

      {/* Filter Bar */}
      <div className="mt-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--color-text-soft)]" />
            <input
              type="text"
              placeholder="Cari nama user atau detail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control pl-11 pr-4 py-3"
            />
          </div>
          <select value={action} onChange={(e) => setAction(e.target.value)} className="form-control py-3 w-full sm:w-56">
            <option value="">Semua Aktivitas</option>
            <optgroup label="Autentikasi">
              {ACTION_FILTER_OPTIONS.filter(o => ['LOGIN','LOGOUT','PASSWORD_CHANGED'].includes(o.value)).map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </optgroup>
            <optgroup label="Booking — User">
              {ACTION_FILTER_OPTIONS.filter(o => ['BOOKING_CREATED','BOOKING_CANCELLED','BOOKING_REVIEW'].includes(o.value)).map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </optgroup>
            <optgroup label="Booking — Admin">
              {ACTION_FILTER_OPTIONS.filter(o => ['BOOKING_APPROVED','BOOKING_REJECTED','BOOKING_MANDATORY','BOOKING_STARTED','BOOKING_COMPLETED'].includes(o.value)).map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </optgroup>
            <optgroup label="Fleet Management">
              {ACTION_FILTER_OPTIONS.filter(o => o.value.startsWith('VEHICLE_') || o.value.startsWith('DRIVER_')).map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </optgroup>
            <optgroup label="Superadmin">
              {ACTION_FILTER_OPTIONS.filter(o => o.value.startsWith('ACCOUNT_') || ['SERVICE_TOGGLED','PROFILE_UPDATED'].includes(o.value)).map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </optgroup>
          </select>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="flex items-center gap-2 flex-1">
            <Calendar size={14} className="text-[color:var(--color-text-soft)] flex-shrink-0" />
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="form-control py-2.5 text-sm flex-1" />
            <span className="text-xs text-[color:var(--color-text-soft)]">s/d</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="form-control py-2.5 text-sm flex-1" />
          </div>
          <Button onClick={handleExport} loading={exporting} variant="secondary" className="flex items-center gap-2">
            <Download size={14} />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-3 border-djp-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : Object.keys(groupedLogs).length === 0 ? (
          <div className="rounded-2xl border p-12 text-center" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
            <p className="text-[color:var(--color-text-soft)]">Tidak ada log untuk filter yang dipilih</p>
          </div>
        ) : (
          Object.entries(groupedLogs).map(([date, dateLogs]) => (
            <div key={date} className="mb-6">
              <div className="sticky top-[4.5rem] z-10 py-2" style={{ background: 'var(--color-bg-main)' }}>
                <span className="inline-block px-3 py-1.5 rounded-xl text-xs font-bold text-[color:var(--color-text-soft)] border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
                  {date}
                </span>
              </div>
              <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
                {dateLogs.map((log, i) => {
                  const meta = getActionMeta(log.action);
                  const IconComponent = meta.icon;
                  return (
                    <div key={log.id} className={`flex items-start gap-3 p-4 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02] ${i < dateLogs.length - 1 ? 'border-b' : ''}`} style={{ borderColor: 'var(--color-border)' }}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.bgClass}`}>
                        <IconComponent size={16} strokeWidth={2} className={meta.iconClass} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${meta.badgeClass}`}>{meta.label}</span>
                          <span className="text-[10px] text-[color:var(--color-text-soft)] tabular-nums">
                            {new Date(log.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-[color:var(--color-heading)] mt-1">
                          {log.userName}
                          {log.targetName && <span className="text-[color:var(--color-text-soft)] font-normal"> → {log.targetName}</span>}
                        </p>
                        {log.detail && (
                          <p className="text-xs text-[color:var(--color-text-muted)] mt-1 line-clamp-2">{log.detail}</p>
                        )}
                      </div>
                      {log.ipAddress && (
                        <span className="text-[9px] font-mono text-[color:var(--color-text-soft)] flex-shrink-0 hidden sm:block opacity-60">
                          {log.ipAddress}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-xs text-[color:var(--color-text-soft)]">
            Menampilkan halaman {page} dari {pagination.totalPages} (Total {pagination.total} log)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(Math.max(1, page - 1))}
              className="text-xs py-1.5 px-3"
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
              className="text-xs py-1.5 px-3"
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}

      <p className="mt-3 text-xs text-[color:var(--color-text-soft)] text-center">
        Log disimpan selama 31 hari. Gunakan Export Excel untuk backup sebelum data otomatis terhapus.
      </p>
    </div>
  );
}
