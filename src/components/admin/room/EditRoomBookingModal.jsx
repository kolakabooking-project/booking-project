import { useState, useEffect, useMemo } from 'react';
import { useRoomBooking } from '../../../contexts/RoomBookingContext';
import { useLoading } from '../../../contexts/LoadingContext';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import FormInput from '../../ui/FormInput';
import CounterInput from '../../ui/CounterInput';
import RoomPhoto from '../../ui/RoomPhoto';
import { bookingApi } from '../../../lib/api';
import { formatTime, formatDateShort } from '../../../utils/helpers';
import { BOOKING_STATUS } from '../../../utils/constants';
import { toast } from 'sonner';
import { Search, CheckCircle, Building2, Users, AlertCircle, Info } from 'lucide-react';

export default function EditRoomBookingModal({ isOpen, onClose, booking, onSuccess }) {
  const { rooms = [], roomBookings = [], updateRoomBooking } = useRoomBooking();
  const { showLoading, hideLoading } = useLoading();

  const [form, setForm] = useState({
    startDate: '',
    startTime: '',
    endTime: '',
    roomId: '',
    keperluan: '',
    jumlahPeserta: 5,
    catatan: '',
  });

  const [pegawaiList, setPegawaiList] = useState([]);
  const [pegawaiSearch, setPegawaiSearch] = useState('');
  const [showPegawaiDropdown, setShowPegawaiDropdown] = useState(false);
  const [selectedPegawai, setSelectedPegawai] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form when booking data changes
  useEffect(() => {
    if (isOpen && booking) {
      const start = new Date(booking.startTime);
      const end = new Date(booking.endTime);

      const yyyy = start.getFullYear();
      const mm = String(start.getMonth() + 1).padStart(2, '0');
      const dd = String(start.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const startH = String(start.getHours()).padStart(2, '0');
      const startM = String(start.getMinutes()).padStart(2, '0');
      const endH = String(end.getHours()).padStart(2, '0');
      const endM = String(end.getMinutes()).padStart(2, '0');

      setForm({
        startDate: dateStr,
        startTime: `${startH}:${startM}`,
        endTime: `${endH}:${endM}`,
        roomId: String(booking.roomId || ''),
        keperluan: booking.keperluan || '',
        jumlahPeserta: booking.jumlahPeserta || 5,
        catatan: booking.catatan || '',
      });

      setSelectedPegawai({
        id: booking.userId,
        name: booking.userName || 'Pegawai',
      });
      setPegawaiSearch('');
      setShowPegawaiDropdown(false);

      // Fetch pegawai list for reassignment
      bookingApi.getPegawaiList()
        .then(res => setPegawaiList(res.data || []))
        .catch(() => setPegawaiList([]));
    }
  }, [isOpen, booking]);

  const filteredPegawaiList = useMemo(() => {
    if (!pegawaiSearch.trim()) return pegawaiList.slice(0, 10);
    const term = pegawaiSearch.toLowerCase().trim();
    return pegawaiList.filter(p =>
      (p.name && p.name.toLowerCase().includes(term)) ||
      (p.nip && p.nip.toLowerCase().includes(term))
    ).slice(0, 10);
  }, [pegawaiList, pegawaiSearch]);

  // Compute collision with other bookings excluding this booking
  const roomConflicts = useMemo(() => {
    if (!form.startDate || !form.startTime || !form.endTime) return {};

    const startObj = new Date(`${form.startDate}T${form.startTime}:00`);
    const endObj = new Date(`${form.startDate}T${form.endTime}:00`);
    if (isNaN(startObj.getTime()) || isNaN(endObj.getTime()) || startObj >= endObj) return {};

    const conflicts = {};

    roomBookings.forEach(b => {
      // Exclude the current booking being edited and cancelled bookings
      if (b.id === booking?.id) return;
      if (b.status !== BOOKING_STATUS.APPROVED && b.status !== BOOKING_STATUS.ONGOING && b.status !== 'Disetujui' && b.status !== 'Berlangsung') return;

      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);

      if (bStart < endObj && bEnd > startObj) {
        conflicts[String(b.roomId)] = b;
      }
    });

    return conflicts;
  }, [form.startDate, form.startTime, form.endTime, roomBookings, booking]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.startDate || !form.startTime || !form.endTime) {
      toast.error('Tanggal, Waktu Mulai, dan Waktu Selesai wajib diisi.');
      return;
    }
    if (form.startTime >= form.endTime) {
      toast.error('Waktu Selesai harus setelah Waktu Mulai.');
      return;
    }
    if (!form.roomId) {
      toast.error('Silakan pilih Ruangan terlebih dahulu.');
      return;
    }
    if (!form.keperluan.trim()) {
      toast.error('Keperluan / Agenda Kegiatan wajib diisi.');
      return;
    }

    if (roomConflicts[String(form.roomId)]) {
      const conflict = roomConflicts[String(form.roomId)];
      toast.error(`Ruangan bentrok dengan peminjaman oleh ${conflict.userName} (${formatTime(conflict.startTime)} - ${formatTime(conflict.endTime)}).`);
      return;
    }

    const startIso = new Date(`${form.startDate}T${form.startTime}:00`).toISOString();
    const endIso = new Date(`${form.startDate}T${form.endTime}:00`).toISOString();

    const payload = {
      roomId: form.roomId,
      startTime: startIso,
      endTime: endIso,
      keperluan: form.keperluan.trim(),
      jumlahPeserta: parseInt(form.jumlahPeserta) || 1,
      catatan: form.catatan.trim() || null,
      targetUserId: selectedPegawai?.id,
    };

    setIsSubmitting(true);
    showLoading('Menyimpan perubahan booking...');
    try {
      const updated = await updateRoomBooking(booking.id, payload);
      toast.success('Peminjaman ruangan berhasil diperbarui');
      if (onSuccess) onSuccess(updated);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Gagal memperbarui peminjaman');
    } finally {
      setIsSubmitting(false);
      hideLoading();
    }
  };

  if (!isOpen || !booking) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Peminjaman Ruangan" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Pegawai Peminjam */}
        <div className="space-y-2 relative">
          <label className="block text-sm font-semibold text-[color:var(--color-heading)]">
            Pegawai Peminjam <span className="text-danger">*</span>
          </label>

          {selectedPegawai ? (
            <div className="flex items-center justify-between p-3.5 rounded-2xl border-2 border-blue-500 bg-blue-500/5">
              <div>
                <p className="font-heading font-bold text-sm text-[color:var(--color-heading)]">{selectedPegawai.name}</p>
                {selectedPegawai.nip && (
                  <p className="text-xs text-[color:var(--color-text-soft)]">
                    NIP: {selectedPegawai.nip} {selectedPegawai.jabatan ? `• ${selectedPegawai.jabatan}` : ''}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedPegawai(null);
                  setPegawaiSearch('');
                }}
                className="text-xs font-semibold text-blue-600 hover:underline px-2 py-1"
              >
                Ganti Pegawai
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--color-text-soft)]" />
                <input
                  type="text"
                  placeholder="Cari Nama atau NIP Pegawai..."
                  value={pegawaiSearch}
                  onChange={(e) => {
                    setPegawaiSearch(e.target.value);
                    setShowPegawaiDropdown(true);
                  }}
                  onFocus={() => setShowPegawaiDropdown(true)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border bg-[color:var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  style={{ borderColor: 'var(--color-border)' }}
                />
              </div>

              {showPegawaiDropdown && (
                <div
                  className="absolute left-0 right-0 mt-1.5 max-h-60 overflow-y-auto z-50 rounded-2xl border shadow-xl bg-[color:var(--color-surface)] divide-y divide-[color:var(--color-border)]"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  {filteredPegawaiList.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[color:var(--color-text-soft)]">
                      Pegawai tidak ditemukan
                    </div>
                  ) : (
                    filteredPegawaiList.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPegawai(p);
                          setShowPegawaiDropdown(false);
                        }}
                        className="w-full text-left p-3 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-sm text-[color:var(--color-heading)]">{p.name}</p>
                          <p className="text-xs text-[color:var(--color-text-soft)]">
                            NIP: {p.nip} {p.jabatan ? `• ${p.jabatan}` : ''}
                          </p>
                        </div>
                        <CheckCircle size={16} className="text-blue-500" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tanggal & Waktu */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <FormInput
            label="Tanggal Booking"
            id="editStartDate"
            type="date"
            required
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3 items-end">
            <FormInput
              label="Waktu Mulai"
              id="editStartTime"
              type="time"
              required
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            />
            <FormInput
              label="Waktu Selesai"
              id="editEndTime"
              type="time"
              required
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            />
          </div>
        </div>

        {/* Pilih Ruangan */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-[color:var(--color-heading)]">
            Ruangan <span className="text-danger">*</span>
          </label>
          <div className="grid grid-cols-1 gap-2.5 max-h-56 overflow-y-auto pr-1">
            {rooms.map((r) => {
              const isSelected = String(form.roomId) === String(r.id);
              const isOccupied = Boolean(roomConflicts[String(r.id)]);
              const conflictData = roomConflicts[String(r.id)];

              return (
                <div
                  key={r.id}
                  onClick={() => {
                    if (!isOccupied) setForm((prev) => ({ ...prev, roomId: String(r.id) }));
                  }}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                    isOccupied
                      ? 'opacity-60 bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30 cursor-not-allowed'
                      : isSelected
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-sm cursor-pointer'
                      : 'hover:border-blue-300 dark:hover:border-blue-500/50 cursor-pointer'
                  }`}
                  style={{ borderColor: !isSelected && !isOccupied ? 'var(--color-border)' : undefined }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0 overflow-hidden">
                      <RoomPhoto
                        roomId={r.id}
                        hasFoto={r.hasFoto}
                        alt={r.name}
                        className="w-full h-full object-cover"
                        fallback={<Building2 size={18} />}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-heading font-bold text-sm text-[color:var(--color-heading)] truncate">
                        {r.name} {r.lokasi ? `(${r.lokasi})` : ''}
                      </p>
                      <p className="text-xs text-[color:var(--color-text-soft)] flex items-center gap-1 mt-0.5">
                        <Users size={12} /> Kapasitas: {r.kapasitas || '-'} orang
                      </p>
                    </div>
                  </div>

                  <div>
                    {isOccupied ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-red-600 bg-red-100 dark:bg-red-900/30 px-2.5 py-1 rounded-lg">
                        <AlertCircle size={12} />
                        Bentrok: {conflictData?.userName}
                      </span>
                    ) : isSelected ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/40 px-3 py-1 rounded-xl">
                        <CheckCircle size={14} /> Terpilih
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-gray-500 hover:text-blue-600 px-2 py-1">Pilih</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Keperluan & Jumlah Peserta */}
        <div className="space-y-4">
          <FormInput
            label="Keperluan / Agenda Kegiatan"
            id="editKeperluan"
            type="text"
            required
            value={form.keperluan}
            onChange={(e) => setForm({ ...form, keperluan: e.target.value })}
            placeholder="Misal: Rapat Koordinasi Anggaran Triwulan II"
          />

          <CounterInput
            label="Jumlah Peserta"
            value={form.jumlahPeserta}
            onChange={(val) => setForm({ ...form, jumlahPeserta: val })}
            min={1}
            max={100}
          />

          <FormInput
            label="Catatan Pengajuan (Opsional)"
            id="editCatatan"
            type="textarea"
            rows={2}
            value={form.catatan}
            onChange={(e) => setForm({ ...form, catatan: e.target.value })}
            placeholder="Catatan tambahan keperluan ruangan..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-3 border-t border-gray-100 dark:border-gray-800">
          <Button variant="ghost" type="button" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            variant="primary"
            type="submit"
            loading={isSubmitting}
            className="shadow-md shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Simpan Perubahan
          </Button>
        </div>
      </form>
    </Modal>
  );
}
