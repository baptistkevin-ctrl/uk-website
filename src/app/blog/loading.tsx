import { Container } from "@/components/layout/Container";
import { Skeleton } from "@/components/ui/skeleton";

export default function BlogLoading() {
  return (
    <div className="min-h-screen bg-background">
      <Container size="xl" className="py-12">
        {/* Page heading */}
        <div className="text-center mb-12">
          <Skeleton className="h-10 w-48 mx-auto mb-4" />
          <Skeleton className="h-5 w-80 mx-auto" />
        </div>

        {/* Blog post grid: 3 columns x 2 rows */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-(--color-border) bg-(--color-surface) overflow-hidden animate-pulse"
            >
              {/* Featured image */}
              <div className="aspect-16/9 bg-(--color-elevated)" />

              {/* Card content */}
              <div className="p-5 space-y-3">
                {/* Category + date */}
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>

                {/* Title */}
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-4/5" />

                {/* Excerpt */}
                <div className="space-y-2 pt-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>

                {/* Author */}
                <div className="flex items-center gap-3 pt-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
