/**
 * SkipLink — Accessibility skip navigation link.
 * Visible only when focused (keyboard navigation).
 * Allows screen reader and keyboard users to skip directly to main content.
 */
export default function SkipLink({ targetId = 'main-content', label = 'Langsung ke konten utama' }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[99999] focus:px-4 focus:py-2.5 focus:rounded-xl focus:shadow-lg focus:text-sm focus:font-heading focus:font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2"
      style={{
        background: 'var(--color-surface-elevated)',
        color: 'var(--color-brand)',
        borderColor: 'var(--color-border)',
      }}
    >
      {label}
    </a>
  );
}
