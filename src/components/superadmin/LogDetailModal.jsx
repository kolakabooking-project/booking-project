import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { getActionMeta } from '../../utils/actionConfig';
import { formatDate, formatDateShort, formatTime } from '../../utils/helpers';
import { superadminApi } from '../../lib/api';
import { 
  Calendar, 
  Clock, 
  Car, 
  User, 
  Users, 
  FileText, 
  Info, 
  Globe, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Building, 
  Phone, 
  ShieldCheck,
  Tag
} from 'lucide-react';

export default function LogDetailModal({ isOpen, onClose, logId, initialLog }) {
  const [loading, setLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    if (!isOpen || !logId) {
      setDetailData(null);
      setFetchError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setFetchError(null);

    superadminApi.getLogDetail(logId)
      .then((res) => {
        if (isMounted) {
          setDetailData(res.data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setFetchError(err.message || 'Gagal memuat detail log dari server');
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, logId]);

  if (!isOpen) return null;

  const currentLog = detailData?.log || initialLog || {};
  const meta = getActionMeta(currentLog.action);
  const IconComponent = meta.icon || Activity;
  const entityType = detailData?.entityType || 'general';
  const entityDetail = detailData?.entityDetail;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detail Log Aktivitas"
      size="lg"
    >
      <div className="space-y-6">
        {/* Header Summary Card */}
        <div
          className="rounded-2xl p-4 border"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-muted)' }}
        >
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.bgClass}`}>
              <IconComponent size={20} strokeWidth={2} className={meta.iconClass} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-md ${meta.badgeClass}`}>
                  {meta.label}
                </span>
                {currentLog.id && (
                  <span className="text-[11px] font-mono text-[color:var(--color-text-soft)]">
                    ID: #{currentLog.id.slice(0, 8)}
                  </span>
                )}
              </div>
              <p className="text-base font-heading font-bold text-[color:var(--color-heading)] mt-1.5">
                {currentLog.userName || '-'}
                {currentLog.targetName && (
                  <span className="text-[color:var(--color-text-soft)] font-normal"> → {currentLog.targetName}</span>
                )}
              </p>
              {currentLog.detail && (
                <p className="text-sm text-[color:var(--color-text-muted)] mt-1 break-words">
                  {currentLog.detail}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[color:var(--color-text-soft)]" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="flex-shrink-0" />
              <span>
                Waktu: {currentLog.createdAt ? `${formatDate(currentLog.createdAt)}, ${formatTime(currentLog.createdAt)}` : '-'}
              </span>
            </div>
            {currentLog.ipAddress && (
              <div className="flex items-center gap-1.5">
                <Globe size={14} className="flex-shrink-0" />
                <span>IP Address: <span className="font-mono">{currentLog.ipAddress}</span></span>
              </div>
            )}
          </div>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-[color:var(--color-text-soft)]">
            <div className="w-6 h-6 border-2 border-djp-blue border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Memuat data relasi entitas...</span>
          </div>
        )}

        {/* Fetch Error Notice */}
        {fetchError && !loading && (
          <div className="rounded-xl p-3.5 border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
            <Info size={16} className="flex-shrink-0 mt-0.5" />
            <p>{fetchError}. Menampilkan informasi historis log.</p>
          </div>
        )}

        {/* Domain Entity Detail Content */}
        {!loading && entityType === 'booking' && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Car size={16} className="text-[color:var(--color-text-soft)]" />
              <h4 className="text-sm font-heading font-bold text-[color:var(--color-heading)]">
                Rincian Peminjaman Kendaraan
              </h4>
            </div>

            {entityDetail ? (
              <div
                className="rounded-2xl p-4 sm:p-5 border space-y-4"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
              >
                {/* Status Bar */}
                <div className="flex items-center justify-between gap-2 pb-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <span className="text-xs font-medium text-[color:var(--color-text-soft)]">Status Terkini</span>
                  <Badge status={entityDetail.status} />
                </div>

                {/* Grid Informasi Peminjaman */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                  {/* Jadwal Pelaksanaan */}
                  <div>
                    <span className="text-[11px] font-semibold text-[color:var(--color-text-soft)] block uppercase tracking-wider">
                      Waktu Penggunaan
                    </span>
                    <p className="text-[color:var(--color-heading)] font-medium mt-1">
                      {formatDateShort(entityDetail.startTime)} s/d {formatDateShort(entityDetail.endTime)}
                    </p>
                    <p className="text-xs text-[color:var(--color-text-soft)] mt-0.5">
                      {formatTime(entityDetail.startTime)} - {formatTime(entityDetail.endTime)}
                    </p>
                  </div>

                  {/* Kendaraan */}
                  <div>
                    <span className="text-[11px] font-semibold text-[color:var(--color-text-soft)] block uppercase tracking-wider">
                      Kendaraan
                    </span>
                    <p className="text-[color:var(--color-heading)] font-semibold mt-1">
                      {entityDetail.vehicleName || `Jenis: ${entityDetail.jenisKendaraan || 'Mobil'} (Belum ditetapkan)`}
                    </p>
                  </div>

                  {/* Sopir */}
                  <div>
                    <span className="text-[11px] font-semibold text-[color:var(--color-text-soft)] block uppercase tracking-wider">
                      Sopir / Pengemudi
                    </span>
                    <p className="text-[color:var(--color-heading)] font-medium mt-1">
                      {entityDetail.driverName
                        ? entityDetail.driverName
                        : entityDetail.perluSopir
                        ? 'Memerlukan Sopir (Belum ditugaskan)'
                        : 'Tanpa Sopir (Lepas Kunci)'}
                    </p>
                  </div>

                  {/* Jumlah Penumpang */}
                  <div>
                    <span className="text-[11px] font-semibold text-[color:var(--color-text-soft)] block uppercase tracking-wider">
                      Jumlah Penumpang
                    </span>
                    <p className="text-[color:var(--color-heading)] font-medium mt-1">
                      {entityDetail.jumlahPenumpang || 1} orang
                    </p>
                  </div>

                  {/* Pemohon */}
                  <div className="sm:col-span-2">
                    <span className="text-[11px] font-semibold text-[color:var(--color-text-soft)] block uppercase tracking-wider">
                      Pemohon
                    </span>
                    <p className="text-[color:var(--color-heading)] font-medium mt-1">
                      {entityDetail.userName || currentLog.userName || '-'}
                    </p>
                  </div>

                  {/* Keperluan */}
                  <div className="sm:col-span-2">
                    <span className="text-[11px] font-semibold text-[color:var(--color-text-soft)] block uppercase tracking-wider">
                      Keperluan / Tujuan Perjalanan
                    </span>
                    <p className="text-[color:var(--color-heading)] font-medium mt-1 whitespace-pre-wrap">
                      {entityDetail.keperluan || '-'}
                    </p>
                  </div>

                  {/* Catatan Pengajuan */}
                  {entityDetail.catatan && (
                    <div className="sm:col-span-2 rounded-xl p-3 bg-black/[0.02] dark:bg-white/[0.02] border" style={{ borderColor: 'var(--color-border)' }}>
                      <span className="text-[11px] font-semibold text-[color:var(--color-text-soft)] block">
                        Catatan Pengajuan:
                      </span>
                      <p className="text-xs text-[color:var(--color-heading)] mt-0.5">
                        {entityDetail.catatan}
                      </p>
                    </div>
                  )}

                  {/* Alasan Penolakan */}
                  {entityDetail.alasanPenolakan && (
                    <div className="sm:col-span-2 rounded-xl p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30">
                      <span className="text-[11px] font-semibold text-red-700 dark:text-red-400 block">
                        Alasan Penolakan:
                      </span>
                      <p className="text-xs text-red-900 dark:text-red-300 mt-0.5">
                        {entityDetail.alasanPenolakan}
                      </p>
                    </div>
                  )}

                  {/* Ulasan / Review Pasca Perjalanan */}
                  {entityDetail.reviewNotes && (
                    <div className="sm:col-span-2 rounded-xl p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/30">
                      <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-400 block">
                        Catatan Penggunaan / Ulasan:
                      </span>
                      <p className="text-xs text-purple-900 dark:text-purple-300 mt-0.5">
                        {entityDetail.reviewNotes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div
                className="rounded-2xl p-4 border flex items-start gap-3"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
              >
                <Info size={18} className="text-[color:var(--color-text-soft)] flex-shrink-0 mt-0.5" />
                <div className="text-xs text-[color:var(--color-text-muted)] space-y-1">
                  <p className="font-semibold text-[color:var(--color-heading)]">Data Master Tidak Tersedia</p>
                  <p>
                    Data peminjaman asli dengan ID <span className="font-mono">{currentLog.targetId}</span> sudah tidak ditemukan di database (kemungkinan telah dibersihkan atau di-reset). Informasi historis yang tercatat pada log tetap tersimpan di atas.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Domain Entity Detail for Room Booking */}
        {!loading && entityType === 'room_booking' && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Building size={16} className="text-[color:var(--color-text-soft)]" />
              <h4 className="text-sm font-heading font-bold text-[color:var(--color-heading)]">
                Rincian Peminjaman Ruangan
              </h4>
            </div>

            {entityDetail ? (
              <div
                className="rounded-2xl p-4 sm:p-5 border space-y-4"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
              >
                <div className="flex items-center justify-between gap-2 pb-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <span className="text-xs font-medium text-[color:var(--color-text-soft)]">Status Ruangan</span>
                  <Badge status={entityDetail.status} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div>
                    <span className="text-[11px] font-semibold text-[color:var(--color-text-soft)] block uppercase tracking-wider">
                      Ruangan
                    </span>
                    <p className="text-[color:var(--color-heading)] font-semibold mt-1">
                      {entityDetail.roomName || '-'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-[color:var(--color-text-soft)] block uppercase tracking-wider">
                      Peserta
                    </span>
                    <p className="text-[color:var(--color-heading)] font-medium mt-1">
                      {entityDetail.jumlahPeserta || '-'} orang
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-[11px] font-semibold text-[color:var(--color-text-soft)] block uppercase tracking-wider">
                      Jadwal Pemakaian
                    </span>
                    <p className="text-[color:var(--color-heading)] font-medium mt-1">
                      {formatDateShort(entityDetail.startTime)} ({formatTime(entityDetail.startTime)} - {formatTime(entityDetail.endTime)})
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-[11px] font-semibold text-[color:var(--color-text-soft)] block uppercase tracking-wider">
                      Keperluan Acara
                    </span>
                    <p className="text-[color:var(--color-heading)] font-medium mt-1">
                      {entityDetail.keperluan || '-'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="rounded-2xl p-4 border flex items-start gap-3"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
              >
                <Info size={18} className="text-[color:var(--color-text-soft)] flex-shrink-0 mt-0.5" />
                <div className="text-xs text-[color:var(--color-text-muted)]">
                  <p className="font-semibold text-[color:var(--color-heading)]">Data Master Ruangan Tidak Tersedia</p>
                  <p className="mt-0.5">Data peminjaman ruangan asli sudah tidak ditemukan di database.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Domain Entity Detail for User */}
        {!loading && entityType === 'user' && entityDetail && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <User size={16} className="text-[color:var(--color-text-soft)]" />
              <h4 className="text-sm font-heading font-bold text-[color:var(--color-heading)]">
                Rincian Akun Pegawai
              </h4>
            </div>

            <div
              className="rounded-2xl p-4 border grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
            >
              <div>
                <span className="text-[11px] font-semibold text-[color:var(--color-text-soft)] block">Nama Pegawai</span>
                <p className="text-[color:var(--color-heading)] font-semibold mt-0.5">{entityDetail.name}</p>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-[color:var(--color-text-soft)] block">NIP</span>
                <p className="text-[color:var(--color-heading)] font-mono mt-0.5">{entityDetail.nip || '-'}</p>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-[color:var(--color-text-soft)] block">Jabatan</span>
                <p className="text-[color:var(--color-heading)] mt-0.5">{entityDetail.jabatan || '-'}</p>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-[color:var(--color-text-soft)] block">Role Akses</span>
                <p className="text-[color:var(--color-heading)] font-semibold capitalize mt-0.5">{entityDetail.role}</p>
              </div>
            </div>
          </div>
        )}

        {/* Domain Entity Detail for Vehicle */}
        {!loading && entityType === 'vehicle' && entityDetail && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Car size={16} className="text-[color:var(--color-text-soft)]" />
              <h4 className="text-sm font-heading font-bold text-[color:var(--color-heading)]">
                Rincian Armada Kendaraan
              </h4>
            </div>

            <div
              className="rounded-2xl p-4 border grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
            >
              <div>
                <span className="text-[11px] font-semibold text-[color:var(--color-text-soft)] block">Merek Kendaraan</span>
                <p className="text-[color:var(--color-heading)] font-semibold mt-0.5">{entityDetail.merek}</p>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-[color:var(--color-text-soft)] block">Nomor Polisi / Plat</span>
                <p className="text-[color:var(--color-heading)] font-mono font-bold mt-0.5">{entityDetail.platNomor}</p>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-[color:var(--color-text-soft)] block">Jenis / Tipe</span>
                <p className="text-[color:var(--color-heading)] mt-0.5">{entityDetail.tipe || entityDetail.jenis || 'Mobil'}</p>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-[color:var(--color-text-soft)] block">Status Operasional</span>
                <p className="text-[color:var(--color-heading)] font-medium mt-0.5">{entityDetail.status || 'Tersedia'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="flex justify-end pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <Button variant="secondary" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </Modal>
  );
}
