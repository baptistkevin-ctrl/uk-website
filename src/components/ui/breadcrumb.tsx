'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { useBreadcrumbs, type BreadcrumbItem, type UseBreadcrumbsOptions } from '@/hooks/use-breadcrumbs'

/**
 * SVG Icons for the breadcrumb component
 */
const HomeIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={cn('h-4 w-4', className)}
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z"
      clipRule="evenodd"
    />
  </svg>
)

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={cn('h-4 w-4', className)}
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
      clipRule="evenodd"
    />
  </svg>
)

const EllipsisIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={cn('h-4 w-4', className)}
    aria-hidden="true"
  >
    <path d="M3 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM8.5 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM15.5 8.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />
  </svg>
)

/**
 * Props for the Breadcrumb component
 */
export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Custom breadcrumb items (overrides auto-generated breadcrumbs)
   */
  items?: BreadcrumbItem[]

  /**
   * Options for auto-generating breadcrumbs from pathname
   */
  options?: UseBreadcrumbsOptions

  /**
   * Maximum number of visible items before truncation
   * Items in the middle will be collapsed
   * Default: 4
   */
  maxItems?: number

  /**
   * Number of items to always show at the start (including home)
   * Default: 1
   */
  itemsBeforeCollapse?: number

  /**
   * Number of items to always show at the end
   * Default: 2
   */
  itemsAfterCollapse?: number

  /**
   * Whether to show home icon for the first item
   * Default: true
   */
  showHomeIcon?: boolean

  /**
   * Custom separator component
   */
  separator?: React.ReactNode

  /**
   * Base URL for the site (used in JSON-LD)
   * Default: '' (relative URLs)
   */
  baseUrl?: string

  /**
   * Whether to include JSON-LD structured data
   * Default: true
   */
  includeJsonLd?: boolean
}

/**
 * Props for individual breadcrumb items
 */
interface BreadcrumbItemProps {
  item: BreadcrumbItem
  isFirst: boolean
  showHomeIcon: boolean
  isCollapsed?: boolean
}

/**
 * Individual breadcrumb item component
 */
const BreadcrumbItemComponent = React.memo(function BreadcrumbItemComponent({
  item,
  isFirst,
  showHomeIcon,
}: BreadcrumbItemProps) {
  const content = (
    <>
      {isFirst && showHomeIcon ? (
        <span className="flex items-center gap-1.5">
          <HomeIcon className="flex-shrink-0" />
          <span className="sr-only sm:not-sr-only">{item.label}</span>
        </span>
      ) : (
        <span className="truncate max-w-[120px] sm:max-w-[180px] md:max-w-[240px]">
          {item.label}
        </span>
      )}
    </>
  )

  if (item.isCurrent) {
    return (
      <span
        className={cn(
          'text-sm font-medium text-gray-900 dark:text-gray-100',
          'truncate max-w-[150px] sm:max-w-[200px] md:max-w-[300px]'
        )}
        aria-current="page"
      >
        {isFirst && showHomeIcon ? (
          <span className="flex items-center gap-1.5">
            <HomeIcon className="flex-shrink-0" />
            <span className="sr-only sm:not-sr-only">{item.label}</span>
          </span>
        ) : (
          item.label
        )}
      </span>
    )
  }

  return (
    <Link
      href={item.href}
      className={cn(
        'text-sm font-medium text-gray-500 dark:text-gray-400',
        'hover:text-green-600 dark:hover:text-green-400',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2',
        'rounded-sm transition-colors duration-150',
        'inline-flex items-center'
      )}
    >
      {content}
    </Link>
  )
})

/**
 * Separator between breadcrumb items
 */
const BreadcrumbSeparator = ({ children }: { children?: React.ReactNode }) => (
  <li className="flex items-center mx-1.5 sm:mx-2 text-gray-400 dark:text-gray-500" aria-hidden="true">
    {children || <ChevronRightIcon />}
  </li>
)

/**
 * Collapsed items indicator (ellipsis)
 */
const BreadcrumbEllipsis = ({
  items,
  onExpand,
}: {
  items: BreadcrumbItem[]
  onExpand: () => void
}) => (
  <li className="flex items-center">
    <button
      type="button"
      onClick={onExpand}
      className={cn(
        'p-1 rounded-md text-gray-500 dark:text-gray-400',
        'hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-800',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2',
        'transition-colors duration-150'
      )}
      aria-label={`Show ${items.length} more breadcrumbs`}
      title={items.map((i) => i.label).join(' > ')}
    >
      <EllipsisIcon />
    </button>
  </li>
)

/**
 * JSON-LD structured data for SEO
 */
const BreadcrumbJsonLd = ({
  items,
  baseUrl,
}: {
  items: BreadcrumbItem[]
  baseUrl: string
}) => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.isCurrent ? undefined : `${baseUrl}${item.href}`,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

/**
 * World-class Breadcrumb component with:
 * - Semantic HTML with proper ARIA attributes
 * - Home icon for first item
 * - Separator icons between items
 * - Current page (last item) not linked
 * - Truncation for long paths
 * - Mobile-friendly with collapsible middle items
 * - JSON-LD structured data for SEO
 * - Tailwind CSS styling
 * - Dark mode support
 * - Keyboard accessible
 *
 * @example
 * ```tsx
 * // Auto-generated from pathname
 * <Breadcrumb />
 *
 * // With custom options
 * <Breadcrumb
 *   options={{
 *     labelMap: { 'product-slug': 'Product Name' },
 *   }}
 *   maxItems={4}
 * />
 *
 * // With custom items
 * <Breadcrumb
 *   items={[
 *     { label: 'Home', href: '/', isCurrent: false },
 *     { label: 'Products', href: '/products', isCurrent: false },
 *     { label: 'Product Name', href: '/products/product-name', isCurrent: true },
 *   ]}
 * />
 * ```
 */
export function Breadcrumb({
  items: customItems,
  options,
  maxItems = 4,
  itemsBeforeCollapse = 1,
  itemsAfterCollapse = 2,
  showHomeIcon = true,
  separator,
  baseUrl = '',
  includeJsonLd = true,
  className,
  ...props
}: BreadcrumbProps) {
  // Auto-generate breadcrumbs from pathname if no custom items provided
  const autoBreadcrumbs = useBreadcrumbs(options)
  const items = customItems || autoBreadcrumbs

  // State for expanded/collapsed view
  const [isExpanded, setIsExpanded] = React.useState(false)

  // Don't render if there are no items or only home
  if (items.length <= 1) {
    return null
  }

  // Determine if we need to collapse items
  const shouldCollapse = !isExpanded && items.length > maxItems
  const collapsedItems = shouldCollapse
    ? items.slice(itemsBeforeCollapse, items.length - itemsAfterCollapse)
    : []

  // Build the visible items list
  let visibleItems: (BreadcrumbItem | 'ellipsis')[]
  if (shouldCollapse) {
    visibleItems = [
      ...items.slice(0, itemsBeforeCollapse),
      'ellipsis' as const,
      ...items.slice(items.length - itemsAfterCollapse),
    ]
  } else {
    visibleItems = items
  }

  return (
    <>
      {includeJsonLd && <BreadcrumbJsonLd items={items} baseUrl={baseUrl} />}

      <nav
        aria-label="Breadcrumb navigation"
        className={cn(
          'flex items-center py-2 px-1',
          className
        )}
        {...props}
      >
        <ol
          className={cn(
            'flex flex-wrap items-center gap-y-1',
            'text-sm'
          )}
          itemScope
          itemType="https://schema.org/BreadcrumbList"
        >
          {visibleItems.map((item, index) => {
            if (item === 'ellipsis') {
              return (
                <React.Fragment key="ellipsis">
                  <BreadcrumbSeparator>{separator}</BreadcrumbSeparator>
                  <BreadcrumbEllipsis
                    items={collapsedItems}
                    onExpand={() => setIsExpanded(true)}
                  />
                </React.Fragment>
              )
            }

            const isFirst = index === 0
            const actualIndex = shouldCollapse && index > itemsBeforeCollapse
              ? items.indexOf(item)
              : index

            return (
              <React.Fragment key={item.href}>
                {!isFirst && <BreadcrumbSeparator>{separator}</BreadcrumbSeparator>}
                <li
                  className="flex items-center"
                  itemScope
                  itemProp="itemListElement"
                  itemType="https://schema.org/ListItem"
                >
                  <BreadcrumbItemComponent
                    item={item}
                    isFirst={isFirst}
                    showHomeIcon={showHomeIcon}
                  />
                  <meta itemProp="position" content={String(actualIndex + 1)} />
                  <meta itemProp="name" content={item.label} />
                  {!item.isCurrent && (
                    <meta itemProp="item" content={`${baseUrl}${item.href}`} />
                  )}
                </li>
              </React.Fragment>
            )
          })}
        </ol>
      </nav>
    </>
  )
}

/**
 * Container component for consistent breadcrumb styling with background
 */
export function BreadcrumbContainer({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800',
        className
      )}
      {...props}
    >
      <div className="container mx-auto px-4">
        {children}
      </div>
    </div>
  )
}

/**
 * Skeleton loading state for breadcrumbs
 */
export function BreadcrumbSkeleton({ itemCount = 3 }: { itemCount?: number }) {
  return (
    <nav aria-label="Loading breadcrumb" className="flex items-center py-2 px-1">
      <ol className="flex items-center gap-2">
        {Array.from({ length: itemCount }).map((_, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <li className="text-gray-300 dark:text-gray-600" aria-hidden="true">
                <ChevronRightIcon />
              </li>
            )}
            <li>
              <div
                className={cn(
                  'h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse',
                  index === 0 ? 'w-4' : index === itemCount - 1 ? 'w-24' : 'w-16'
                )}
              />
            </li>
          </React.Fragment>
        ))}
      </ol>
    </nav>
  )
}

export type { BreadcrumbItem, UseBreadcrumbsOptions }
export default Breadcrumb
