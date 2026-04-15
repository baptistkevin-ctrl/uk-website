'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { ShoppingBag } from 'lucide-react'
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  X,
  Maximize2,
  Download,
  Share2
} from 'lucide-react'

interface ProductGalleryProps {
  images: string[]
  productName: string
  showThumbnails?: boolean
  showZoom?: boolean
  showLightbox?: boolean
}

export function ProductGallery({
  images,
  productName,
  showThumbnails = true,
  showZoom = true,
  showLightbox = true
}: ProductGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 })
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [imgError, setImgError] = useState(false)
  const imageContainerRef = useRef<HTMLDivElement>(null)
  const thumbnailsRef = useRef<HTMLDivElement>(null)

  // Ensure we have at least one image
  const galleryImages = images.length > 0 ? images : ['/placeholder-product.jpg']

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % galleryImages.length)
    setIsZoomed(false)
  }, [galleryImages.length])

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)
    setIsZoomed(false)
  }, [galleryImages.length])

  const goToIndex = (index: number) => {
    setCurrentIndex(index)
    setIsZoomed(false)
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLightboxOpen) {
        if (e.key === 'ArrowRight') goToNext()
        if (e.key === 'ArrowLeft') goToPrev()
        if (e.key === 'Escape') setIsLightboxOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isLightboxOpen, goToNext, goToPrev])

  // Scroll thumbnail into view
  useEffect(() => {
    if (thumbnailsRef.current) {
      const thumbnail = thumbnailsRef.current.children[currentIndex] as HTMLElement
      if (thumbnail) {
        thumbnail.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        })
      }
    }
  }, [currentIndex])

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return

    const touchEnd = e.changedTouches[0].clientX
    const diff = touchStart - touchEnd

    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext()
      else goToPrev()
    }

    setTouchStart(null)
  }

  // Zoom functionality
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed || !imageContainerRef.current) return

    const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect()
    const x = ((e.clientX - left) / width) * 100
    const y = ((e.clientY - top) / height) * 100

    setZoomPosition({ x, y })
  }

  const handleZoomToggle = () => {
    setIsZoomed(!isZoomed)
  }

  // Share functionality
  const handleShare = async () => {
    const imageUrl = galleryImages[currentIndex]

    if (navigator.share) {
      try {
        await navigator.share({
          title: productName,
          url: window.location.href
        })
      } catch (error) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard.writeText(window.location.href)
    }
  }

  // Download functionality
  const handleDownload = async () => {
    const imageUrl = galleryImages[currentIndex]
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${productName}-${currentIndex + 1}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download image:', error)
    }
  }

  return (
    <div className="w-full">
      {/* Main Image */}
      <div
        ref={imageContainerRef}
        className="relative aspect-square bg-(--color-elevated) rounded-xl overflow-hidden mb-4 group"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isZoomed && setIsZoomed(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={`relative w-full h-full ${isZoomed ? 'cursor-zoom-out' : showZoom ? 'cursor-zoom-in' : ''}`}
          onClick={showZoom ? handleZoomToggle : undefined}
        >
          {imgError ? (
            <div className="flex flex-col items-center justify-center h-full w-full bg-(--color-elevated)">
              <ShoppingBag className="h-16 w-16 text-(--color-text-muted) mb-3" />
              <p className="text-sm text-(--color-text-muted)">Image not available</p>
            </div>
          ) : null}
          {!imgError && <Image
            src={galleryImages[currentIndex]}
            alt={`${productName} - Image ${currentIndex + 1}`}
            fill
            onError={() => setImgError(true)}
            className={`object-contain transition-transform duration-200 ${
              isZoomed ? 'scale-[2]' : ''
            }`}
            style={
              isZoomed
                ? {
                    transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
                  }
                : undefined
            }
            priority={currentIndex === 0}
            sizes="(max-width: 768px) 100vw, 50vw"
          />}
        </div>

        {/* Navigation Arrows */}
        {galleryImages.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation()
                goToPrev()
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-(--color-surface)/90 hover:bg-(--color-surface) rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                goToNext()
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-(--color-surface)/90 hover:bg-(--color-surface) rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5 text-foreground" />
            </button>
          </>
        )}

        {/* Action Buttons */}
        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {showZoom && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleZoomToggle()
              }}
              className="p-2 bg-(--color-surface)/90 hover:bg-(--color-surface) rounded-full shadow-md"
              aria-label={isZoomed ? 'Zoom out' : 'Zoom in'}
            >
              {isZoomed ? (
                <ZoomOut className="h-4 w-4 text-foreground" />
              ) : (
                <ZoomIn className="h-4 w-4 text-foreground" />
              )}
            </button>
          )}
          {showLightbox && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsLightboxOpen(true)
              }}
              className="p-2 bg-(--color-surface)/90 hover:bg-(--color-surface) rounded-full shadow-md"
              aria-label="View fullscreen"
            >
              <Maximize2 className="h-4 w-4 text-foreground" />
            </button>
          )}
        </div>

        {/* Image Counter */}
        {galleryImages.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 text-white text-sm rounded-full">
            {currentIndex + 1} / {galleryImages.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {showThumbnails && galleryImages.length > 1 && (
        <div
          ref={thumbnailsRef}
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {galleryImages.map((image, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? 'border-(--brand-primary) ring-2 ring-(--brand-primary-light)'
                  : 'border-(--color-border) hover:border-(--color-border)'
              }`}
            >
              <Image
                src={image}
                alt={`${productName} - Thumbnail ${index + 1}`}
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Dot Indicators (for mobile when thumbnails hidden) */}
      {!showThumbnails && galleryImages.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {galleryImages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? 'bg-(--brand-primary) w-4' : 'bg-(--color-text-disabled)'
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Controls */}
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleShare()
              }}
              className="p-3 bg-(--color-surface)/10 hover:bg-(--color-surface)/20 text-white rounded-full transition-colors"
              aria-label="Share"
            >
              <Share2 className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDownload()
              }}
              className="p-3 bg-(--color-surface)/10 hover:bg-(--color-surface)/20 text-white rounded-full transition-colors"
              aria-label="Download"
            >
              <Download className="h-5 w-5" />
            </button>
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="p-3 bg-(--color-surface)/10 hover:bg-(--color-surface)/20 text-white rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Image Counter */}
          <div className="absolute top-4 left-4 text-white text-sm">
            {currentIndex + 1} / {galleryImages.length}
          </div>

          {/* Navigation */}
          {galleryImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  goToPrev()
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-4 bg-(--color-surface)/10 hover:bg-(--color-surface)/20 text-white rounded-full transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  goToNext()
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-(--color-surface)/10 hover:bg-(--color-surface)/20 text-white rounded-full transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}

          {/* Main Image */}
          <div
            className="relative max-w-[90vw] max-h-[90vh] aspect-square"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={galleryImages[currentIndex]}
              alt={`${productName} - Image ${currentIndex + 1}`}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 90vw"
            />
          </div>

          {/* Thumbnail Strip */}
          {galleryImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto p-2">
              {galleryImages.map((image, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation()
                    goToIndex(index)
                  }}
                  className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentIndex
                      ? 'border-white opacity-100'
                      : 'border-transparent opacity-50 hover:opacity-75'
                  }`}
                >
                  <Image
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
