/**
 * Sentry Client-Side Configuration
 *
 * To enable: npm install @sentry/nextjs && set NEXT_PUBLIC_SENTRY_DSN in env
 * This file is loaded automatically by @sentry/nextjs when installed.
 *
 * Until Sentry is installed, this file serves as documentation and
 * ready-to-activate configuration.
 */

// Uncomment when @sentry/nextjs is installed:
//
// import * as Sentry from '@sentry/nextjs'
//
// Sentry.init({
//   dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
//   environment: process.env.NODE_ENV,
//
//   // Performance Monitoring
//   tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
//
//   // Session Replay for debugging user issues
//   replaysSessionSampleRate: 0.1,
//   replaysOnErrorSampleRate: 1.0,
//
//   // Only send errors in production
//   enabled: process.env.NODE_ENV === 'production',
//
//   // Ignore common non-actionable errors
//   ignoreErrors: [
//     'ResizeObserver loop',
//     'Non-Error promise rejection',
//     'Load failed',
//     'Failed to fetch',
//     'NetworkError',
//     'AbortError',
//   ],
//
//   integrations: [
//     Sentry.replayIntegration(),
//   ],
// })

export {}
