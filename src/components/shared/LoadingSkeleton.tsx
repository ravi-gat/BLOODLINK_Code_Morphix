export function SkeletonCard() {
  return (
    <div className="bg-card rounded-2xl border border-border p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-muted" />
        <div className="w-14 h-5 rounded-full bg-muted" />
      </div>
      <div className="w-24 h-7 rounded-lg bg-muted mb-2" />
      <div className="w-32 h-4 rounded bg-muted" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="w-40 h-4 rounded bg-muted" />
        <div className="w-24 h-3 rounded bg-muted" />
      </div>
      <div className="w-16 h-5 rounded-full bg-muted" />
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="space-y-6">
      <div className="w-64 h-7 rounded-lg bg-muted animate-pulse" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <div className="bg-card rounded-2xl border border-border p-6 animate-pulse">
        <div className="w-48 h-5 rounded bg-muted mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Default export for easier usage
export const LoadingSkeleton = {
  SkeletonCard,
  SkeletonRow,
  SkeletonPage,
};

export default LoadingSkeleton;
