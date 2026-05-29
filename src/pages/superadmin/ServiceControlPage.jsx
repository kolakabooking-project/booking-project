import PageHeader from '../../components/ui/PageHeader';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Power, Shield, AlertTriangle, Clock } from 'lucide-react';
import useServiceControl from '../../hooks/useServiceControl';

export default function ServiceControlPage() {
  const { state, actions } = useServiceControl();
  const { status, loading, toggling, confirmTarget } = state;
  const { handleToggleConfirm, executeToggle, cancelToggle } = actions;

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
              onClick={() => handleToggleConfirm('kdo')}
              disabled={toggling}
              className={`w-full p-5 rounded-2xl font-heading font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-60 ${
                isKdoActive
                  ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-2 border-red-500/20 hover:bg-red-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-500/20 hover:bg-emerald-500/20'
              }`}
            >
              {toggling && confirmTarget === 'kdo' ? (
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
              onClick={() => handleToggleConfirm('room')}
              disabled={toggling}
              className={`w-full p-5 rounded-2xl font-heading font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-60 ${
                isRoomActive
                  ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-2 border-red-500/20 hover:bg-red-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-500/20 hover:bg-emerald-500/20'
              }`}
            >
              {toggling && confirmTarget === 'room' ? (
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

      <ConfirmDialog
        isOpen={!!confirmTarget}
        onClose={cancelToggle}
        onConfirm={executeToggle}
        title={`Konfirmasi ${confirmTarget === 'kdo' ? 'Booking KDO' : 'Booking Ruangan'}`}
        message={
          confirmTarget === 'kdo'
            ? `Apakah Anda yakin ingin ${isKdoActive ? 'menonaktifkan' : 'mengaktifkan'} layanan Booking KDO?`
            : `Apakah Anda yakin ingin ${isRoomActive ? 'menonaktifkan' : 'mengaktifkan'} layanan Booking Ruangan?`
        }
        confirmText="Ya, Lanjutkan"
        variant={
          (confirmTarget === 'kdo' && isKdoActive) || (confirmTarget === 'room' && isRoomActive)
            ? 'danger'
            : 'primary'
        }
      />
    </div>
  );
}
