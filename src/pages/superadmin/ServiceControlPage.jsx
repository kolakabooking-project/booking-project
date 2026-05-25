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

  const handleToggleKdo = async () => {
    if (!status) return;
    const newActive = !status.kdoActive;
    
    setToggling(true);
    showLoading(newActive ? 'Mengaktifkan layanan Booking KDO...' : 'Menonaktifkan layanan Booking KDO...');
    try {
      const res = await superadminApi.toggleService(newActive, undefined);
      setStatus({ ...status, kdoActive: res.data.kdoActive, updatedAt: res.data.updatedAt });
      toast.success(newActive ? 'Layanan Booking KDO diaktifkan' : 'Layanan Booking KDO dinonaktifkan');
    } catch (err) {
      toast.error(err.message || 'Gagal mengubah status layanan KDO');
    } finally {
      setToggling(false);
      hideLoading();
    }
  };

  const handleToggleRoom = async () => {
    if (!status) return;
    const newActive = !status.roomActive;
    
    setToggling(true);
    showLoading(newActive ? 'Mengaktifkan layanan Booking Ruangan...' : 'Menonaktifkan layanan Booking Ruangan...');
    try {
      const res = await superadminApi.toggleService(undefined, newActive);
      setStatus({ ...status, roomActive: res.data.roomActive, updatedAt: res.data.updatedAt });
      toast.success(newActive ? 'Layanan Booking Ruangan diaktifkan' : 'Layanan Booking Ruangan dinonaktifkan');
    } catch (err) {
      toast.error(err.message || 'Gagal mengubah status layanan Ruangan');
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

  const isKdoActive = status?.kdoActive;
  const isRoomActive = status?.roomActive;

  return (
    <div className="pb-10">
      <PageHeader title="Kontrol Layanan" subtitle="Kelola status operasional sistem Bookolaka secara independen per layanan." />

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-6xl mx-auto">
        
        {/* Booking KDO Control Card */}
        <div className="rounded-3xl border overflow-hidden shadow-lg" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
          <div className={`p-8 text-center ${isKdoActive ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10' : 'bg-gradient-to-br from-red-500/10 to-orange-500/10'}`}>
            <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-4 transition-all ${isKdoActive ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isKdoActive ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-red-500 shadow-lg shadow-red-500/30'}`}>
                <Power size={32} className="text-white" />
              </div>
            </div>
            <h2 className={`text-2xl font-heading font-extrabold ${isKdoActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              Booking KDO {isKdoActive ? 'Aktif' : 'Nonaktif'}
            </h2>
            <p className="text-sm text-[color:var(--color-text-soft)] mt-2">
              {isKdoActive
                ? 'Fitur Booking Kendaraan Dinas Operasional dapat diakses pengguna.'
                : 'Pengguna yang mencoba mengakses Booking KDO akan melihat peringatan maintenance.'}
            </p>
          </div>

          <div className="p-6 space-y-6">
            <button
              onClick={handleToggleKdo}
              disabled={toggling}
              className={`w-full p-5 rounded-2xl font-heading font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-60 ${
                isKdoActive
                  ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-2 border-red-500/20 hover:bg-red-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-500/20 hover:bg-emerald-500/20'
              }`}
            >
              {toggling ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Power size={22} />
              )}
              {isKdoActive ? 'Nonaktifkan Booking KDO' : 'Aktifkan Booking KDO'}
            </button>

            {!isKdoActive && (
              <div className="rounded-2xl p-4 bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Maintenance Aktif</p>
                    <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                      Akses menuju layanan KDO dicegah dari frontend maupun API untuk pengguna non-superadmin.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Booking Ruangan Control Card */}
        <div className="rounded-3xl border overflow-hidden shadow-lg" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
          <div className={`p-8 text-center ${isRoomActive ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10' : 'bg-gradient-to-br from-red-500/10 to-orange-500/10'}`}>
            <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-4 transition-all ${isRoomActive ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isRoomActive ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-red-500 shadow-lg shadow-red-500/30'}`}>
                <Power size={32} className="text-white" />
              </div>
            </div>
            <h2 className={`text-2xl font-heading font-extrabold ${isRoomActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              Booking Ruangan {isRoomActive ? 'Aktif' : 'Nonaktif'}
            </h2>
            <p className="text-sm text-[color:var(--color-text-soft)] mt-2">
              {isRoomActive
                ? 'Fitur Booking Ruangan dapat diakses oleh semua pengguna.'
                : 'Pengguna yang mencoba mengakses Booking Ruangan akan melihat peringatan maintenance.'}
            </p>
          </div>

          <div className="p-6 space-y-6">
            <button
              onClick={handleToggleRoom}
              disabled={toggling}
              className={`w-full p-5 rounded-2xl font-heading font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-60 ${
                isRoomActive
                  ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-2 border-red-500/20 hover:bg-red-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-500/20 hover:bg-emerald-500/20'
              }`}
            >
              {toggling ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Power size={22} />
              )}
              {isRoomActive ? 'Nonaktifkan Booking Ruangan' : 'Aktifkan Booking Ruangan'}
            </button>

            {!isRoomActive && (
              <div className="rounded-2xl p-4 bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Maintenance Aktif</p>
                    <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                      Akses menuju layanan Ruangan dicegah dari frontend maupun API untuk pengguna non-superadmin.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      <div className="mt-8 max-w-6xl mx-auto flex flex-col items-center">
        <div className="rounded-2xl p-4 max-w-lg w-full" style={{ background: 'var(--color-surface-muted)' }}>
          <div className="flex items-start gap-3">
            <Shield size={16} className="text-djp-blue flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-[color:var(--color-heading)]">Catatan Keamanan</p>
              <p className="text-xs text-[color:var(--color-text-soft)] mt-1">
                Superadmin selalu dapat mengakses seluruh sistem terlepas dari status layanannya.
              </p>
            </div>
          </div>
        </div>

        {status?.updatedAt && (
          <div className="flex items-center justify-center gap-2 text-xs text-[color:var(--color-text-soft)] mt-4">
            <Clock size={12} />
            Terakhir diubah: {new Date(status.updatedAt).toLocaleString('id-ID')}
          </div>
        )}
      </div>
    </div>
  );
}
