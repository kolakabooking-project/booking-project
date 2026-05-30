import { useState } from 'react';
import { useRoomBooking } from '../../../contexts/RoomBookingContext';
import { useLoading } from '../../../contexts/LoadingContext';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import FormInput from '../../../components/ui/FormInput';
import PhotoUploadCard from '../../../components/ui/PhotoUploadCard';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import Badge from '../../../components/ui/Badge';
import DataTable from '../../../components/ui/DataTable';
import PageHeader from '../../../components/ui/PageHeader';
import { ROOM_STATUS } from '../../../utils/constants';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Users, Wifi, Tv, MonitorPlay } from 'lucide-react';

const INITIAL = { name: '', lokasi: '', status: ROOM_STATUS.AVAILABLE, photo: '' };

export default function RoomManagementPage() {
  const { rooms, addRoom, updateRoom, deleteRoom } = useRoomBooking();
  const { showLoading, hideLoading } = useLoading();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(INITIAL);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const openAdd = () => { setEditing(null); setForm(INITIAL); setModalOpen(true); };
  const openEdit = (r) => { setEditing(r.id); setForm({ ...r }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name || !form.lokasi) { toast.error('Nama dan lokasi ruangan wajib diisi'); return; }
    setIsSaving(true);
    showLoading(editing ? 'Memperbarui data ruangan...' : 'Menambahkan ruangan baru...');
    try {
      const payload = { ...form };
      if (editing) { await updateRoom(editing, payload); toast.success('Data ruangan diperbarui'); }
      else { await addRoom(payload); toast.success('Ruangan baru ditambahkan'); }
      setModalOpen(false);
    } catch (err) { 
      toast.error(err.message || 'Gagal menyimpan data'); 
    } finally {
      hideLoading();
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      showLoading('Menghapus data ruangan...');
      try { 
        await deleteRoom(deleteTarget); 
        toast.success('Ruangan dihapus'); 
      } catch (err) { 
        toast.error(err.message || 'Gagal menghapus'); 
      } finally {
        hideLoading();
      }
      setDeleteTarget(null);
    }
  };

  const columns = [
    { key: 'ruangan', label: 'Ruangan' },
    { key: 'status', label: 'Status' },
    { key: 'aksi', label: 'Aksi' },
  ];

  return (
    <div className="min-w-0">
      <PageHeader
        title="Manajemen Ruangan"
        subtitle="Kelola ketersediaan, fasilitas, dan detail ruang rapat."
      />
      
      <DataTable
        title="Daftar Ruangan"
        subtitle={`${rooms.length} ruangan tersedia dalam sistem.`}
        columns={columns}
        actions={<Button onClick={openAdd} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"><Plus size={14} />Tambah Ruangan</Button>}
        empty={rooms.length === 0 ? <div className="empty-state">Belum ada ruangan yang terdaftar.</div> : null}
      >
        {rooms.map((r) => (
          <tr key={r.id} className="hover:bg-blue-50/50 transition-colors">
            <td>
              <div className="flex items-center gap-4">
                {r.photo ? (
                  <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-gray-100">
                    <img src={r.photo} alt={r.name} className="h-full w-full object-cover" loading="lazy" />
                  </div>
                ) : (
                  <div className="h-12 w-12 flex-shrink-0 rounded-xl bg-blue-100 flex items-center justify-center text-blue-500 font-bold text-lg border border-blue-200">
                    {r.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-heading font-bold text-[color:var(--color-heading)] text-base">{r.name}</div>
                  <div className="mt-0.5 text-xs text-blue-500 font-medium tracking-wide uppercase">ID: {r.id.slice(-6)}</div>
                </div>
              </div>
            </td>
            <td><Badge status={r.status} /></td>
            <td>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => openEdit(r)} className="hover:border-blue-300 hover:text-blue-600"><Edit size={14} />Edit</Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(r.id)} className="text-red-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={14} /></Button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Ruangan' : 'Tambah Ruangan'} size="lg">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormInput label="Nama Ruangan" id="name" required value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Cth: Ruang Rapat A" />
          <FormInput label="Lokasi" id="lokasi" required value={form.lokasi || ''} onChange={(e) => setForm({ ...form, lokasi: e.target.value })} placeholder="Cth: Lantai 2" />
          <div className="sm:col-span-2">
            <FormInput label="Status" id="status" type="select" value={form.status === ROOM_STATUS.IN_USE ? ROOM_STATUS.AVAILABLE : (form.status || ROOM_STATUS.AVAILABLE)} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value={ROOM_STATUS.AVAILABLE}>{ROOM_STATUS.AVAILABLE}</option>
              <option value={ROOM_STATUS.MAINTENANCE}>{ROOM_STATUS.MAINTENANCE}</option>
            </FormInput>
          </div>
        </div>
        <div className="mt-5">
          <PhotoUploadCard 
            label="Foto Ruangan (Opsional)" 
            value={form.photo || ''} 
            onChange={(base64) => setForm({ ...form, photo: base64 })} 
            maxSizeMB={2}
          />
        </div>
        <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-gray-100">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Batal</Button>
          <Button onClick={handleSave} loading={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20">{editing ? 'Simpan Perubahan' : 'Tambah Ruangan'}</Button>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Hapus Ruangan?" message="Data ruangan beserta histori peminjamannya mungkin akan terpengaruh. Apakah Anda yakin?" confirmText="Ya, Hapus" />
    </div>
  );
}
