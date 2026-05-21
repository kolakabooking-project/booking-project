import { useState } from 'react';
import { useBooking } from '../../contexts/BookingContext';
import { useLoading } from '../../contexts/LoadingContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import FormInput from '../../components/ui/FormInput';
import PhotoUploadCard from '../../components/ui/PhotoUploadCard';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import PageHeader from '../../components/ui/PageHeader';
import { DRIVER_STATUS } from '../../utils/constants';
import { toast } from 'sonner';
import { Plus, Edit, Trash2 } from 'lucide-react';

const INITIAL = { name: '', noHP: '', status: DRIVER_STATUS.AVAILABLE, simJenis: 'SIM A', simExpiry: '', foto: '' };

export default function DriversPage() {
  const { drivers, addDriver, updateDriver, deleteDriver } = useBooking();
  const { showLoading, hideLoading } = useLoading();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(INITIAL);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const openAdd = () => { setEditing(null); setForm(INITIAL); setModalOpen(true); };
  const openEdit = (d) => { setEditing(d.id); setForm({ ...d }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name) { toast.error('Nama wajib diisi'); return; }
    showLoading(editing ? 'Memperbarui data pengemudi...' : 'Menambahkan pengemudi baru...');
    try {
      if (editing) { await updateDriver(editing, form); toast.success('Data pengemudi diperbarui'); }
      else { await addDriver(form); toast.success('Pengemudi baru ditambahkan'); }
      setModalOpen(false);
    } catch (err) { 
      toast.error(err.message || 'Gagal menyimpan data'); 
    } finally {
      hideLoading();
    }
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      showLoading('Menghapus data pengemudi...');
      try { 
        await deleteDriver(deleteTarget); 
        toast.success('Pengemudi dihapus'); 
      } catch (err) { 
        toast.error(err.message || 'Gagal menghapus'); 
      } finally {
        hideLoading();
      }
      setDeleteTarget(null);
    }
  };

  const statusColor = (s) => s === DRIVER_STATUS.AVAILABLE ? 'bg-success-light dark:bg-success/15 text-success' : s === DRIVER_STATUS.ON_DUTY ? 'bg-info-light dark:bg-info/15 text-info' : 'bg-gray-100 dark:bg-gray-700/30 text-gray-500 dark:text-gray-400';

  return (
    <div className="min-w-0">
      <PageHeader
        title="Manajemen pengemudi"
        subtitle="Kelola ketersediaan pengemudi, masa berlaku SIM, dan informasi kontak."
      />

      <div className="mb-6 flex justify-end">
        <Button onClick={openAdd}><Plus size={16} />Tambah Pengemudi</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {drivers.map((d) => (
          <Card key={d.id} hover className="p-5 shadow-sm">
            <div className="mb-3 flex items-start justify-between">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-djp-blue/10 overflow-hidden">
                {d.foto ? (
                  <img src={d.foto} alt={d.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-lg font-heading font-bold text-djp-blue">{d.name.charAt(0)}</span>
                )}
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(d.status)}`}>{d.status}</span>
            </div>
            <h3 className="font-heading font-semibold text-[color:var(--color-heading)]">{d.name}</h3>
            <div className="mt-3 space-y-2 text-sm text-[color:var(--color-text-soft)]">
              <p>{d.noHP || 'Nomor HP belum diisi'}</p>
              <p>{d.simJenis}</p>
              {d.simExpiry && <p>Berlaku sampai {d.simExpiry}</p>}
            </div>
            <div className="mt-4 flex gap-2 border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
              <Button variant="secondary" size="sm" onClick={() => openEdit(d)} className="flex-1"><Edit size={14} />Edit</Button>
              <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(d.id)} className="text-danger"><Trash2 size={14} /></Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Pengemudi' : 'Tambah Pengemudi'}>
        <div className="space-y-4">
          <FormInput label="Nama" id="driver-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <FormInput label="No. HP" id="driver-hp" value={form.noHP} onChange={(e) => setForm({ ...form, noHP: e.target.value })} placeholder="08xxxx" />
          <PhotoUploadCard 
            label="Foto Pengemudi (Opsional)" 
            value={form.foto || ''} 
            onChange={(base64) => setForm({ ...form, foto: base64 })} 
            maxSizeMB={1}
          />
          <FormInput label="Jenis SIM" id="driver-sim" type="select" value={form.simJenis} onChange={(e) => setForm({ ...form, simJenis: e.target.value })}>
            <option value="SIM A">SIM A</option><option value="SIM C">SIM C</option><option value="SIM A & C">SIM A & C</option>
          </FormInput>
          <FormInput label="Masa Berlaku SIM" id="driver-exp" type="date" value={form.simExpiry} onChange={(e) => setForm({ ...form, simExpiry: e.target.value })} />
          <FormInput label="Status" id="driver-status" type="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {Object.values(DRIVER_STATUS).map((s) => <option key={s} value={s}>{s}</option>)}
          </FormInput>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Batal</Button>
          <Button onClick={handleSave}>{editing ? 'Simpan' : 'Tambah'}</Button>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Hapus Pengemudi?" message="Data pengemudi akan dihapus." confirmText="Ya, Hapus" />
    </div>
  );
}
