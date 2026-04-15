import { Skeleton } from '@/components/ui/skeleton'

export default function CartLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 max-w-5xl">
        <Skeleton className="h-8 w-36 mb-8" />
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart items skeleton */}
          <div className="flex-1 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3 rounded-lg border border-(--color-border) bg-(--color-surface) p-3">
                <Skeleton className="h-16 w-16 rounded-md shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-20" />
                  <div className="flex justify-between">
                    <Skeleton className="h-9 w-28 rounded-md" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Summary skeleton */}
          <div className="lg:w-80">
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
