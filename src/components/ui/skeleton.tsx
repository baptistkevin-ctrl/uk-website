'use client'

import * as React from 'react'
import { cn } from '@/lib/utils/cn'
import { cva, type VariantProps } from 'class-variance-authority'

// ============================================================================
// Base Skeleton Component
// ============================================================================

const skeletonVariants = cva(
  'relative overflow-hidden rounded-md bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]',
  {
    variants: {
      animation: {
        pulse: 'animate-pulse',
        shimmer: 'animate-shimmer',
        wave: 'animate-wave',
        none: '',
      },
      variant: {
        default: 'bg-gray-200',
        subtle: 'bg-gray-100',
        dark: 'bg-gray-300',
      },
    },
    defaultVariants: {
      animation: 'shimmer',
      variant: 'default',
    },
  }
)

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

function Skeleton({
  className,
  animation,
  variant,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(skeletonVariants({ animation, variant }), className)}
      {...props}
    />
  )
}

// ============================================================================
// Text Skeleton - For simulating text content
// ============================================================================

interface TextSkeletonProps extends SkeletonProps {
  lines?: number
  lastLineWidth?: 'full' | 'three-quarters' | 'half' | 'quarter'
}

function TextSkeleton({
  lines = 3,
  lastLineWidth = 'three-quarters',
  className,
  ...props
}: TextSkeletonProps) {
  const widthMap = {
    full: 'w-full',
    'three-quarters': 'w-3/4',
    half: 'w-1/2',
    quarter: 'w-1/4',
  }

  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn(
            'h-4',
            index === lines - 1 ? widthMap[lastLineWidth] : 'w-full'
          )}
          {...props}
        />
      ))}
    </div>
  )
}

// ============================================================================
// Image Skeleton - For simulating images with aspect ratios
// ============================================================================

interface ImageSkeletonProps extends SkeletonProps {
  aspectRatio?: 'square' | 'video' | 'wide' | 'portrait'
  showIcon?: boolean
}

function ImageSkeleton({
  aspectRatio = 'square',
  showIcon = true,
  className,
  ...props
}: ImageSkeletonProps) {
  const aspectRatioMap = {
    square: 'aspect-square',
    video: 'aspect-video',
    wide: 'aspect-[21/9]',
    portrait: 'aspect-[3/4]',
  }

  return (
    <Skeleton
      className={cn(
        'flex items-center justify-center',
        aspectRatioMap[aspectRatio],
        className
      )}
      {...props}
    >
      {showIcon && (
        <svg
          className="h-10 w-10 text-gray-300"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      )}
    </Skeleton>
  )
}

// ============================================================================
// Avatar Skeleton - For simulating avatars
// ============================================================================

interface AvatarSkeletonProps extends SkeletonProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

function AvatarSkeleton({
  size = 'md',
  className,
  ...props
}: AvatarSkeletonProps) {
  const sizeMap = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  }

  return (
    <Skeleton
      className={cn('rounded-full', sizeMap[size], className)}
      {...props}
    />
  )
}

// ============================================================================
// Card Skeleton - Complete card with image, title, description
// ============================================================================

interface CardSkeletonProps extends SkeletonProps {
  hasImage?: boolean
  hasFooter?: boolean
  imageAspectRatio?: 'square' | 'video' | 'wide' | 'portrait'
}

function CardSkeleton({
  hasImage = true,
  hasFooter = true,
  imageAspectRatio = 'video',
  className,
  ...props
}: CardSkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden',
        className
      )}
    >
      {hasImage && (
        <ImageSkeleton aspectRatio={imageAspectRatio} showIcon={true} {...props} />
      )}
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" {...props} />
        <TextSkeleton lines={2} lastLineWidth="half" {...props} />
        {hasFooter && (
          <div className="flex items-center justify-between pt-2">
            <Skeleton className="h-6 w-20" {...props} />
            <Skeleton className="h-9 w-24 rounded-md" {...props} />
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Product Card Skeleton - Specifically designed for e-commerce product cards
// ============================================================================

interface ProductCardSkeletonProps extends SkeletonProps {
  showBadge?: boolean
  showRating?: boolean
  showAddToCart?: boolean
  layout?: 'vertical' | 'horizontal'
}

function ProductCardSkeleton({
  showBadge = true,
  showRating = true,
  showAddToCart = true,
  layout = 'vertical',
  className,
  ...props
}: ProductCardSkeletonProps) {
  if (layout === 'horizontal') {
    return (
      <div
        className={cn(
          'flex rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden',
          className
        )}
      >
        <div className="relative w-1/3 min-w-[120px]">
          <ImageSkeleton aspectRatio="square" showIcon={true} className="h-full" {...props} />
          {showBadge && (
            <Skeleton className="absolute top-2 left-2 h-5 w-12 rounded-full" {...props} />
          )}
        </div>
        <div className="flex-1 p-4 space-y-3">
          <Skeleton className="h-4 w-20" {...props} />
          <Skeleton className="h-5 w-full" {...props} />
          {showRating && (
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-4 rounded-sm" {...props} />
              ))}
              <Skeleton className="h-4 w-8 ml-2" {...props} />
            </div>
          )}
          <div className="flex items-center justify-between pt-2">
            <div className="space-y-1">
              <Skeleton className="h-6 w-16" {...props} />
              <Skeleton className="h-4 w-12" {...props} />
            </div>
            {showAddToCart && (
              <Skeleton className="h-10 w-10 rounded-full" {...props} />
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group relative rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg',
        className
      )}
    >
      {/* Image Section */}
      <div className="relative">
        <ImageSkeleton aspectRatio="square" showIcon={true} {...props} />
        {showBadge && (
          <Skeleton className="absolute top-3 left-3 h-6 w-14 rounded-full" {...props} />
        )}
        {/* Wishlist button skeleton */}
        <Skeleton className="absolute top-3 right-3 h-8 w-8 rounded-full" {...props} />
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-3">
        {/* Category */}
        <Skeleton className="h-3 w-16" {...props} />

        {/* Product Name */}
        <Skeleton className="h-5 w-full" {...props} />
        <Skeleton className="h-5 w-2/3" {...props} />

        {/* Rating */}
        {showRating && (
          <div className="flex items-center gap-1">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-4 rounded" {...props} />
              ))}
            </div>
            <Skeleton className="h-4 w-10 ml-2" {...props} />
          </div>
        )}

        {/* Price and Add to Cart */}
        <div className="flex items-end justify-between pt-2">
          <div className="space-y-1">
            <Skeleton className="h-3 w-14" {...props} />
            <Skeleton className="h-7 w-20" {...props} />
          </div>
          {showAddToCart && (
            <Skeleton className="h-10 w-28 rounded-lg" {...props} />
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Table Skeleton - For simulating table data
// ============================================================================

interface TableSkeletonProps extends SkeletonProps {
  rows?: number
  columns?: number
  showHeader?: boolean
  showCheckbox?: boolean
  showActions?: boolean
}

function TableSkeleton({
  rows = 5,
  columns = 4,
  showHeader = true,
  showCheckbox = false,
  showActions = true,
  className,
  ...props
}: TableSkeletonProps) {
  const totalColumns = columns + (showCheckbox ? 1 : 0) + (showActions ? 1 : 0)

  return (
    <div className={cn('w-full overflow-hidden rounded-lg border border-gray-200', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          {showHeader && (
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {showCheckbox && (
                  <th className="px-4 py-3 w-12">
                    <Skeleton className="h-5 w-5 rounded" {...props} />
                  </th>
                )}
                {Array.from({ length: columns }).map((_, index) => (
                  <th key={index} className="px-4 py-3 text-left">
                    <Skeleton
                      className={cn('h-4', index === 0 ? 'w-32' : 'w-20')}
                      {...props}
                    />
                  </th>
                ))}
                {showActions && (
                  <th className="px-4 py-3 w-24">
                    <Skeleton className="h-4 w-16 ml-auto" {...props} />
                  </th>
                )}
              </tr>
            </thead>
          )}
          <tbody className="divide-y divide-gray-200 bg-white">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                {showCheckbox && (
                  <td className="px-4 py-4 w-12">
                    <Skeleton className="h-5 w-5 rounded" {...props} />
                  </td>
                )}
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="px-4 py-4">
                    {colIndex === 0 ? (
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-lg" {...props} />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-28" {...props} />
                          <Skeleton className="h-3 w-20" {...props} />
                        </div>
                      </div>
                    ) : (
                      <Skeleton
                        className={cn(
                          'h-4',
                          colIndex === 1 ? 'w-24' : colIndex === 2 ? 'w-16' : 'w-20'
                        )}
                        {...props}
                      />
                    )}
                  </td>
                ))}
                {showActions && (
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Skeleton className="h-8 w-8 rounded" {...props} />
                      <Skeleton className="h-8 w-8 rounded" {...props} />
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ============================================================================
// List Skeleton - For simulating list items
// ============================================================================

interface ListSkeletonProps extends SkeletonProps {
  items?: number
  showAvatar?: boolean
  showAction?: boolean
}

function ListSkeleton({
  items = 5,
  showAvatar = true,
  showAction = false,
  className,
  ...props
}: ListSkeletonProps) {
  return (
    <div className={cn('divide-y divide-gray-200', className)}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 py-4">
          {showAvatar && <AvatarSkeleton size="md" {...props} />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" {...props} />
            <Skeleton className="h-3 w-2/3" {...props} />
          </div>
          {showAction && <Skeleton className="h-8 w-20 rounded-md" {...props} />}
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// Form Skeleton - For simulating forms
// ============================================================================

interface FormSkeletonProps extends SkeletonProps {
  fields?: number
  showSubmit?: boolean
}

function FormSkeleton({
  fields = 4,
  showSubmit = true,
  className,
  ...props
}: FormSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-24" {...props} />
          <Skeleton className="h-10 w-full rounded-md" {...props} />
        </div>
      ))}
      {showSubmit && (
        <Skeleton className="h-10 w-full rounded-md mt-4" {...props} />
      )}
    </div>
  )
}

// ============================================================================
// Stats Card Skeleton - For dashboard statistics
// ============================================================================

function StatsCardSkeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-white p-6 shadow-sm',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-10 rounded-lg" {...props} />
        <Skeleton className="h-6 w-16 rounded-full" {...props} />
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-8 w-24" {...props} />
        <Skeleton className="h-4 w-32" {...props} />
      </div>
    </div>
  )
}

// ============================================================================
// Navigation Skeleton - For nav bars and menus
// ============================================================================

interface NavSkeletonProps extends SkeletonProps {
  items?: number
  showLogo?: boolean
  showSearch?: boolean
  showAvatar?: boolean
}

function NavSkeleton({
  items = 4,
  showLogo = true,
  showSearch = true,
  showAvatar = true,
  className,
  ...props
}: NavSkeletonProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white',
        className
      )}
    >
      <div className="flex items-center gap-8">
        {showLogo && <Skeleton className="h-8 w-32" {...props} />}
        <div className="hidden md:flex items-center gap-6">
          {Array.from({ length: items }).map((_, index) => (
            <Skeleton key={index} className="h-4 w-16" {...props} />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4">
        {showSearch && (
          <Skeleton className="h-10 w-64 rounded-full hidden lg:block" {...props} />
        )}
        <Skeleton className="h-10 w-10 rounded-lg" {...props} />
        {showAvatar && <AvatarSkeleton size="md" {...props} />}
      </div>
    </div>
  )
}

// ============================================================================
// Sidebar Skeleton - For sidebar navigation
// ============================================================================

interface SidebarSkeletonProps extends SkeletonProps {
  items?: number
  showHeader?: boolean
  collapsed?: boolean
}

function SidebarSkeleton({
  items = 8,
  showHeader = true,
  collapsed = false,
  className,
  ...props
}: SidebarSkeletonProps) {
  return (
    <div
      className={cn(
        'flex flex-col h-full bg-white border-r border-gray-200',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {showHeader && (
        <div className="p-4 border-b border-gray-200">
          <Skeleton
            className={cn('h-8', collapsed ? 'w-8' : 'w-32')}
            {...props}
          />
        </div>
      )}
      <div className="flex-1 p-4 space-y-2">
        {Array.from({ length: items }).map((_, index) => (
          <div
            key={index}
            className={cn(
              'flex items-center gap-3 p-2 rounded-lg',
              index === 0 && 'bg-green-50'
            )}
          >
            <Skeleton className="h-5 w-5 rounded" {...props} />
            {!collapsed && <Skeleton className="h-4 w-24" {...props} />}
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// Comment Skeleton - For social/comment sections
// ============================================================================

interface CommentSkeletonProps extends SkeletonProps {
  showReplies?: boolean
  replyCount?: number
}

function CommentSkeleton({
  showReplies = false,
  replyCount = 2,
  className,
  ...props
}: CommentSkeletonProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex gap-3">
        <AvatarSkeleton size="md" {...props} />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24" {...props} />
            <Skeleton className="h-3 w-16" {...props} />
          </div>
          <TextSkeleton lines={2} lastLineWidth="three-quarters" {...props} />
          <div className="flex items-center gap-4 pt-1">
            <Skeleton className="h-4 w-12" {...props} />
            <Skeleton className="h-4 w-12" {...props} />
          </div>
        </div>
      </div>
      {showReplies && (
        <div className="ml-12 space-y-4">
          {Array.from({ length: replyCount }).map((_, index) => (
            <div key={index} className="flex gap-3">
              <AvatarSkeleton size="sm" {...props} />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-20" {...props} />
                  <Skeleton className="h-3 w-12" {...props} />
                </div>
                <Skeleton className="h-4 w-full" {...props} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Export all components
// ============================================================================

export {
  Skeleton,
  TextSkeleton,
  ImageSkeleton,
  AvatarSkeleton,
  CardSkeleton,
  ProductCardSkeleton,
  TableSkeleton,
  ListSkeleton,
  FormSkeleton,
  StatsCardSkeleton,
  NavSkeleton,
  SidebarSkeleton,
  CommentSkeleton,
  skeletonVariants,
}
