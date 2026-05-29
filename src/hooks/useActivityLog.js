import { useState, useCallback, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { superadminApi } from '../lib/api';
import useDebouncedValue from './useDebouncedValue';
import useServerPagination from './useServerPagination';
import { getActionMeta } from '../utils/actionConfig';

export default function useActivityLog() {
  const [action, setAction] = useState('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exporting, setExporting] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 350);

  const fetchLogsFn = useCallback(async (page, filters, signal) => {
    // getLogs API does not take a signal in its definition right now, but we pass it anyway.
    // If api.js is updated, it can use the signal.
    const res = await superadminApi.getLogs({
      action: filters.action || undefined,
      search: filters.search || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      page,
      limit: 10,
    });
    return res;
  }, []);

  const filters = useMemo(() => ({
    action,
    search: debouncedSearch,
    startDate,
    endDate
  }), [action, debouncedSearch, startDate, endDate]);

  const {
    data: logs,
    loading,
    currentPage: page,
    totalItems: total,
    totalPages,
    handlePageChange,
    applyFilters
  } = useServerPagination(fetchLogsFn, filters);

  // Apply filters when debounced search or other filters change
  useEffect(() => {
    applyFilters(filters);
  }, [filters, applyFilters]);

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

      // Build CSV with CSV injection protection
      const headers = ['Tanggal', 'Waktu', 'User', 'Aksi', 'Target', 'Detail', 'IP'];
      const rows = data.map((log) => {
        // Sanitize field to prevent CSV formula injection
        const sanitizeCsv = (val) => {
          if (!val) return '-';
          let str = String(val);
          if (str.startsWith('=') || str.startsWith('+') || str.startsWith('-') || str.startsWith('@')) {
            str = "'" + str; // Prefix with single quote
          }
          return str.replace(/,/g, ';'); // Replace commas to avoid breaking CSV columns
        };

        return [
          new Date(log.createdAt).toLocaleDateString('id-ID'),
          new Date(log.createdAt).toLocaleTimeString('id-ID'),
          sanitizeCsv(log.userName),
          getActionMeta(log.action).label,
          sanitizeCsv(log.targetName),
          sanitizeCsv(log.detail),
          log.ipAddress || '-',
        ];
      });

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
  const groupedLogs = useMemo(() => {
    return logs.reduce((groups, log) => {
      const date = new Date(log.createdAt).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      if (!groups[date]) groups[date] = [];
      groups[date].push(log);
      return groups;
    }, {});
  }, [logs]);

  return {
    state: {
      logs, loading, exporting,
      action, search, startDate, endDate,
      page, total, totalPages,
      groupedLogs
    },
    actions: {
      setAction, setSearch, setStartDate, setEndDate,
      handlePageChange, handleExport
    }
  };
}
