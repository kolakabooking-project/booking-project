/**
 * ThemeLogo — renders both logo variants stacked with opacity crossfade.
 * Both images are always in the DOM. The light logo sets the layout size,
 * the dark logo is layered on top with absolute positioning.
 */
export default function ThemeLogo({ lightSrc = '/logocolor.png', darkSrc = '/logo.png', alt = 'Logo BOOKOLAKA', className = 'h-10' }) {
  const fallback = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='40' viewBox='0 0 160 40'%3E%3Crect width='160' height='40' rx='8' fill='rgba(255,255,255,0.1)' stroke='rgba(255,255,255,0.2)' stroke-width='1'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' font-weight='bold' fill='rgba(255,255,255,0.6)'%3ELogo%3C/text%3E%3C/svg%3E";

  return (
    <span data-theme-logo="" className="relative inline-flex items-center">
      {/* Light-mode logo — sets the natural width/height */}
      <img
        src={lightSrc}
        alt={alt}
        data-logo-light=""
        className={`${className} w-auto object-contain`}
        onError={(e) => { e.target.onerror = null; e.target.src = fallback; }}
      />
      {/* Dark-mode logo — layered on top */}
      <img
        src={darkSrc}
        alt=""
        data-logo-dark=""
        className={`${className} w-auto object-contain absolute left-0 top-0`}
        onError={(e) => { e.target.onerror = null; e.target.src = fallback; }}
      />
    </span>
  );
}
