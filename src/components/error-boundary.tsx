'use client'

import React, { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp, Bug, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Error details structure for logging and display
 */
interface ErrorDetails {
  message: string
  stack?: string
  componentStack?: string
  timestamp: string
  url?: string
  userAgent?: string
}

/**
 * Props for the ErrorBoundary component
 */
interface ErrorBoundaryProps {
  /** Child components to wrap */
  children: ReactNode
  /** Custom fallback UI to render on error */
  fallback?: ReactNode
  /** Custom fallback component that receives error info */
  FallbackComponent?: React.ComponentType<FallbackProps>
  /** Callback when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  /** Callback when reset is triggered */
  onReset?: () => void
  /** Reset keys - when these change, the error boundary resets */
  resetKeys?: unknown[]
  /** Custom class name for the fallback container */
  className?: string
  /** Show detailed error info (useful for development) */
  showDetails?: boolean
}

/**
 * Props passed to custom fallback components
 */
export interface FallbackProps {
  error: Error
  errorDetails: ErrorDetails
  resetErrorBoundary: () => void
}

/**
 * State for the ErrorBoundary component
 */
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorDetails: ErrorDetails | null
}

// ============================================================================
// Error Logging Service (Ready for integration)
// ============================================================================

/**
 * Log error to console and prepare for external service integration
 * Ready to be connected to services like Sentry, LogRocket, Bugsnag, etc.
 */
function logErrorToService(errorDetails: ErrorDetails): void {
  // Console logging for development
  console.group('%c[ErrorBoundary] An error was caught', 'color: #ef4444; font-weight: bold;')
  console.error('Message:', errorDetails.message)
  console.error('Timestamp:', errorDetails.timestamp)
  console.error('URL:', errorDetails.url)

  if (errorDetails.stack) {
    console.groupCollapsed('Stack Trace')
    console.error(errorDetails.stack)
    console.groupEnd()
  }

  if (errorDetails.componentStack) {
    console.groupCollapsed('Component Stack')
    console.error(errorDetails.componentStack)
    console.groupEnd()
  }

  console.groupEnd()

  // TODO: Integrate with your error tracking service
  // Example integrations:
  //
  // Sentry:
  // Sentry.captureException(error, {
  //   extra: errorDetails,
  //   tags: { component: 'ErrorBoundary' }
  // })
  //
  // LogRocket:
  // LogRocket.captureException(error, {
  //   extra: errorDetails
  // })
  //
  // Custom API:
  // fetch('/api/log-error', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(errorDetails)
  // })
}

// ============================================================================
// Default Fallback Component
// ============================================================================

/**
 * Beautiful default fallback UI matching the site design
 */
function DefaultFallback({
  error,
  errorDetails,
  resetErrorBoundary,
  showDetails = false,
  className
}: FallbackProps & { showDetails?: boolean; className?: string }) {
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const copyErrorToClipboard = async () => {
    const errorText = `
Error: ${errorDetails.message}
Timestamp: ${errorDetails.timestamp}
URL: ${errorDetails.url || 'N/A'}

Stack Trace:
${errorDetails.stack || 'N/A'}

Component Stack:
${errorDetails.componentStack || 'N/A'}
    `.trim()

    try {
      await navigator.clipboard.writeText(errorText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      console.error('Failed to copy error details')
    }
  }

  return (
    <div
      className={cn(
        'min-h-[400px] flex items-center justify-center p-6',
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="w-full max-w-lg">
        {/* Error Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-red-500 to-rose-500 px-6 py-8 text-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Oops! Something went wrong
            </h2>
            <p className="text-red-100 text-sm">
              We encountered an unexpected error
            </p>
          </div>

          {/* Body */}
          <div className="p-6">
            {/* Error message summary */}
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <Bug className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-red-800 mb-1">
                    Error Message
                  </p>
                  <p className="text-sm text-red-700 break-words">
                    {error.message || 'An unknown error occurred'}
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Button
                onClick={resetErrorBoundary}
                className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white font-semibold"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="flex-1 h-12 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold"
              >
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </div>

            {/* Show details toggle (development mode) */}
            {showDetails && (
              <div className="border-t border-gray-100 pt-4">
                <button
                  onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                  className="flex items-center justify-between w-full text-left text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  aria-expanded={isDetailsOpen}
                >
                  <span className="font-medium">Technical Details</span>
                  {isDetailsOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                {isDetailsOpen && (
                  <div className="mt-4 space-y-4">
                    {/* Timestamp and URL */}
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-gray-500 block mb-1">Timestamp</span>
                        <span className="text-gray-700 font-mono">
                          {errorDetails.timestamp}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block mb-1">URL</span>
                        <span className="text-gray-700 font-mono truncate block">
                          {errorDetails.url || 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Stack trace */}
                    {errorDetails.stack && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-500">Stack Trace</span>
                          <button
                            onClick={copyErrorToClipboard}
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            {copied ? (
                              <>
                                <Check className="h-3 w-3 text-green-500" />
                                <span className="text-green-500">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs overflow-x-auto max-h-48 overflow-y-auto">
                          <code>{errorDetails.stack}</code>
                        </pre>
                      </div>
                    )}

                    {/* Component stack */}
                    {errorDetails.componentStack && (
                      <div>
                        <span className="text-xs text-gray-500 block mb-2">
                          Component Stack
                        </span>
                        <pre className="bg-gray-100 text-gray-700 rounded-lg p-4 text-xs overflow-x-auto max-h-32 overflow-y-auto">
                          <code>{errorDetails.componentStack}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              If this problem persists, please{' '}
              <a
                href="/contact"
                className="text-green-600 hover:text-green-700 underline underline-offset-2"
              >
                contact our support team
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// ErrorBoundary Class Component
// ============================================================================

/**
 * Production-ready Error Boundary component for React applications
 *
 * Features:
 * - Catches all errors in child component tree
 * - Beautiful, accessible fallback UI
 * - Error logging ready for service integration
 * - Customizable fallback components
 * - Reset functionality with key-based resets
 * - TypeScript support
 *
 * @example
 * // Basic usage
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 *
 * @example
 * // With custom fallback and error handler
 * <ErrorBoundary
 *   FallbackComponent={CustomFallback}
 *   onError={(error, info) => logToService(error, info)}
 *   onReset={() => clearCache()}
 *   resetKeys={[userId]}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorDetails: null,
    }
  }

  /**
   * Update state when an error is caught
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  /**
   * Log error and call onError callback
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const errorDetails: ErrorDetails = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      componentStack: errorInfo.componentStack || undefined,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    }

    this.setState({
      errorInfo,
      errorDetails,
    })

    // Log error
    logErrorToService(errorDetails)

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)
  }

  /**
   * Reset error boundary when resetKeys change
   */
  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { resetKeys } = this.props
    const { hasError } = this.state

    if (
      hasError &&
      resetKeys &&
      prevProps.resetKeys &&
      !this.areKeysEqual(prevProps.resetKeys, resetKeys)
    ) {
      this.resetErrorBoundary()
    }
  }

  /**
   * Compare reset keys for equality
   */
  private areKeysEqual(prevKeys: unknown[], nextKeys: unknown[]): boolean {
    if (prevKeys.length !== nextKeys.length) return false
    return prevKeys.every((key, index) => key === nextKeys[index])
  }

  /**
   * Reset the error boundary state
   */
  resetErrorBoundary = (): void => {
    this.props.onReset?.()
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorDetails: null,
    })
  }

  render(): ReactNode {
    const {
      hasError,
      error,
      errorDetails
    } = this.state

    const {
      children,
      fallback,
      FallbackComponent,
      className,
      showDetails = process.env.NODE_ENV === 'development',
    } = this.props

    if (hasError && error && errorDetails) {
      // Custom fallback element
      if (fallback) {
        return fallback
      }

      // Custom fallback component
      if (FallbackComponent) {
        return (
          <FallbackComponent
            error={error}
            errorDetails={errorDetails}
            resetErrorBoundary={this.resetErrorBoundary}
          />
        )
      }

      // Default fallback
      return (
        <DefaultFallback
          error={error}
          errorDetails={errorDetails}
          resetErrorBoundary={this.resetErrorBoundary}
          showDetails={showDetails}
          className={className}
        />
      )
    }

    return children
  }
}

// ============================================================================
// Higher-Order Component (HOC)
// ============================================================================

/**
 * Options for the withErrorBoundary HOC
 */
interface WithErrorBoundaryOptions {
  /** Custom fallback UI */
  fallback?: ReactNode
  /** Custom fallback component */
  FallbackComponent?: React.ComponentType<FallbackProps>
  /** Error callback */
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  /** Reset callback */
  onReset?: () => void
  /** Show technical details */
  showDetails?: boolean
  /** Custom class name */
  className?: string
}

/**
 * Higher-Order Component to wrap any component with an error boundary
 *
 * @example
 * // Basic usage
 * const SafeComponent = withErrorBoundary(MyComponent)
 *
 * @example
 * // With options
 * const SafeComponent = withErrorBoundary(MyComponent, {
 *   FallbackComponent: CustomFallback,
 *   onError: (error) => console.error(error),
 * })
 */
function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithErrorBoundaryOptions = {}
): React.FC<P> {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component'

  const ComponentWithErrorBoundary: React.FC<P> = (props) => {
    return (
      <ErrorBoundary
        fallback={options.fallback}
        FallbackComponent={options.FallbackComponent}
        onError={options.onError}
        onReset={options.onReset}
        showDetails={options.showDetails}
        className={options.className}
      >
        <WrappedComponent {...props} />
      </ErrorBoundary>
    )
  }

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`

  return ComponentWithErrorBoundary
}

// ============================================================================
// Utility Hook for Throwing Errors (Testing)
// ============================================================================

/**
 * Hook to throw errors from functional components (useful for testing)
 *
 * @example
 * const throwError = useErrorHandler()
 *
 * // In an async operation
 * try {
 *   await riskyOperation()
 * } catch (error) {
 *   throwError(error)
 * }
 */
function useErrorHandler(): (error: unknown) => void {
  const [, setError] = React.useState<Error>()

  return React.useCallback((error: unknown) => {
    setError(() => {
      if (error instanceof Error) {
        throw error
      }
      throw new Error(String(error))
    })
  }, [])
}

// ============================================================================
// Exports
// ============================================================================

export {
  ErrorBoundary,
  withErrorBoundary,
  useErrorHandler,
  DefaultFallback,
  type ErrorBoundaryProps,
  type ErrorDetails,
  type WithErrorBoundaryOptions,
}

export default ErrorBoundary
