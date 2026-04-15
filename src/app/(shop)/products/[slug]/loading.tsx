import { Container } from "@/components/layout/Container";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetailLoading() {
  return (
    <div className="min-h-screen bg-background">
      <Container size="xl" className="py-10">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-2 mb-8">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Two-column PDP layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left: product image */}
          <div className="space-y-4">
            <Skeleton className="aspect-square w-full rounded-2xl" />
            {/* Thumbnail row */}
            <div className="flex gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-20 w-20 rounded-lg"
                />
              ))}
            </div>
          </div>

          {/* Right: product info */}
          <div className="space-y-6">
            {/* Category badge */}
            <Skeleton className="h-6 w-24 rounded-full" />

            {/* Product name */}
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-3/4" />
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-20" />
            </div>

            {/* Price */}
            <Skeleton className="h-10 w-32" />

            {/* Description lines */}
            <div className="space-y-2 pt-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>

            {/* Quantity + Add to cart */}
            <div className="flex items-center gap-4 pt-4">
              <Skeleton className="h-12 w-32 rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>

            {/* Delivery info */}
            <div className="space-y-3 pt-6 border-t border-(--color-border)">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
