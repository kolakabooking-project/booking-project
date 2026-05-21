import { useState, useEffect, useCallback } from 'react';
import { superadminApi } from '../../lib/api';
import { useLoading } from '../../contexts/LoadingContext';
import PageHeader from '../../components/ui/PageHeader';
import { Power, Shield, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function ServiceControlPage() {
  const { showLoading, hideLoading } = useLoading();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await superadminApi.getServiceStatus();
      setStatus(res.data);
    } catch {
      toast.error('Gagal memuat status layanan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const handleToggle = async () => {
    if (!status) return;
    const newActive = !status.active;
    
    setToggling(true);
    showLoading(newActive ? 'Mengaktifkan layanan Bookolaka...' : 'Menonaktifkan layanan Bookolaka...');
    try {
      const res = await superadminApi.toggleService(newActive);
      setStatus({ ...status, active: res.data.active, updatedAt: new Date().toISOString() });
      toast.success(newActive ? 'Layanan berhasil diaktifkan' : 'Layanan berhasil dinonaktifkan');
    } catch (err) {
      toast.error(err.message || 'Gagal mengubah status layanan');
    } finally {
      setToggling(false);
      hideLoading();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-djp-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isActive = status?.active;

  return (
    <div className="pb-10">
      <PageHeader title="Kontrol Layanan" subtitle="Kelola status operasional sistem Bookolaka." />

      {/* Main Control Card */}
      <div className="mt-6 max-w-lg mx-auto">
        <div className="rounded-3xl border overflow-hidden shadow-lg" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
          {/* Status Header */}
          <div className={`p-8 text-center ${isActive ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10' : 'bg-gradient-to-br from-red-500/10 to-orange-500/10'}`}>
            <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-4 transition-all ${isActive ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-red-500 shadow-lg shadow-red-500/30'}`}>
                <Power size={32} className="text-white" />
              </div>
            </div>
            <h2 className={`text-2xl font-heading font-extrabold ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {isActive ? 'Layanan Aktif' : 'Layanan Nonaktif'}
            </h2>
            <p className="text-sm text-[color:var(--color-text-soft)] mt-2">
              {isActive
                ? 'Semua pengguna dapat mengakses sistem dengan normal.'
                : 'Pengguna biasa dan admin akan melihat halaman maintenance.'}
            </p>
          </div>

          {/* Toggle Section */}
          <div className="p-6 space-y-6">
            {/* Big Toggle Button */}
            <button
              onClick={handleToggle}
              disabled={toggling}
              className={`w-full p-5 rounded-2xl font-heading font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-60 ${
                isActive
                  ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-2 border-red-500/20 hover:bg-red-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-500/20 hover:bg-emerald-500/20'
              }`}
            >
              {toggling ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Power size={22} />
              )}
              {isActive ? 'Nonaktifkan Layanan' : 'Aktifkan Layanan'}
            </button>

            {/* Info Cards */}
            {!isActive && (
              <div className="rounded-2xl p-4 bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Mode Maintenance Aktif</p>
                    <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                      Semua user dan admin yang login akan melihat halaman "Sistem Dalam Perbaikan". Hanya superadmin yang dapat mengakses sistem.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-2xl p-4" style={{ background: 'var(--color-surface-muted)' }}>
              <div className="flex items-start gap-3">
                <Shield size={16} className="text-djp-blue flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-[color:var(--color-heading)]">Catatan Keamanan</p>
                  <p className="text-xs text-[color:var(--color-text-soft)] mt-1">
                    Superadmin selalu dapat mengakses sistem terlepas dari status layanan. Semua toggle akan dicatat di log aktivitas.
                  </p>
                </div>
              </div>
            </div>

            {status?.updatedAt && (
              <div className="flex items-center justify-center gap-2 text-xs text-[color:var(--color-text-soft)]">
                <Clock size={12} />
                Terakhir diubah: {new Date(status.updatedAt).toLocaleString('id-ID')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
