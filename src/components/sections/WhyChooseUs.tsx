import Image from "next/image";
import {
  Truck,
  Leaf,
  BadgePoundSterling,
  Recycle,
  ShieldCheck,
  MessageCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const FEATURES: { icon: LucideIcon; title: string; description: string; stat: string }[] = [
  { icon: Truck, title: "Same-Day Delivery", description: "Order before 2pm for delivery today. Free on orders over £50.", stat: "2hr avg." },
  { icon: Leaf, title: "Farm Fresh Quality", description: "Sourced from 200+ local British farms. Delivered within 24 hours.", stat: "200+ farms" },
  { icon: BadgePoundSterling, title: "Best Price Promise", description: "We match competitors' prices. Found it cheaper? We'll refund the difference.", stat: "100% match" },
  { icon: Recycle, title: "Eco-Friendly", description: "Carbon-neutral delivery with electric vans and cargo bikes.", stat: "0 emissions" },
  { icon: ShieldCheck, title: "Secure Checkout", description: "Bank-level encryption. Apple Pay, Google Pay, and all major cards.", stat: "256-bit SSL" },
  { icon: MessageCircle, title: "24/7 Support", description: "Chat with our team anytime. Average response time: under 2 minutes.", stat: "<2 min" },
];

export function WhyChooseUs() {
  return (
    <section className="py-16 lg:py-24 bg-(--color-surface)">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Two-column layout: image left, features right */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
          {/* Left — Hero image */}
          <div className="hidden lg:block lg:col-span-5">
            <div className="relative rounded-3xl overflow-hidden aspect-3/4">
              <Image
                src="https://images.unsplash.com/photo-1506617420156-8e4536971650?w=600&q=80&auto=format&fit=crop"
                alt="Fresh groceries being packed"
                fill
                className="object-cover"
                sizes="40vw"
              />
              {/* Overlay card */}
              <div className="absolute bottom-6 left-6 right-6 bg-(--color-surface)/95 backdrop-blur-md rounded-2xl p-5 shadow-(--shadow-lg)">
                <p className="font-display text-lg font-semibold text-foreground">
                  Trusted by 50,000+ households
                </p>
                <p className="text-sm text-(--color-text-muted) mt-1">
                  Rated 4.9/5 across all platforms
                </p>
                <div className="flex items-center gap-0.5 mt-2">
                  {[1,2,3,4,5].map(i => (
                    <svg key={i} className="h-4 w-4 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right — Content */}
          <div className="lg:col-span-7">
            <p className="text-xs uppercase tracking-[0.2em] text-(--brand-primary) font-semibold mb-3">
              Why choose us
            </p>
            <h2 className="font-display text-3xl lg:text-4xl font-semibold text-foreground leading-tight">
              Grocery shopping,{" "}
              <span className="text-(--brand-primary)">reimagined</span>
            </h2>
            <p className="text-base text-(--color-text-secondary) mt-3 max-w-lg leading-relaxed">
              We're not just another online supermarket. Every detail is designed to save you time, money, and hassle.
            </p>

            {/* Features grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-8">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="group flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl hover:bg-(--color-elevated) transition-colors duration-200"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-(--brand-primary)/8 group-hover:bg-(--brand-primary)/15 transition-colors">
                    <feature.icon className="h-5 w-5 text-(--brand-primary)" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">
                        {feature.title}
                      </h3>
                      <span className="text-[11px] font-bold text-(--brand-primary) bg-(--brand-primary)/8 px-1.5 py-0.5 rounded">
                        {feature.stat}
                      </span>
                    </div>
                    <p className="text-xs text-(--color-text-muted) mt-1 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
