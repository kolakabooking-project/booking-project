import Modal from '../ui/Modal';

export default function AboutAppModal({ 
  isOpen, 
  onClose,
  showProcessSteps = true,
  accentColor = 'djp-blue'
}) {
  const isRed = accentColor === 'red-500';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tentang Aplikasi" size="sm">
      <div className="space-y-4 text-center pb-4">
        <div className="mx-auto w-20 h-20 rounded-[1.5rem] flex items-center justify-center mb-6">
          <img src="/logoweb.png" alt="Bookolaka" className="w-full h-full object-contain" loading="lazy" />
        </div>
        <h3 className={`text-xl font-heading font-bold ${isRed ? 'text-red-400' : 'text-[color:var(--color-heading)]'}`}>Bookolaka</h3>
        <p className="text-sm text-[color:var(--color-text-soft)] leading-relaxed px-4">
          Sistem Informasi Manajemen Kendaraan Dinas Operasional (KDO) di lingkungan KPP Pratama Kolaka. 
        </p>

        {showProcessSteps && (
          <div className="mt-4 space-y-3 text-left">
            <div className="p-4 rounded-2xl" style={{ background: 'var(--color-surface-muted)' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text-soft)] mb-2">Alur Proses Bisnis</p>
              <ol className="space-y-2 text-[13px] text-[color:var(--color-heading)]">
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-djp-blue text-white text-[10px] font-bold flex items-center justify-center">1</span>
                  <span>User mengajukan permohonan peminjaman kendaraan dinas.</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-djp-blue text-white text-[10px] font-bold flex items-center justify-center">2</span>
                  <span>Admin meninjau dan menyetujui/menolak permohonan.</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-djp-blue text-white text-[10px] font-bold flex items-center justify-center">3</span>
                  <span>Kendaraan digunakan dan perjalanan dimulai.</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-djp-blue text-white text-[10px] font-bold flex items-center justify-center">4</span>
                  <span>User mengembalikan kendaraan dan mengisi laporan akhir perjalanan.</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-djp-blue text-white text-[10px] font-bold flex items-center justify-center">5</span>
                  <span>Data terdokumentasi untuk pelaporan dan audit.</span>
                </li>
              </ol>
            </div>
          </div>
        )}

        <div className="pt-4">
          <p className="text-xs text-[color:var(--color-text-soft)]">Versi 1.0.0 &copy; {new Date().getFullYear()} KPP Pratama Kolaka</p>
        </div>
      </div>
    </Modal>
  );
}
