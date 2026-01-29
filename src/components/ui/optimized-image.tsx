'use client'

import { useState, useCallback, forwardRef } from 'react'
import Image, { ImageProps } from 'next/image'
import { cn } from '@/lib/utils/cn'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Responsive sizing presets for common use cases
 */
export const responsiveSizes = {
  /** Full width on mobile, half on tablet, third on desktop */
  productCard: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  /** Full width on mobile, half on larger screens */
  hero: '(max-width: 768px) 100vw, 50vw',
  /** Full width always */
  fullWidth: '100vw',
  /** Small thumbnail */
  thumbnail: '(max-width: 640px) 80px, 120px',
  /** Product gallery main image */
  gallery: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px',
  /** Avatar or icon sized */
  avatar: '48px',
  /** Category banner */
  banner: '(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px',
} as const

export type ResponsiveSizePreset = keyof typeof responsiveSizes

/**
 * Format hints for modern image formats
 * These suggest to Next.js Image optimization which formats to prefer
 */
export type ImageFormatHint = 'auto' | 'webp' | 'avif'

export interface OptimizedImageProps extends Omit<ImageProps, 'onError' | 'onLoad' | 'placeholder'> {
  /** Alt text for accessibility - required */
  alt: string
  /** Show blur placeholder while loading */
  blurPlaceholder?: boolean
  /** Custom blur data URL (if not using Next.js automatic blur) */
  blurDataURL?: string
  /** Fallback image URL when main image fails to load */
  fallbackSrc?: string
  /** Show skeleton loader while loading */
  showSkeleton?: boolean
  /** Custom skeleton className */
  skeletonClassName?: string
  /** Responsive size preset or custom sizes string */
  responsiveSize?: ResponsiveSizePreset | string
  /** Container aspect ratio (e.g., '1/1', '16/9', '4/3') */
  aspectRatio?: string
  /** Additional container className */
  containerClassName?: string
  /** Format optimization hint */
  formatHint?: ImageFormatHint
  /** Callback when image loads successfully */
  onLoadComplete?: () => void
  /** Callback when image fails to load */
  onErrorCallback?: () => void
  /** Disable lazy loading (images will load eagerly) */
  eager?: boolean
  /** Quality setting (1-100, default 75) */
  quality?: number
}

/** Default fallback image for missing/broken images */
const DEFAULT_FALLBACK = '/placeholder-product.jpg'

/** Tiny transparent placeholder for blur effect base */
const BLUR_PLACEHOLDER = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

/**
 * OptimizedImage - A world-class image component wrapper around Next.js Image
 *
 * Features:
 * - Blur placeholder support
 * - Lazy loading by default (with eager option)
 * - Error fallback handling
 * - Loading skeleton while loading
 * - Responsive sizing helpers
 * - WebP/AVIF format hints
 * - Automatic aspect ratio containers
 *
 * @example
 * ```tsx
 * // Basic usage
 * <OptimizedImage
 *   src="/product.jpg"
 *   alt="Product name"
 *   width={400}
 *   height={400}
 * />
 *
 * // With all features
 * <OptimizedImage
 *   src="/product.jpg"
 *   alt="Product name"
 *   fill
 *   blurPlaceholder
 *   showSkeleton
 *   fallbackSrc="/fallback.jpg"
 *   responsiveSize="productCard"
 *   aspectRatio="1/1"
 *   formatHint="avif"
 * />
 * ```
 */
export const OptimizedImage = forwardRef<HTMLImageElement, OptimizedImageProps>(
  (
    {
      src,
      alt,
      blurPlaceholder = false,
      blurDataURL,
      fallbackSrc = DEFAULT_FALLBACK,
      showSkeleton = true,
      skeletonClassName,
      responsiveSize,
      aspectRatio,
      containerClassName,
      formatHint = 'auto',
      onLoadComplete,
      onErrorCallback,
      eager = false,
      quality = 75,
      className,
      fill,
      width,
      height,
      sizes,
      priority,
      ...props
    },
    ref
  ) => {
    const [isLoading, setIsLoading] = useState(true)
    const [hasError, setHasError] = useState(false)
    const [currentSrc, setCurrentSrc] = useState(src)

    // Determine the sizes attribute
    const computedSizes = sizes || (
      responsiveSize
        ? (responsiveSizes[responsiveSize as ResponsiveSizePreset] || responsiveSize)
        : undefined
    )

    // Handle image load
    const handleLoad = useCallback(() => {
      setIsLoading(false)
      onLoadComplete?.()
    }, [onLoadComplete])

    // Handle image error
    const handleError = useCallback(() => {
      if (!hasError && currentSrc !== fallbackSrc) {
        setHasError(true)
        setCurrentSrc(fallbackSrc)
        onErrorCallback?.()
      }
      setIsLoading(false)
    }, [hasError, currentSrc, fallbackSrc, onErrorCallback])

    // Build the placeholder prop
    const placeholder = blurPlaceholder ? 'blur' : 'empty'
    const computedBlurDataURL = blurDataURL || (blurPlaceholder ? BLUR_PLACEHOLDER : undefined)

    // Container styles for aspect ratio
    const containerStyles = aspectRatio
      ? { aspectRatio }
      : undefined

    // Build format-optimized URL query params (Next.js handles this via config, but we can hint)
    // Note: Next.js automatically serves WebP/AVIF based on browser support
    // The formatHint is more for documentation/clarity purposes

    const imageElement = (
      <>
        {/* Skeleton loader */}
        {showSkeleton && isLoading && (
          <Skeleton
            className={cn(
              'absolute inset-0 z-10',
              skeletonClassName
            )}
          />
        )}

        {/* The actual image */}
        <Image
          ref={ref}
          src={currentSrc}
          alt={alt}
          fill={fill}
          width={!fill ? width : undefined}
          height={!fill ? height : undefined}
          sizes={computedSizes}
          quality={quality}
          loading={eager || priority ? 'eager' : 'lazy'}
          priority={priority}
          placeholder={placeholder}
          blurDataURL={computedBlurDataURL}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'transition-opacity duration-300',
            isLoading && showSkeleton ? 'opacity-0' : 'opacity-100',
            className
          )}
          // Unoptimized for external URLs that aren't in next.config domains
          // Note: Remove this if all external domains are properly configured
          {...props}
        />
      </>
    )

    // If aspect ratio or fill is used, wrap in container
    if (aspectRatio || fill) {
      return (
        <div
          className={cn(
            'relative overflow-hidden',
            containerClassName
          )}
          style={containerStyles}
        >
          {imageElement}
        </div>
      )
    }

    // For fixed dimensions, return image directly (wrapped in relative container for skeleton)
    return (
      <div
        className={cn(
          'relative inline-block overflow-hidden',
          containerClassName
        )}
        style={{ width, height }}
      >
        {imageElement}
      </div>
    )
  }
)

OptimizedImage.displayName = 'OptimizedImage'

/**
 * Utility function to generate blur placeholder data URL
 * Use this for static generation of blur placeholders
 */
export function generateBlurPlaceholder(color: string = '#e5e7eb'): string {
  // Simple single-color SVG placeholder
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect fill="${color}" width="1" height="1"/></svg>`
  const base64 = typeof window === 'undefined'
    ? Buffer.from(svg).toString('base64')
    : btoa(svg)
  return `data:image/svg+xml;base64,${base64}`
}

/**
 * Hook to preload an image
 * Useful for preloading images before they're needed
 */
export function useImagePreload() {
  const preload = useCallback((src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        resolve()
        return
      }

      const img = new window.Image()
      img.onload = () => resolve()
      img.onerror = reject
      img.src = src
    })
  }, [])

  const preloadMultiple = useCallback(async (srcs: string[]): Promise<void[]> => {
    return Promise.all(srcs.map(preload))
  }, [preload])

  return { preload, preloadMultiple }
}

export default OptimizedImage
