import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQs",
  description:
    "Find answers to common questions about orders, delivery, payments, returns, and more at UK Grocery Store.",
  alternates: { canonical: "https://ukgrocerystore.com/faq" },
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children;
}
