'use client'

import * as React from 'react'
import { cn } from '@/lib/utils/cn'
import { AlertCircle, XCircle, AlertTriangle, Info } from 'lucide-react'

// ============================================================================
// Types
// ============================================================================

export type FormErrorVariant = 'error' | 'warning' | 'info'

export interface FormErrorProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The error message to display
   */
  message?: string
  /**
   * Alternative: children can be used instead of message
   */
  children?: React.ReactNode
  /**
   * Visual variant of the error
   * @default 'error'
   */
  variant?: FormErrorVariant
  /**
   * Icon to display. Set to null to hide icon.
   * @default AlertCircle for error, AlertTriangle for warning, Info for info
   */
  icon?: React.ReactNode
  /**
   * Whether to show the icon
   * @default true
   */
  showIcon?: boolean
  /**
   * ID for associating with input via aria-describedby
   */
  id?: string
  /**
   * Whether this is an inline error (smaller, no background)
   * @default false
   */
  inline?: boolean
  /**
   * Animation on appear
   * @default true
   */
  animate?: boolean
}

export interface FormErrorListProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Object containing field errors
   */
  errors: Record<string, string | undefined>
  /**
   * Optional mapping of field names to display labels
   */
  fieldLabels?: Record<string, string>
  /**
   * Visual variant
   * @default 'error'
   */
  variant?: FormErrorVariant
  /**
   * Title for the error summary
   */
  title?: string
  /**
   * Whether to show field names/labels
   * @default true
   */
  showFieldNames?: boolean
}

// ============================================================================
// Helper Components
// ============================================================================

const iconMap: Record<FormErrorVariant, React.ComponentType<{ className?: string }>> = {
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const variantStyles: Record<FormErrorVariant, { container: string; icon: string; text: string }> = {
  error: {
    container: 'bg-red-50 border-red-200 text-red-800',
    icon: 'text-red-500',
    text: 'text-red-700',
  },
  warning: {
    container: 'bg-amber-50 border-amber-200 text-amber-800',
    icon: 'text-amber-500',
    text: 'text-amber-700',
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: 'text-blue-500',
    text: 'text-blue-700',
  },
}

const inlineVariantStyles: Record<FormErrorVariant, { icon: string; text: string }> = {
  error: {
    icon: 'text-red-500',
    text: 'text-red-600',
  },
  warning: {
    icon: 'text-amber-500',
    text: 'text-amber-600',
  },
  info: {
    icon: 'text-blue-500',
    text: 'text-blue-600',
  },
}

// ============================================================================
// FormError Component
// ============================================================================

/**
 * A versatile form error display component with accessibility support
 *
 * @example
 * ```tsx
 * // Basic usage
 * <FormError message="This field is required" />
 *
 * // With children
 * <FormError>
 *   Please enter a valid email address
 * </FormError>
 *
 * // Inline variant (for field-level errors)
 * <FormError message={errors.email} inline id="email-error" />
 *
 * // Warning variant
 * <FormError message="Password is weak" variant="warning" />
 * ```
 */
const FormError = React.forwardRef<HTMLDivElement, FormErrorProps>(
  (
    {
      message,
      children,
      variant = 'error',
      icon,
      showIcon = true,
      id,
      inline = false,
      animate = true,
      className,
      role = 'alert',
      'aria-live': ariaLive = 'polite',
      ...props
    },
    ref
  ) => {
    const content = message || children

    if (!content) {
      return null
    }

    const IconComponent = icon === undefined ? iconMap[variant] : null

    if (inline) {
      const styles = inlineVariantStyles[variant]
      return (
        <div
          ref={ref}
          id={id}
          role={role}
          aria-live={ariaLive}
          className={cn(
            'flex items-center gap-1.5 text-sm mt-1.5',
            styles.text,
            animate && 'animate-in fade-in-0 slide-in-from-top-1 duration-200',
            className
          )}
          {...props}
        >
          {showIcon && IconComponent && (
            <IconComponent className={cn('h-4 w-4 flex-shrink-0', styles.icon)} aria-hidden="true" />
          )}
          {showIcon && icon && (
            <span className={cn('flex-shrink-0', styles.icon)} aria-hidden="true">
              {icon}
            </span>
          )}
          <span>{content}</span>
        </div>
      )
    }

    const styles = variantStyles[variant]
    return (
      <div
        ref={ref}
        id={id}
        role={role}
        aria-live={ariaLive}
        className={cn(
          'flex items-start gap-3 rounded-lg border p-4',
          styles.container,
          animate && 'animate-in fade-in-0 slide-in-from-top-2 duration-300',
          className
        )}
        {...props}
      >
        {showIcon && IconComponent && (
          <IconComponent className={cn('h-5 w-5 flex-shrink-0 mt-0.5', styles.icon)} aria-hidden="true" />
        )}
        {showIcon && icon && (
          <span className={cn('flex-shrink-0 mt-0.5', styles.icon)} aria-hidden="true">
            {icon}
          </span>
        )}
        <div className={cn('flex-1 text-sm', styles.text)}>{content}</div>
      </div>
    )
  }
)
FormError.displayName = 'FormError'

// ============================================================================
// FormErrorList Component
// ============================================================================

/**
 * Displays a summary of multiple form errors
 *
 * @example
 * ```tsx
 * <FormErrorList
 *   errors={form.errors}
 *   fieldLabels={{ email: 'Email address', password: 'Password' }}
 *   title="Please fix the following errors:"
 * />
 * ```
 */
const FormErrorList = React.forwardRef<HTMLDivElement, FormErrorListProps>(
  (
    {
      errors,
      fieldLabels = {},
      variant = 'error',
      title = 'Please correct the following errors:',
      showFieldNames = true,
      className,
      ...props
    },
    ref
  ) => {
    const errorEntries = Object.entries(errors).filter(
      ([, value]) => value !== undefined && value !== ''
    ) as [string, string][]

    if (errorEntries.length === 0) {
      return null
    }

    const styles = variantStyles[variant]
    const IconComponent = iconMap[variant]

    return (
      <div
        ref={ref}
        role="alert"
        aria-live="polite"
        className={cn(
          'rounded-lg border p-4',
          styles.container,
          'animate-in fade-in-0 slide-in-from-top-2 duration-300',
          className
        )}
        {...props}
      >
        <div className="flex items-start gap-3">
          <IconComponent className={cn('h-5 w-5 flex-shrink-0 mt-0.5', styles.icon)} aria-hidden="true" />
          <div className="flex-1">
            {title && (
              <p className={cn('text-sm font-medium mb-2', styles.text)}>{title}</p>
            )}
            <ul className={cn('text-sm space-y-1 list-disc list-inside', styles.text)}>
              {errorEntries.map(([field, error]) => (
                <li key={field}>
                  {showFieldNames && (
                    <span className="font-medium">
                      {fieldLabels[field] || formatFieldName(field)}:
                    </span>
                  )}{' '}
                  {error}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    )
  }
)
FormErrorList.displayName = 'FormErrorList'

// ============================================================================
// FormErrorSummary Component
// ============================================================================

export interface FormErrorSummaryProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Number of errors
   */
  errorCount: number
  /**
   * Custom message template. Use {count} as placeholder.
   */
  message?: string
}

/**
 * Shows a count-based error summary
 *
 * @example
 * ```tsx
 * <FormErrorSummary errorCount={3} />
 * // Renders: "3 errors need to be fixed"
 * ```
 */
const FormErrorSummary = React.forwardRef<HTMLDivElement, FormErrorSummaryProps>(
  ({ errorCount, message, className, ...props }, ref) => {
    if (errorCount === 0) {
      return null
    }

    const defaultMessage = errorCount === 1
      ? '1 error needs to be fixed'
      : `${errorCount} errors need to be fixed`

    const displayMessage = message
      ? message.replace('{count}', String(errorCount))
      : defaultMessage

    return (
      <FormError
        ref={ref}
        message={displayMessage}
        icon={<AlertCircle className="h-5 w-5" />}
        className={className}
        {...props}
      />
    )
  }
)
FormErrorSummary.displayName = 'FormErrorSummary'

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Converts a camelCase or snake_case field name to a human-readable format
 */
function formatFieldName(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\s/, '')
    .toLowerCase()
    .replace(/^./, (char) => char.toUpperCase())
}

// ============================================================================
// Exports
// ============================================================================

export { FormError, FormErrorList, FormErrorSummary }
