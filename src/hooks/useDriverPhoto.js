import { useQuery } from '@tanstack/react-query';
import { driverApi } from '../lib/api';

/**
 * Lazy-loads a single driver's photo by ID.
 * Photos are excluded from getAllDrivers() to save egress bandwidth.
 * Each photo is fetched individually only when the component rendering it mounts.
 *
 * @param {string|null} driverId - The driver ID to fetch photo for
 * @param {boolean} hasFoto - Whether the driver has a photo (from list query)
 * @returns {{ photo: string|null, isLoading: boolean }}
 */
export default function useDriverPhoto(driverId, hasFoto = true) {
  const { data, isLoading } = useQuery({
    queryKey: ['driver-photo', driverId],
    queryFn: async () => {
      const res = await driverApi.getPhoto(driverId);
      return res?.data || null;
    },
    enabled: !!driverId && hasFoto,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours — driver photos rarely change
    gcTime: 48 * 60 * 60 * 1000,    // Keep in cache for 48 hours
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return {
    photo: data || null,
    isLoading: isLoading && !!driverId && hasFoto,
  };
}
