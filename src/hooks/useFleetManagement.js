import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useBooking } from '../contexts/BookingContext';
import { useLoading } from '../contexts/LoadingContext';
import { vehicleApi } from '../lib/api';
import { VEHICLE_STATUS } from '../utils/constants';

const INITIAL_FORM = { 
  platNomor: '', 
  merek: '', 
  tipe: 'Mobil', 
  tahun: new Date().getFullYear(), 
  kapasitas: 7, 
  status: VEHICLE_STATUS.AVAILABLE, 
  odometer: 0, 
  jadwalPajak: '', 
  jadwalServis: '', 
  warna: '', 
  foto: '' 
};

export default function useFleetManagement() {
  const { vehicles, addVehicle, updateVehicle, deleteVehicle } = useBooking();
  const { showLoading, hideLoading } = useLoading();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const openAdd = useCallback(() => { 
    setEditing(null); 
    setForm(INITIAL_FORM); 
    setModalOpen(true); 
  }, []);
  
  // Fetch full vehicle data (including foto) when editing
  const openEdit = useCallback(async (v) => { 
    setEditing(v.id); 
    setForm({ ...v, foto: '' }); // Start with empty foto
    setModalOpen(true);
    // Lazy-load the foto for the edit form
    try {
      const res = await vehicleApi.getById(v.id);
      if (res?.data?.foto) {
        setForm(prev => ({ ...prev, foto: res.data.foto }));
      }
    } catch {
      // Non-critical — form works without foto preview
    }
  }, []);

  const handleFormChange = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = async () => {
    // Basic sanitization and validation
    if (!form.platNomor?.trim() || !form.merek?.trim()) { 
      toast.error('Plat nomor dan merek wajib diisi'); 
      return; 
    }
    
    setIsSaving(true);
    showLoading(editing ? 'Memperbarui data kendaraan...' : 'Menambahkan kendaraan baru...');
    try {
      if (editing) { 
        await updateVehicle(editing, form); 
        toast.success('Data kendaraan diperbarui'); 
      } else { 
        await addVehicle(form); 
        toast.success('Kendaraan baru ditambahkan'); 
      }
      setModalOpen(false);
    } catch (err) { 
      toast.error(err.message || 'Gagal menyimpan data kendaraan'); 
    } finally {
      hideLoading();
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    
    showLoading('Menghapus data kendaraan...');
    try { 
      await deleteVehicle(deleteTarget); 
      toast.success('Kendaraan berhasil dihapus'); 
    } catch (err) { 
      toast.error(err.message || 'Gagal menghapus kendaraan'); 
    } finally {
      hideLoading();
      setDeleteTarget(null);
    }
  };

  return {
    state: {
      vehicles,
      modalOpen,
      editing,
      form,
      deleteTarget,
      isSaving
    },
    actions: {
      setModalOpen,
      setForm,
      setDeleteTarget,
      openAdd,
      openEdit,
      handleFormChange,
      handleSave,
      handleDelete
    }
  };
}
