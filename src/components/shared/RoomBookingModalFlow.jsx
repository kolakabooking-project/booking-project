import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRoomBooking } from '../../contexts/RoomBookingContext';
import { useLoading } from '../../contexts/LoadingContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import FormInput from '../ui/FormInput';
import CounterInput from '../ui/CounterInput';
import { Plus, ArrowLeft, Building2, Info, Send, Search, CheckCircle, Users } from 'lucide-react';
import { formatTime, formatDateShort } from '../../utils/helpers';
import { toast } from 'sonner';

export default function RoomBookingModalFlow({ isOpen, onClose, selectedDate, dateBookings = [], isAdmin = false }) {
  const { user } = useAuth();
  const { createRoomBooking, createMandatoryRoomBooking, getAvailableRooms, getRoomBookingsForDate } = useRoomBooking();
  const { showLoading, hideLoading } = useLoading();
  
  const [mode, setMode] = useState('list'); // 'list', 'form'
  const [loading, setLoading] = useState(false);
  const [availChecked, setAvailChecked] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [roomDetailModal, setRoomDetailModal] = useState(null);

  const [form, setForm] = useState({
    startTime: '',
    endTime: '',
    startDate: '',
    roomId: '',
    keperluan: '',
    jumlahPeserta: 5,
    catatan: '',
    adminUserName: 'Admin', // default for admin
  });

  const selectedDateBookings = useMemo(() => {
    if (!form.startDate || !getRoomBookingsForDate) return [];
    
    const dateObj = new Date(`${form.startDate}T12:00:00`); 
    
    return getRoomBookingsForDate(dateObj).filter(b => 
      b.status === 'Berlangsung' || b.status === 'Disetujui'
    ).sort((a,b) => new Date(a.startTime) - new Date(b.startTime));
  }, [form.startDate, getRoomBookingsForDate]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isOpen) {
      setMode(isAdmin || !selectedDate ? 'form' : 'list');
      setAvailChecked(false);
      setAvailableRooms([]);
      setRoomDetailModal(null);
      
      const targetDate = selectedDate || new Date();
      const yyyy = targetDate.getFullYear();
      const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
      const dd = String(targetDate.getDate()).padStart(2, '0');
      const formattedDate = `${yyyy}-${mm}-${dd}`;
      
      setForm({
        startTime: '',
        endTime: '',
        startDate: formattedDate,
        roomId: '',
        keperluan: '',
        jumlahPeserta: 5,
        catatan: '',
        adminUserName: 'Admin',
      });
    }
  }, [isOpen, selectedDate, isAdmin]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleCheckAvailability = () => {
    if (!form.startTime || !form.endTime) {
      toast.error('Isi waktu mulai dan selesai terlebih dahulu');
      return;
    }
    if (form.startTime >= form.endTime) {
      toast.error('Waktu selesai harus setelah waktu mulai');
      return;
    }
    
    const startIso = new Date(`${form.startDate}T${form.startTime}:00`).toISOString();
    const endIso = new Date(`${form.startDate}T${form.endTime}:00`).toISOString();

    const avail = getAvailableRooms(startIso, endIso);
    setAvailableRooms(avail);
    setAvailChecked(true);
    setForm(prev => ({ ...prev, roomId: '' })); // reset selected room
    
    if (avail.length === 0) {
      toast.error('Tidak ada ruangan tersedia pada jadwal tersebut');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.roomId) {
      toast.error('Pilih ruangan terlebih dahulu');
      return;
    }

    setLoading(true);
    showLoading(isAdmin ? 'Membuat mandatory booking...' : 'Mengirim pengajuan ruangan...');

    const startIso = new Date(`${form.startDate}T${form.startTime}:00`).toISOString();
    const endIso = new Date(`${form.startDate}T${form.endTime}:00`).toISOString();

    const bookingPayload = {
      userId: user.id,
      userName: isAdmin ? form.adminUserName : user.name,
      startTime: startIso,
      endTime: endIso,
      keperluan: form.keperluan,
      jumlahPeserta: parseInt(form.jumlahPeserta),
      roomId: form.roomId,
      catatan: form.catatan,
    };

    try {
      if (isAdmin) {
        await createMandatoryRoomBooking(bookingPayload);
      } else {
        await createRoomBooking(bookingPayload);
      }

      toast.success('Peminjaman Ruangan Berhasil Dibuat');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Gagal membuat peminjaman ruangan');
    } finally {
      setLoading(false);
      hideLoading();
    }
  };

  const renderListMode = () => (
    <div className="space-y-4">
      {dateBookings.length === 0 ? (
        <div className="text-center py-8">
          <Building2 size={48} className="mx-auto text-blue-500/40 mb-3" />
          <p className="text-[color:var(--color-text-soft)] text-sm">Semua ruangan tersedia pada tanggal ini.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="mb-3 text-sm font-semibold text-gray-500">
            {dateBookings.length} aktivitas di ruangan pada tanggal ini:
          </p>
          {dateBookings.map((b) => (
            <div key={b.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-heading font-bold text-gray-900 dark:text-white truncate pr-2">{b.userName}</span>
                <Badge status={b.status} />
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md">
                  {formatTime(b.startTime)} - {formatTime(b.endTime)}
                </p>
                {b.roomName && (
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1"><Building2 size={12}/> {b.roomName}</p>
                )}
              </div>
              <p className="mt-2 text-xs font-medium text-gray-600 dark:text-gray-400">{b.keperluan}</p>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-6 border-t pt-5 border-gray-100 dark:border-gray-800 flex justify-end">
        <Button onClick={() => setMode('form')} size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20">
          <Plus size={16} />
          Buat Peminjaman Ruang
        </Button>
      </div>
    </div>
  );

  const renderFormMode = () => (
    <form onSubmit={handleSubmit} className="space-y-5">
      {!isAdmin && selectedDate && (
        <button type="button" onClick={() => setMode('list')} className="text-sm font-semibold text-gray-500 flex items-center gap-1 hover:text-blue-600 transition-colors mb-2">
          <ArrowLeft size={16} /> Kembali
        </button>
      )}

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
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-end">
        <FormInput
          label="Tanggal Booking"
          id="startDate"
          type="date"
          required
          value={form.startDate}
          disabled={!!selectedDate && !isAdmin}
          onChange={(e) => { setForm({...form, startDate: e.target.value}); setAvailChecked(false); }}
        />
        <div className="grid grid-cols-2 gap-4 items-end">
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
          <div className="mt-2 bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30 col-span-1 sm:col-span-2">
            <div className="flex items-center gap-2 mb-3 text-blue-900 dark:text-blue-300 font-bold text-sm">
              <Info size={16} className="text-blue-600" />
              <span>Jadwal Ruangan Terisi Hari Ini</span>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
              {selectedDateBookings.map(b => (
                <div key={b.id} className="text-xs text-blue-800 dark:text-blue-200 flex justify-between items-center border-b border-blue-200/50 dark:border-blue-800/50 pb-1.5 last:border-0 last:pb-0">
                  <span className="font-mono font-semibold bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded">{formatTime(b.startTime)} - {formatTime(b.endTime)}</span>
                  <span className="font-bold text-right truncate pl-2">{b.roomName}</span>
                </div>
              ))}
            </div>
            {availChecked && availableRooms.length === 0 && (
              <div className="mt-3 text-xs text-red-600 font-bold p-3 bg-red-100/50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800/30">
                🚨 Tidak ada ruangan tersedia. Silakan cari celah waktu kosong dari jadwal di atas.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-heading font-bold text-gray-700 dark:text-gray-300">
            Pilih Ruangan <span className="text-red-500">*</span>
          </label>
          <Button type="button" variant="secondary" size="sm" onClick={handleCheckAvailability} className="bg-white hover:bg-gray-50 border-gray-200 text-gray-700 shadow-sm">
            <Search size={14} /> Cek Ruang Kosong
          </Button>
        </div>
        
        {!availChecked ? (
          <div className="w-full rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 p-6 text-center text-gray-500 font-medium text-sm bg-gray-50 dark:bg-gray-900/50 transition-all">
            Klik tombol "Cek Ruang Kosong" untuk melihat daftar ruangan yang tersedia.
          </div>
        ) : availableRooms.length === 0 ? (
          <div className="w-full rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-600 font-bold text-sm shadow-inner">
            Maaf, semua ruangan sudah penuh pada waktu tersebut.
          </div>
        ) : (
          <div className="w-full rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden max-h-60 overflow-y-auto shadow-inner bg-white dark:bg-gray-900">
            {availableRooms.map(r => (
              <div key={r.id} className={`flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 last:border-0 transition-colors ${form.roomId === r.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border-l-4 border-l-transparent'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 overflow-hidden border border-blue-200">
                    {r.photo ? <img src={r.photo} alt={r.name} className="w-full h-full object-cover" /> : <Building2 size={20} />}
                  </div>
                  <div>
                    <p className="font-heading font-extrabold text-gray-900 dark:text-white text-sm">
                      {r.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    type="button" 
                    onClick={() => setRoomDetailModal(r)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    title="Detail Fasilitas"
                  >
                    <Info size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({...form, roomId: r.id})}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                      form.roomId === r.id 
                        ? 'bg-blue-600 text-white shadow-blue-500/30' 
                        : 'bg-white text-gray-600 hover:text-blue-600 border border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {form.roomId === r.id ? <span className="flex items-center gap-1.5"><CheckCircle size={14}/> Dipilih</span> : 'Pilih'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <FormInput
        label="Nama Agenda / Keperluan"
        id="keperluan"
        type="textarea"
        required
        value={form.keperluan}
        onChange={(e) => setForm({...form, keperluan: e.target.value})}
        placeholder="Misal: Rapat Koordinasi Bulanan..."
      />

      <div className="grid grid-cols-2 gap-5 items-end">
        <CounterInput
          label="Jumlah Peserta"
          value={parseInt(form.jumlahPeserta) || 1}
          onChange={(val) => setForm({...form, jumlahPeserta: val})}
          min={1}
          max={200}
        />
        <FormInput
          label="Catatan (Opsional)"
          id="catatan"
          type="text"
          value={form.catatan}
          onChange={(e) => setForm({...form, catatan: e.target.value})}
          placeholder="Misal: Tolong siapkan proyektor..."
        />
      </div>

      <div className="mt-8 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 pt-5">
        <Button type="button" variant="ghost" onClick={onClose} className="font-semibold text-gray-600 hover:bg-gray-100">Batal</Button>
        <Button type="submit" loading={loading} disabled={!form.roomId} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 px-6">
          <Send size={16} /> {isAdmin ? 'Booking Wajib' : 'Booking Ruangan Sekarang'}
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
          mode === 'list' ? `Jadwal Ruangan: ${selectedDate ? formatDateShort(selectedDate) : ''}` : 'Booking Ruang Rapat'
        }
        size="lg"
      >
        <div className="p-1">
          {mode === 'list' && renderListMode()}
          {mode === 'form' && renderFormMode()}
        </div>
      </Modal>

      {roomDetailModal && (
        <Modal
          isOpen={!!roomDetailModal}
          onClose={() => setRoomDetailModal(null)}
          title="Detail Fasilitas Ruangan"
          size="sm"
        >
          <div className="space-y-5 p-2">
            <div className="flex items-center justify-center h-40 rounded-2xl mb-2 overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
              {roomDetailModal.photo ? (
                <img src={roomDetailModal.photo} alt={roomDetailModal.name} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <Building2 size={64} className="text-blue-500/30" />
              )}
            </div>
            
            <div className="text-center">
              <h3 className="text-2xl font-heading font-extrabold text-gray-900 dark:text-white">{roomDetailModal.name}</h3>
            </div>
            
            <div className="flex justify-end mt-8 pt-4 border-t border-gray-100">
              <Button onClick={() => setRoomDetailModal(null)} variant="secondary" className="w-full">Tutup Detail</Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
