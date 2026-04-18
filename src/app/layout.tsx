import type { Metadata } from "next";
import { Fraunces, DM_Sans, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ClientShell } from "@/components/layout/ClientShell";
import { ShopOnlyShell } from "@/components/layout/ShopOnlyShell";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://uk-grocery-store.com"),
  title: {
    default: "UK Grocery Store — Fresh Food Delivered",
    template: "%s | UK Grocery Store",
  },
  description:
    "Shop fresh produce, meat, dairy, and pantry essentials online. Free delivery on orders over £50. Next-day delivery across the UK.",
  keywords: [
    "online grocery UK",
    "fresh food delivery",
    "grocery delivery",
    "buy groceries online",
    "fresh produce UK",
    "organic vegetables delivery",
  ],
  authors: [{ name: "UK Grocery Store" }],
  creator: "UK Grocery Store",
  publisher: "UK Grocery Store",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "UK Grocery Store",
    images: [
      {
        url: "/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "UK Grocery Store — Fresh Food Delivered",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@ukgrocerystore",
  },
  alternates: {
    canonical: "https://uk-grocery-store.com",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    apple: [{ url: "/icons/icon.svg" }],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "UK Grocery",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans antialiased overflow-x-hidden">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-(--color-surface) focus:px-4 focus:py-2 focus:shadow-lg focus:text-(--brand-primary) focus:font-semibold"
        >
          Skip to main content
        </a>

        <ClientShell />

        <main id="main-content">{children}</main>

        <ShopOnlyShell />
        <Analytics />
        <SpeedInsights />

        {/* Service Worker Registration */}
        <Script id="sw-register" strategy="afterInteractive">{`
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {});
          }
        `}</Script>

        {/* Console Signature */}
        <Script id="console-signature" strategy="afterInteractive">{`
          console.log(
            "%c UK GROCERY STORE ",
            "background:#1B6B3A;color:#FFFFFF;font-weight:bold;font-size:14px;padding:6px 12px;border-radius:4px;",
            "\\n%cBuilt by Solaris Empire Inc",
            "color:#E8861A;font-size:11px;"
          );
        `}</Script>
      </body>
    </html>
  );
}
