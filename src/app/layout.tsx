import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { CartSheet } from '@/components/cart/cart-sheet'
import { LiveChatWidget } from '@/components/chat/live-chat-widget'

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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <CartSheet />
        <LiveChatWidget />
      </body>
    </html>
  )
}
