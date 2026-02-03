'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight } from 'lucide-react'
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

// Promotional banners data (these would ideally come from the database)
const promoBanners = [
  {
    id: 'promo-1',
    title: 'Premium Honeynuts',
    subtitle: '100% Salted Organic Nuts',
    price: '15.00',
    image: '/images/banners/honeynuts.jpg',
    link: '/products?search=nuts',
    bgColor: 'bg-amber-50',
  },
  {
    id: 'promo-2',
    title: 'New Baby Diaper',
    subtitle: 'Top Quality Product',
    image: '/images/banners/baby-diaper.jpg',
    link: '/categories/baby',
    bgColor: 'bg-cyan-50',
  },
  {
    id: 'promo-3',
    title: 'Dark wash FaceWash',
    subtitle: 'All Fixed Size',
    discount: '15% OFF',
    image: '/images/banners/facewash.jpg',
    link: '/categories/health-beauty',
    bgColor: 'bg-orange-50',
  },
]

export function HeroSlider({ slides }: HeroSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  const activeSlides = slides.filter(s => s.is_active).sort((a, b) => a.display_order - b.display_order)

  const nextSlide = useCallback(() => {
    if (activeSlides.length > 1) {
      setCurrentSlide((prev) => (prev + 1) % activeSlides.length)
    }
  }, [activeSlides.length])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  useEffect(() => {
    if (!isAutoPlaying || activeSlides.length <= 1) return
    const timer = setInterval(nextSlide, 5000)
    return () => clearInterval(timer)
  }, [isAutoPlaying, nextSlide, activeSlides.length])

  if (activeSlides.length === 0) {
    return <ZillyDefaultHero />
  }

  const slide = activeSlides[currentSlide]

  return (
    <section className="py-6 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Hero Banner - Left Side */}
          <div className="lg:col-span-2 relative rounded-2xl overflow-hidden h-[400px] lg:h-[480px]">
            {activeSlides.map((s, index) => (
              <div
                key={s.id}
                className={`absolute inset-0 transition-opacity duration-700 ${
                  index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              >
                <Image
                  src={s.image_url}
                  alt={s.title}
                  fill
                  className="object-cover"
                  priority={index === 0}
                />
                {/* Dark gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
                {/* Content Overlay */}
                <div className="absolute inset-0 flex items-center">
                  <div className="p-8 lg:p-12 max-w-md">
                    <span className="inline-block bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 shadow-lg">
                      100% Farm Fresh Food
                    </span>
                    <h1 className="text-3xl lg:text-5xl font-bold text-white mb-2 leading-tight drop-shadow-lg">
                      Fresh Organic
                    </h1>
                    <p className="text-yellow-400 text-xl lg:text-2xl font-semibold mb-4 drop-shadow-md">
                      Food For All
                    </p>
                    <p className="text-4xl lg:text-5xl font-bold text-white mb-6 drop-shadow-lg">
                      £59.00
                    </p>
                    {s.button_text && s.button_link && (
                      <Button
                        className="bg-green-500 hover:bg-green-600 text-white rounded-full px-8 h-12 text-base font-semibold shadow-lg"
                        asChild
                      >
                        <Link href={s.button_link}>
                          {s.button_text}
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Dots */}
            {activeSlides.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
                {activeSlides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`transition-all rounded-full ${
                      index === currentSlide
                        ? 'w-6 h-2 bg-green-500'
                        : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Side Promotional Banners */}
          <div className="hidden lg:grid grid-rows-2 gap-4">
            {/* Top Banner - Premium Honeynuts */}
            <Link href="/products?search=nuts" className="relative rounded-2xl overflow-hidden bg-amber-50 p-6 group">
              <div className="relative z-10">
                <p className="text-sm font-semibold text-amber-800 mb-1">Premium Honeynuts</p>
                <p className="text-xs text-amber-600 mb-2">100% Salted Organic Nuts</p>
                <p className="text-3xl font-bold text-gray-900 mb-4">£15.00</p>
                <span className="inline-flex items-center text-sm font-medium text-amber-700 group-hover:text-green-500 transition-colors">
                  Shop Now <ChevronRight className="h-4 w-4 ml-1" />
                </span>
              </div>
              <div className="absolute right-4 bottom-4 text-6xl">🥜</div>
            </Link>

            {/* Bottom Banners Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Baby Diaper Banner */}
              <Link href="/categories/baby" className="relative rounded-2xl overflow-hidden bg-cyan-100 p-4 group">
                <div className="relative z-10">
                  <p className="text-sm font-semibold text-cyan-800 mb-1">New Baby Diaper</p>
                  <p className="text-xs text-cyan-600 mb-3">Top Quality Product</p>
                  <span className="inline-flex items-center text-xs font-medium text-cyan-700 group-hover:text-cyan-900 transition-colors">
                    Shop Now <ChevronRight className="h-3 w-3 ml-1" />
                  </span>
                </div>
              </Link>

              {/* FaceWash Banner */}
              <Link href="/categories/health-beauty" className="relative rounded-2xl overflow-hidden bg-orange-100 p-4 group">
                <div className="relative z-10">
                  <span className="inline-block bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded mb-2">
                    15% OFF
                  </span>
                  <p className="text-sm font-semibold text-orange-800 mb-1">Dark wash FaceWash</p>
                  <p className="text-xs text-orange-600 mb-2">All Fixed Size</p>
                  <span className="inline-flex items-center text-xs font-medium text-orange-700 group-hover:text-orange-900 transition-colors">
                    Shop Now <ChevronRight className="h-3 w-3 ml-1" />
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Default hero when no slides are configured
function ZillyDefaultHero() {
  return (
    <section className="py-6 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Hero Banner */}
          <div className="lg:col-span-2 relative rounded-2xl overflow-hidden h-[400px] lg:h-[480px] bg-gradient-to-r from-green-600 to-teal-500">
            <div className="absolute inset-0 flex items-center">
              <div className="p-8 lg:p-12 max-w-md">
                <span className="inline-block bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 shadow-lg">
                  100% Farm Fresh Food
                </span>
                <h1 className="text-3xl lg:text-5xl font-bold text-white mb-2 leading-tight drop-shadow-lg">
                  Fresh Organic
                </h1>
                <p className="text-yellow-400 text-xl lg:text-2xl font-semibold mb-4 drop-shadow-md">
                  Food For All
                </p>
                <p className="text-4xl lg:text-5xl font-bold text-white mb-6 drop-shadow-lg">
                  £59.00
                </p>
                <Button
                  className="bg-white hover:bg-gray-100 text-green-600 rounded-full px-8 h-12 text-base font-semibold shadow-lg"
                  asChild
                >
                  <Link href="/products">Shop Now</Link>
                </Button>
              </div>
            </div>
            {/* Decorative vegetables */}
            <div className="absolute right-0 bottom-0 w-1/2 h-full opacity-90">
              <div className="absolute right-4 bottom-4 text-8xl drop-shadow-lg">🥬</div>
              <div className="absolute right-24 bottom-20 text-6xl drop-shadow-lg">🍅</div>
              <div className="absolute right-8 top-20 text-5xl drop-shadow-lg">🥕</div>
              <div className="absolute right-32 top-10 text-4xl drop-shadow-lg">🌽</div>
            </div>
          </div>

          {/* Right Side Promotional Banners */}
          <div className="hidden lg:grid grid-rows-2 gap-4">
            {/* Top Banner */}
            <Link href="/products?search=nuts" className="relative rounded-2xl overflow-hidden bg-amber-50 p-6 group">
              <div className="relative z-10">
                <p className="text-sm text-gray-600 mb-1">Premium Honeynuts</p>
                <p className="text-xs text-gray-500 mb-2">100% Salted Organic Nuts</p>
                <p className="text-3xl font-bold text-gray-900 mb-4">£15.00</p>
                <span className="inline-flex items-center text-sm font-medium text-gray-700 group-hover:text-green-500 transition-colors">
                  Shop Now <ChevronRight className="h-4 w-4 ml-1" />
                </span>
              </div>
              <div className="absolute right-2 bottom-2 text-6xl">🥜</div>
            </Link>

            {/* Bottom Banners */}
            <div className="grid grid-cols-2 gap-4">
              <Link href="/categories/baby" className="relative rounded-2xl overflow-hidden bg-cyan-100 p-4 group">
                <div className="relative z-10">
                  <p className="text-sm font-semibold text-cyan-800 mb-1">New Baby Diaper</p>
                  <p className="text-xs text-cyan-600 mb-3">Top Quality Product</p>
                  <span className="inline-flex items-center text-xs font-medium text-cyan-700 group-hover:text-cyan-900 transition-colors">
                    Shop Now <ChevronRight className="h-3 w-3 ml-1" />
                  </span>
                </div>
                <div className="absolute right-1 bottom-1 text-4xl">👶</div>
              </Link>

              <Link href="/categories/health-beauty" className="relative rounded-2xl overflow-hidden bg-orange-100 p-4 group">
                <div className="relative z-10">
                  <span className="inline-block bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded mb-2">
                    15% OFF
                  </span>
                  <p className="text-sm font-semibold text-orange-800 mb-1">Dark wash FaceWash</p>
                  <p className="text-xs text-orange-600 mb-2">All Fixed Size</p>
                  <span className="inline-flex items-center text-xs font-medium text-orange-700 group-hover:text-orange-900 transition-colors">
                    Shop Now <ChevronRight className="h-3 w-3 ml-1" />
                  </span>
                </div>
                <div className="absolute right-1 bottom-1 text-3xl">🧴</div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
