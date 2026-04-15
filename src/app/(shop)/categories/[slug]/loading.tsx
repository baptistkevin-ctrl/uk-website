import { Container } from "@/components/layout/Container";
import { ProductCardSkeleton } from "@/components/ui/ProductCardSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function CategoryLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Category hero banner skeleton */}
      <div className="relative h-[200px] lg:h-[280px] bg-(--color-elevated) animate-pulse">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96 max-w-[80%]" />
        </div>
      </div>

      <Container size="xl" className="py-10">
        {/* Filter bar skeleton */}
        <div className="flex items-center justify-between mb-8">
          <Skeleton className="h-5 w-32" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-28 rounded-lg" />
            <Skeleton className="h-10 w-36 rounded-lg" />
          </div>
        </div>

        {/* Product grid skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>

        {/* Pagination skeleton */}
        <div className="flex items-center justify-center gap-2 mt-10">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-10 w-10 rounded-lg"
            />
          ))}
        </div>
      </Container>
    </div>
  );
}
