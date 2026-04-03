/**
 * Skeleton loading components for instant perceived performance.
 * Show these instead of a spinner for a more premium feel.
 */

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`card space-y-4 ${className}`}>
      <div className="skeleton h-5 w-1/3 rounded" />
      <div className="space-y-2">
        <div className="skeleton-text" />
        <div className="skeleton-text-sm" />
      </div>
      <div className="flex gap-2">
        <div className="skeleton h-8 w-20 rounded-lg" />
        <div className="skeleton h-8 w-16 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonStatCards({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card flex items-center gap-4">
          <div className="skeleton-circle w-12 h-12" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3 w-16 rounded" />
            <div className="skeleton h-6 w-12 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="card !p-0 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="skeleton h-5 w-32 rounded" />
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            {Array.from({ length: cols }).map((_, j) => (
              <div key={j} className="flex-1">
                <div className={`skeleton h-4 rounded ${j === 0 ? 'w-full' : j === cols - 1 ? 'w-16' : 'w-3/4'}`} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonCourseCard() {
  return (
    <div className="card !p-0 overflow-hidden">
      <div className="skeleton h-40 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-5 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="skeleton-circle w-6 h-6" />
            <div className="skeleton h-3 w-20 rounded" />
          </div>
          <div className="skeleton h-6 w-12 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({ count = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card flex items-center gap-4 !py-4">
          <div className="skeleton-circle w-10 h-10" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-1/3 rounded" />
            <div className="skeleton h-3 w-2/3 rounded" />
          </div>
          <div className="skeleton h-8 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

// Full page skeleton — replaces the spinner Loading component
export default function SkeletonPage() {
  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="skeleton h-7 w-48 rounded" />
          <div className="skeleton h-4 w-32 rounded" />
        </div>
        <div className="skeleton h-10 w-32 rounded-lg" />
      </div>
      <SkeletonStatCards />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
