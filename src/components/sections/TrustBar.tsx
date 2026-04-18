import { Truck, ShieldCheck, RotateCcw, MessageCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const TRUST_ITEMS: { icon: LucideIcon; title: string; description: string }[] = [
  { icon: Truck, title: "Free Delivery", description: "On orders over £50" },
  { icon: ShieldCheck, title: "Freshness Guarantee", description: "Or your money back" },
  { icon: RotateCcw, title: "Easy Returns", description: "30-day hassle-free" },
  { icon: MessageCircle, title: "24/7 Support", description: "We're always here" },
];

export function TrustBar() {
  return (
    <section className="py-10 lg:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {TRUST_ITEMS.map((item) => (
            <div
              key={item.title}
              className="flex items-center gap-4 rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 lg:p-5 hover:border-(--brand-primary)/20 hover:shadow-sm transition-all duration-300"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-(--brand-primary)/8">
                <item.icon className="h-5 w-5 text-(--brand-primary)" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground leading-tight">
                  {item.title}
                </p>
                <p className="text-xs text-(--color-text-muted) mt-0.5">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
