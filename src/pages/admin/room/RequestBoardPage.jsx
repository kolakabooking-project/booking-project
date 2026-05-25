import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useRoomBooking } from '../../../contexts/RoomBookingContext';
import { useLoading } from '../../../contexts/LoadingContext';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import FormInput from '../../../components/ui/FormInput';
import DataTable from '../../../components/ui/DataTable';
import Pagination from '../../../components/ui/Pagination';
import PageHeader from '../../../components/ui/PageHeader';
import { ROOM_STATUS } from '../../../utils/constants';
import { formatDateShort, formatTime } from '../../../utils/helpers';
import { toast } from 'sonner';
import { XCircle, Eye, Search, Filter } from 'lucide-react';

export default function RequestBoardPage() {
  const { roomBookings, cancelRoomBooking } = useRoomBooking();
  const { showLoading, hideLoading } = useLoading();
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
      const b = roomBookings.find((b) => b.id === location.state.openBookingId);
      if (b) {
        setModal(b);
        setRejectReason('');
        setShowReject(false);
        if (['Selesai', 'Selesai dengan Catatan', 'Dibatalkan'].includes(b.status)) {
          setActiveTab('riwayat');
        } else {
          setActiveTab('aktif');
        }
      }
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.openBookingId, roomBookings, navigate, location.pathname]);

  const filteredBookings = useMemo(() => {
    let list = roomBookings;

    // 1. Filter by Tab
    if (activeTab === 'aktif') {
      list = list.filter((b) => ['Disetujui', 'Berlangsung'].includes(b.status));
    } else {
      list = list.filter((b) => ['Selesai', 'Selesai dengan Catatan', 'Dibatalkan'].includes(b.status));
    }

    // 2. Filter by Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter((b) =>
        b.userName.toLowerCase().includes(query) ||
        b.id.toLowerCase().includes(query) ||
        (b.roomName && b.roomName.toLowerCase().includes(query))
      );
    }

    // 3. Filter by Date Range (Month/Year)
    if (dateFilter) {
      list = list.filter((b) => b.startTime.startsWith(dateFilter));
    }

    // Sort by startTime
    return list.sort((a, b) => {
      const dateA = new Date(a.startTime);
      const dateB = new Date(b.startTime);
      return activeTab === 'aktif' ? dateA - dateB : dateB - dateA;
    });
  }, [roomBookings, activeTab, searchQuery, dateFilter]);

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

  const handleCancelBooking = async () => {
    if (!modal) return;
    if (!rejectReason.trim()) { toast.error('Masukkan alasan pembatalan'); return; }
    showLoading('Membatalkan peminjaman ruangan...');
    try {
      await cancelRoomBooking(modal.id, rejectReason);
      toast.success(`Peminjaman ${modal.userName} dibatalkan`);
      setModal(null);
    } catch (err) {
      toast.error(err.message || 'Gagal membatalkan peminjaman');
    } finally {
      hideLoading();
    }
  };

  const columns = [
    { key: 'index', label: '#' },
    { key: 'pegawai', label: 'Pegawai' },
    { key: 'waktu', label: 'Waktu Pinjam' },
    { key: 'tujuan', label: 'Tujuan' },
    { key: 'ruangan', label: 'Ruangan' },
    { key: 'status', label: 'Status' },
    { key: 'aksi', label: 'Aksi' },
  ];

  return (
    <div className="min-w-0">
      <PageHeader
        title="Monitoring Booking Ruangan"
        subtitle="Sistem ruangan bersifat First-Come-First-Serve. Anda dapat memantau dan membatalkan booking jika diperlukan."
      />

      <div className="toolbar-shell mb-6">
        <div className="mobile-scroll-tabs">
          <button
            onClick={() => { setActiveTab('aktif'); setCurrentPage(1); }}
            className={`flex-shrink-0 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-sm font-heading font-bold transition-all ${activeTab === 'aktif' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 border border-transparent hover:border-gray-200'
              }`}
          >
            Aktif & Berlangsung
          </button>
          <button
            onClick={() => { setActiveTab('riwayat'); setCurrentPage(1); }}
            className={`flex-shrink-0 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-sm font-heading font-bold transition-all ${activeTab === 'riwayat' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 border border-transparent hover:border-gray-200'
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
              <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          )}

          <div className="relative">
            <input
              type="text"
              placeholder="Cari ID, Nama, Ruangan..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="form-control w-full pl-9 pr-4 py-2.5 sm:w-64"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Desktop table view */}
      <div className="hidden sm:block">
        <DataTable
          title={activeTab === 'aktif' ? "Daftar Booking Aktif" : "Riwayat Booking Ruangan"}
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
            <tr key={b.id} className="hover:bg-blue-50/50 transition-colors">
              <td className="text-gray-500">{(currentPage - 1) * itemsPerPage + i + 1}</td>
              <td>
                <p className="font-heading font-bold text-gray-900 dark:text-white">{b.userName}</p>
                <p className="mt-1 text-xs text-gray-500 font-mono">#{b.id.slice(-6)}</p>
              </td>
              <td>
                <div className="font-medium text-gray-700 dark:text-gray-300">{formatDateShort(b.startTime)}</div>
                <div className="mt-1 text-xs text-gray-500">{formatTime(b.startTime)} - {formatTime(b.endTime)}</div>
              </td>
              <td className="max-w-[200px]">
                <p className="line-clamp-2" title={b.keperluan}>{b.keperluan}</p>
              </td>
              <td>
                <span className="font-medium text-blue-600">{b.roomName}</span>
              </td>
              <td><Badge status={b.status} /></td>
              <td>
                <Button variant="secondary" size="sm" onClick={() => openModal(b)} className="hover:border-blue-300 hover:text-blue-600">
                  <Eye size={14} /> Detail
                </Button>
              </td>
            </tr>
          ))}
        </DataTable>
      </div>

      {/* Mobile card view (omitted for brevity, typically would be identical structure to KDO but adapted) */}
      <div className="block sm:hidden space-y-3">
        {currentData.length === 0 ? (
          <div className="surface-card empty-state">Tidak ada data yang ditemukan.</div>
        ) : (
          currentData.map((b) => (
            <div key={b.id} className="surface-card p-4 border border-gray-100 hover:border-blue-200" onClick={() => openModal(b)}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0 flex-1">
                  <p className="font-heading font-bold text-gray-900 truncate">{b.userName}</p>
                  <p className="text-[10px] text-gray-500">#{b.id.slice(-6)}</p>
                </div>
                <Badge status={b.status} />
              </div>
              <p className="text-xs text-gray-600 line-clamp-1 mb-2">{b.keperluan}</p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                <div className="text-[11px] text-gray-500">
                  {formatDateShort(b.startTime)} • {formatTime(b.startTime)}-{formatTime(b.endTime)}
                </div>
                <span className="text-[11px] font-bold text-blue-600 truncate ml-2 max-w-[120px]">{b.roomName}</span>
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

      {/* Detail Modal */}
      <Modal isOpen={!!modal} onClose={() => setModal(null)} title="Detail Peminjaman Ruangan" size="lg">
        {modal && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 bg-gray-50 dark:bg-gray-800/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div><span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-1">Pegawai</span><p className="font-medium text-gray-900 dark:text-white">{modal.userName}</p></div>
              <div><span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-1">Status</span><div className="mt-1"><Badge status={modal.status} /></div></div>
              <div><span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-1">Waktu</span><p className="font-medium text-gray-900 dark:text-white">{formatDateShort(modal.startTime)} {formatTime(modal.startTime)}-{formatTime(modal.endTime)}</p></div>
              <div><span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-1">Ruangan</span><p className="font-bold text-blue-600">{modal.roomName}</p></div>
              <div><span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-1">Peserta</span><p className="font-medium text-gray-900 dark:text-white">{modal.jumlahPeserta} orang</p></div>
              <div className="col-span-2"><span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-1">Keperluan</span><p className="font-medium text-gray-900 dark:text-white">{modal.keperluan}</p></div>
              {modal.catatan && <div className="col-span-2"><span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-1">Catatan Pengajuan</span><p className="font-medium text-gray-900 dark:text-white">{modal.catatan}</p></div>}
              {modal.alasanPembatalan && (
                <div className="col-span-2 bg-red-50 dark:bg-red-900/10 p-3 rounded-xl border border-red-100 dark:border-red-900/30">
                  <span className="text-xs font-bold uppercase tracking-wider text-red-600 block mb-1">Alasan Dibatalkan</span>
                  <p className="text-red-700">{modal.alasanPembatalan}</p>
                </div>
              )}
              {modal.reviewNotes && (
                <div className="col-span-2 bg-purple-50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-100 dark:border-purple-800/30">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-600 block mb-1">Catatan Kendala Pengguna</span>
                  <p className="text-purple-800 font-medium">{modal.reviewNotes}</p>
                </div>
              )}
            </div>

            {(modal.status === 'Disetujui' || modal.status === 'Berlangsung') && (
              <div className="pt-2">
                {!showReject ? (
                  <div className="flex gap-3 justify-end bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <div className="flex-1 text-sm text-gray-500 self-center">Batalkan peminjaman jika terjadi konflik atau alasan darurat.</div>
                    <Button variant="danger" onClick={() => setShowReject(true)} className="shadow-sm shadow-red-500/20"><XCircle size={16} />Batalkan Booking</Button>
                  </div>
                ) : (
                  <div className="bg-red-50/50 dark:bg-red-900/10 rounded-2xl p-5 border border-red-100 dark:border-red-900/30 animate-fade-in">
                    <h4 className="font-bold text-red-700 mb-3">Konfirmasi Pembatalan</h4>
                    <FormInput label="Alasan Pembatalan (Wajib)" id="reject-reason" type="textarea" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Misal: Ruangan sedang direnovasi mendadak..." required />
                    <div className="flex gap-3 justify-end pt-4 mt-2">
                      <Button variant="ghost" onClick={() => setShowReject(false)} className="hover:bg-red-100 text-red-700">Kembali</Button>
                      <Button variant="danger" onClick={handleCancelBooking} className="shadow-md shadow-red-500/30"><XCircle size={16} />Ya, Batalkan</Button>
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
