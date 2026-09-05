import { useQuery } from '@tanstack/react-query';
import { vehicleApi } from '../lib/api';

/**
 * Lazy-loads a single vehicle's photo by ID.
 * Photos are no longer included in getAllVehicles() to save ~5MB of egress per call.
 * Each photo is fetched individually only when the component rendering it mounts.
 *
 * @param {string|null} vehicleId - The vehicle ID to fetch photo for
 * @param {boolean} hasFoto - Whether the vehicle has a photo (from list query)
 * @returns {{ photo: string|null, isLoading: boolean }}
 */
export default function useVehiclePhoto(vehicleId, hasFoto = true) {
  const { data, isLoading } = useQuery({
    queryKey: ['vehicle-photo', vehicleId],
    queryFn: async () => {
      const res = await vehicleApi.getPhoto(vehicleId);
      return res?.data || null;
    },
    enabled: !!vehicleId && hasFoto,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours — photos rarely change
    gcTime: 48 * 60 * 60 * 1000,    // Keep in cache for 48 hours
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return {
    photo: data || null,
    isLoading: isLoading && !!vehicleId && hasFoto,
  };
}
