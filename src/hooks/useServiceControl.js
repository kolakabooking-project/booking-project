import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { superadminApi } from '../lib/api';
import { useLoading } from '../contexts/LoadingContext';

export default function useServiceControl() {
  const { showLoading, hideLoading } = useLoading();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null); // 'kdo', 'room', or 'spd'

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

  const SERVICE_LABELS = {
    kdo: 'Booking KDO',
    room: 'Booking Ruangan',
    spd: 'Track SPD',
  };

  const executeToggle = async () => {
    if (!status || !confirmTarget) return;
    
    const label = SERVICE_LABELS[confirmTarget] || confirmTarget;
    let newActive;

    if (confirmTarget === 'kdo') {
      newActive = !status.kdoActive;
    } else if (confirmTarget === 'room') {
      newActive = !status.roomActive;
    } else {
      newActive = !status.spdActive;
    }
    
    setToggling(true);
    setConfirmTarget(null);
    showLoading(newActive ? `Mengaktifkan layanan ${label}...` : `Menonaktifkan layanan ${label}...`);
    
    try {
      const res = await superadminApi.toggleService(
        confirmTarget === 'kdo' ? newActive : undefined,
        confirmTarget === 'room' ? newActive : undefined,
        confirmTarget === 'spd' ? newActive : undefined
      );
      
      setStatus({ 
        ...status, 
        ...(confirmTarget === 'kdo' ? { kdoActive: res.data.kdoActive } : {}),
        ...(confirmTarget === 'room' ? { roomActive: res.data.roomActive } : {}),
        ...(confirmTarget === 'spd' ? { spdActive: res.data.spdActive } : {}),
        updatedAt: res.data.updatedAt 
      });
      
      toast.success(newActive ? `Layanan ${label} diaktifkan` : `Layanan ${label} dinonaktifkan`);
    } catch (err) {
      toast.error(err.message || `Gagal mengubah status layanan ${label}`);
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
