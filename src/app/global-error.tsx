'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect, useState } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [tryAgainHover, setTryAgainHover] = useState(false)
  const [goHomeHover, setGoHomeHover] = useState(false)

  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: '#F7F7F5',
          fontFamily:
            "'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif",
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '28rem',
            width: '100%',
            margin: '1.5rem',
            padding: '2.5rem 2rem',
            textAlign: 'center',
            boxShadow:
              '0 4px 24px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.04)',
          }}
        >
          {/* Warning icon */}
          <div
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 1.25rem',
              borderRadius: '50%',
              backgroundColor: '#FEF2F2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#DC2626"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>

          {/* Heading */}
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              color: '#1C1C1E',
              margin: '0 0 0.5rem',
              lineHeight: 1.3,
            }}
          >
            Something went wrong
          </h1>

          {/* Description */}
          <p
            style={{
              fontSize: '0.875rem',
              color: '#8A8A8A',
              margin: '0 0 1.5rem',
              lineHeight: 1.6,
            }}
          >
            We&apos;ve been notified and are looking into it.
          </p>

          {/* Error digest */}
          {error.digest && (
            <div
              style={{
                fontSize: '0.75rem',
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                color: '#8A8A8A',
                backgroundColor: '#F0F0EE',
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                wordBreak: 'break-all',
              }}
            >
              Error ID: {error.digest}
            </div>
          )}

          {/* Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'center',
            }}
          >
            <button
              onClick={reset}
              onMouseEnter={() => setTryAgainHover(true)}
              onMouseLeave={() => setTryAgainHover(false)}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: tryAgainHover ? '#C96E0A' : '#E8861A',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '14px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
                fontFamily: 'inherit',
                transition: 'background-color 200ms ease',
              }}
            >
              Try Again
            </button>

            <a
              href="/"
              onMouseEnter={() => setGoHomeHover(true)}
              onMouseLeave={() => setGoHomeHover(false)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.75rem 1.5rem',
                backgroundColor: goHomeHover ? '#F7F7F5' : 'transparent',
                color: '#1C1C1E',
                border: '1.5px solid #E8E8E6',
                borderRadius: '14px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
                fontFamily: 'inherit',
                textDecoration: 'none',
                transition: 'background-color 200ms ease',
              }}
            >
              Go Home
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
