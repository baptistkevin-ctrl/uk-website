import Image from "next/image";
import { Truck, ShieldCheck, RotateCcw, MessageCircle } from "lucide-react";

const STATS = [
  { value: "50,000+", label: "Customers" },
  { value: "5,000+", label: "Products" },
  { value: "200+", label: "British Farms" },
  { value: "4.9/5", label: "Rating" },
] as const;

const TRUST = [
  { icon: Truck, title: "Free delivery over £50" },
  { icon: ShieldCheck, title: "Freshness guaranteed" },
  { icon: RotateCcw, title: "30-day returns" },
  { icon: MessageCircle, title: "24/7 live support" },
] as const;

export function StatsBar() {
  return (
    <section className="relative overflow-hidden">
      {/* Full bleed image background */}
      <Image
        src="https://images.unsplash.com/photo-1573246123716-6b1782bfc499?w=1920&q=80&auto=format&fit=crop"
        alt="Fresh market produce"
        fill
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-(--brand-dark)/90 backdrop-blur-sm" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 lg:divide-x lg:divide-white/10">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center lg:px-8">
              <p className="font-display text-4xl lg:text-5xl font-bold text-white tracking-tight">
                {stat.value}
              </p>
              <p className="text-xs uppercase tracking-[0.15em] text-white/40 mt-2 font-medium">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="my-10 lg:my-14 border-t border-white/10" />

        {/* Trust row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {TRUST.map(({ icon: Icon, title }) => (
            <div key={title} className="flex items-center gap-3 justify-center">
              <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-(--brand-amber)" />
              </div>
              <span className="text-sm font-medium text-white/70">{title}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
