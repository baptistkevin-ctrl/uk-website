"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Truck,
  Clock,
  ShieldCheck,
  Star,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Leaf,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────
   HERO SLIDE DATA
   ───────────────────────────────────────────── */
const SLIDES = [
  {
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1920&q=80&auto=format&fit=crop",
    alt: "Fresh vegetables and groceries",
    eyebrow: "Fresh from British farms — delivered today",
    headline: "Fresh Groceries,",
    headlineAccent: "Delivered to Your Door",
    subtitle: "Shop 5,000+ premium products from local British farms. Free delivery on orders over £50.",
    cta: { label: "Shop Now", href: "/products" },
    ctaSecondary: { label: "View Deals", href: "/deals" },
  },
  {
    image: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1920&q=80&auto=format&fit=crop",
    alt: "Fresh organic produce at a farmers market",
    eyebrow: "Organic & Locally Sourced",
    headline: "Organic Produce,",
    headlineAccent: "Straight from the Farm",
    subtitle: "Over 500 certified organic products. Supporting British farmers and sustainable agriculture.",
    cta: { label: "Shop Organic", href: "/categories/fresh-produce" },
    ctaSecondary: { label: "Our Story", href: "/about" },
  },
  {
    image: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=1920&q=80&auto=format&fit=crop",
    alt: "Premium meat and seafood selection",
    eyebrow: "Premium Quality — Hand Selected",
    headline: "Premium Meat &",
    headlineAccent: "Fresh Seafood",
    subtitle: "Restaurant-quality cuts delivered to your kitchen. Aged steaks, wild-caught fish, and more.",
    cta: { label: "Shop Meat & Fish", href: "/categories/meat-fish" },
    ctaSecondary: { label: "Today's Deals", href: "/deals" },
  },
  {
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&q=80&auto=format&fit=crop",
    alt: "Artisan bakery and fresh bread",
    eyebrow: "Baked Fresh Every Morning",
    headline: "Artisan Bakery,",
    headlineAccent: "Delivered Warm",
    subtitle: "Sourdough, pastries, and cakes from award-winning British bakers. Order by 10pm for morning delivery.",
    cta: { label: "Shop Bakery", href: "/categories/bakery" },
    ctaSecondary: { label: "Free Delivery", href: "/delivery" },
  },
] as const;

/* ─────────────────────────────────────────────
   FEATURED PRODUCTS (rotating on the right)
   ───────────────────────────────────────────── */
const FEATURED_PRODUCTS = [
  { name: "Organic Fruit Box", price: "£12.99", originalPrice: "£16.25", badge: "Save 20%", image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=500&q=80&auto=format&fit=crop", category: "Fresh Produce", organic: true, slug: "organic-fruit-box" },
  { name: "Free-Range Eggs 12pk", price: "£3.49", originalPrice: "£4.20", badge: "Best Seller", image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=500&q=80&auto=format&fit=crop", category: "Dairy & Eggs", organic: false, slug: "free-range-eggs" },
  { name: "Sourdough Loaf", price: "£3.95", originalPrice: null, badge: "Fresh Today", image: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=500&q=80&auto=format&fit=crop", category: "Bakery", organic: false, slug: "sourdough-loaf" },
  { name: "Scottish Salmon Fillets", price: "£8.99", originalPrice: "£11.50", badge: "Save 22%", image: "https://images.unsplash.com/photo-1574781330855-d0db8cc6a79c?w=500&q=80&auto=format&fit=crop", category: "Fish & Seafood", organic: false, slug: "scottish-salmon" },
  { name: "Organic Avocados 4pk", price: "£2.99", originalPrice: "£3.80", badge: "Popular", image: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=500&q=80&auto=format&fit=crop", category: "Fresh Produce", organic: true, slug: "organic-avocados" },
  { name: "Aged Cheddar 400g", price: "£4.50", originalPrice: null, badge: "Award Winner", image: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=500&q=80&auto=format&fit=crop", category: "Dairy & Cheese", organic: false, slug: "aged-cheddar" },
  { name: "Mixed Berry Punnet", price: "£3.25", originalPrice: "£4.00", badge: "In Season", image: "https://images.unsplash.com/photo-1563746098251-d35aef196e83?w=500&q=80&auto=format&fit=crop", category: "Fresh Fruit", organic: false, slug: "mixed-berries" },
  { name: "Organic Whole Milk 2L", price: "£1.85", originalPrice: null, badge: "Everyday", image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&q=80&auto=format&fit=crop", category: "Dairy", organic: true, slug: "organic-milk" },
  { name: "Ribeye Steak 300g", price: "£9.95", originalPrice: "£12.99", badge: "Save 23%", image: "https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=500&q=80&auto=format&fit=crop", category: "Meat", organic: false, slug: "ribeye-steak" },
  { name: "Seasonal Veg Box", price: "£14.99", originalPrice: "£19.00", badge: "Best Value", image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&q=80&auto=format&fit=crop", category: "Fresh Produce", organic: true, slug: "seasonal-veg-box" },
] as const;

const SLIDE_INTERVAL = 6000;
const PRODUCT_INTERVAL = 5000;

const trustPills = [
  { label: "Free delivery over £50", icon: Truck },
  { label: "Same-day delivery", icon: Clock },
  { label: "Freshness guaranteed", icon: ShieldCheck },
  { label: "4.9★ Rated", icon: Star },
] as const;

/* ─────────────────────────────────────────────
   COMPONENT
   ───────────────────────────────────────────── */
export function HeroSection() {
  const [current, setCurrent] = useState(0);
  const [productIdx, setProductIdx] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  /* ── Slide navigation ── */
  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setCurrent(index);
      setTimeout(() => setIsTransitioning(false), 800);
    },
    [isTransitioning]
  );

  const next = useCallback(() => goTo((current + 1) % SLIDES.length), [current, goTo]);
  const prev = useCallback(() => goTo((current - 1 + SLIDES.length) % SLIDES.length), [current, goTo]);

  /* Auto-advance slides */
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(next, SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [next, isPaused]);

  /* Auto-rotate featured products */
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setProductIdx((i) => (i + 1) % FEATURED_PRODUCTS.length);
    }, PRODUCT_INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused]);

  const slide = SLIDES[current];
  const product = FEATURED_PRODUCTS[productIdx];

  return (
    <section
      className="relative min-h-[420px] lg:min-h-[580px] overflow-hidden flex items-center"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-roledescription="carousel"
      aria-label="Hero slideshow"
    >
      {/* ── Background Images with Ken Burns ── */}
      {SLIDES.map((s, i) => (
        <div
          key={i}
          className={cn(
            "absolute inset-0 transition-opacity duration-[1200ms] ease-in-out",
            i === current ? "opacity-100" : "opacity-0"
          )}
          aria-hidden={i !== current}
        >
          <Image
            src={s.image}
            alt={s.alt}
            fill
            priority={i === 0}
            quality={85}
            sizes="100vw"
            {...(i === 0 ? { placeholder: 'blur' as const, blurDataURL: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAoHBwgHBgoICAgLCgoLDhgQDg0NDh0VFhEYIx8lJCIfIiEmKzcvJik0KSEiMEExNDk7Pj4+JS5ESUM8SDc9Pjv/2wBDAQoLCw4NDhwQEBw7KCIoOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozv/wAARCAAIAAoDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAABv/EAB8QAAICAgIDAQAAAAAAAAAAAAECAAMEBREhBhIxQf/EABUBAQEAAAAAAAAAAAAAAAAAAAAB/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8Ank+VY2Nh1V0UpZcx9mLEkAD4B+yIgf/2Q==' } : {})}
            className={cn(
              "object-cover",
              i === current ? "animate-[kenburns_8s_ease-in-out_forwards]" : ""
            )}
          />
        </div>
      ))}

      {/* ── Overlays ── */}
      <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/55 to-black/25" />
      <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-linear-to-br from-(--brand-dark)/30 via-transparent to-(--brand-amber)/5" />

      {/* ── Content ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 w-full">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
          {/* ────── Left column — text (7 cols) ────── */}
          <div className="lg:col-span-7">
            {/* Eyebrow */}
            <div
              key={`e-${current}`}
              className="inline-flex items-center gap-2 rounded-full bg-(--color-surface)/10 backdrop-blur-md border border-white/15 px-4 py-1.5 mb-6 animate-[fadeSlideUp_600ms_ease-out_both]"
            >
              <span className="h-2 w-2 rounded-full bg-(--brand-amber) animate-pulse" />
              <span className="text-xs font-medium text-white/90 tracking-wide">{slide.eyebrow}</span>
            </div>

            {/* Headline */}
            <h1
              key={`h-${current}`}
              className={cn(
                "font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl",
                "font-semibold text-white tracking-tight leading-[1.05]",
                "animate-[fadeSlideUp_700ms_ease-out_100ms_both]"
              )}
            >
              {slide.headline}
              <br className="hidden sm:block" />
              <span className="bg-linear-to-r from-(--brand-amber) to-amber-300 bg-clip-text text-transparent">
                {slide.headlineAccent}
              </span>
            </h1>

            {/* Subtitle */}
            <p
              key={`s-${current}`}
              className="text-base lg:text-lg text-white/70 mt-5 lg:mt-7 max-w-xl leading-relaxed animate-[fadeSlideUp_700ms_ease-out_200ms_both]"
            >
              {slide.subtitle}
            </p>

            {/* CTAs */}
            <div
              key={`c-${current}`}
              className="mt-7 lg:mt-9 flex flex-col sm:flex-row gap-3 animate-[fadeSlideUp_700ms_ease-out_300ms_both]"
            >
              <Link
                href={slide.cta.href}
                className={cn(
                  "inline-flex items-center justify-center gap-2.5",
                  "bg-(--brand-amber) text-white",
                  "rounded-lg px-7 py-3.5 text-sm font-semibold",
                  "shadow-[0_8px_30px_rgba(232,134,26,0.4)]",
                  "transition-all duration-(--duration-base) ease-(--ease-premium)",
                  "hover:-translate-y-1 hover:shadow-[0_14px_40px_rgba(232,134,26,0.5)]",
                  "active:translate-y-0"
                )}
              >
                {slide.cta.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={slide.ctaSecondary.href}
                className={cn(
                  "inline-flex items-center justify-center",
                  "bg-(--color-surface)/10 backdrop-blur-sm border border-white/25 text-white",
                  "rounded-lg px-7 py-3.5 text-sm font-medium",
                  "transition-all duration-(--duration-base) ease-(--ease-premium)",
                  "hover:bg-(--color-surface)/20 hover:border-white/40"
                )}
              >
                {slide.ctaSecondary.label}
              </Link>
            </div>

            {/* Trust pills */}
            <div className="mt-10 lg:mt-14 flex flex-wrap gap-x-6 gap-y-2">
              {trustPills.map(({ label, icon: Icon }) => (
                <div key={label} className="flex items-center gap-2 text-sm text-white/50">
                  <Icon className="h-3.5 w-3.5" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ────── Right column — Rotating Featured Product (5 cols) ────── */}
          <div className="hidden lg:flex lg:col-span-5 justify-center">
            <div className="relative w-[360px]">
              {/* Main glass card */}
              <div
                className={cn(
                  "relative rounded-[24px]",
                  "bg-(--color-surface)/[0.08] backdrop-blur-2xl border border-white/[0.12]",
                  "p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)]",
                  "animate-[float_6s_ease-in-out_infinite]"
                )}
              >
                {/* Product image — crossfade */}
                <div className="relative aspect-4/3 rounded-[16px] overflow-hidden bg-(--color-surface)/5 mb-4">
                  {FEATURED_PRODUCTS.map((p, i) => (
                    <div
                      key={i}
                      className={cn(
                        "absolute inset-0 transition-all duration-700 ease-in-out",
                        i === productIdx
                          ? "opacity-100 scale-100"
                          : "opacity-0 scale-105"
                      )}
                    >
                      <Image
                        src={p.image}
                        alt={p.name}
                        fill
                        sizes="360px"
                        className="object-cover"
                      />
                    </div>
                  ))}

                  {/* Badges on image */}
                  <div className="absolute top-3 left-3 flex gap-1.5 z-10">
                    <span className="bg-(--brand-amber) text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-lg">
                      {product.badge}
                    </span>
                    {product.organic && (
                      <span className="bg-(--brand-primary) text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
                        <Leaf className="h-2.5 w-2.5" />
                        Organic
                      </span>
                    )}
                  </div>
                </div>

                {/* Product info — crossfade */}
                <div className="relative min-h-[90px]">
                  {FEATURED_PRODUCTS.map((p, i) => (
                    <div
                      key={i}
                      className={cn(
                        "transition-all duration-500 ease-in-out",
                        i === productIdx
                          ? "opacity-100 translate-y-0"
                          : "opacity-0 translate-y-2 absolute inset-0 pointer-events-none"
                      )}
                    >
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
                        {p.category}
                      </span>
                      <h3 className="text-white font-semibold text-lg mt-0.5 leading-tight">
                        {p.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="font-mono text-2xl font-bold text-white">
                          {p.price}
                        </span>
                        {p.originalPrice && (
                          <span className="font-mono text-sm text-white/40 line-through">
                            {p.originalPrice}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add to basket CTA */}
                <Link
                  href={`/products/${product.slug}`}
                  className={cn(
                    "mt-3 w-full flex items-center justify-center gap-2",
                    "bg-(--brand-amber) text-white rounded-[12px] py-2.5 text-sm font-semibold",
                    "shadow-[0_6px_20px_rgba(232,134,26,0.35)]",
                    "transition-all duration-200 ease-(--ease-premium)",
                    "hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(232,134,26,0.45)]",
                    "active:translate-y-0"
                  )}
                >
                  <ShoppingCart className="h-4 w-4" />
                  View Product
                </Link>

              </div>

              {/* Below card: delivery badge + dots row */}
              <div className="flex items-center justify-between mt-1.5 px-1">
                {/* Delivery badge */}
                <div
                  className={cn(
                    "flex items-center gap-2.5",
                    "bg-(--color-surface) rounded-xl",
                    "px-4 py-2.5 shadow-[0_10px_40px_rgba(0,0,0,0.2)]",
                    "animate-[float_8s_ease-in-out_infinite_reverse]"
                  )}
                >
                  <div className="h-8 w-8 rounded-full bg-(--brand-primary-light) flex items-center justify-center">
                    <Truck className="h-3.5 w-3.5 text-(--brand-primary)" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Free Delivery</p>
                    <p className="text-[11px] text-(--color-text-muted)">Orders over £50</p>
                  </div>
                </div>

                {/* Dot indicators */}
                <div className="flex items-center gap-1">
                  {FEATURED_PRODUCTS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setProductIdx(i)}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        i === productIdx
                          ? "w-5 bg-(--brand-amber)"
                          : "w-1.5 bg-(--color-surface)/30 hover:bg-(--color-surface)/50"
                      )}
                      aria-label={`View product ${i + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Floating rating badge */}
              <div
                className={cn(
                  "absolute -top-2 -right-4",
                  "flex items-center gap-1.5",
                  "bg-(--color-surface) rounded-full",
                  "px-3 py-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.2)]",
                  "animate-[float_7s_ease-in-out_infinite]"
                )}
              >
                <Star className="h-3.5 w-3.5 fill-(--brand-amber) text-(--brand-amber)" />
                <span className="text-xs font-bold text-foreground">4.9</span>
                <span className="text-[11px] text-(--color-text-muted)">(2.4k)</span>
              </div>

              {/* Floating product count badge */}
              <div
                className={cn(
                  "absolute top-1/2 -left-10",
                  "bg-(--color-surface) rounded-full",
                  "px-3 py-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.2)]",
                  "animate-[float_9s_ease-in-out_infinite]"
                )}
              >
                <span className="text-[11px] font-bold text-(--brand-primary)">5,000+</span>
                <span className="text-[11px] text-(--color-text-muted) ml-1">Products</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Slide Controls ── */}
      <button
        onClick={prev}
        className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-(--color-surface)/10 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/70 hover:bg-(--color-surface)/20 hover:text-white transition-all"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-(--color-surface)/10 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/70 hover:bg-(--color-surface)/20 hover:text-white transition-all"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Slide progress dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className="relative h-1.5 rounded-full overflow-hidden transition-all duration-300"
            style={{ width: i === current ? 32 : 8 }}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === current ? "true" : undefined}
          >
            <span className="absolute inset-0 bg-(--color-surface)/30 rounded-full" />
            {i === current && (
              <span
                className="absolute inset-0 bg-(--color-surface) rounded-full origin-left"
                style={{
                  animation: isPaused ? "none" : `progress ${SLIDE_INTERVAL}ms linear forwards`,
                }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Bottom gradient fade — subtle blend into content */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-linear-to-t from-black/30 to-transparent z-10 pointer-events-none" />
    </section>
  );
}
