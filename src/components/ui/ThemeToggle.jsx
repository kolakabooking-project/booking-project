import { Moon, SunMedium } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function ThemeToggle({ className = '', iconOnly = false }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Aktifkan tema terang' : 'Aktifkan tema gelap'}
      aria-pressed={isDark}
      className={`inline-flex h-11 items-center ${iconOnly ? 'w-11 justify-center' : 'gap-2 px-3.5'} rounded-full border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-elevated)] text-sm font-heading font-semibold text-[color:var(--color-text-main)] shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[color:var(--color-brand-soft)] hover:text-[color:var(--color-brand)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-focus)] focus:ring-offset-2 focus:ring-offset-[color:var(--color-surface-elevated)] ${className}`}
    >
      <span className={`flex h-7 w-7 items-center justify-center rounded-full ${isDark ? 'bg-djp-yellow/15 text-djp-yellow' : 'bg-blue-400/20 text-blue-400'}`}>
        {isDark ? <SunMedium size={16} /> : <Moon size={16} />}
      </span>
      {!iconOnly && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
    </button>
  );
}
