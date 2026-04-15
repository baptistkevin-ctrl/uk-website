import Link from 'next/link'
import { ArrowLeft, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-auto max-w-md px-4 text-center">
        {/* Large 404 */}
        <p className="font-display text-8xl font-bold text-(--brand-primary)/10 lg:text-9xl">
          404
        </p>

        {/* Message */}
        <h1 className="mt-2 font-display text-2xl font-semibold text-foreground">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-(--color-text-muted)">
          The page you&apos;re looking for has moved or doesn&apos;t exist.
        </p>

        {/* CTA */}
        <div className="mt-6">
          <Link href="/">
            <Button variant="primary" size="lg">
              <ArrowLeft className="h-4 w-4" />
              Back to Homepage
            </Button>
          </Link>
        </div>

        {/* Inline search */}
        <div className="relative mx-auto mt-6 max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--color-text-muted)" />
          <input
            type="search"
            placeholder="Search products..."
            className="h-10 w-full rounded-lg border border-(--color-border) bg-(--color-surface) pl-10 pr-3 text-sm text-foreground placeholder:text-(--color-text-muted) transition-colors focus:border-(--brand-primary) focus:ring-2 focus:ring-(--brand-primary)/30 focus:outline-none"
          />
        </div>
      </div>
    </div>
  )
}
