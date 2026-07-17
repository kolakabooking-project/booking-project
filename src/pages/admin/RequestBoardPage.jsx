import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import FormInput from '../../components/ui/FormInput';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import PageHeader from '../../components/ui/PageHeader';
import { BOOKING_STATUS } from '../../utils/constants';
import { formatDateShort, formatTime } from '../../utils/helpers';
import { CheckCircle, XCircle, Eye, Search, Filter, FlagTriangleRight, AlertTriangle } from 'lucide-react';
import useRequestBoard from '../../hooks/useRequestBoard';

export default function RequestBoardPage() {
  const itemsPerPage = 10;
  const { state, actions } = useRequestBoard(itemsPerPage);
  
  const {
    activeTab,
    searchQuery,
    dateFilter,
    currentPage,
    modal,
    rejectReason,
    showReject,
    cancelApprovedReason,
    showCancelApproved,
    completeEarlyNotes,
    showCompleteEarly,
    filteredBookings,
    currentData,
    totalPages
  } = state;

  const {
    setActiveTab,
    setSearchQuery,
    setDateFilter,
    setCurrentPage,
    setModal,
    setRejectReason,
    setShowReject,
    setCancelApprovedReason,
    setShowCancelApproved,
    setCompleteEarlyNotes,
    setShowCompleteEarly,
    openModal,
    handleApprove,
    handleReject,
    handleCancelApproved,
    handleCompleteEarly
  } = actions;

  const columns = [
    { key: 'index', label: '#' },
    { key: 'pegawai', label: 'Pegawai' },
    { key: 'waktu', label: 'Waktu Pinjam' },
    { key: 'tujuan', label: 'Tujuan' },
    { key: 'kendaraan', label: 'Kendaraan' },
    { key: 'status', label: 'Status' },
    { key: 'aksi', label: 'Aksi' },
  ];

  return (
    <div>
      <PageHeader
        title="Kelola antrean dan histori booking"
        subtitle="Gunakan pencarian, filter untuk memproses permintaan secara cepat."
      />

      <div className="toolbar-shell mb-6">
        <div className="mobile-scroll-tabs">
          <button
            onClick={() => { setActiveTab('aktif'); setCurrentPage(1); }}
            className={`flex-shrink-0 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-sm font-heading font-bold transition-all ${activeTab === 'aktif' ? 'bg-[color:var(--color-surface-elevated)] text-[color:var(--color-brand)] shadow-sm' : 'text-[color:var(--color-text-muted)] hover:text-[color:var(--color-heading)]'
              }`}
          >
            Antrean & Aktif
          </button>
          <button
            onClick={() => { setActiveTab('riwayat'); setCurrentPage(1); }}
            className={`flex-shrink-0 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-sm font-heading font-bold transition-all ${activeTab === 'riwayat' ? 'bg-[color:var(--color-surface-elevated)] text-[color:var(--color-brand)] shadow-sm' : 'text-[color:var(--color-text-muted)] hover:text-[color:var(--color-heading)]'
              }`}
          >
            Riwayat Selesai
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {activeTab === 'riwayat' && (
            <div className="relative">
              <input
                type="month"
                value={dateFilter}
                onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
                className="form-control pl-9 pr-4 py-2.5 w-full sm:w-auto"
              />
              <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-text-soft)]" />
            </div>
          )}

          <div className="relative">
            <input
              type="text"
              placeholder="Cari ID, Nama, Kendaraan..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="form-control w-full pl-9 pr-4 py-2.5 sm:w-64"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-text-soft)]" />
          </div>
        </div>
      </div>

      {/* Mobile card view */}
      <div className="block sm:hidden space-y-3">
        {currentData.length === 0 ? (
          <div className="surface-card empty-state">Tidak ada data yang ditemukan.</div>
        ) : (
          currentData.map((b) => (
            <div key={b.id} className="surface-card p-4" onClick={() => openModal(b)}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0 flex-1">
                  <p className="font-heading font-bold text-[color:var(--color-heading)] truncate">{b.userName}</p>
                  <p className="text-[10px] text-[color:var(--color-text-soft)]">#{b.id.slice(-6)}</p>
                </div>
                <Badge status={b.status} />
              </div>
              <p className="text-xs text-[color:var(--color-text-muted)] line-clamp-1 mb-1">{b.keperluan}</p>
              <div className="flex items-center justify-between mt-2">
                <div className="text-[11px] text-[color:var(--color-text-soft)]">
                  {formatDateShort(b.startTime)} - {formatDateShort(b.endTime)} • {formatTime(b.startTime)}-{formatTime(b.endTime)}
                </div>
                {b.vehicleName && <span className="text-[11px] font-medium text-djp-blue truncate ml-2 max-w-[120px]">{b.vehicleName}</span>}
              </div>
            </div>
          ))
        )}
        {totalPages > 1 && (
          <div className="pt-2">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={filteredBookings.length} itemsPerPage={itemsPerPage} />
          </div>
        )}
      </div>

      {/* Desktop table view */}
      <div className="hidden sm:block">
        <DataTable
          title={activeTab === 'aktif' ? "Daftar Permintaan Aktif" : "Riwayat Peminjaman"}
          subtitle={
            searchQuery
              ? `Ditemukan ${filteredBookings.length} hasil pencarian.`
              : `Menampilkan ${filteredBookings.length} data.`
          }
          columns={columns}
          empty={currentData.length === 0 ? <div className="empty-state">Tidak ada data yang ditemukan.</div> : null}
          footer={
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredBookings.length}
              itemsPerPage={itemsPerPage}
            />
          }
        >
          {currentData.map((b, i) => (
            <tr key={b.id}>
              <td className="text-[color:var(--color-text-soft)]">{(currentPage - 1) * itemsPerPage + i + 1}</td>
              <td>
                <p className="font-heading font-bold text-[color:var(--color-heading)]">{b.userName}</p>
                <p className="mt-1 text-xs text-[color:var(--color-text-soft)]">#{b.id.slice(-6)}</p>
              </td>
              <td>
                <div className="font-medium text-[color:var(--color-text-muted)]">{formatDateShort(b.startTime)} - {formatDateShort(b.endTime)}</div>
                <div className="mt-1 text-xs text-[color:var(--color-text-soft)]">{formatTime(b.startTime)} - {formatTime(b.endTime)}</div>
              </td>
              <td className="max-w-[200px]">
                <p className="line-clamp-2" title={b.keperluan}>{b.keperluan}</p>
              </td>
              <td>
                {b.vehicleName ? (
                  <span className="font-medium text-djp-blue">{b.vehicleName}</span>
                ) : (
                  <span className="italic text-[color:var(--color-text-soft)]">Belum di-assign</span>
                )}
              </td>
              <td><Badge status={b.status} /></td>
              <td>
                <Button variant="secondary" size="sm" onClick={() => openModal(b)}>
                  <Eye size={14} /> Detail
                </Button>
              </td>
            </tr>
          ))}
        </DataTable>
      </div>

      {/* Detail Modal */}
      <Modal isOpen={!!modal} onClose={() => setModal(null)} title="Detail Peminjaman" size="lg">
        {modal && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div><span className="font-semibold text-[color:var(--color-text-soft)]">Pegawai:</span><p className="text-[color:var(--color-heading)]">{modal.userName}</p></div>
              <div><span className="font-semibold text-[color:var(--color-text-soft)]">Status:</span><div className="mt-1"><Badge status={modal.status} /></div></div>
              <div><span className="font-semibold text-[color:var(--color-text-soft)]">Waktu:</span><p className="text-[color:var(--color-heading)]">{formatDateShort(modal.startTime)} - {formatDateShort(modal.endTime)} ({formatTime(modal.startTime)}-{formatTime(modal.endTime)})</p></div>
              <div><span className="font-semibold text-[color:var(--color-text-soft)]">Penumpang:</span><p className="text-[color:var(--color-heading)]">{modal.jumlahPenumpang} orang</p></div>
              <div className="col-span-2"><span className="font-semibold text-[color:var(--color-text-soft)]">Keperluan:</span><p className="text-[color:var(--color-heading)]">{modal.keperluan}</p></div>
              {modal.catatan && <div className="col-span-2"><span className="font-semibold text-[color:var(--color-text-soft)]">Catatan Pengajuan:</span><p className="text-[color:var(--color-heading)]">{modal.catatan}</p></div>}
              {modal.reviewNotes && (
                <div className="col-span-2 mt-2 rounded-2xl bg-purple-50 dark:bg-purple-900/10 p-3 border border-purple-100 dark:border-purple-800/30">
                  <span className="font-semibold text-purple-700 dark:text-purple-400">Catatan/Review Pengguna:</span>
                  <p className="text-purple-900 dark:text-purple-300 mt-1">{modal.reviewNotes}</p>
                </div>
              )}
              {modal.perluSopir && <div><span className="font-semibold text-[color:var(--color-text-soft)]">Sopir:</span><p className="font-semibold text-djp-blue">Diperlukan</p></div>}
              {modal.vehicleName && <div><span className="font-semibold text-[color:var(--color-text-soft)]">Kendaraan:</span><p className="font-semibold text-djp-blue">{modal.vehicleName}</p></div>}
            </div>

            {modal.status === BOOKING_STATUS.PENDING && (
              <div className="border-t pt-4 space-y-4" style={{ borderColor: 'var(--color-border)' }}>
                {!showReject ? (
                  <>
                    <div className="rounded-2xl p-4 bg-djp-blue/5 border border-djp-blue/10">
                      <p className="text-sm font-medium text-[color:var(--color-heading)]">Kendaraan yang diajukan:</p>
                      <p className="text-sm font-bold text-djp-blue mt-1">{modal.vehicleName}</p>
                      {modal.perluSopir && (
                        <p className="text-sm text-[color:var(--color-text-muted)] mt-1">Sopir akan ditugaskan secara otomatis.</p>
                      )}
                    </div>
                    <div className="flex gap-3 justify-end pt-2">
                      <Button variant="danger" onClick={() => setShowReject(true)}><XCircle size={16} />Tolak</Button>
                      <Button variant="success" onClick={handleApprove}><CheckCircle size={16} />Setujui</Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-danger-light/30 rounded-2xl p-4">
                      <FormInput label="Alasan Penolakan" id="reject-reason" type="textarea" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Jelaskan alasan penolakan..." required />
                    </div>
                    <div className="flex gap-3 justify-end pt-2">
                      <Button variant="ghost" onClick={() => setShowReject(false)}>Kembali</Button>
                      <Button variant="danger" onClick={handleReject}><XCircle size={16} />Konfirmasi Tolak</Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {(modal.status === BOOKING_STATUS.APPROVED || modal.status === BOOKING_STATUS.ONGOING) && (
              <div className="border-t pt-4 space-y-4" style={{ borderColor: 'var(--color-border)' }}>
                {!showCancelApproved && !showCompleteEarly && (
                  <div className="space-y-3">
                    {/* Kartu Selesaikan Sebelum Waktunya */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/30">
                      <div>
                        <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                          <FlagTriangleRight size={16} /> Kendaraan Sudah Kembali?
                        </p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                          Jika kendaraan sudah kembali ke kantor sebelum jadwal selesai, Anda dapat mengakhiri booking ini lebih awal.
                        </p>
                      </div>
                      <Button variant="success" onClick={() => setShowCompleteEarly(true)} className="flex-shrink-0">
                        <FlagTriangleRight size={16} /> Selesaikan Lebih Awal
                      </Button>
                    </div>

                    {/* Kartu Batalkan Peminjaman */}
                    {new Date() < new Date(modal.endTime) && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-red-50 dark:bg-red-950/20 p-4 rounded-2xl border border-red-200 dark:border-red-900/30">
                        <div>
                          <p className="text-sm font-bold text-red-800 dark:text-red-300 flex items-center gap-1.5">
                            <XCircle size={16} /> Batalkan Peminjaman?
                          </p>
                          <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                            Peminjaman ini dapat dibatalkan apabila ada kendala darurat atau pembatalan perjalanan dinas.
                          </p>
                        </div>
                        <Button variant="danger" onClick={() => setShowCancelApproved(true)} className="flex-shrink-0">
                          <XCircle size={16} /> Batalkan Peminjaman
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {showCancelApproved && (
                  <div className="bg-red-50 dark:bg-red-950/20 rounded-2xl p-4 border border-red-200 dark:border-red-900/30 space-y-3">
                    <FormInput
                      label="Alasan Pembatalan (Wajib)"
                      id="cancel-approved-reason"
                      type="textarea"
                      value={cancelApprovedReason}
                      onChange={(e) => setCancelApprovedReason(e.target.value)}
                      placeholder="Masukkan alasan pembatalan peminjaman yang sudah disetujui..."
                      required
                    />
                    <div className="flex gap-3 justify-end pt-1">
                      <Button variant="ghost" onClick={() => setShowCancelApproved(false)}>Kembali</Button>
                      <Button variant="danger" onClick={handleCancelApproved}>
                        <XCircle size={16} /> Konfirmasi Batalkan
                      </Button>
                    </div>
                  </div>
                )}

                {showCompleteEarly && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-900/30 space-y-4">
                    <div className="flex items-start gap-3 bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200 p-3.5 rounded-xl border border-amber-300 dark:border-amber-800/40">
                      <AlertTriangle size={20} className="flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                      <div className="text-xs space-y-1">
                        <p className="font-bold text-sm">Pastikan Kendaraan Sudah Balik ke Kantor!</p>
                        <p>
                          Sebelum menyelesaikan dan mengakhiri booking ini lebih awal, pastikan fisik kendaraan dinas telah kembali berada di kantor dan kunci kendaraan beserta STNK telah diserahkan.
                        </p>
                      </div>
                    </div>
                    <FormInput
                      label="Catatan Penyelesaian Lebih Awal (Opsional)"
                      id="complete-early-notes"
                      type="textarea"
                      value={completeEarlyNotes}
                      onChange={(e) => setCompleteEarlyNotes(e.target.value)}
                      placeholder="Contoh: Kendaraan dikembalikan tanggal 5 dalam kondisi baik, BBM terisi penuh..."
                    />
                    <div className="flex gap-3 justify-end pt-1">
                      <Button variant="ghost" onClick={() => setShowCompleteEarly(false)}>Kembali</Button>
                      <Button variant="success" onClick={handleCompleteEarly}>
                        <FlagTriangleRight size={16} /> Konfirmasi Selesaikan
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
