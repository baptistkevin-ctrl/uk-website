export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface)">
      {/* Image area */}
      <div className="aspect-square bg-(--color-elevated)" />

      {/* Content area */}
      <div className="space-y-3 p-4">
        {/* Category */}
        <div className="h-3 w-16 rounded-full bg-(--color-elevated)" />

        {/* Name line 1 */}
        <div className="h-4 w-full rounded bg-(--color-elevated)" />

        {/* Name line 2 */}
        <div className="h-4 w-3/4 rounded bg-(--color-elevated)" />

        {/* Bottom row */}
        <div className="flex items-center justify-between pt-2">
          {/* Price */}
          <div className="h-5 w-16 rounded bg-(--color-elevated)" />

          {/* Button */}
          <div className="h-9 w-28 rounded-lg bg-(--color-elevated)" />
        </div>
      </div>
    </div>
  );
}
