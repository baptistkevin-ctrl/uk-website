'use client'

import { useMemo } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Breadcrumb item interface
 */
export interface BreadcrumbItem {
  /** Display label for the breadcrumb */
  label: string
  /** URL path for the breadcrumb link */
  href: string
  /** Whether this is the current/active page */
  isCurrent: boolean
}

/**
 * Options for the useBreadcrumbs hook
 */
export interface UseBreadcrumbsOptions {
  /**
   * Custom label mapping for path segments
   * Maps path segments to display labels
   * Example: { 'products': 'Shop', 'my-category': 'My Category' }
   */
  labelMap?: Record<string, string>

  /**
   * Custom home label (default: 'Home')
   */
  homeLabel?: string

  /**
   * Whether to include the home breadcrumb (default: true)
   */
  includeHome?: boolean

  /**
   * Segments to exclude from breadcrumbs (e.g., route groups like '(shop)')
   */
  excludeSegments?: string[]

  /**
   * Dynamic segment resolvers - functions to resolve labels for dynamic segments
   * Key is the dynamic segment pattern (e.g., '[slug]', '[id]')
   * Value is the resolved label or a function that returns the label
   */
  dynamicSegments?: Record<string, string | ((segment: string) => string)>

  /**
   * Custom transformer for segment labels when no mapping exists
   */
  transformLabel?: (segment: string) => string
}

/**
 * Default label transformations for common URL patterns
 */
const DEFAULT_LABEL_MAP: Record<string, string> = {
  // Shop sections
  products: 'Products',
  categories: 'Categories',
  category: 'Category',
  cart: 'Cart',
  checkout: 'Checkout',
  wishlist: 'Wishlist',
  compare: 'Compare',
  search: 'Search',
  deals: 'Deals',
  offers: 'Offers',

  // Account sections
  account: 'My Account',
  orders: 'Orders',
  addresses: 'Addresses',
  profile: 'Profile',
  settings: 'Settings',
  notifications: 'Notifications',
  rewards: 'Rewards',
  referrals: 'Referrals',
  invoices: 'Invoices',

  // Admin sections
  admin: 'Admin',
  dashboard: 'Dashboard',
  users: 'Users',
  vendors: 'Vendors',
  analytics: 'Analytics',
  coupons: 'Coupons',
  'gift-cards': 'Gift Cards',
  'abandoned-carts': 'Abandoned Carts',

  // Vendor sections
  vendor: 'Vendor Portal',
  payouts: 'Payouts',

  // Informational pages
  about: 'About Us',
  contact: 'Contact',
  faq: 'FAQ',
  help: 'Help',
  privacy: 'Privacy Policy',
  terms: 'Terms of Service',
  'track-order': 'Track Order',
}

/**
 * Transforms a URL segment into a human-readable label
 * Handles kebab-case, snake_case, and other common patterns
 */
function defaultTransformLabel(segment: string): string {
  return segment
    // Replace hyphens and underscores with spaces
    .replace(/[-_]/g, ' ')
    // Capitalize first letter of each word
    .replace(/\b\w/g, (char) => char.toUpperCase())
    // Handle common acronyms
    .replace(/\bId\b/g, 'ID')
    .replace(/\bUrl\b/g, 'URL')
    .replace(/\bApi\b/g, 'API')
}

/**
 * Checks if a segment is a route group (wrapped in parentheses)
 */
function isRouteGroup(segment: string): boolean {
  return segment.startsWith('(') && segment.endsWith(')')
}

/**
 * Checks if a segment is a dynamic segment (wrapped in brackets)
 */
function isDynamicSegment(segment: string): boolean {
  return segment.startsWith('[') && segment.endsWith(']')
}

/**
 * Custom hook to generate breadcrumb navigation items from the current pathname
 *
 * @param options - Configuration options for breadcrumb generation
 * @returns Array of breadcrumb items with labels, hrefs, and current state
 *
 * @example
 * ```tsx
 * const breadcrumbs = useBreadcrumbs({
 *   labelMap: { 'my-product': 'My Product Name' },
 *   dynamicSegments: {
 *     '[slug]': (slug) => slug.replace(/-/g, ' '),
 *   },
 * })
 * ```
 */
export function useBreadcrumbs(options: UseBreadcrumbsOptions = {}): BreadcrumbItem[] {
  const pathname = usePathname()

  const {
    labelMap = {},
    homeLabel = 'Home',
    includeHome = true,
    excludeSegments = [],
    dynamicSegments = {},
    transformLabel = defaultTransformLabel,
  } = options

  // Merge custom label map with defaults
  const mergedLabelMap = useMemo(
    () => ({ ...DEFAULT_LABEL_MAP, ...labelMap }),
    [labelMap]
  )

  const breadcrumbs = useMemo(() => {
    // Split pathname into segments and filter empty ones
    const segments = pathname.split('/').filter(Boolean)

    // Filter out route groups and excluded segments
    const filteredSegments = segments.filter((segment) => {
      if (isRouteGroup(segment)) return false
      if (excludeSegments.includes(segment)) return false
      return true
    })

    const items: BreadcrumbItem[] = []

    // Add home breadcrumb
    if (includeHome) {
      items.push({
        label: homeLabel,
        href: '/',
        isCurrent: pathname === '/',
      })
    }

    // Build breadcrumb items for each segment
    let currentPath = ''
    filteredSegments.forEach((segment, index) => {
      currentPath += `/${segment}`
      const isLast = index === filteredSegments.length - 1

      // Determine the label for this segment
      let label: string

      // Check if this is a dynamic segment with a resolver
      const dynamicKey = Object.keys(dynamicSegments).find((key) => {
        const pattern = key.replace(/\[|\]/g, '')
        return segment.match(new RegExp(`^${pattern}$`, 'i')) || key === `[${segment}]`
      })

      if (mergedLabelMap[segment]) {
        // Use label map if available
        label = mergedLabelMap[segment]
      } else if (dynamicKey && dynamicSegments[dynamicKey]) {
        // Use dynamic segment resolver
        const resolver = dynamicSegments[dynamicKey]
        label = typeof resolver === 'function' ? resolver(segment) : resolver
      } else if (isDynamicSegment(segment)) {
        // Clean up dynamic segment syntax for display
        label = transformLabel(segment.replace(/\[|\]/g, ''))
      } else {
        // Default transformation
        label = transformLabel(segment)
      }

      items.push({
        label,
        href: currentPath,
        isCurrent: isLast,
      })
    })

    return items
  }, [
    pathname,
    mergedLabelMap,
    homeLabel,
    includeHome,
    excludeSegments,
    dynamicSegments,
    transformLabel,
  ])

  return breadcrumbs
}

/**
 * Generate static breadcrumbs without using hooks
 * Useful for server components or static generation
 *
 * @param pathname - The current pathname
 * @param options - Configuration options
 * @returns Array of breadcrumb items
 */
export function generateBreadcrumbs(
  pathname: string,
  options: Omit<UseBreadcrumbsOptions, 'dynamicSegments'> & {
    dynamicSegments?: Record<string, string>
  } = {}
): BreadcrumbItem[] {
  const {
    labelMap = {},
    homeLabel = 'Home',
    includeHome = true,
    excludeSegments = [],
    dynamicSegments = {},
    transformLabel = defaultTransformLabel,
  } = options

  const mergedLabelMap = { ...DEFAULT_LABEL_MAP, ...labelMap }
  const segments = pathname.split('/').filter(Boolean)

  const filteredSegments = segments.filter((segment) => {
    if (isRouteGroup(segment)) return false
    if (excludeSegments.includes(segment)) return false
    return true
  })

  const items: BreadcrumbItem[] = []

  if (includeHome) {
    items.push({
      label: homeLabel,
      href: '/',
      isCurrent: pathname === '/',
    })
  }

  let currentPath = ''
  filteredSegments.forEach((segment, index) => {
    currentPath += `/${segment}`
    const isLast = index === filteredSegments.length - 1

    let label: string

    if (mergedLabelMap[segment]) {
      label = mergedLabelMap[segment]
    } else if (dynamicSegments[segment]) {
      label = dynamicSegments[segment]
    } else {
      label = transformLabel(segment)
    }

    items.push({
      label,
      href: currentPath,
      isCurrent: isLast,
    })
  })

  return items
}

export default useBreadcrumbs
