import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

interface Product {
  name: string;
  slug: string;
  imageUrl: string;
  price: number;
}

interface FreshProduceFeatureProps {
  products: Product[];
}

export function FreshProduceFeature({ products }: FreshProduceFeatureProps) {
  if (products.length === 0) return null;

  return (
    <section className="py-14 lg:py-24 bg-(--color-surface)">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-(--brand-primary-light) px-3.5 py-1.5 mb-4">
              <Leaf className="h-3.5 w-3.5 text-(--brand-primary)" />
              <span className="text-xs font-semibold text-(--brand-primary) uppercase tracking-wider">
                Farm to Table
              </span>
            </div>
            <h2 className="font-display text-3xl lg:text-4xl font-semibold text-foreground leading-tight">
              Picked Fresh Today
            </h2>
            <p className="mt-3 text-base text-(--color-text-secondary) max-w-lg leading-relaxed">
              Sourced directly from local British farms and delivered within 24 hours.
            </p>
          </div>
          <Link
            href="/categories/fresh-produce"
            className={cn(
              "inline-flex items-center gap-2 shrink-0",
              "bg-(--brand-primary) text-white",
              "rounded-lg px-6 py-3 font-semibold text-sm",
              "shadow-(--shadow-green)",
              "hover:-translate-y-0.5 hover:bg-(--brand-primary-hover)",
              "transition-all duration-200"
            )}
          >
            Shop Fresh Produce
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Product Grid — modern asymmetric layout */}
        <div className="reveal-up grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {products.slice(0, 5).map((product, i) => (
            <Link
              key={product.slug}
              href={`/products/${product.slug}`}
              className={cn(
                "group relative overflow-hidden rounded-2xl",
                "bg-(--color-elevated)",
                "transition-all duration-300 ease-(--ease-premium)",
                "hover:-translate-y-1 hover:shadow-(--shadow-xl)",
                // First item spans 2 cols on desktop
                i === 0 && "lg:col-span-2 lg:row-span-2"
              )}
            >
              <div className={cn(
                "relative w-full",
                i === 0 ? "aspect-square lg:aspect-auto lg:h-full lg:min-h-100" : "aspect-square"
              )}>
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-700 ease-(--ease-premium) group-hover:scale-105"
                    sizes={i === 0 ? "(max-width: 1024px) 50vw, 50vw" : "(max-width: 1024px) 50vw, 25vw"}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-(--color-text-muted) text-4xl">
                    🥬
                  </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-5">
                  {product.price && (
                    <span className="inline-block font-mono text-xs font-bold text-white bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full mb-2">
                      £{product.price.toFixed(2)}
                    </span>
                  )}
                  <h3 className={cn(
                    "font-semibold text-white leading-snug",
                    i === 0 ? "text-lg lg:text-xl" : "text-sm lg:text-base"
                  )}>
                    {product.name}
                  </h3>
                </div>

                {/* Organic badge for first item */}
                {i === 0 && (
                  <div className="absolute top-4 left-4">
                    <span className="inline-flex items-center gap-1 bg-(--brand-primary) text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                      <Leaf className="h-3 w-3" />
                      FRESH
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
