import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Building2, Home, RefreshCw } from 'lucide-react';
import { useJadwalJumat, useRefreshCache } from '../../../hooks/useSheetData';
import { useAuth } from '../../../contexts/AuthContext';
import { useLoading } from '../../../contexts/LoadingContext';
import { toast } from 'sonner';

export default function JadwalJumatPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('Semua'); // 'Semua', 'WFO', 'WFH'

  const { data: result, isLoading, isError } = useJadwalJumat({
    search: searchTerm,
    page: 1,
    limit: 1000 // Get all for easy client-side tab filtering
  });

  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const refreshCache = useRefreshCache();
  const { showLoading, hideLoading } = useLoading();

  const allData = result?.data || [];

  const handleRefresh = async () => {
    try {
      showLoading('Memperbarui data jadwal...');
      await refreshCache.mutateAsync();
      toast.success('Data jadwal berhasil di-refresh dari Google Sheets');
    } catch {
      toast.error('Gagal me-refresh data');
    } finally {
      hideLoading();
    }
  };

  // Filter based on active tab
  const filteredData = allData.filter((item) => {
    if (activeTab === 'Semua') return true;
    return item.tipe === activeTab;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-heading font-bold text-[color:var(--color-heading)]">Jadwal Jumat</h1>
        <p className="text-sm text-[color:var(--color-text-soft)] mt-1">
          Daftar jadwal Work From Office (WFO) dan Work From Home (WFH) hari Jumat.
        </p>
      </div>

      <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
          <div className="flex bg-[color:var(--color-surface-muted)] p-1 rounded-xl w-full sm:w-auto">
            {['Semua', 'WFO', 'WFH'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === tab 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'text-[color:var(--color-text-muted)] hover:text-[color:var(--color-heading)]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          
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
          
          {isAdmin && (
            <button
              onClick={handleRefresh}
              disabled={refreshCache.isPending}
              className="flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-heading font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors disabled:opacity-50 w-full sm:w-auto mt-4 sm:mt-0"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <RefreshCw size={16} className={refreshCache.isPending ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}
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
                        <div className="h-3 w-20 rounded bg-[color:var(--color-surface-muted)]" />
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
                    Tidak ada jadwal ditemukan.
                  </td>
                </tr>
              ) : (
                filteredData.map((item, index) => (
                  <motion.tr 
                    key={`${item.no}-${item.nip}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.05, 0.5) }}
                    className="hover:bg-[color:var(--color-surface-muted)]/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-[color:var(--color-text-soft)]">
                      {item.no}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-heading font-semibold text-[color:var(--color-heading)]">{item.nama}</div>
                      <div className="text-xs text-[color:var(--color-text-soft)] mt-0.5">{item.nip}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-[color:var(--color-text-main)]">{item.jabatan}</div>
                      <div className="text-xs text-[color:var(--color-text-soft)] mt-0.5">{item.pangkatGolongan}</div>
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
    </div>
  );
}
