import { Container } from "@/components/layout/Container";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero skeleton */}
      <div className="h-[320px] lg:h-[480px] bg-(--color-elevated) animate-pulse" />

      {/* Category grid skeleton */}
      <Container size="xl" className="py-12">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton
              key={i}
              className="aspect-4/3 rounded-xl"
            />
          ))}
        </div>
      </Container>

      {/* Products skeleton */}
      <Container size="xl" className="py-12">
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-(--color-border) bg-(--color-surface) overflow-hidden animate-pulse"
            >
              <div className="aspect-square bg-(--color-elevated)" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
