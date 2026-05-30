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
import { Plus, Edit, Trash2 } from 'lucide-react';
import useFleetManagement from '../../hooks/useFleetManagement';

export default function FleetPage() {
  const { state, actions } = useFleetManagement();
  const { vehicles, modalOpen, editing, form, deleteTarget, isSaving } = state;
  const { setModalOpen, setDeleteTarget, openAdd, openEdit, handleFormChange, handleSave, handleDelete } = actions;

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
                    <img src={v.foto} alt={v.merek} className="h-full w-full object-cover" loading="lazy" />
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 items-end">
          <FormInput label="Nomor Polisi" id="platNomor" required value={form.platNomor || ''} onChange={(e) => handleFormChange('platNomor', e.target.value)} placeholder="Cth: B 1234 CD" />
          <FormInput label="Merek / Model" id="merek" required value={form.merek || ''} onChange={(e) => handleFormChange('merek', e.target.value)} placeholder="Cth: Toyota Avanza" />
          <FormInput label="Tipe Kendaraan" id="tipe" type="select" value={form.tipe || 'Mobil'} onChange={(e) => handleFormChange('tipe', e.target.value)}>
            <option value="Mobil">Mobil</option>
            <option value="Motor">Motor</option>
            <option value="Minibus">Minibus</option>
          </FormInput>
          <FormInput label="Tahun Kendaraan" id="tahun" type="number" required value={form.tahun || ''} onChange={(e) => handleFormChange('tahun', e.target.value ? parseInt(e.target.value) : '')} />
          <FormInput label="Warna" id="warna" value={form.warna || ''} onChange={(e) => handleFormChange('warna', e.target.value)} placeholder="Cth: Hitam" />
          <FormInput label="Kapasitas" id="kapasitas" type="number" value={form.kapasitas || ''} onChange={(e) => handleFormChange('kapasitas', e.target.value ? parseInt(e.target.value) : '')} />
          <FormInput label="Odometer (KM)" id="odometer" type="number" value={form.odometer || ''} onChange={(e) => handleFormChange('odometer', e.target.value ? parseInt(e.target.value) : '')} />
          <FormInput label="Jadwal Pajak" id="jadwalPajak" type="date" value={form.jadwalPajak || ''} onChange={(e) => handleFormChange('jadwalPajak', e.target.value)} />
          <FormInput label="Jadwal Servis Berikutnya" id="jadwalServis" type="date" value={form.jadwalServis || ''} onChange={(e) => handleFormChange('jadwalServis', e.target.value)} />
          <FormInput label="Status" id="status" type="select" value={form.status === VEHICLE_STATUS.IN_USE ? VEHICLE_STATUS.AVAILABLE : form.status} onChange={(e) => handleFormChange('status', e.target.value)}>
            <option value={VEHICLE_STATUS.AVAILABLE}>{VEHICLE_STATUS.AVAILABLE}</option>
            <option value={VEHICLE_STATUS.MAINTENANCE}>{VEHICLE_STATUS.MAINTENANCE}</option>
          </FormInput>
        </div>
        <div className="mt-4">
          <PhotoUploadCard 
            label="Foto Kendaraan (Opsional)" 
            value={form.foto || ''} 
            onChange={(base64) => handleFormChange('foto', base64)} 
            maxSizeMB={1}
          />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Batal</Button>
          <Button onClick={handleSave} loading={isSaving}>{editing ? 'Simpan Perubahan' : 'Tambah Kendaraan'}</Button>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Hapus Kendaraan?" message="Data kendaraan akan dihapus permanen." confirmText="Ya, Hapus" />
    </div>
  );
}
