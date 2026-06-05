import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function useNotifications() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications');
      if (!res.ok) throw new Error('Gagal mengambil notifikasi');
      const data = await res.json();
      return data.data;
    },
    refetchInterval: 60000, // Auto refresh every minute
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
