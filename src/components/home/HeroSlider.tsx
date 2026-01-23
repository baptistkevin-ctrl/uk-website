'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeroSlide {
  id: string
  title: string
  subtitle: string | null
  image_url: string
  button_text: string | null
  button_link: string | null
  is_active: boolean
  display_order: number
}

interface HeroSliderProps {
  slides: HeroSlide[]
}

export function HeroSlider({ slides }: HeroSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  const activeSlides = slides.filter(s => s.is_active).sort((a, b) => a.display_order - b.display_order)

  const nextSlide = useCallback(() => {
    if (activeSlides.length > 1) {
      setCurrentSlide((prev) => (prev + 1) % activeSlides.length)
    }
  }, [activeSlides.length])

  const prevSlide = () => {
    if (activeSlides.length > 1) {
      setCurrentSlide((prev) => (prev - 1 + activeSlides.length) % activeSlides.length)
    }
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    setIsAutoPlaying(false)
    // Resume auto-play after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  // Auto-play
  useEffect(() => {
    if (!isAutoPlaying || activeSlides.length <= 1) return

    const timer = setInterval(nextSlide, 5000)
    return () => clearInterval(timer)
  }, [isAutoPlaying, nextSlide, activeSlides.length])

  if (activeSlides.length === 0) {
    return null
  }

  const slide = activeSlides[currentSlide]

  return (
    <section className="relative h-[400px] sm:h-[500px] lg:h-[600px] overflow-hidden">
      {/* Slides */}
      {activeSlides.map((s, index) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          {/* Background Image */}
          <Image
            src={s.image_url}
            alt={s.title}
            fill
            className="object-cover"
            priority={index === 0}
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />

          {/* Content */}
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-4">
              <div className="max-w-2xl">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
                  <Sparkles className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-medium text-white">Special Offer</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                  {s.title}
                </h1>

                {s.subtitle && (
                  <p className="text-lg lg:text-xl text-white/90 mb-8 max-w-xl">
                    {s.subtitle}
                  </p>
                )}

                {s.button_text && s.button_link && (
                  <Button
                    size="lg"
                    className="h-14 px-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/30 text-base font-semibold"
                    asChild
                  >
                    <Link href={s.button_link}>
                      {s.button_text}
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      {activeSlides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all border border-white/20"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all border border-white/20"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Dots */}
      {activeSlides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {activeSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all ${
                index === currentSlide
                  ? 'w-8 h-3 bg-emerald-500 rounded-full'
                  : 'w-3 h-3 bg-white/50 hover:bg-white/70 rounded-full'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
