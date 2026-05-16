/**
 * Vehicle Icons — uses PNG images from public/
 * Automatically switches between dark/light variants based on theme.
 */
import { useTheme } from '../../contexts/ThemeContext';

export function CarIcon({ size = 48, className = '', style = {} }) {
  const { isDark } = useTheme();
  return (
    <img
      src={isDark ? '/icon-car-white.png' : '/icon-car.png'}
      alt=""
      aria-hidden="true"
      width={size}
      height={size * 0.46}
      className={className}
      style={{ objectFit: 'contain', ...style }}
      draggable={false}
    />
  );
}

export function MotorcycleIcon({ size = 42, className = '', style = {} }) {
  const { isDark } = useTheme();
  return (
    <img
      src={isDark ? '/icon-motor-white.png' : '/icon-motor.png'}
      alt=""
      aria-hidden="true"
      width={size}
      height={size * 0.62}
      className={className}
      style={{ objectFit: 'contain', ...style }}
      draggable={false}
    />
  );
}
