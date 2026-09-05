import useVehiclePhoto from '../../hooks/useVehiclePhoto';

/**
 * Lazy-loaded vehicle photo component.
 * Fetches the photo only when mounted, keeping getAllVehicles() lightweight.
 *
 * @param {string} vehicleId - Vehicle ID
 * @param {boolean} hasFoto - Whether the vehicle has a photo (from hasFoto field)
 * @param {string} alt - Alt text for the image
 * @param {string} className - CSS class for the img element
 * @param {object} style - Inline styles for the img element
 * @param {React.ReactNode} fallback - Fallback content when no photo exists
 * @param {React.ReactNode} skeleton - Loading skeleton (optional)
 */
export default function VehiclePhoto({ vehicleId, hasFoto = true, alt = '', className = '', style = {}, fallback = null, skeleton = null }) {
  const { photo, isLoading } = useVehiclePhoto(vehicleId, hasFoto);

  if (!hasFoto) return fallback;
  if (isLoading) return skeleton || (
    <div className={className} style={{ ...style, background: 'var(--color-surface-muted)', animation: 'pulse 1.5s ease-in-out infinite' }} />
  );
  if (!photo) return fallback;

  return <img src={photo} alt={alt} className={className} style={style} loading="lazy" />;
}
