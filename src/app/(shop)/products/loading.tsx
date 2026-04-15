import { Skeleton } from '@/components/ui/skeleton'

export default function ProductsLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero skeleton */}
      <div className="h-48 lg:h-56 bg-(--color-elevated) animate-pulse" />

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filter sidebar skeleton */}
          <aside className="hidden lg:block lg:w-72 shrink-0 space-y-4">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </aside>

          {/* Product grid skeleton */}
          <div className="flex-1">
            <div className="flex justify-between mb-6">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-9 w-40" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-(--color-border) bg-(--color-surface) overflow-hidden">
                  <div className="aspect-square bg-(--color-elevated) animate-pulse" />
                  <div className="p-3 space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
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
      </div>
    </div>
  )
}
