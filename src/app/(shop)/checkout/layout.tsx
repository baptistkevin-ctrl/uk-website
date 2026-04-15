import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-(--color-border) bg-(--color-surface)">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="font-display text-xl font-semibold text-(--brand-dark)"
          >
            UK Grocery
          </Link>
          <div className="flex items-center gap-2 text-sm text-(--color-text-muted)">
            <ShieldCheck size={16} />
            Secure Checkout
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 lg:py-8">
        {children}
      </main>
    </div>
  )
}
