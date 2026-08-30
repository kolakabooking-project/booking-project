import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sheetsApi } from '../lib/api';
import { useState, useEffect } from 'react';

// ─── Debounce Hook ───
function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ─── Agenda Surat Tugas ───
export function useAgendaST(params = {}) {
  const debouncedSearch = useDebounce(params.search);
  const activeRole = localStorage.getItem('booking_active_role') || 'admin';
  return useQuery({
    queryKey: ['agenda-st', activeRole, { ...params, search: debouncedSearch }],
    queryFn: () => sheetsApi.getAgendaST({ ...params, search: debouncedSearch }),
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

// ─── Rekap SPD ───
export function useRekapSPD(params = {}) {
  const debouncedSearch = useDebounce(params.search);
  const activeRole = localStorage.getItem('booking_active_role') || 'admin';
  return useQuery({
    queryKey: ['rekap-spd', activeRole, { ...params, search: debouncedSearch }],
    queryFn: () => sheetsApi.getRekapSPD({ ...params, search: debouncedSearch }),
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

// ─── SPD Summary ───
export function useSPDSummary() {
  const activeRole = localStorage.getItem('booking_active_role') || 'admin';
  return useQuery({
    queryKey: ['spd-summary', activeRole],
    queryFn: () => sheetsApi.getSPDSummary(),
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Consolidated Tracking Dashboard (single call) ───
export function useTrackingDashboard() {
  const activeRole = localStorage.getItem('booking_active_role') || 'admin';
  return useQuery({
    queryKey: ['tracking-dashboard', activeRole],
    queryFn: () => sheetsApi.getTrackingDashboard(),
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Jadwal Jumat (WFO/WFH) ───
export function useJadwalJumat(params = {}) {
  const debouncedSearch = useDebounce(params.search);
  return useQuery({
    queryKey: ['jadwal-jumat', { ...params, search: debouncedSearch }],
    queryFn: () => sheetsApi.getJadwalJumat({ ...params, search: debouncedSearch }),
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

// ─── Pegawai Cuti ───
export function usePegawaiCuti(params = {}) {
  const debouncedSearch = useDebounce(params.search);
  return useQuery({
    queryKey: ['pegawai-cuti', { ...params, search: debouncedSearch }],
    queryFn: () => sheetsApi.getPegawaiCuti({ ...params, search: debouncedSearch }),
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

// ─── SPD Rankings (Top Frequent Travellers) ───
export function useSPDRankings(params = {}) {
  return useQuery({
    queryKey: ['spd-rankings', params],
    queryFn: () => sheetsApi.getSPDRankings(params),
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

// ─── Refresh Cache (Refreshes ALL sheets data) ───
export function useRefreshCache() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => sheetsApi.refreshCache(),
    onSuccess: async () => {
      // Invalidate all queries related to all sheets data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['agenda-st'], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['rekap-spd'], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['spd-summary'], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['spd-rankings'], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['jadwal-jumat'], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['pegawai-cuti'], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['tracking-dashboard'], refetchType: 'all' }),
      ]);
    },
  });
}
