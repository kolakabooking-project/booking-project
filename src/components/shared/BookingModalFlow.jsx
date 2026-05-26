import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useBooking } from '../../contexts/BookingContext';
import { useLoading } from '../../contexts/LoadingContext';
import { BOOKING_STATUS } from '../../utils/constants';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import FormInput from '../ui/FormInput';
import CounterInput from '../ui/CounterInput';
import { Plus, ArrowLeft, Car, Info, Send, Search, CheckCircle } from 'lucide-react';
import { formatTime, formatDateShort } from '../../utils/helpers';
import { toast } from 'sonner';

export default function BookingModalFlow({ isOpen, onClose, selectedDate, dateBookings, isAdmin = false }) {
  const { user } = useAuth();
  const { createBooking, createMandatoryBooking, getAvailableVehicles, getBookingsForDate } = useBooking();
  const { showLoading, hideLoading } = useLoading();
  
  const [mode, setMode] = useState('list'); // 'list', 'select_type', 'form_single', 'form_multiple'
  const [loading, setLoading] = useState(false);
  const [availChecked, setAvailChecked] = useState(false);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [vehicleDetailModal, setVehicleDetailModal] = useState(null);

  const [form, setForm] = useState({
    startTime: '',
    endTime: '',
    startDate: '',
    endDate: '',
    vehicleId: '',
    keperluan: '',
    jumlahPenumpang: 1,
    perluSopir: false,
    catatan: '',
    adminUserName: 'Admin', // default for admin
  });

  const selectedDateBookings = useMemo(() => {
    if (!form.startDate || !getBookingsForDate) return [];
    
    // We append noon time to avoid timezone edge cases when creating Date from just YYYY-MM-DD
    const dateObj = new Date(`${form.startDate}T12:00:00`); 
    
    return getBookingsForDate(dateObj).filter(b => 
      b.status === BOOKING_STATUS.ONGOING || b.status === BOOKING_STATUS.APPROVED
    ).sort((a,b) => new Date(a.startTime) - new Date(b.startTime));
  }, [form.startDate, getBookingsForDate]);

  // Reset state when opened
  /* eslint-disable react-hooks/set-state-in-effect */
  // This effect intentionally resets the flow each time the modal session is opened.
  useEffect(() => {
    if (isOpen) {
      setMode(isAdmin || !selectedDate ? 'select_type' : 'list');
      setAvailChecked(false);
      setAvailableVehicles([]);
      setVehicleDetailModal(null);
      
      const targetDate = selectedDate || new Date();
      const yyyy = targetDate.getFullYear();
      const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
      const dd = String(targetDate.getDate()).padStart(2, '0');
      const formattedDate = `${yyyy}-${mm}-${dd}`;
      
      setForm({
        startTime: '',
        endTime: '',
        startDate: formattedDate,
        endDate: formattedDate,
        vehicleId: '',
        keperluan: '',
        jumlahPenumpang: 1,
        perluSopir: false,
        catatan: '',
        adminUserName: 'Admin',
      });
    }
  }, [isOpen, selectedDate, isAdmin]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleCheckAvailability = () => {
    let startIso, endIso;
    
    if (mode === 'form_single') {
      if (!form.startTime || !form.endTime) {
        toast.error('Isi waktu pinjam terlebih dahulu');
        return;
      }
      if (form.startTime >= form.endTime) {
        toast.error('Waktu selesai harus setelah waktu mulai');
        return;
      }
      startIso = new Date(`${form.startDate}T${form.startTime}:00`).toISOString();
      endIso = new Date(`${form.startDate}T${form.endTime}:00`).toISOString();
    } else {
      if (!form.startDate || !form.endDate) {
        toast.error('Isi tanggal mulai dan selesai terlebih dahulu');
        return;
      }
      if (form.startDate > form.endDate) {
        toast.error('Tanggal selesai tidak valid');
        return;
      }
      // For multi-day, assume full day (00:00 to 23:59)
      startIso = new Date(`${form.startDate}T00:00:00`).toISOString();
      endIso = new Date(`${form.endDate}T23:59:59`).toISOString();
    }

    const avail = getAvailableVehicles(startIso, endIso);
    setAvailableVehicles(avail);
    setAvailChecked(true);
    setForm(prev => ({ ...prev, vehicleId: '' })); // reset selected vehicle
    
    if (avail.length === 0) {
      toast.error('Tidak ada kendaraan tersedia pada jadwal tersebut');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.vehicleId) {
      toast.error('Pilih kendaraan terlebih dahulu');
      return;
    }

    setLoading(true);
    showLoading(isAdmin ? 'Membuat booking mandatory...' : 'Mengirim pengajuan peminjaman...');

    let startIso, endIso;
    if (mode === 'form_single') {
      startIso = new Date(`${form.startDate}T${form.startTime}:00`).toISOString();
      endIso = new Date(`${form.startDate}T${form.endTime}:00`).toISOString();
    } else {
      startIso = new Date(`${form.startDate}T08:00:00`).toISOString();
      endIso = new Date(`${form.endDate}T17:00:00`).toISOString();
    }

    const selectedVehicle = availableVehicles.find(v => v.id === form.vehicleId);

    const bookingPayload = {
      userId: user.id,
      userName: isAdmin ? form.adminUserName : user.name,
      startTime: startIso,
      endTime: endIso,
      keperluan: form.keperluan,
      jumlahPenumpang: parseInt(form.jumlahPenumpang),
      jenisKendaraan: selectedVehicle?.tipe || 'Mobil',
      vehicleId: form.vehicleId,
      perluSopir: form.perluSopir,
      catatan: form.catatan,
    };

    try {
      if (isAdmin) {
        await createMandatoryBooking(bookingPayload);
      } else {
        await createBooking(bookingPayload);
      }

      toast.success('Pengajuan Berhasil Dikirim');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Gagal mengirim pengajuan');
    } finally {
      setLoading(false);
      hideLoading();
    }
  };

  const renderListMode = () => (
    <div className="space-y-4">
      {dateBookings.length === 0 ? (
        <div className="text-center py-8">
          <Car size={48} className="mx-auto text-success/40 mb-3" />
          <p className="text-[color:var(--color-text-soft)]">Semua kendaraan tersedia pada tanggal ini.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="mb-3 text-sm text-[color:var(--color-text-soft)]">
            {dateBookings.length} peminjaman pada tanggal ini:
          </p>
          {dateBookings.map((b) => (
            <div key={b.id} className="surface-muted rounded-2xl p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-heading font-semibold text-[color:var(--color-heading)]">{b.userName}</span>
                <Badge status={b.status} />
              </div>
              <p className="text-xs text-[color:var(--color-text-soft)]">
                {formatTime(b.startTime)} - {formatTime(b.endTime)}
              </p>
              <p className="mt-1 text-xs text-[color:var(--color-text-muted)]">{b.keperluan}</p>
              {b.vehicleName && (
                <p className="mt-1 text-xs font-medium text-djp-blue">{b.vehicleName}</p>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-6 border-t pt-4 flex justify-end" style={{ borderColor: 'var(--color-border)' }}>
        <Button onClick={() => setMode('select_type')} size="lg" className="w-full sm:w-auto">
          <Plus size={16} />
          Buat Peminjaman
        </Button>
      </div>
    </div>
  );

  const renderSelectTypeMode = () => (
    <div className="space-y-4">
      {!isAdmin && selectedDate && (
        <button onClick={() => setMode('list')} className="text-sm text-[color:var(--color-text-soft)] flex items-center gap-1 hover:text-djp-blue transition-colors mb-4">
          <ArrowLeft size={16} /> Kembali
        </button>
      )}
      
      <h3 className="text-lg font-heading font-bold text-center mb-6 text-[color:var(--color-heading)]">Pilih Durasi Peminjaman</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button 
          onClick={() => { setMode('form_single'); setAvailChecked(false); }}
          className="border-2 rounded-3xl p-6 text-center transition-all group hover:border-djp-blue hover:bg-[color:var(--color-surface-muted)]"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="bg-djp-blue/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
            <span className="text-djp-blue font-bold text-xl">1</span>
          </div>
          <h4 className="font-heading font-bold text-[color:var(--color-heading)] mb-2">Pinjam Sehari</h4>
          <p className="text-xs text-[color:var(--color-text-soft)]">Peminjaman kendaraan untuk keperluan pada hari yang sama.</p>
        </button>
        
        <button 
          onClick={() => { setMode('form_multiple'); setAvailChecked(false); }}
          className="border-2 rounded-3xl p-6 text-center transition-all group hover:border-djp-blue hover:bg-[color:var(--color-surface-muted)]"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="bg-djp-blue/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
            <span className="text-djp-blue font-bold text-xl">+</span>
          </div>
          <h4 className="font-heading font-bold text-[color:var(--color-heading)] mb-2">Lebih dari Sehari</h4>
          <p className="text-xs text-[color:var(--color-text-soft)]">Peminjaman untuk keperluan dinas luar kota atau menginap.</p>
        </button>
      </div>
    </div>
  );

  const renderFormMode = () => (
    <form onSubmit={handleSubmit} className="space-y-5">
      <button type="button" onClick={() => setMode('select_type')} className="text-sm text-[color:var(--color-text-soft)] flex items-center gap-1 hover:text-djp-blue transition-colors mb-2">
        <ArrowLeft size={16} /> Kembali
      </button>

      {/* Date and Time Inputs */}
      {isAdmin && (
        <FormInput
          label="Nama Peminjam (Mandatory)"
          id="adminUserName"
          type="text"
          required
          value={form.adminUserName}
          onChange={(e) => setForm({...form, adminUserName: e.target.value})}
          placeholder="Nama Peminjam / Acara"
        />
      )}
      {mode === 'form_single' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <FormInput
            label="Tanggal Peminjaman"
            id="startDate"
            type="date"
            required
            value={form.startDate}
            disabled={!!selectedDate && !isAdmin}
            onChange={(e) => { setForm({...form, startDate: e.target.value, endDate: e.target.value}); setAvailChecked(false); }}
          />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 items-end">
            <FormInput
              label="Waktu Mulai"
              id="startTime"
              type="time"
              required
              value={form.startTime}
              onChange={(e) => { setForm({...form, startTime: e.target.value}); setAvailChecked(false); }}
            />
            <FormInput
              label="Waktu Selesai"
              id="endTime"
              type="time"
              required
              value={form.endTime}
              onChange={(e) => { setForm({...form, endTime: e.target.value}); setAvailChecked(false); }}
            />
          </div>
          {selectedDateBookings.length > 0 && (
            <div className="mt-2 surface-muted rounded-xl p-4 border col-span-1 sm:col-span-2" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-2 mb-2 text-[color:var(--color-heading)] font-semibold text-sm">
                <Info size={16} className="text-djp-blue" />
                <span>Informasi Jadwal Terisi di Hari Ini</span>
              </div>
              <div className="space-y-2">
                {selectedDateBookings.map(b => (
                  <div key={b.id} className="text-xs text-[color:var(--color-text-soft)] flex justify-between items-center border-b pb-1 last:border-0 last:pb-0" style={{ borderColor: 'var(--color-border)' }}>
                    <span>{formatTime(b.startTime)} - {formatTime(b.endTime)}</span>
                    <span className="font-medium text-right max-w-[60%] truncate">{b.vehicleName || b.jenisKendaraan}</span>
                  </div>
                ))}
              </div>
              {availChecked && availableVehicles.length === 0 && (
                <div className="mt-3 text-xs text-danger font-medium p-2 bg-danger/10 rounded-lg">
                  💡 Tidak ada kendaraan pada rentang waktu yang Anda pilih. Silakan sesuaikan waktu mulai atau selesai dengan celah jadwal kosong di atas.
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <FormInput
            label="Tanggal Mulai"
            id="startDate"
            type="date"
            required
            min={form.startDate}
            value={form.startDate}
            onChange={(e) => { setForm({...form, startDate: e.target.value}); setAvailChecked(false); }}
          />
          <FormInput
            label="Tanggal Selesai"
            id="endDate"
            type="date"
            required
            min={form.startDate}
            value={form.endDate}
            onChange={(e) => { setForm({...form, endDate: e.target.value}); setAvailChecked(false); }}
          />
        </div>
      )}

      {/* Vehicle Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-heading font-semibold text-[color:var(--color-text-muted)]">
            Kendaraan <span className="text-danger">*</span>
          </label>
          <Button type="button" variant="secondary" size="sm" onClick={handleCheckAvailability}>
            <Search size={14} /> Cek Ketersediaan
          </Button>
        </div>
        
        {!availChecked ? (
          <div className="w-full rounded-2xl border border-dashed p-4 text-center text-[color:var(--color-text-soft)] text-sm" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-muted)' }}>
            Klik tombol "Cek Ketersediaan" untuk melihat kendaraan yang bisa dipinjam.
          </div>
        ) : availableVehicles.length === 0 ? (
          <div className="w-full rounded-2xl border border-danger/50 bg-danger-light/30 p-4 text-center text-danger text-sm">
            Tidak ada kendaraan tersedia pada waktu yang dipilih.
          </div>
        ) : (
          <div className="w-full rounded-2xl border overflow-hidden max-h-60 overflow-y-auto shadow-inner" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-strong)' }}>
            {availableVehicles.map(v => (
              <div key={v.id} className={`flex items-center justify-between p-3 border-b last:border-0 transition-colors ${form.vehicleId === v.id ? 'bg-djp-blue/10' : 'hover:bg-[color:var(--color-surface-muted)]'}`} style={{ borderColor: 'var(--color-border)' }}>
                <div>
                  <p className="font-heading font-semibold text-[color:var(--color-heading)] text-sm">
                    {v.merek} - <span className="text-djp-blue">{v.platNomor}</span>
                  </p>
                  <p className="text-xs text-[color:var(--color-text-soft)] mt-0.5">{v.tipe} • {v.kapasitas} Penumpang</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    type="button" 
                    onClick={() => setVehicleDetailModal(v)}
                    className="p-2 text-[color:var(--color-text-soft)] hover:text-djp-blue hover:bg-djp-blue/10 rounded-full transition-colors"
                    title="Detail"
                  >
                    <Info size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({...form, vehicleId: v.id})}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      form.vehicleId === v.id 
                        ? 'bg-success text-white' 
                        : 'bg-[color:var(--color-surface-elevated)] text-[color:var(--color-text-muted)] hover:text-djp-blue hover:border-djp-blue/30 border border-transparent'
                    }`}
                  >
                    {form.vehicleId === v.id ? <span className="flex items-center gap-1"><CheckCircle size={12}/> Dipilih</span> : 'Pilih'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="perluSopir"
          checked={form.perluSopir}
          onChange={(e) => setForm({...form, perluSopir: e.target.checked})}
          className="w-4 h-4 rounded text-djp-blue focus:ring-djp-yellow"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-strong)' }}
        />
        <label htmlFor="perluSopir" className="text-sm font-heading font-semibold text-[color:var(--color-text-muted)]">
          Perlu Sopir Kantor
        </label>
      </div>

      <FormInput
        label="Keperluan / Tujuan"
        id="keperluan"
        type="textarea"
        required
        value={form.keperluan}
        onChange={(e) => setForm({...form, keperluan: e.target.value})}
        placeholder="Misal: Kunjungan lapangan, meeting..."
      />

      <CounterInput
        label="Jumlah Penumpang"
        value={parseInt(form.jumlahPenumpang) || 1}
        onChange={(val) => setForm({...form, jumlahPenumpang: val})}
        min={1}
        max={100}
      />

      <FormInput
        label="Catatan Tambahan"
        id="catatan"
        type="textarea"
        value={form.catatan}
        onChange={(e) => setForm({...form, catatan: e.target.value})}
        placeholder="Opsional..."
      />

      <div className="mt-8 flex justify-end gap-3 border-t pt-5" style={{ borderColor: 'var(--color-border)' }}>
        <Button type="button" variant="ghost" onClick={onClose}>Batal</Button>
        <Button type="submit" loading={loading} disabled={!form.vehicleId}>
          <Send size={16} /> {isAdmin ? 'Buat Mandatory Booking' : 'Kirim Pengajuan'}
        </Button>
      </div>
    </form>
  );

  return (
    <>
      <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={
          mode === 'list' ? `Agenda: ${selectedDate ? formatDateShort(selectedDate) : ''}` :
          mode === 'select_type' ? 'Buat Peminjaman Baru' :
          mode === 'form_single' ? 'Form Pinjam Sehari' : 'Form Lebih Dari Sehari'
        }
        size="lg"
      >
        {mode === 'list' && renderListMode()}
        {mode === 'select_type' && renderSelectTypeMode()}
        {(mode === 'form_single' || mode === 'form_multiple') && renderFormMode()}
      </Modal>

      {/* Vehicle Detail Sub-modal */}
      {vehicleDetailModal && (
        <Modal
          isOpen={!!vehicleDetailModal}
          onClose={() => setVehicleDetailModal(null)}
          title="Detail Kendaraan"
          size="sm"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-center h-32 rounded-3xl mb-4 overflow-hidden relative" style={{ background: 'var(--color-surface-muted)' }}>
              {vehicleDetailModal.foto ? (
                <img src={vehicleDetailModal.foto} alt={vehicleDetailModal.merek} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <Car size={48} className="text-[color:var(--color-text-soft)] opacity-40" />
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-[color:var(--color-text-soft)]">{vehicleDetailModal.tipe}</p>
              <h3 className="text-xl font-heading font-bold text-[color:var(--color-heading)]">{vehicleDetailModal.merek}</h3>
              <p className="text-lg font-mono font-semibold text-djp-blue mt-1">{vehicleDetailModal.platNomor}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-3 rounded-2xl" style={{ background: 'var(--color-surface-muted)' }}>
                <p className="text-xs text-[color:var(--color-text-soft)]">Kapasitas</p>
                <p className="font-semibold text-[color:var(--color-heading)]">{vehicleDetailModal.kapasitas} Orang</p>
              </div>
              <div className="p-3 rounded-2xl" style={{ background: 'var(--color-surface-muted)' }}>
                <p className="text-xs text-[color:var(--color-text-soft)]">Tahun</p>
                <p className="font-semibold text-[color:var(--color-heading)]">{vehicleDetailModal.tahun || '2020'}</p>
              </div>
              <div className="p-3 rounded-2xl col-span-2" style={{ background: 'var(--color-surface-muted)' }}>
                <p className="text-xs text-[color:var(--color-text-soft)]">KM Terakhir</p>
                <p className="font-semibold text-[color:var(--color-heading)]">{vehicleDetailModal.odometerTerakhir?.toLocaleString() || 0} km</p>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button onClick={() => setVehicleDetailModal(null)} variant="secondary">Tutup Detail</Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
