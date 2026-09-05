import { useQuery } from '@tanstack/react-query';
import { roomApi } from '../lib/api';

/**
 * Lazy-loads a single room's photo by ID.
 * Photos are excluded from getAllRooms() to save egress bandwidth.
 * Each photo is fetched individually only when the component rendering it mounts.
 *
 * @param {string|null} roomId - The room ID to fetch photo for
 * @param {boolean} hasFoto - Whether the room has a photo (from list query)
 * @returns {{ photo: string|null, isLoading: boolean }}
 */
export default function useRoomPhoto(roomId, hasFoto = true) {
  const { data, isLoading } = useQuery({
    queryKey: ['room-photo', roomId],
    queryFn: async () => {
      const res = await roomApi.getPhoto(roomId);
      return res?.data || null;
    },
    enabled: !!roomId && hasFoto,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours — room photos rarely change
    gcTime: 48 * 60 * 60 * 1000,    // Keep in cache for 48 hours
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return {
    photo: data || null,
    isLoading: isLoading && !!roomId && hasFoto,
  };
}
