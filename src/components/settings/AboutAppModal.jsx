import Modal from '../ui/Modal';
import { Car, Building2, MapPin, Megaphone, ShieldCheck } from 'lucide-react';

export default function AboutAppModal({ 
  isOpen, 
  onClose,
  showProcessSteps = true,
  accentColor = 'djp-blue',
  role = 'admin'
}) {
  const isRed = accentColor === 'red-500';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tentang Aplikasi" size="md">
      <div className="space-y-4 text-center pb-2">
        <div className="mx-auto w-20 h-20 rounded-[1.5rem] flex items-center justify-center mb-4">
          <img src="/logoweb.png" alt="Bookolaka" className="w-full h-full object-contain" loading="lazy" />
        </div>
        <h3 className={`text-xl font-heading font-bold ${isRed ? 'text-red-400' : 'text-[color:var(--color-heading)]'}`}>Bookolaka</h3>
        <p className="text-sm text-[color:var(--color-text-soft)] leading-relaxed px-4">
          Sistem Informasi Manajemen Kendaraan Dinas Operasional (KDO) dan Fasilitas Ruangan di lingkungan KPP Pratama Kolaka.
        </p>

        <div className="mt-5 space-y-3 text-left">
          <div className="p-4 rounded-2xl border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[color:var(--color-text-soft)] mb-3">
              Kapabilitas Sistem
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'var(--color-surface-muted)' }}>
                  <Car size={16} className={isRed ? 'text-red-400' : 'text-djp-blue'} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[color:var(--color-heading)]">Manajemen Kendaraan Dinas (KDO)</h4>
                  <p className="text-[11px] text-[color:var(--color-text-soft)] leading-relaxed mt-0.5">Pengajuan peminjaman armada, pemantauan status kendaraan secara real-time, serta pencatatan riwayat penggunaan.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'var(--color-surface-muted)' }}>
                  <Building2 size={16} className={isRed ? 'text-red-400' : 'text-djp-blue'} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[color:var(--color-heading)]">Reservasi Ruang Rapat dan Fasilitas</h4>
                  <p className="text-[11px] text-[color:var(--color-text-soft)] leading-relaxed mt-0.5">Pengelolaan jadwal peminjaman ruangan yang terintegrasi untuk mendukung kegiatan operasional kantor.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'var(--color-surface-muted)' }}>
                  <MapPin size={16} className={isRed ? 'text-red-400' : 'text-djp-blue'} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[color:var(--color-heading)]">Pemantauan Perjalanan Dinas (SPD)</h4>
                  <p className="text-[11px] text-[color:var(--color-text-soft)] leading-relaxed mt-0.5">Pelacakan status perjalanan dinas dan dokumentasi laporan akhir kegiatan.</p>
                </div>
              </div>

              {role !== 'user' && (
                <>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'var(--color-surface-muted)' }}>
                      <Megaphone size={16} className={isRed ? 'text-red-400' : 'text-djp-blue'} />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-[color:var(--color-heading)]">Notifikasi dan Broadcast Massal</h4>
                      <p className="text-[11px] text-[color:var(--color-text-soft)] leading-relaxed mt-0.5">Pengiriman pengumuman login dan pesan notifikasi push secara langsung kepada seluruh pengguna sistem.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'var(--color-surface-muted)' }}>
                      <ShieldCheck size={16} className={isRed ? 'text-red-400' : 'text-djp-blue'} />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-[color:var(--color-heading)]">Keamanan dan Log Aktivitas</h4>
                      <p className="text-[11px] text-[color:var(--color-text-soft)] leading-relaxed mt-0.5">Pencatatan jejak audit sistem dan kendali akses berbasis hak pengguna untuk menjaga keamanan data.</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {showProcessSteps && (
            <div className="p-4 rounded-2xl border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[color:var(--color-text-soft)] mb-3">Alur Proses Bisnis</p>
              <ol className="space-y-2.5 text-xs text-[color:var(--color-heading)]">
                <li className="flex gap-2.5 items-start">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-djp-blue text-white text-[10px] font-bold flex items-center justify-center mt-0.5">1</span>
                  <span className="leading-relaxed">User mengajukan permohonan peminjaman kendaraan dinas (KDO) atau reservasi ruang rapat melalui sistem.</span>
                </li>
                <li className="flex gap-2.5 items-start">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-djp-blue text-white text-[10px] font-bold flex items-center justify-center mt-0.5">2</span>
                  <span className="leading-relaxed">Admin meninjau spesifikasi permohonan, jadwal ketersediaan, kemudian menyetujui atau menolak pengajuan.</span>
                </li>
                <li className="flex gap-2.5 items-start">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-djp-blue text-white text-[10px] font-bold flex items-center justify-center mt-0.5">3</span>
                  <span className="leading-relaxed">Kendaraan operasional digunakan untuk perjalanan dinas atau fasilitas ruang rapat digunakan sesuai jadwal reservasi.</span>
                </li>
                <li className="flex gap-2.5 items-start">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-djp-blue text-white text-[10px] font-bold flex items-center justify-center mt-0.5">4</span>
                  <span className="leading-relaxed">User mengembalikan kendaraan dan mengisi laporan perjalanan (untuk KDO), atau menyelesaikan penggunaan fasilitas ruangan.</span>
                </li>
                <li className="flex gap-2.5 items-start">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-djp-blue text-white text-[10px] font-bold flex items-center justify-center mt-0.5">5</span>
                  <span className="leading-relaxed">Seluruh riwayat peminjaman dan penggunaan fasilitas terdokumentasi secara digital untuk pelaporan dan audit sistem.</span>
                </li>
              </ol>
            </div>
          )}
        </div>

        <div className="pt-4 mt-2 border-t space-y-1" style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-xs font-semibold text-[color:var(--color-text-muted)]">
            &copy; {new Date().getFullYear()} KPP PRATAMA KOLAKA V1.0.0
          </p>
          <p className="text-[11px] text-[color:var(--color-text-soft)]">
            Dikembangkan oleh <span className="font-bold text-[color:var(--color-heading)]">Ahmad Fikri Rafiuddin</span>
          </p>
        </div>
      </div>
    </Modal>
  );
}
