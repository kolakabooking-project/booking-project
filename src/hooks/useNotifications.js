import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useAbly } from '../contexts/AblyProvider';

export default function useNotifications() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { subscribe } = useAbly();

  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications');
      if (!res.ok) throw new Error('Gagal mengambil notifikasi');
      const data = await res.json();
      return data.data;
    },
    staleTime: 30_000, // 30s — Ably subscription handles real-time updates
    refetchOnWindowFocus: false,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      if (!res.ok) throw new Error('Gagal memperbarui notifikasi');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/notifications/read-all', { method: 'PUT' });
      if (!res.ok) throw new Error('Gagal memperbarui notifikasi');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  useEffect(() => {
    if (!user || !subscribe) return;

    const unsubscribe = subscribe(`notifications:user_${user.id}`, 'new_notification', (message) => {
      const payload = message.data || {};
      
      // Show toast with unique ID to prevent duplicates if multiple bells are rendered
      toast.info(payload.title || 'Notifikasi Baru', {
        id: message.id || new Date().getTime(),
        description: payload.body || '',
        duration: 1000,
      });

      // Refetch notifications to update badge and list
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    return unsubscribe;
  }, [user, subscribe, queryClient]);

  return {
    notifications: query.data || [],
    unreadCount: (query.data || []).filter(n => !n.isRead).length,
    isLoading: query.isLoading,
    isError: query.isError,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    isMarkingRead: markAsReadMutation.isPending || markAllAsReadMutation.isPending,
  };
}
