'use client'

import { useState, useCallback, forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'
import { OptimizedImage, responsiveSizes, type OptimizedImageProps } from '@/components/ui/optimized-image'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { ShoppingBag, ImageOff } from 'lucide-react'

/**
 * Badge configuration for product overlays
 */
export interface ProductBadge {
  /** Badge text content */
  text: string
  /** Badge variant from Badge component */
  variant?: BadgeProps['variant']
  /** Position of the badge */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  /** Custom className for the badge */
  className?: string
  /** Optional icon component */
  icon?: React.ReactNode
}

/**
 * Aspect ratio presets for product images
 */
export const aspectRatioPresets = {
  /** Square - most common for product images */
  square: '1/1',
  /** Portrait - taller products */
  portrait: '3/4',
  /** Landscape - wider products */
  landscape: '4/3',
  /** Wide - banner-style */
  wide: '16/9',
  /** Ultra-wide - panoramic */
  ultraWide: '21/9',
} as const

export type AspectRatioPreset = keyof typeof aspectRatioPresets

export interface ProductImageProps extends Omit<OptimizedImageProps, 'aspectRatio' | 'fill'> {
  /** Product name for alt text fallback */
  productName?: string
  /** Aspect ratio preset or custom ratio string */
  aspectRatio?: AspectRatioPreset | string
  /** Enable zoom effect on hover */
  enableZoom?: boolean
  /** Zoom scale factor (default: 1.1) */
  zoomScale?: number
  /** Badges to overlay on the image */
  badges?: ProductBadge[]
  /** Show placeholder icon when no image */
  showPlaceholder?: boolean
  /** Custom placeholder content */
  placeholderContent?: React.ReactNode
  /** Whether the product is out of stock */
  isOutOfStock?: boolean
  /** Custom out of stock overlay content */
  outOfStockContent?: React.ReactNode
  /** Enable grayscale when out of stock */
  grayscaleWhenOutOfStock?: boolean
  /** Callback when image is clicked */
  onClick?: () => void
  /** Additional overlay content (renders on top of image) */
  overlay?: React.ReactNode
  /** Show gradient overlay on hover */
  showHoverGradient?: boolean
  /** Border radius preset */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
}

const DEFAULT_PRODUCT_FALLBACK = '/placeholder-product.jpg'

/**
 * Rounded class mapping
 */
const roundedClasses = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  full: 'rounded-full',
} as const

/**
 * Badge position classes
 */
const badgePositionClasses = {
  'top-left': 'top-2 left-2',
  'top-right': 'top-2 right-2',
  'bottom-left': 'bottom-2 left-2',
  'bottom-right': 'bottom-2 right-2',
} as const

/**
 * ProductImage - A specialized image component for product displays
 *
 * Features:
 * - Aspect ratio container
 * - Zoom on hover effect
 * - Fallback for missing product images
 * - Badge overlay support (sale, new, etc.)
 * - Out of stock overlay
 * - Hover gradient effect
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ProductImage
 *   src="/product.jpg"
 *   alt="Product name"
 *   productName="Fresh Apples"
 * />
 *
 * // With badges and zoom
 * <ProductImage
 *   src="/product.jpg"
 *   alt="Product name"
 *   enableZoom
 *   badges={[
 *     { text: 'SALE', variant: 'destructive', position: 'top-left' },
 *     { text: 'NEW', variant: 'default', position: 'top-right' }
 *   ]}
 * />
 *
 * // Out of stock
 * <ProductImage
 *   src="/product.jpg"
 *   alt="Product name"
 *   isOutOfStock
 *   grayscaleWhenOutOfStock
 * />
 * ```
 */
export const ProductImage = forwardRef<HTMLDivElement, ProductImageProps>(
  (
    {
      src,
      alt,
      productName,
      aspectRatio = 'square',
      enableZoom = false,
      zoomScale = 1.1,
      badges = [],
      showPlaceholder = true,
      placeholderContent,
      isOutOfStock = false,
      outOfStockContent,
      grayscaleWhenOutOfStock = false,
      onClick,
      overlay,
      showHoverGradient = false,
      rounded = 'lg',
      className,
      containerClassName,
      responsiveSize = 'productCard',
      fallbackSrc = DEFAULT_PRODUCT_FALLBACK,
      ...imageProps
    },
    ref
  ) => {
    const [hasError, setHasError] = useState(false)
    const [isHovered, setIsHovered] = useState(false)

    // Resolve aspect ratio
    const resolvedAspectRatio =
      aspectRatioPresets[aspectRatio as AspectRatioPreset] || aspectRatio

    // Handle error to show placeholder
    const handleError = useCallback(() => {
      setHasError(true)
    }, [])

    // Determine if we should show the placeholder
    const shouldShowPlaceholder = !src || hasError

    // Group badges by position for proper rendering
    const badgesByPosition = badges.reduce(
      (acc, badge) => {
        const position = badge.position || 'top-left'
        if (!acc[position]) acc[position] = []
        acc[position].push(badge)
        return acc
      },
      {} as Record<string, ProductBadge[]>
    )

    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden group',
          roundedClasses[rounded],
          onClick && 'cursor-pointer',
          containerClassName
        )}
        style={{ aspectRatio: resolvedAspectRatio }}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      >
        {/* Main Image or Placeholder */}
        {shouldShowPlaceholder && showPlaceholder ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
            {placeholderContent || (
              <div className="flex flex-col items-center justify-center text-slate-400">
                <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-2">
                  {hasError ? (
                    <ImageOff className="h-8 w-8 text-slate-400" />
                  ) : (
                    <ShoppingBag className="h-8 w-8 text-slate-400" />
                  )}
                </div>
                {productName && (
                  <span className="text-xs text-center px-2 line-clamp-2">
                    {productName}
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          <OptimizedImage
            src={src}
            alt={alt || productName || 'Product image'}
            fill
            responsiveSize={responsiveSize}
            fallbackSrc={fallbackSrc}
            onErrorCallback={handleError}
            className={cn(
              'object-cover transition-all duration-500 ease-out',
              enableZoom && 'group-hover:scale-110',
              isOutOfStock && grayscaleWhenOutOfStock && 'grayscale',
              className
            )}
            style={
              enableZoom && isHovered
                ? { transform: `scale(${zoomScale})` }
                : undefined
            }
            containerClassName="absolute inset-0"
            {...imageProps}
          />
        )}

        {/* Hover Gradient Overlay */}
        {showHoverGradient && (
          <div
            className={cn(
              'absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent',
              'opacity-0 group-hover:opacity-100 transition-opacity duration-300',
              'pointer-events-none'
            )}
          />
        )}

        {/* Badge Overlays */}
        {Object.entries(badgesByPosition).map(([position, positionBadges]) => (
          <div
            key={position}
            className={cn(
              'absolute flex flex-col gap-1 z-10',
              badgePositionClasses[position as keyof typeof badgePositionClasses]
            )}
          >
            {positionBadges.map((badge, index) => (
              <Badge
                key={`${badge.text}-${index}`}
                variant={badge.variant || 'default'}
                className={cn(
                  'text-xs font-semibold shadow-md',
                  badge.className
                )}
              >
                {badge.icon && <span className="mr-1">{badge.icon}</span>}
                {badge.text}
              </Badge>
            ))}
          </div>
        ))}

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-20">
            {outOfStockContent || (
              <Badge
                variant="secondary"
                className="text-sm px-4 py-2 bg-slate-900 text-white font-semibold"
              >
                Out of Stock
              </Badge>
            )}
          </div>
        )}

        {/* Custom Overlay */}
        {overlay && (
          <div className="absolute inset-0 z-30 pointer-events-none">
            {overlay}
          </div>
        )}
      </div>
    )
  }
)

ProductImage.displayName = 'ProductImage'

/**
 * ProductImageSkeleton - Loading skeleton for product images
 */
export function ProductImageSkeleton({
  aspectRatio = 'square',
  rounded = 'lg',
  className,
}: {
  aspectRatio?: AspectRatioPreset | string
  rounded?: ProductImageProps['rounded']
  className?: string
}) {
  const resolvedAspectRatio =
    aspectRatioPresets[aspectRatio as AspectRatioPreset] || aspectRatio

  return (
    <div
      className={cn(
        'bg-slate-200 animate-pulse',
        roundedClasses[rounded || 'lg'],
        className
      )}
      style={{ aspectRatio: resolvedAspectRatio }}
    />
  )
}

/**
 * ProductImageGrid - Responsive grid for multiple product images
 */
export function ProductImageGrid({
  images,
  productName,
  onImageClick,
  className,
  maxImages = 4,
  showMoreCount = true,
}: {
  images: string[]
  productName?: string
  onImageClick?: (index: number) => void
  className?: string
  maxImages?: number
  showMoreCount?: boolean
}) {
  const displayImages = images.slice(0, maxImages)
  const remainingCount = images.length - maxImages

  return (
    <div
      className={cn(
        'grid gap-2',
        displayImages.length === 1 && 'grid-cols-1',
        displayImages.length === 2 && 'grid-cols-2',
        displayImages.length === 3 && 'grid-cols-2 grid-rows-2',
        displayImages.length >= 4 && 'grid-cols-2 grid-rows-2',
        className
      )}
    >
      {displayImages.map((src, index) => (
        <div
          key={src}
          className={cn(
            'relative',
            displayImages.length === 3 && index === 0 && 'row-span-2'
          )}
        >
          <ProductImage
            src={src}
            alt={`${productName || 'Product'} - Image ${index + 1}`}
            productName={productName}
            aspectRatio="square"
            enableZoom
            onClick={() => onImageClick?.(index)}
          />
          {/* Show "+X more" on last image if there are more */}
          {showMoreCount && index === maxImages - 1 && remainingCount > 0 && (
            <div
              className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg cursor-pointer"
              onClick={() => onImageClick?.(index)}
            >
              <span className="text-white text-xl font-semibold">
                +{remainingCount} more
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default ProductImage
