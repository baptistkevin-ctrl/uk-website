'use client'

import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className={cn(
        'fixed bottom-24 lg:bottom-8 right-4 lg:right-6 z-40',
        'h-11 w-11 rounded-full',
        'bg-(--brand-primary) text-white shadow-lg',
        'hover:bg-(--brand-primary-hover) hover:shadow-xl hover:scale-110',
        'active:scale-95',
        'transition-all duration-300 ease-out',
        visible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-4 opacity-0 pointer-events-none'
      )}
    >
      <ArrowUp className="h-5 w-5 mx-auto" />
    </button>
  )
}
