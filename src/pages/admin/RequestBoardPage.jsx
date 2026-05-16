import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useBooking } from '../../contexts/BookingContext';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import FormInput from '../../components/ui/FormInput';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import PageHeader from '../../components/ui/PageHeader';
import { BOOKING_STATUS, VEHICLE_STATUS, DRIVER_STATUS } from '../../utils/constants';
import { formatDateShort, formatTime } from '../../utils/helpers';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Eye, Search, Filter } from 'lucide-react';

export default function RequestBoardPage() {
  const { bookings, vehicles, drivers, approveBooking, rejectBooking } = useBooking();
  const location = useLocation();
  const navigate = useNavigate();

  // UI States
  const [activeTab, setActiveTab] = useState('aktif'); // 'aktif' or 'riwayat'
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal States
  const [modal, setModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  useEffect(() => {
    if (location.state?.openBookingId) {
      const b = bookings.find((b) => b.id === location.state.openBookingId);
      if (b) {
        setModal(b);
        setRejectReason('');
        setShowReject(false);
        if ([BOOKING_STATUS.COMPLETED, BOOKING_STATUS.REJECTED].includes(b.status)) {
          setActiveTab('riwayat');
        } else {
          setActiveTab('aktif');
        }
      }
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.openBookingId, bookings, navigate, location.pathname]);

  const filteredBookings = useMemo(() => {
    let list = bookings;

    // 1. Filter by Tab
    if (activeTab === 'aktif') {
      list = list.filter((b) =>
        [BOOKING_STATUS.PENDING, BOOKING_STATUS.APPROVED, BOOKING_STATUS.ONGOING].includes(b.status)
      );
    } else {
      list = list.filter((b) =>
        [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.COMPLETED_WITH_NOTES, BOOKING_STATUS.REJECTED].includes(b.status)
      );
    }

    // 2. Filter by Search Query (Name or ID)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter((b) =>
        b.userName.toLowerCase().includes(query) ||
        b.id.toLowerCase().includes(query) ||
        (b.vehicleName && b.vehicleName.toLowerCase().includes(query))
      );
    }

    // 3. Filter by Date Range (Month/Year) - only for history or if selected
    if (dateFilter) {
      // dateFilter is expected to be 'YYYY-MM'
      list = list.filter((b) => b.startTime.startsWith(dateFilter));
    }

    // Sort by startTime (descending for history, ascending for active queue)
    return list.sort((a, b) => {
      const dateA = new Date(a.startTime);
      const dateB = new Date(b.startTime);
      return activeTab === 'aktif' ? dateA - dateB : dateB - dateA;
    });
  }, [bookings, activeTab, searchQuery, dateFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const currentData = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openModal = (booking) => {
    setModal(booking);
    setRejectReason('');
    setShowReject(false);
  };

  const handleApprove = async () => {
    if (!modal) return;
    if (!modal.vehicleId) { toast.error('Kendaraan belum dipilih oleh pengguna'); return; }
    try {
      await approveBooking(modal.id, modal.vehicleId, null);
      toast.success(`✅ Peminjaman ${modal.userName} disetujui`);
    } catch (err) {
      toast.error(err.message || 'Gagal menyetujui peminjaman');
    }
    setModal(null);
  };

  const handleReject = async () => {
    if (!modal) return;
    if (!rejectReason.trim()) { toast.error('Masukkan alasan penolakan'); return; }
    try {
      await rejectBooking(modal.id, rejectReason);
      toast.success(`Peminjaman ${modal.userName} ditolak`);
    } catch (err) {
      toast.error(err.message || 'Gagal menolak peminjaman');
    }
    setModal(null);
  };

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
                  {formatDateShort(b.startTime)} • {formatTime(b.startTime)}-{formatTime(b.endTime)}
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
                <div className="font-medium text-[color:var(--color-text-muted)]">{formatDateShort(b.startTime)}</div>
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
              <div><span className="font-semibold text-[color:var(--color-text-soft)]">Waktu:</span><p className="text-[color:var(--color-heading)]">{formatDateShort(modal.startTime)} {formatTime(modal.startTime)}-{formatTime(modal.endTime)}</p></div>
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
          </div>
        )}
      </Modal>
    </div>
  );
}
