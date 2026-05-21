import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useBooking } from '../../contexts/BookingContext';
import { useLoading } from '../../contexts/LoadingContext';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import PageHeader from '../../components/ui/PageHeader';
import { BOOKING_STATUS } from '../../utils/constants';
import { formatDateShort, formatTime } from '../../utils/helpers';
import { toast } from 'sonner';
import { X, MessageSquarePlus } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import FormInput from '../../components/ui/FormInput';

const TABS = ['Semua', BOOKING_STATUS.PENDING, BOOKING_STATUS.APPROVED, BOOKING_STATUS.ONGOING, BOOKING_STATUS.COMPLETED, BOOKING_STATUS.COMPLETED_WITH_NOTES, BOOKING_STATUS.REJECTED];

export default function MyBookingsPage() {
  const { user } = useAuth();
  const { getUserBookings, cancelBooking, submitReview } = useBooking();
  const { showLoading, hideLoading } = useLoading();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.filterStatus || 'Semua');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const myBookings = getUserBookings(user.id);
  const forcedTab = location.state?.openBookingId ? 'Semua' : activeTab;

  useEffect(() => {
    if (location.state?.filterStatus) {
      setActiveTab(location.state.filterStatus);
      window.history.replaceState({}, document.title);
    }
    
    if (location.state?.openBookingId) {
      setTimeout(() => {
        const el = document.getElementById(`booking-${location.state.openBookingId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-4', 'ring-djp-yellow', 'ring-offset-2');
          setTimeout(() => el.classList.remove('ring-4', 'ring-djp-yellow', 'ring-offset-2'), 2000);
        }
      }, 100);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const filtered = useMemo(() => {
    let list = forcedTab === 'Semua' ? myBookings : myBookings.filter((b) => b.status === forcedTab);
    return list.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
  }, [myBookings, forcedTab]);

  const handleCancel = async () => {
    if (cancelTarget) {
      showLoading('Membatalkan peminjaman...');
      try { 
        await cancelBooking(cancelTarget); 
        toast.success('Peminjaman dibatalkan.'); 
      } catch (err) { 
        toast.error(err.message || 'Gagal membatalkan'); 
      } finally {
        hideLoading();
      }
      setCancelTarget(null);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewNotes.trim()) {
      toast.error('Ulasan tidak boleh kosong');
      return;
    }
    showLoading('Mengirim catatan review...');
    try {
      await submitReview(reviewTarget.id, reviewNotes);
      toast.success('Terima kasih, catatan Anda telah tersimpan.');
      setReviewTarget(null);
      setReviewNotes('');
    } catch (err) {
      toast.error(err.message || 'Gagal mengirim catatan');
    } finally {
      hideLoading();
    }
  };

  return (
    <div className="min-w-0">
      <PageHeader
        title="Kontrol booking pribadi"
        subtitle="Lacak status pengajuan, lanjutkan check-out perjalanan, dan batalkan permintaan yang masih menunggu persetujuan."
      />

      <div className="toolbar-shell mb-6">
        <div>
          <h2 className="section-title">Filter status</h2>
          <p className="section-copy">Pilih status untuk memfokuskan daftar peminjaman Anda.</p>
        </div>
        <div className="mobile-scroll-tabs">
          {TABS.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`interactive-pill flex-shrink-0 ${forcedTab === tab ? 'interactive-pill-active' : ''}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="empty-state">
          <p className="text-lg font-heading font-bold text-[color:var(--color-heading)]">Belum ada peminjaman pada filter ini.</p>
          <p className="mt-2 text-sm text-[color:var(--color-text-soft)]">Coba pilih status lain atau buat pengajuan baru.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((b) => (
            <Card key={b.id} id={`booking-${b.id}`} hover className="p-5 sm:p-6 transition-all duration-300">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="mb-2 flex items-center gap-2"><Badge status={b.status} /><span className="text-xs font-medium text-[color:var(--color-text-soft)]">#{b.id.slice(-6)}</span></div>
                  <h3 className="text-base font-heading font-bold text-[color:var(--color-heading)]">{b.keperluan}</h3>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[color:var(--color-text-soft)]">
                    <span>{formatDateShort(b.startTime)}</span>
                    <span>{formatTime(b.startTime)} - {formatTime(b.endTime)}</span>
                    <span>{b.jumlahPenumpang} orang</span>
                  </div>
                  {b.vehicleName && <p className="mt-2 text-sm font-medium text-djp-blue">{b.vehicleName}</p>}
                  {b.driverName && <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">{b.driverName}</p>}
                  {b.alasanPenolakan && <p className="mt-3 rounded-2xl bg-danger-light px-3 py-2 text-sm text-danger">Alasan: {b.alasanPenolakan}</p>}
                </div>
                <div className="flex flex-shrink-0 flex-wrap gap-2">
                  {b.status === BOOKING_STATUS.PENDING && <Button variant="danger" size="sm" onClick={() => setCancelTarget(b.id)}><X size={14} />Batalkan</Button>}
                  {b.status === BOOKING_STATUS.COMPLETED && <Button variant="secondary" size="sm" onClick={() => { setReviewTarget(b); setReviewNotes(''); }}><MessageSquarePlus size={14} />Tambah Catatan</Button>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog isOpen={!!cancelTarget} onClose={() => setCancelTarget(null)} onConfirm={handleCancel} title="Batalkan Peminjaman?" message="Pengajuan ini akan dibatalkan." confirmText="Ya, Batalkan" />
      
      {/* Review Modal */}
      <Modal isOpen={!!reviewTarget} onClose={() => setReviewTarget(null)} title="Catatan Penggunaan Kendaraan" size="md">
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          <p className="text-sm text-[color:var(--color-text-soft)] mb-2">
            Peminjaman telah selesai. Tambahkan catatan jika terdapat kendala (seperti AC kurang dingin, mesin bermasalah, kebersihan kurang, dll).
          </p>
          <FormInput
            id="reviewNotes"
            label="Catatan Kendala/Review"
            type="textarea"
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            placeholder="Ketik catatan Anda di sini..."
            required
          />
          <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <Button type="button" variant="ghost" onClick={() => setReviewTarget(null)}>Batal</Button>
            <Button type="submit" variant="primary">Kirim Catatan</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
