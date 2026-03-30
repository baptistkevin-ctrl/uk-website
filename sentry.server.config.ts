/**
 * Sentry Server-Side Configuration
 *
 * To enable: npm install @sentry/nextjs && set SENTRY_DSN in env
 */

// Uncomment when @sentry/nextjs is installed:
//
// import * as Sentry from '@sentry/nextjs'
//
// Sentry.init({
//   dsn: process.env.SENTRY_DSN,
//   environment: process.env.NODE_ENV,
//
//   // Performance Monitoring
//   tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
//
//   // Only send errors in production
//   enabled: process.env.NODE_ENV === 'production',
//
//   // Capture unhandled promise rejections
//   integrations: [
//     Sentry.captureConsoleIntegration({ levels: ['error'] }),
//   ],
//
//   // Before sending, enrich with context
//   beforeSend(event) {
//     // Don't send events for expected errors
//     if (event.exception?.values?.[0]?.type === 'NotFoundError') {
//       return null
//     }
//     return event
//   },
// })

export {}
