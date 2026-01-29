'use client'

import * as React from 'react'
import { cn } from '@/lib/utils/cn'
import {
  SKIP_LINK_TARGETS,
  DEFAULT_SKIP_LINKS,
  skipToTarget,
  type SkipLinkConfig,
  type SkipLinkTarget,
} from '@/lib/accessibility'

/**
 * Props for the SkipLink component
 */
export interface SkipLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  /**
   * The target ID to skip to
   */
  targetId: string
  /**
   * Label text for the skip link
   */
  label?: string
}

/**
 * SkipLink Component
 *
 * A single skip link that becomes visible on focus.
 * Essential for keyboard users to bypass repetitive navigation.
 *
 * Follows WCAG 2.1 AA Success Criterion 2.4.1: Bypass Blocks
 *
 * @example
 * ```tsx
 * <SkipLink targetId="main-content" label="Skip to main content" />
 * ```
 */
const SkipLink = React.forwardRef<HTMLAnchorElement, SkipLinkProps>(
  ({ targetId, label = 'Skip to content', className, onClick, ...props }, ref) => {
    const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault()
      skipToTarget(targetId)
      onClick?.(event)
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLAnchorElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        skipToTarget(targetId)
      }
    }

    return (
      <a
        ref={ref}
        href={`#${targetId}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          // Hidden by default
          'absolute left-0 top-0 z-[9999]',
          'w-px h-px p-0 -m-px overflow-hidden',
          'whitespace-nowrap border-0',
          '[clip:rect(0,0,0,0)]',
          // Visible on focus
          'focus:static focus:w-auto focus:h-auto',
          'focus:px-6 focus:py-3 focus:m-2',
          'focus:overflow-visible focus:whitespace-normal',
          'focus:[clip:auto]',
          // Styling
          'focus:bg-emerald-600 focus:text-white',
          'focus:font-semibold focus:text-sm',
          'focus:rounded-lg focus:shadow-lg',
          'focus:outline-none focus:ring-2 focus:ring-emerald-400',
          'focus:ring-offset-2',
          // Transition
          'transition-all duration-150',
          className
        )}
        {...props}
      >
        {label}
      </a>
    )
  }
)

SkipLink.displayName = 'SkipLink'

/**
 * Props for the SkipLinks component
 */
export interface SkipLinksProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Custom skip link configurations
   * If not provided, uses default skip links
   */
  links?: SkipLinkConfig[]
  /**
   * Whether to render as a navigation landmark
   */
  asNav?: boolean
}

/**
 * SkipLinks Component
 *
 * A group of skip links for navigating to different sections of the page.
 * Typically placed at the very beginning of the page content.
 *
 * Follows WCAG 2.1 AA Success Criterion 2.4.1: Bypass Blocks
 *
 * @example Basic usage with default links
 * ```tsx
 * // In your layout.tsx
 * <body>
 *   <SkipLinks />
 *   <Header />
 *   <main id="main-content">
 *     {children}
 *   </main>
 * </body>
 * ```
 *
 * @example Custom links
 * ```tsx
 * <SkipLinks
 *   links={[
 *     { id: 'main-content', label: 'Skip to main content' },
 *     { id: 'sidebar', label: 'Skip to sidebar' },
 *     { id: 'footer', label: 'Skip to footer' },
 *   ]}
 * />
 * ```
 */
const SkipLinks = React.forwardRef<HTMLDivElement, SkipLinksProps>(
  ({ links = DEFAULT_SKIP_LINKS, asNav = true, className, ...props }, ref) => {
    const Wrapper = asNav ? 'nav' : 'div'

    return (
      <Wrapper
        ref={ref}
        aria-label={asNav ? 'Skip links' : undefined}
        className={cn('skip-links', className)}
        {...props}
      >
        {links.map((link) => (
          <SkipLink
            key={link.id}
            targetId={link.id}
            label={link.label}
            aria-keyshortcuts={link.shortcut}
          />
        ))}
      </Wrapper>
    )
  }
)

SkipLinks.displayName = 'SkipLinks'

/**
 * Props for the SkipLinkTarget component
 */
export interface SkipLinkTargetProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The ID of the skip link target
   */
  id: SkipLinkTarget | string
  /**
   * The element to render
   */
  as?: 'div' | 'main' | 'section' | 'nav' | 'article' | 'aside' | 'header' | 'footer'
  /**
   * Optional label for screen readers
   */
  label?: string
}

/**
 * SkipLinkTarget Component
 *
 * A wrapper component that marks a section as a skip link target.
 * Ensures proper focus management when a skip link is activated.
 *
 * @example
 * ```tsx
 * <SkipLinkTarget id="main-content" as="main" label="Main content">
 *   <h1>Page Title</h1>
 *   <p>Page content...</p>
 * </SkipLinkTarget>
 * ```
 */
const SkipLinkTarget = React.forwardRef<HTMLDivElement, SkipLinkTargetProps>(
  ({ id, as: Component = 'div', label, className, children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        id={id}
        tabIndex={-1}
        aria-label={label}
        className={cn(
          // Remove default focus outline since we manage focus programmatically
          'outline-none focus:outline-none',
          // Optional subtle focus indicator for debugging
          'focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-inset',
          className
        )}
        {...props}
      >
        {children}
      </Component>
    )
  }
)

SkipLinkTarget.displayName = 'SkipLinkTarget'

/**
 * Hook for managing skip link keyboard shortcuts
 *
 * @param shortcuts - Map of key combinations to target IDs
 * @returns void
 *
 * @example
 * ```tsx
 * useSkipLinkShortcuts({
 *   'Alt+1': 'main-content',
 *   'Alt+2': 'navigation',
 *   'Alt+3': 'search',
 * })
 * ```
 */
export function useSkipLinkShortcuts(
  shortcuts: Record<string, string>
): void {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = [
        event.altKey && 'Alt',
        event.ctrlKey && 'Ctrl',
        event.shiftKey && 'Shift',
        event.metaKey && 'Meta',
        event.key,
      ]
        .filter(Boolean)
        .join('+')

      const targetId = shortcuts[key]
      if (targetId) {
        event.preventDefault()
        skipToTarget(targetId)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

/**
 * Provider component that sets up skip link keyboard shortcuts
 */
export interface SkipLinkProviderProps {
  children: React.ReactNode
  /**
   * Enable default keyboard shortcuts (Alt+1, Alt+2, Alt+3)
   */
  enableShortcuts?: boolean
}

/**
 * SkipLinkProvider Component
 *
 * A provider component that sets up skip link keyboard shortcuts
 * and manages skip link functionality throughout the app.
 *
 * @example
 * ```tsx
 * // In your root layout
 * <SkipLinkProvider enableShortcuts>
 *   <SkipLinks />
 *   <Header />
 *   <main id="main-content">{children}</main>
 * </SkipLinkProvider>
 * ```
 */
export function SkipLinkProvider({
  children,
  enableShortcuts = true,
}: SkipLinkProviderProps) {
  // Set up keyboard shortcuts
  useSkipLinkShortcuts(
    enableShortcuts
      ? {
          'Alt+1': SKIP_LINK_TARGETS.MAIN_CONTENT,
          'Alt+2': SKIP_LINK_TARGETS.NAVIGATION,
          'Alt+3': SKIP_LINK_TARGETS.SEARCH,
        }
      : {}
  )

  return <>{children}</>
}

// Re-export constants and types for convenience
export { SKIP_LINK_TARGETS, DEFAULT_SKIP_LINKS }
export type { SkipLinkConfig }
export type { SkipLinkTarget as SkipLinkTargetId }

export { SkipLink, SkipLinks, SkipLinkTarget }
