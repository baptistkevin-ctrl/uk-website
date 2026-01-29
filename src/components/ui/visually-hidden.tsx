'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils/cn'

/**
 * Props for the VisuallyHidden component
 */
export interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * When true, renders the child element directly with visually hidden styles
   * instead of wrapping it in a span
   */
  asChild?: boolean
  /**
   * Whether the content should become visible on focus
   * Useful for skip links and focus-based content
   */
  focusable?: boolean
}

/**
 * VisuallyHidden Component
 *
 * Renders content that is visually hidden but accessible to screen readers.
 * This is essential for providing context to assistive technology users
 * without affecting the visual design.
 *
 * Follows WCAG 2.1 AA guidelines for accessible hiding techniques.
 *
 * @example Basic usage
 * ```tsx
 * <button>
 *   <HeartIcon />
 *   <VisuallyHidden>Add to favorites</VisuallyHidden>
 * </button>
 * ```
 *
 * @example With focusable skip link
 * ```tsx
 * <VisuallyHidden focusable asChild>
 *   <a href="#main-content">Skip to main content</a>
 * </VisuallyHidden>
 * ```
 *
 * @example Using asChild to pass styles to children
 * ```tsx
 * <VisuallyHidden asChild>
 *   <label htmlFor="email">Email address</label>
 * </VisuallyHidden>
 * ```
 */
const VisuallyHidden = React.forwardRef<HTMLSpanElement, VisuallyHiddenProps>(
  ({ asChild = false, focusable = false, className, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'span'

    return (
      <Comp
        ref={ref}
        className={cn(
          // Base visually hidden styles following best practices
          // These styles hide content visually while keeping it accessible
          // to screen readers and other assistive technologies
          'absolute w-px h-px p-0 -m-px overflow-hidden',
          'whitespace-nowrap border-0',
          // Use clip-path for modern browsers with rect fallback
          '[clip:rect(0,0,0,0)]',
          // When focusable, show on focus
          focusable && [
            // Reset styles when focused
            'focus:static focus:w-auto focus:h-auto focus:p-2',
            'focus:m-0 focus:overflow-visible',
            'focus:whitespace-normal focus:[clip:auto]',
            // Focus ring styling
            'focus:outline-none focus:ring-2 focus:ring-emerald-500',
            'focus:ring-offset-2 focus:bg-white focus:shadow-lg',
            'focus:rounded-md focus:z-50',
          ],
          className
        )}
        {...props}
      >
        {children}
      </Comp>
    )
  }
)

VisuallyHidden.displayName = 'VisuallyHidden'

/**
 * Hook for applying visually hidden styles programmatically
 *
 * @example
 * ```tsx
 * function CustomComponent() {
 *   const srOnlyStyles = useVisuallyHiddenStyles()
 *
 *   return (
 *     <div style={srOnlyStyles}>
 *       Screen reader only content
 *     </div>
 *   )
 * }
 * ```
 */
export function useVisuallyHiddenStyles(): React.CSSProperties {
  return {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: '0',
  }
}

/**
 * Tailwind CSS classes for visually hidden content
 * Can be used directly in className props
 */
export const visuallyHiddenClasses =
  'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0 [clip:rect(0,0,0,0)]'

/**
 * Tailwind CSS classes for focusable visually hidden content
 * Shows content when focused (useful for skip links)
 */
export const visuallyHiddenFocusableClasses = cn(
  visuallyHiddenClasses,
  'focus:static focus:w-auto focus:h-auto focus:p-2',
  'focus:m-0 focus:overflow-visible',
  'focus:whitespace-normal focus:[clip:auto]',
  'focus:outline-none focus:ring-2 focus:ring-emerald-500',
  'focus:ring-offset-2 focus:bg-white focus:shadow-lg',
  'focus:rounded-md focus:z-50'
)

export { VisuallyHidden }
