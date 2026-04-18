import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const MOOD_CARDS = [
  {
    title: "Quick & Easy",
    subtitle: "Ready in under 15 minutes",
    tag: "⚡ Fast",
    href: "/recipes?category=Quick+Meals",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80&auto=format&fit=crop",
    overlayFrom: "from-black/70",
  },
  {
    title: "Healthy Living",
    subtitle: "Organic, nutritious picks",
    tag: "🌿 Organic",
    href: "/products?is_organic=true",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80&auto=format&fit=crop",
    overlayFrom: "from-black/70",
  },
  {
    title: "Weekend Feast",
    subtitle: "Cook something special",
    tag: "👨‍🍳 Premium",
    href: "/recipes",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80&auto=format&fit=crop",
    overlayFrom: "from-black/70",
  },
  {
    title: "Budget Friendly",
    subtitle: "Great value under £2",
    tag: "💰 Value",
    href: "/products?sort=price_asc",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80&auto=format&fit=crop",
    overlayFrom: "from-black/70",
  },
] as const;

export function ShopByMood() {
  return (
    <section className="py-14 lg:py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl lg:text-4xl font-semibold text-foreground">
            Shop by Mood
          </h2>
          <p className="mt-2 text-base text-(--color-text-muted)">
            What are you in the mood for today?
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
          {MOOD_CARDS.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="group relative rounded-2xl overflow-hidden aspect-3/4 sm:aspect-4/5"
            >
              {/* Background Image */}
              <Image
                src={card.image}
                alt={card.title}
                fill
                className="object-cover transition-transform duration-700 ease-(--ease-premium) group-hover:scale-110"
                sizes="(max-width: 640px) 50vw, 25vw"
              />

              {/* Gradient Overlay */}
              <div className={cn(
                "absolute inset-0 bg-linear-to-t via-black/20 to-transparent",
                card.overlayFrom,
                "group-hover:from-black/80 transition-all duration-500"
              )} />

              {/* Tag */}
              <div className="absolute top-3 left-3 z-10">
                <span className="inline-flex items-center bg-white/15 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-full border border-white/10">
                  {card.tag}
                </span>
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                <h3 className="font-display text-lg lg:text-xl font-semibold text-white leading-tight">
                  {card.title}
                </h3>
                <p className="text-xs text-white/60 mt-1">
                  {card.subtitle}
                </p>

                {/* Hover arrow */}
                <div className="flex items-center gap-1 mt-2.5 text-white/0 group-hover:text-white/80 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                  <span className="text-xs font-medium">Explore</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
