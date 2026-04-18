import Link from "next/link";
import { ArrowRight, Truck, Zap, Shield, Gift, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = [
  { icon: Zap, title: "Same-day delivery", desc: "Order before 2pm" },
  { icon: Gift, title: "App-only offers", desc: "Exclusive deals" },
  { icon: Shield, title: "Secure payments", desc: "Apple Pay & Google Pay" },
  { icon: Truck, title: "Free first 3 orders", desc: "No minimum spend" },
] as const;

export function AppDownloadBanner() {
  return (
    <section className="py-14 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-(--brand-dark) overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-size-[24px_24px]" />
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-(--brand-primary)/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-(--brand-amber)/8 blur-3xl" />

          <div className="relative z-10 p-6 sm:p-10 lg:p-16">
            <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
              {/* Left content */}
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3.5 py-1.5 mb-5">
                  <span className="h-2 w-2 rounded-full bg-(--brand-amber) animate-pulse" />
                  <span className="text-xs font-semibold text-white/80 tracking-wide">Fresh groceries, delivered fast</span>
                </div>

                <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-white leading-[1.08] tracking-tight">
                  Start shopping
                  <br />
                  <span className="text-(--brand-amber)">smarter today</span>
                </h2>

                <p className="mt-4 text-base text-white/45 max-w-md leading-relaxed">
                  Join 50,000+ households across the UK who trust us for their weekly shop.
                </p>

                {/* CTAs */}
                <div className="flex flex-wrap gap-3 mt-8">
                  <Link
                    href="/products"
                    className={cn(
                      "inline-flex items-center gap-2.5",
                      "bg-(--brand-amber) text-white",
                      "rounded-xl px-7 py-3.5 text-sm font-semibold",
                      "shadow-[0_8px_30px_rgba(232,134,26,0.3)]",
                      "hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(232,134,26,0.4)]",
                      "transition-all duration-200"
                    )}
                  >
                    Start Shopping
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-white rounded-xl px-7 py-3.5 text-sm font-medium hover:bg-white/15 transition-all"
                  >
                    Create Free Account
                  </Link>
                </div>
              </div>

              {/* Right — feature cards */}
              <div className="lg:col-span-5 mt-10 lg:mt-0">
                <div className="grid grid-cols-2 gap-3">
                  {FEATURES.map(({ icon: Icon, title, desc }, i) => (
                    <div
                      key={title}
                      className="rounded-2xl bg-white/6 backdrop-blur-sm border border-white/8 p-3 sm:p-5 hover:bg-white/10 transition-colors duration-200"
                    >
                      <div className="h-9 w-9 rounded-lg bg-(--brand-amber)/15 flex items-center justify-center mb-3">
                        <Icon className="h-4.5 w-4.5 text-(--brand-amber)" />
                      </div>
                      <p className="text-sm font-semibold text-white leading-tight">{title}</p>
                      <p className="text-xs text-white/40 mt-1">{desc}</p>
                    </div>
                  ))}
                </div>

                {/* Rating */}
                <div className="flex items-center justify-center gap-2 mt-5">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-xs text-white/50">Rated 4.9/5 by 2,400+ customers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
