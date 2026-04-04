import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { CartSheet } from '@/components/cart/cart-sheet'
import { LiveChatWidget } from '@/components/chat/live-chat-widget'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'
import { ProductQuickViewModal } from '@/components/products/product-quick-view-modal'
import { CsrfProvider } from '@/components/csrf-provider'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'FreshMart - Online Grocery Shopping UK',
    template: '%s | FreshMart',
  },
  description:
    'Shop for fresh groceries online. Quality products delivered to your door across the UK. Fresh fruits, vegetables, dairy, meat, and more.',
  keywords: [
    'online grocery',
    'UK groceries',
    'fresh food delivery',
    'supermarket delivery',
    'buy groceries online',
  ],
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased pb-14 lg:pb-0`}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-white focus:px-4 focus:py-2 focus:rounded focus:shadow-lg focus:text-green-700 focus:font-semibold">
          Skip to main content
        </a>
        <CsrfProvider>
          <main id="main-content">{children}</main>
          <MobileBottomNav />
          <CartSheet />
          <ProductQuickViewModal />
          <LiveChatWidget />
        </CsrfProvider>
      </body>
    </html>
  )
}
