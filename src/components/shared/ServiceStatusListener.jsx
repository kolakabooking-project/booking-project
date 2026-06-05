import { useEffect } from 'react';
import { useAbly } from '../../contexts/AblyProvider';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

export default function ServiceStatusListener() {
  const { subscribe } = useAbly();
  const { updateServiceStatuses, user } = useAuth();

  useEffect(() => {
    // Superadmin bypasses maintenance mode, so no need to actively listen for lockouts,
    // but they might still want to see the UI update. We will listen for all users.
    if (!user) return;

    return subscribe('system', 'SERVICE_STATUS_CHANGED', (message) => {
      const newStatuses = message.data;
      if (newStatuses) {
        updateServiceStatuses(newStatuses);
        
        // Show toast notification if we're not superadmin (since superadmin made the change usually)
        if (user.role !== 'superadmin') {
          // You could determine specifically which one changed if we had previous state,
          // but a generic re-evaluation will trigger the MaintenancePage via ProtectedRoute automatically.
        }
      }
    });
  }, [subscribe, user, updateServiceStatuses]);

  return null;
}
