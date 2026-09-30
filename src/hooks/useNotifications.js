import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useAbly } from '../contexts/AblyProvider';
import { notificationApi } from '../lib/api';

export default function useNotifications() {
  const queryClient = useQueryClient();
  const { user, activeRole } = useAuth();
  const { subscribe } = useAbly();

  const query = useQuery({
    queryKey: ['notifications', user?.id, activeRole],
    queryFn: async () => {
      const res = await notificationApi.getAll(activeRole);
      return res?.data || [];
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000, // 1m — Ably subscription handles real-time updates instantly
    refetchOnWindowFocus: true,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id) => {
      return await notificationApi.markAsRead(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return await notificationApi.markAllAsRead();
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
