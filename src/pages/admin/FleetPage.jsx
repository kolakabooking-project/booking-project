import { useState } from 'react';
import { useBooking } from '../../contexts/BookingContext';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import FormInput from '../../components/ui/FormInput';
import PhotoUploadCard from '../../components/ui/PhotoUploadCard';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import PageHeader from '../../components/ui/PageHeader';
import { VEHICLE_STATUS } from '../../utils/constants';
import { formatDateShort } from '../../utils/helpers';
import { toast } from 'sonner';
import { Plus, Edit, Trash2 } from 'lucide-react';

const INITIAL = { platNomor: '', merek: '', tipe: 'Mobil', tahun: new Date().getFullYear(), kapasitas: 7, status: VEHICLE_STATUS.AVAILABLE, odometer: 0, jadwalPajak: '', jadwalServis: '', warna: '', foto: '' };

export default function FleetPage() {
  const { vehicles, addVehicle, updateVehicle, deleteVehicle } = useBooking();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(INITIAL);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const openAdd = () => { setEditing(null); setForm(INITIAL); setModalOpen(true); };
  const openEdit = (v) => { setEditing(v.id); setForm({ ...v }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.platNomor || !form.merek) { toast.error('Plat nomor dan merek wajib diisi'); return; }
    try {
      if (editing) { await updateVehicle(editing, form); toast.success('Data kendaraan diperbarui'); }
      else { await addVehicle(form); toast.success('Kendaraan baru ditambahkan'); }
      setModalOpen(false);
    } catch (err) { toast.error(err.message || 'Gagal menyimpan data'); }
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      try { await deleteVehicle(deleteTarget); toast.success('Kendaraan dihapus'); } catch (err) { toast.error(err.message || 'Gagal menghapus'); }
      setDeleteTarget(null);
    }
  };

  const columns = [
    { key: 'plat', label: 'Plat Nomor' },
    { key: 'kendaraan', label: 'Kendaraan' },
    { key: 'tahun', label: 'Tahun' },
    { key: 'kapasitas', label: 'Kapasitas' },
    { key: 'status', label: 'Status' },
    { key: 'km', label: 'Odometer' },
    { key: 'jadwal', label: 'Jadwal Penting' },
    { key: 'aksi', label: 'Aksi' },
  ];

  return (
    <div className="min-w-0">
      <PageHeader
        title="Inventaris kendaraan dinas"
        subtitle="Perbarui data, status, dan jadwal kendaraan."
      />
      <DataTable
        title="Inventaris kendaraan"
        subtitle={`${vehicles.length} unit terdaftar dalam sistem.`}
        columns={columns}
        actions={<Button onClick={openAdd} size="sm"><Plus size={14} />Tambah Kendaraan</Button>}
        empty={vehicles.length === 0 ? <div className="empty-state">Belum ada kendaraan yang terdaftar.</div> : null}
      >
        {vehicles.map((v) => (
          <tr key={v.id}>
            <td className="font-mono font-semibold text-djp-blue">{v.platNomor}</td>
            <td>
              <div className="flex items-center gap-3">
                {v.foto && (
                  <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800">
                    <img src={v.foto} alt={v.merek} className="h-full w-full object-cover" />
                  </div>
                )}
                <div>
                  <div className="font-heading font-bold text-[color:var(--color-heading)]">{v.merek}</div>
                  <div className="mt-0.5 text-xs text-[color:var(--color-text-soft)]">{v.tipe} • {v.warna || 'Warna belum diisi'}</div>
                </div>
              </div>
            </td>
            <td>{v.tahun}</td>
            <td>{v.kapasitas} seat</td>
            <td><Badge status={v.status} /></td>
            <td>{v.odometer?.toLocaleString()} km</td>
            <td>
              <div className="text-xs text-[color:var(--color-text-soft)]">Pajak: {v.jadwalPajak ? formatDateShort(v.jadwalPajak) : '-'}</div>
              <div className="mt-1 text-xs text-[color:var(--color-text-soft)]">Servis: {v.jadwalServis ? formatDateShort(v.jadwalServis) : '-'}</div>
            </td>
            <td>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => openEdit(v)}><Edit size={14} />Edit</Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(v.id)} className="text-danger hover:text-danger"><Trash2 size={14} /></Button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Kendaraan' : 'Tambah Kendaraan'} size="lg">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInput label="Nomor Polisi" id="platNomor" required value={form.platNomor} onChange={(e) => setForm({ ...form, platNomor: e.target.value })} placeholder="DT 1234 AB" />
          <FormInput label="Merek/Tipe" id="merek" required value={form.merek} onChange={(e) => setForm({ ...form, merek: e.target.value })} placeholder="Toyota Avanza" />
          <FormInput label="Jenis" id="tipe" type="select" value={form.tipe} onChange={(e) => setForm({ ...form, tipe: e.target.value })}><option value="Mobil">Mobil</option><option value="Motor">Motor</option></FormInput>
          <FormInput label="Tahun" id="tahun" type="number" value={form.tahun} onChange={(e) => setForm({ ...form, tahun: parseInt(e.target.value) })} />
          <FormInput label="Kapasitas" id="kapasitas" type="number" value={form.kapasitas} onChange={(e) => setForm({ ...form, kapasitas: parseInt(e.target.value) })} />
          <FormInput label="Warna" id="warna" value={form.warna} onChange={(e) => setForm({ ...form, warna: e.target.value })} placeholder="Hitam" />
          <FormInput label="Odometer (KM)" id="odometer" type="number" value={form.odometer} onChange={(e) => setForm({ ...form, odometer: parseInt(e.target.value) })} />
          <FormInput label="Status" id="status" type="select" value={form.status === VEHICLE_STATUS.IN_USE ? VEHICLE_STATUS.AVAILABLE : form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value={VEHICLE_STATUS.AVAILABLE}>{VEHICLE_STATUS.AVAILABLE}</option>
            <option value={VEHICLE_STATUS.MAINTENANCE}>{VEHICLE_STATUS.MAINTENANCE}</option>
          </FormInput>
          <FormInput label="Jadwal Pajak" id="jadwalPajak" type="date" value={form.jadwalPajak} onChange={(e) => setForm({ ...form, jadwalPajak: e.target.value })} />
          <FormInput label="Jadwal Servis" id="jadwalServis" type="date" value={form.jadwalServis} onChange={(e) => setForm({ ...form, jadwalServis: e.target.value })} />
        </div>
        <div className="mt-4">
          <PhotoUploadCard 
            label="Foto Kendaraan (Opsional)" 
            value={form.foto || ''} 
            onChange={(base64) => setForm({ ...form, foto: base64 })} 
            maxSizeMB={1}
          />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Batal</Button>
          <Button onClick={handleSave}>{editing ? 'Simpan Perubahan' : 'Tambah Kendaraan'}</Button>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Hapus Kendaraan?" message="Data kendaraan akan dihapus permanen." confirmText="Ya, Hapus" />
    </div>
  );
}
