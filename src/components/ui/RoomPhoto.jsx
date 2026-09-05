import useRoomPhoto from '../../hooks/useRoomPhoto';

/**
 * Lazy-loaded room photo component.
 * Fetches the photo only when mounted, keeping getAllRooms() lightweight.
 *
 * @param {string} roomId - The room ID
 * @param {boolean} hasFoto - Whether the room has a photo (from hasFoto field)
 * @param {string} alt - Image alt text
 * @param {string} className - CSS classes for the img tag
 * @param {object} style - Inline styles for the img tag
 * @param {React.ReactNode} fallback - Fallback content when no photo exists
 * @param {React.ReactNode} skeleton - Custom skeleton loader while photo is fetching
 */
export default function RoomPhoto({ roomId, hasFoto = true, alt = '', className = '', style = {}, fallback = null, skeleton = null }) {
  const { photo, isLoading } = useRoomPhoto(roomId, hasFoto);

  if (!hasFoto) return fallback;

  if (isLoading) {
    return skeleton || (
      <div 
        className={`animate-pulse bg-gray-200 dark:bg-gray-700/50 rounded-lg flex items-center justify-center ${className}`}
        style={style}
      >
        <span className="sr-only">Memuat foto ruangan...</span>
      </div>
    );
  }

  if (!photo) return fallback;

  return (
    <img
      src={photo}
      alt={alt}
      className={className}
      style={style}
      loading="lazy"
    />
  );
}
