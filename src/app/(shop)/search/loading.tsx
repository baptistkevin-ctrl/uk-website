import { Skeleton } from '@/components/ui/skeleton'

export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Search bar skeleton */}
        <Skeleton className="h-12 w-full max-w-2xl mx-auto rounded-xl mb-8" />

        {/* Results skeleton */}
        <div className="flex justify-between mb-6">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-(--color-border) bg-(--color-surface) overflow-hidden">
              <div className="aspect-square bg-(--color-elevated) animate-pulse" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-full" />
                <div className="flex justify-between items-center pt-1">
                  <Skeleton className="h-5 w-14" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
