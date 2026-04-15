import Image from "next/image";
import { cn } from "@/lib/utils";

interface CategoryHeroBannerProps {
  name: string;
  description?: string;
  itemCount?: number;
  imageUrl?: string;
}

export function CategoryHeroBanner({
  name,
  description,
  itemCount,
  imageUrl,
}: CategoryHeroBannerProps) {
  return (
    <div
      className={cn(
        "relative h-[160px] overflow-hidden rounded-2xl lg:h-[200px]",
        !imageUrl &&
          "bg-linear-to-br from-(--brand-primary) to-(--brand-dark)"
      )}
    >
      {imageUrl && (
        <>
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 1200px"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-r from-black/60 via-black/30 to-transparent" />
        </>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6">
        <h1 className="font-display text-2xl font-semibold text-white lg:text-4xl">
          {name}
        </h1>

        {description && (
          <p className="mt-1 line-clamp-2 text-sm text-white/70">
            {description}
          </p>
        )}

        {itemCount != null && (
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-(--color-surface)/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {itemCount.toLocaleString("en-GB")} items
          </span>
        )}
      </div>
    </div>
  );
}
