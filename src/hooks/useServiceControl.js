import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { superadminApi } from '../lib/api';
import { useLoading } from '../contexts/LoadingContext';

export default function useServiceControl() {
  const { showLoading, hideLoading } = useLoading();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null); // 'kdo' or 'room'

  const fetchStatus = useCallback(async () => {
    try {
      const res = await superadminApi.getServiceStatus();
      setStatus(res.data);
    } catch {
      toast.error('Gagal memuat status layanan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const handleToggleConfirm = (target) => {
    setConfirmTarget(target);
  };

  const executeToggle = async () => {
    if (!status || !confirmTarget) return;
    
    const isKdo = confirmTarget === 'kdo';
    const newActive = isKdo ? !status.kdoActive : !status.roomActive;
    
    setToggling(true);
    setConfirmTarget(null);
    showLoading(newActive ? `Mengaktifkan layanan Booking ${isKdo ? 'KDO' : 'Ruangan'}...` : `Menonaktifkan layanan Booking ${isKdo ? 'KDO' : 'Ruangan'}...`);
    
    try {
      const res = await superadminApi.toggleService(
        isKdo ? newActive : undefined,
        !isKdo ? newActive : undefined
      );
      
      setStatus({ 
        ...status, 
        ...(isKdo ? { kdoActive: res.data.kdoActive } : { roomActive: res.data.roomActive }),
        updatedAt: res.data.updatedAt 
      });
      
      toast.success(newActive ? `Layanan Booking ${isKdo ? 'KDO' : 'Ruangan'} diaktifkan` : `Layanan Booking ${isKdo ? 'KDO' : 'Ruangan'} dinonaktifkan`);
    } catch (err) {
      toast.error(err.message || `Gagal mengubah status layanan ${isKdo ? 'KDO' : 'Ruangan'}`);
    } finally {
      setToggling(false);
      hideLoading();
    }
  };

  return {
    state: {
      status, loading, toggling, confirmTarget
    },
    actions: {
      handleToggleConfirm,
      executeToggle,
      cancelToggle: () => setConfirmTarget(null)
    }
  };
}
