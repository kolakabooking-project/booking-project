/**
 * Skeleton — Base skeleton loading placeholder component.
 * Works in both light and dark mode using CSS custom properties.
 */

function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-[color:var(--color-surface-muted)] ${className}`}
      {...props}
    />
  );
}

/** Multiple text line placeholders */
function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3.5 ${i === lines - 1 ? 'w-3/5' : i % 2 === 0 ? 'w-full' : 'w-4/5'}`}
        />
      ))}
    </div>
  );
}

/** Circle placeholder (avatar) */
function SkeletonCircle({ size = 40, className = '' }) {
  return (
    <Skeleton
      className={`rounded-full flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

/** Card placeholder */
function SkeletonCard({ className = '' }) {
  return (
    <div className={`surface-card p-4 space-y-4 ${className}`}>
      <div className="flex items-center gap-3">
        <SkeletonCircle size={40} />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}

// Attach compound variants
Skeleton.Text = SkeletonText;
Skeleton.Circle = SkeletonCircle;
Skeleton.Card = SkeletonCard;

export default Skeleton;
