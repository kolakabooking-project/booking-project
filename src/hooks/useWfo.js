import { useQuery } from '@tanstack/react-query';

export function useWfoSchedule(date) {
  return useQuery({
    queryKey: ['wfo-schedule', date],
    queryFn: async () => {
      const res = await fetch(`/api/wfo/${date}`);
      if (!res.ok) throw new Error('Gagal mengambil data jadwal WFO');
      return res.json();
    },
    enabled: !!date,
    staleTime: 5 * 60 * 1000,
  });
}
