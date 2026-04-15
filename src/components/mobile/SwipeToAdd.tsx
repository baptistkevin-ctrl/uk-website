'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { ShoppingCart, Check } from 'lucide-react'
import { hapticSuccess, hapticLight } from '@/lib/utils/haptics'

interface SwipeToAddProps {
  children: React.ReactNode
  onAdd: () => void
  disabled?: boolean
}

const SWIPE_THRESHOLD = 80

export function SwipeToAdd({ children, onAdd, disabled = false }: SwipeToAddProps) {
  const [added, setAdded] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null)
  const x = useMotionValue(0)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  // Map drag distance to background opacity and icon scale
  const bgOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1])
  const iconScale = useTransform(x, [0, SWIPE_THRESHOLD * 0.6, SWIPE_THRESHOLD], [0.5, 0.8, 1])
  const iconX = useTransform(x, [0, SWIPE_THRESHOLD], [8, 24])

  const handleDragEnd = useCallback(() => {
    const currentX = x.get()

    if (currentX >= SWIPE_THRESHOLD && !disabled) {
      hapticSuccess()
      setAdded(true)
      onAdd()

      // Show "Added!" for 1.2s then reset
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        setAdded(false)
      }, 1200)
    }

    // Animate back to 0
    animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 })
  }, [x, onAdd, disabled])

  const handleDrag = useCallback(() => {
    const currentX = x.get()
    if (currentX > SWIPE_THRESHOLD * 0.5 && currentX < SWIPE_THRESHOLD * 0.6) {
      hapticLight()
    }
  }, [x])

  if (disabled) return <>{children}</>

  return (
    <div className="relative overflow-hidden rounded-lg lg:contents">
      {/* Green reveal background — mobile only */}
      <motion.div
        className="absolute inset-0 z-0 flex items-center rounded-lg lg:hidden"
        style={{
          opacity: bgOpacity,
          background: 'var(--brand-primary)',
        }}
      >
        <motion.div
          className="flex items-center gap-2 text-white font-semibold text-sm"
          style={{ x: iconX, scale: iconScale }}
        >
          {added ? (
            <>
              <Check className="h-5 w-5" />
              <span>Added!</span>
            </>
          ) : (
            <>
              <ShoppingCart className="h-5 w-5" />
              <span>Add to cart</span>
            </>
          )}
        </motion.div>
      </motion.div>

      {/* Draggable card content */}
      <motion.div
        className="relative z-10 lg:transform-none!"
        style={{ x }}
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: 0, right: SWIPE_THRESHOLD + 20 }}
        dragElastic={0.1}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        whileDrag={{ cursor: 'grabbing' }}
      >
        {children}
      </motion.div>
    </div>
  )
}
