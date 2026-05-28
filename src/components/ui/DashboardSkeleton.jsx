import Skeleton from './Skeleton';

/**
 * DashboardSkeleton — Full-page skeleton matching the dashboard layout.
 * Shows a realistic preview of stats, calendar, showcase, and tracker areas.
 */
export default function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="surface-card p-4 flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>

      {/* Calendar area */}
      <div className="surface-card p-5">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-xl" />
            <Skeleton className="h-8 w-8 rounded-xl" />
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
        </div>
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-4 rounded" />
          ))}
        </div>
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-16 sm:h-20 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Showcase area */}
      <div className="surface-card p-5">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-56">
              <Skeleton className="h-32 rounded-2xl mb-3" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>

      {/* Journey tracker area */}
      <div className="surface-card p-5">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
        <div className="flex items-center gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <Skeleton className="w-12 h-12 rounded-full" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-8 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
