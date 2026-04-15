import type { Metadata } from "next";
import { Truck, Clock, MapPin, Package, CheckCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Delivery Information",
  description:
    "UK-wide grocery delivery 7 days a week. Free delivery on orders over £50. Choose from morning, afternoon, and evening time slots.",
  alternates: { canonical: "https://ukgrocerystore.com/delivery" },
};
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

export default function DeliveryPage() {
  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="min-h-screen bg-background">
        <Container size="md" className="py-8 lg:py-12">
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "Delivery Information" },
            ]}
            className="mb-6"
          />

          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-(--brand-primary-light)">
              <Truck className="h-5 w-5 text-(--brand-primary)" />
            </div>
            <h1 className="font-display text-3xl font-semibold text-foreground">
              Delivery Information
            </h1>
          </div>
          <p className="mb-8 text-base text-(--color-text-secondary)">
            Everything you need to know about our delivery service.
          </p>

          {/* Delivery highlights */}
          <div className="grid gap-4 sm:grid-cols-3 mb-10">
            {[
              {
                icon: Clock,
                title: "7 Days a Week",
                desc: "8am - 10pm delivery slots",
              },
              {
                icon: Package,
                title: "Free Over £50",
                desc: "On qualifying orders",
              },
              {
                icon: MapPin,
                title: "UK Wide",
                desc: "Delivering nationwide",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5 text-center shadow-(--shadow-sm)"
              >
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-(--brand-primary-light)">
                  <item.icon className="h-5 w-5 text-(--brand-primary)" />
                </div>
                <h3 className="font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm text-(--color-text-secondary)">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Content sections */}
          <div className="space-y-0 rounded-xl border border-(--color-border) bg-(--color-surface) shadow-(--shadow-sm)">
            {/* Delivery Slots */}
            <section className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Delivery Slots
              </h2>
              <p className="mb-4 text-(--color-text-secondary)">
                We offer convenient 2-hour delivery windows throughout the day.
                Choose the time that works best for you during checkout.
              </p>
              <ul className="space-y-2 text-(--color-text-secondary)">
                {[
                  "Morning: 8am - 12pm",
                  "Afternoon: 12pm - 6pm",
                  "Evening: 6pm - 10pm",
                ].map((slot) => (
                  <li key={slot} className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 shrink-0 text-(--brand-primary)" />
                    {slot}
                  </li>
                ))}
              </ul>
            </section>

            <hr className="border-(--color-border)" />

            {/* Delivery Charges */}
            <section className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Delivery Charges
              </h2>
              <div className="overflow-hidden rounded-lg border border-(--color-border)">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-(--color-border) bg-background">
                      <th className="py-3 px-4 text-left font-semibold text-foreground">
                        Order Value
                      </th>
                      <th className="py-3 px-4 text-right font-semibold text-foreground">
                        Delivery Fee
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-(--color-text-secondary)">
                    <tr className="border-b border-(--color-border)">
                      <td className="py-3 px-4">Under £40</td>
                      <td className="py-3 px-4 text-right">£4.99</td>
                    </tr>
                    <tr className="border-b border-(--color-border)">
                      <td className="py-3 px-4">£40 - £50</td>
                      <td className="py-3 px-4 text-right">£2.99</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-medium text-(--brand-primary)">
                        Over £50
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-(--brand-primary)">
                        FREE
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <hr className="border-(--color-border)" />

            {/* What to Expect */}
            <section className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                What to Expect
              </h2>
              <ol className="space-y-4 text-(--color-text-secondary)">
                {[
                  {
                    step: 1,
                    title: "Order Confirmation",
                    desc: "You'll receive an email confirming your order and delivery slot.",
                  },
                  {
                    step: 2,
                    title: "Dispatch Notification",
                    desc: "We'll notify you when your order is on its way with tracking details.",
                  },
                  {
                    step: 3,
                    title: "Delivery",
                    desc: "Our driver will deliver to your door within your chosen time slot.",
                  },
                ].map((item) => (
                  <li key={item.step} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--brand-primary-light) text-sm font-semibold text-(--brand-primary)">
                      {item.step}
                    </span>
                    <div>
                      <strong className="text-foreground">
                        {item.title}
                      </strong>
                      <p>{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <hr className="border-(--color-border)" />

            {/* Delivery Tips */}
            <section className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Delivery Tips
              </h2>
              <ul className="list-disc space-y-2 pl-6 text-(--color-text-secondary)">
                <li>Ensure someone is available to receive the delivery</li>
                <li>
                  Provide accurate delivery instructions for the driver
                </li>
                <li>Check your order as soon as possible after delivery</li>
                <li>Store chilled and frozen items promptly</li>
              </ul>
            </section>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
