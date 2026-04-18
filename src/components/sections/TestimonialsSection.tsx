"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

const TESTIMONIALS = [
  { name: "Sarah M.", location: "London", rating: 5, quote: "The freshest vegetables I've ever had delivered. The organic selection is amazing and delivery is always on time." },
  { name: "James K.", location: "Manchester", rating: 5, quote: "Switched from our local supermarket and haven't looked back. Quality and convenience is unbeatable." },
  { name: "Priya S.", location: "Birmingham", rating: 5, quote: "Love the same-day delivery option. Perfect for when I forget something for dinner. Great prices too!" },
  { name: "David R.", location: "Leeds", rating: 5, quote: "The meal planner feature is genius. Saves me so much time planning the weekly shop. Absolutely brilliant." },
  { name: "Emma T.", location: "Bristol", rating: 5, quote: "Best online grocery experience in the UK. The product quality rivals Waitrose at Aldi prices." },
  { name: "Mohammed A.", location: "Leicester", rating: 5, quote: "Halal options are properly labelled and the dietary filter is a game changer. Finally, a store that gets it." },
  { name: "Rachel H.", location: "Edinburgh", rating: 5, quote: "The eco-delivery option sealed the deal for me. Love that I can track my carbon footprint too." },
  { name: "Tom W.", location: "Cardiff", rating: 4, quote: "Great range of organic produce. The subscribe and save feature means I never run out of essentials." },
  { name: "Lucy F.", location: "Oxford", rating: 5, quote: "As a busy mum, the recipe-to-cart feature is incredible. Pick a recipe, click add all — done." },
  { name: "Chen L.", location: "Cambridge", rating: 5, quote: "Excellent Asian ingredients selection. Much better than other supermarkets. Delivery is always prompt." },
  { name: "Olivia N.", location: "Bath", rating: 5, quote: "The shared family list means my husband and I never buy duplicates anymore. Such a simple but powerful feature." },
  { name: "Patrick B.", location: "Glasgow", rating: 5, quote: "Being able to chat with the picker is amazing. I asked for firm avocados and they delivered perfectly." },
  { name: "Aisha K.", location: "Nottingham", rating: 5, quote: "Prices are very competitive and the quality is consistently excellent. My go-to for weekly shopping now." },
  { name: "George M.", location: "Liverpool", rating: 5, quote: "The smart reorder feature knows exactly what I need before I do. It's like having a personal shopper." },
  { name: "Sophie D.", location: "Brighton", rating: 4, quote: "Love the sustainability features. Knowing the carbon footprint of my basket helps me make better choices." },
  { name: "Ryan P.", location: "Newcastle", rating: 5, quote: "Switched from Ocado six months ago. Better prices, just as good quality, and the app is much easier to use." },
  { name: "Hannah J.", location: "York", rating: 5, quote: "The community recipes section is wonderful. Found so many new family favourites through other shoppers." },
  { name: "Michael S.", location: "Sheffield", rating: 5, quote: "Free delivery on orders over £50 is very reasonable. Plus the loyalty rewards are genuinely worth it." },
  { name: "Fatima Z.", location: "Coventry", rating: 5, quote: "Finally a grocery store with proper allergen filtering. I can shop without anxiety about my daughter's nut allergy." },
  { name: "William C.", location: "Norwich", rating: 5, quote: "The weekend cooking section always inspires me. Bought a whole sea bass last week and it was incredibly fresh." },
] as const;

const VISIBLE_COUNT = 3;
const INTERVAL = 5000;

export function TestimonialsSection() {
  const [startIndex, setStartIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const totalSets = Math.ceil(TESTIMONIALS.length / VISIBLE_COUNT);

  const next = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setStartIndex((prev) => (prev + VISIBLE_COUNT) % TESTIMONIALS.length);
    setTimeout(() => setIsTransitioning(false), 600);
  }, [isTransitioning]);

  const prev = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setStartIndex((prev) => (prev - VISIBLE_COUNT + TESTIMONIALS.length) % TESTIMONIALS.length);
    setTimeout(() => setIsTransitioning(false), 600);
  }, [isTransitioning]);

  // Auto-advance
  useEffect(() => {
    const timer = setInterval(next, INTERVAL);
    return () => clearInterval(timer);
  }, [next]);

  const visibleTestimonials = Array.from({ length: VISIBLE_COUNT }, (_, i) =>
    TESTIMONIALS[(startIndex + i) % TESTIMONIALS.length]
  );

  const currentSet = Math.floor(startIndex / VISIBLE_COUNT);

  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-10">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-(--brand-primary) font-semibold mb-2">
              Testimonials
            </p>
            <h2 className="font-display text-3xl lg:text-4xl font-semibold text-foreground">
              Loved by thousands
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {/* Rating badge */}
            <div className="flex items-center gap-2 bg-(--color-surface) border border-(--color-border) rounded-full px-4 py-2">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-sm font-semibold text-foreground">4.9/5</span>
              <span className="text-xs text-(--color-text-muted)">2,400+ reviews</span>
            </div>
            {/* Nav arrows */}
            <div className="flex gap-1.5">
              <button
                onClick={prev}
                className="h-9 w-9 rounded-full border border-(--color-border) flex items-center justify-center text-(--color-text-muted) hover:bg-(--color-elevated) hover:text-foreground transition-colors"
                aria-label="Previous testimonials"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={next}
                className="h-9 w-9 rounded-full border border-(--color-border) flex items-center justify-center text-(--color-text-muted) hover:bg-(--color-elevated) hover:text-foreground transition-colors"
                aria-label="Next testimonials"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
          {visibleTestimonials.map((testimonial, index) => (
            <div
              key={`${testimonial.name}-${startIndex}`}
              className={cn(
                "rounded-2xl border border-(--color-border) bg-(--color-surface) p-6 lg:p-7",
                "transition-all duration-500",
                isTransitioning ? "opacity-0 translate-y-3" : "opacity-100 translate-y-0"
              )}
              style={{ transitionDelay: `${index * 80}ms` }}
            >
              {/* Quote icon */}
              <Quote className="h-8 w-8 text-(--brand-primary)/15 mb-3" />

              {/* Stars */}
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: testimonial.rating }, (_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
                {Array.from({ length: 5 - testimonial.rating }, (_, i) => (
                  <Star key={`e-${i}`} className="h-4 w-4 fill-(--color-border) text-(--color-border)" />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-sm text-(--color-text-secondary) leading-relaxed min-h-18">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>

              {/* Author */}
              <div className="mt-5 flex items-center gap-3 pt-4 border-t border-(--color-border)/50">
                <div className="h-9 w-9 rounded-full bg-(--brand-dark) flex items-center justify-center">
                  <span className="text-xs font-bold text-white">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground leading-tight">
                    {testimonial.name}
                  </p>
                  <p className="text-[11px] text-(--color-text-muted)">
                    {testimonial.location}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center gap-1.5 mt-8">
          {Array.from({ length: totalSets }, (_, i) => (
            <button
              key={i}
              onClick={() => { setStartIndex(i * VISIBLE_COUNT); }}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === currentSet ? "w-6 bg-(--brand-primary)" : "w-1.5 bg-(--color-border)"
              )}
              aria-label={`Go to testimonial set ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
