import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customer Support",
  description:
    "Get help with your UK Grocery Store orders. Contact us via live chat, email, or phone for fast support.",
  alternates: { canonical: "https://ukgrocerystore.com/support" },
};

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
