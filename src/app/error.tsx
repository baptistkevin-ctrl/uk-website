'use client'

import { AlertTriangle } from 'lucide-react'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-auto max-w-md px-4 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-(--color-error)" />

        <h1 className="mt-4 font-display text-2xl font-semibold text-foreground">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-(--color-text-muted)">
          An unexpected error occurred. Please try again or return to the homepage.
        </p>

        {error.digest && (
          <p className="mt-3 font-mono text-xs text-(--color-text-muted)">
            Error ID: {error.digest}
          </p>
        )}

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="h-11 px-5 rounded-xl bg-(--brand-primary) text-white text-sm font-semibold hover:bg-(--brand-primary-hover) transition-colors"
          >
            Try Again
          </button>
          <a
            href="/"
            className="h-11 px-5 rounded-xl border border-(--color-border) text-sm font-semibold text-foreground hover:bg-(--color-elevated) transition-colors inline-flex items-center"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  )
}
