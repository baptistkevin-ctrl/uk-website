"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { HelpCircle, Search, Mail } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Accordion } from "@/components/ui/Accordion";
import type { AccordionItem } from "@/components/ui/Accordion";

const faqs = [
  {
    question: "What are your delivery hours?",
    answer:
      "We deliver 7 days a week, with time slots available from 8am to 10pm. You can choose your preferred delivery slot during checkout.",
  },
  {
    question: "What is the minimum order value?",
    answer:
      "There is no minimum order value. However, orders under £40 will incur a delivery fee. Orders over £50 qualify for free delivery.",
  },
  {
    question: "How do I track my order?",
    answer:
      'Once your order is dispatched, you\'ll receive an email with a tracking link. You can also track your order by visiting the "Track Order" page and entering your order number.',
  },
  {
    question: "What if an item is out of stock?",
    answer:
      "If an item is unavailable, we'll substitute it with a similar product of equal or greater value. You can opt out of substitutions in your account settings or during checkout.",
  },
  {
    question: "Can I change or cancel my order?",
    answer:
      'You can modify or cancel your order up to 2 hours before your scheduled delivery time. Visit "My Orders" in your account to make changes.',
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit and debit cards (Visa, Mastercard, American Express), as well as Apple Pay and Google Pay.",
  },
  {
    question: "How do I return a product?",
    answer:
      "If you're not satisfied with any product, please contact us within 24 hours of delivery. We'll arrange a refund or replacement for eligible items.",
  },
  {
    question: "Do you deliver to my area?",
    answer:
      "We currently deliver across the UK. Enter your postcode during checkout to confirm delivery availability to your area.",
  },
  {
    question: "Are your products fresh?",
    answer:
      "Yes! We source our products from trusted suppliers and ensure all items meet our strict quality standards. Fresh produce is delivered with at least 3-5 days before expiry.",
  },
  {
    question: "How do I create an account?",
    answer:
      'Click "Sign In" in the top right corner of the page, then select "Create Account". You\'ll need to provide your email address and create a password.',
  },
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems: AccordionItem[] = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return faqs
      .filter(
        (faq) =>
          !query ||
          faq.question.toLowerCase().includes(query) ||
          faq.answer.toLowerCase().includes(query)
      )
      .map((faq, index) => ({
        id: `faq-${index}`,
        title: faq.question,
        content: <p>{faq.answer}</p>,
      }));
  }, [searchQuery]);

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="min-h-screen bg-background">
        <Container size="md" className="py-8 lg:py-12">
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "FAQs" },
            ]}
            className="mb-6"
          />

          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-(--brand-primary-light)">
              <HelpCircle className="h-5 w-5 text-(--brand-primary)" />
            </div>
            <h1 className="font-display text-3xl font-semibold text-foreground">
              Frequently Asked Questions
            </h1>
          </div>
          <p className="mb-8 text-base text-(--color-text-secondary)">
            Find answers to common questions about orders, delivery, and more.
          </p>

          {/* Search filter */}
          <div className="relative mb-8">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--color-text-muted)" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-(--color-border) bg-(--color-surface) py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-(--color-text-muted) outline-none transition-shadow focus:ring-2 focus:ring-(--brand-primary)/30 focus:border-(--brand-primary)"
            />
          </div>

          {/* Accordion */}
          <div className="rounded-xl border border-(--color-border) bg-(--color-surface) px-6 shadow-(--shadow-sm)">
            {filteredItems.length > 0 ? (
              <Accordion items={filteredItems} />
            ) : (
              <p className="py-8 text-center text-(--color-text-muted)">
                No questions match your search. Try a different term.
              </p>
            )}
          </div>

          {/* Contact CTA */}
          <div className="mt-10 rounded-xl bg-(--brand-primary-light) p-6 text-center">
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Still have questions?
            </h2>
            <p className="text-(--color-text-secondary) mb-4">
              Can&apos;t find what you&apos;re looking for? Our customer support
              team is here to help.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-lg bg-(--brand-primary) px-5 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 transition-opacity"
            >
              <Mail className="h-4 w-4" />
              Contact Support
            </Link>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
