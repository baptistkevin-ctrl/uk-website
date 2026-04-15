import type { Metadata } from "next";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with UK Grocery Store. We are here to help with orders, deliveries, partnerships, and general enquiries.",
};

const CONTACT_INFO = [
  {
    icon: Mail,
    title: "Email Us",
    detail: "hello@uk-grocery-store.com",
    href: "mailto:hello@uk-grocery-store.com",
    description: "We reply within 24 hours",
  },
  {
    icon: Phone,
    title: "Call Us",
    detail: "+44 20 1234 5678",
    href: "tel:+442012345678",
    description: "Mon–Sat, 8am–8pm",
  },
  {
    icon: MapPin,
    title: "Visit Us",
    detail: "123 High Street, London, SW1A 1AA",
    href: undefined,
    description: "United Kingdom",
  },
];

const HOURS = [
  { day: "Monday – Friday", time: "8:00 AM – 8:00 PM" },
  { day: "Saturday", time: "9:00 AM – 6:00 PM" },
  { day: "Sunday", time: "10:00 AM – 4:00 PM" },
];

export default function ContactPage() {
  return (
    <div className="bg-background min-h-screen">
      <Container size="lg">
        <div className="py-8 lg:py-12">
          <Breadcrumb
            items={[{ label: "Home", href: "/" }, { label: "Contact Us" }]}
          />

          <div className="mt-6 mb-10 text-center lg:text-left">
            <h1 className="font-display text-3xl lg:text-4xl font-semibold text-foreground">
              Get in Touch
            </h1>
            <p className="mt-2 text-base text-(--color-text-secondary) max-w-xl lg:max-w-none">
              Have a question about an order, delivery, or anything else? We
              would love to hear from you.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Left: Contact info */}
            <div className="space-y-6">
              {CONTACT_INFO.map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-(--brand-primary-light)">
                    <item.icon className="h-5 w-5 text-(--brand-primary)" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {item.title}
                    </h3>
                    {item.href ? (
                      <a
                        href={item.href}
                        className="text-sm text-(--brand-primary) hover:underline"
                      >
                        {item.detail}
                      </a>
                    ) : (
                      <p className="text-sm text-(--color-text-secondary)">
                        {item.detail}
                      </p>
                    )}
                    <p className="text-xs text-(--color-text-muted) mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}

              {/* Opening Hours */}
              <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5 mt-8">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-4 w-4 text-(--brand-primary)" />
                  <h3 className="text-sm font-semibold text-foreground">
                    Opening Hours
                  </h3>
                </div>
                <div className="space-y-2">
                  {HOURS.map((h) => (
                    <div
                      key={h.day}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-(--color-text-secondary)">
                        {h.day}
                      </span>
                      <span className="font-medium text-foreground">
                        {h.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Contact form */}
            <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-lg font-semibold text-foreground mb-5">
                Send us a message
              </h2>
              <form className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Your name"
                    className="flex h-12 w-full rounded-lg border border-(--color-border) bg-(--color-surface) px-3 text-sm text-foreground placeholder:text-(--color-text-muted) focus:border-(--brand-primary) focus:ring-2 focus:ring-(--brand-primary)/30 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="flex h-12 w-full rounded-lg border border-(--color-border) bg-(--color-surface) px-3 text-sm text-foreground placeholder:text-(--color-text-muted) focus:border-(--brand-primary) focus:ring-2 focus:ring-(--brand-primary)/30 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="What is this about?"
                    className="flex h-12 w-full rounded-lg border border-(--color-border) bg-(--color-surface) px-3 text-sm text-foreground placeholder:text-(--color-text-muted) focus:border-(--brand-primary) focus:ring-2 focus:ring-(--brand-primary)/30 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Message
                  </label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Tell us how we can help..."
                    className="flex min-h-30 w-full resize-y rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-3 text-sm text-foreground placeholder:text-(--color-text-muted) focus:border-(--brand-primary) focus:ring-2 focus:ring-(--brand-primary)/30 focus:outline-none transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-(--brand-amber) px-6 py-3 text-sm font-semibold text-white shadow-(--shadow-amber) transition-all duration-(--duration-fast) ease-(--ease-premium) hover:-translate-y-0.5 hover:bg-(--brand-amber-hover) active:translate-y-0"
                >
                  <Send className="h-4 w-4" />
                  Send Message
                </button>
                <p className="text-xs text-(--color-text-muted) text-center">
                  We typically reply within 24 hours.
                </p>
              </form>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
