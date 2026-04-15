import type { Metadata } from "next";
import { RotateCcw, CheckCircle, AlertCircle, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Returns & Refunds",
  description:
    "Hassle-free returns and refunds for UK Grocery Store orders. Report issues within 24 hours for a full refund or replacement.",
  alternates: { canonical: "https://ukgrocerystore.com/returns" },
};
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Accordion } from "@/components/ui/Accordion";
import type { AccordionItem } from "@/components/ui/Accordion";

const policyAccordionItems: AccordionItem[] = [
  {
    id: "eligible",
    title: "What Can Be Returned?",
    content: (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg bg-(--brand-primary-light) p-4">
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-(--brand-primary)" />
          <div>
            <strong className="text-foreground">
              Eligible for Return/Refund:
            </strong>
            <ul className="mt-2 space-y-1 text-(--color-text-secondary)">
              <li>Damaged or defective products</li>
              <li>Wrong items delivered</li>
              <li>Items past their use-by date on delivery</li>
              <li>Missing items from your order</li>
              <li>Poor quality fresh produce</li>
            </ul>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-(--color-border) bg-(--color-error-bg) p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-(--color-error)" />
          <div>
            <strong className="text-foreground">Not Eligible:</strong>
            <ul className="mt-2 space-y-1 text-(--color-text-secondary)">
              <li>Change of mind (for food safety reasons)</li>
              <li>Items reported more than 24 hours after delivery</li>
              <li>Products that have been opened and partially used</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "how-to",
    title: "How to Request a Refund",
    content: (
      <ol className="space-y-4 text-(--color-text-secondary)">
        {[
          {
            step: 1,
            title: "Report the Issue",
            desc: "Contact us within 24 hours of delivery via email or your account.",
          },
          {
            step: 2,
            title: "Provide Details",
            desc: "Include your order number and photos of the affected items.",
          },
          {
            step: 3,
            title: "Resolution",
            desc: "We'll review your request and process a refund or replacement within 48 hours.",
          },
        ].map((item) => (
          <li key={item.step} className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--brand-primary-light) text-sm font-semibold text-(--brand-primary)">
              {item.step}
            </span>
            <div>
              <strong className="text-foreground">{item.title}</strong>
              <p>{item.desc}</p>
            </div>
          </li>
        ))}
      </ol>
    ),
  },
  {
    id: "timeline",
    title: "Refund Timeline",
    content: (
      <div className="flex items-start gap-3 rounded-lg bg-background p-4">
        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-(--color-text-muted)" />
        <div className="text-(--color-text-secondary)">
          <p>
            Once approved, refunds are processed within{" "}
            <strong className="text-foreground">3-5 business days</strong>.
          </p>
          <p className="mt-2">
            The refund will appear on the original payment method used for your
            order. Bank processing times may vary.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "substitutions",
    title: "Substitutions",
    content: (
      <div className="space-y-3 text-(--color-text-secondary)">
        <p>
          If we substitute an item and you&apos;re not happy with the
          replacement, you can return it for a full refund. Simply reject the
          substitution at delivery or contact us within 24 hours.
        </p>
        <p>
          You can opt out of substitutions entirely in your account settings or
          at checkout.
        </p>
      </div>
    ),
  },
];

export default function ReturnsPage() {
  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="min-h-screen bg-background">
        <Container size="md" className="py-8 lg:py-12">
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "Returns & Refunds" },
            ]}
            className="mb-6"
          />

          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-(--brand-primary-light)">
              <RotateCcw className="h-5 w-5 text-(--brand-primary)" />
            </div>
            <h1 className="font-display text-3xl font-semibold text-foreground">
              Returns & Refunds
            </h1>
          </div>
          <p className="mb-8 text-base text-(--color-text-secondary)">
            Our hassle-free returns policy.
          </p>

          {/* Our Promise */}
          <div className="mb-8 rounded-xl bg-(--brand-primary-light) p-6">
            <h2 className="font-semibold text-foreground mb-2">
              Our Promise
            </h2>
            <p className="text-(--color-text-secondary)">
              We want you to be completely satisfied with your order. If
              something isn&apos;t right, we&apos;ll make it right — whether
              that&apos;s a refund, replacement, or credit.
            </p>
          </div>

          {/* Policy sections accordion */}
          <div className="rounded-xl border border-(--color-border) bg-(--color-surface) px-6 shadow-(--shadow-sm)">
            <Accordion items={policyAccordionItems} defaultOpen="eligible" />
          </div>

          {/* Contact section */}
          <div className="mt-8 rounded-xl border border-(--color-border) bg-(--color-surface) p-6 shadow-(--shadow-sm)">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Contact Us
            </h2>
            <p className="mb-4 text-(--color-text-secondary)">
              Need help with a return or refund? Our customer service team is
              here to assist.
            </p>
            <div className="space-y-2 text-(--color-text-secondary)">
              <p>
                <strong className="text-foreground">Email:</strong>{" "}
                support@ukgrocerystore.com
              </p>
              <p>
                <strong className="text-foreground">
                  Response time:
                </strong>{" "}
                Within 24 hours
              </p>
            </div>
            <Link
              href="/contact"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-(--brand-primary) px-5 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 transition-opacity"
            >
              Get in Touch
            </Link>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
