'use client'

import { useEffect, useRef, useState } from 'react'

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const mousePos = useRef({ x: 0, y: 0 })
  const ringPos = useRef({ x: 0, y: 0 })
  const rafId = useRef<number>(0)

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      mousePos.current.x = e.clientX
      mousePos.current.y = e.clientY

      if (!visible) setVisible(true)

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${e.clientX - 4}px, ${e.clientY - 4}px)`
      }
    }

    function onMouseLeave() {
      setVisible(false)
    }

    function onMouseEnter() {
      setVisible(true)
    }

    function animateRing() {
      const dx = mousePos.current.x - ringPos.current.x
      const dy = mousePos.current.y - ringPos.current.y

      ringPos.current.x += dx * 0.15
      ringPos.current.y += dy * 0.15

      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ringPos.current.x - 18}px, ${ringPos.current.y - 18}px)`
      }

      rafId.current = requestAnimationFrame(animateRing)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseleave', onMouseLeave)
    document.addEventListener('mouseenter', onMouseEnter)
    rafId.current = requestAnimationFrame(animateRing)

    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseleave', onMouseLeave)
      document.removeEventListener('mouseenter', onMouseEnter)
      cancelAnimationFrame(rafId.current)
    }
  }, [visible])

  return (
    <>
      <div
        ref={dotRef}
        data-cursor="dot"
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-2 w-2 rounded-full bg-(--brand-primary)"
        style={{ opacity: visible ? 1 : 0 }}
      />
      <div
        ref={ringRef}
        data-cursor="ring"
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[9998] h-9 w-9 rounded-full border-2 border-(--brand-primary)/40 transition-transform duration-[120ms] ease-out"
        style={{ opacity: visible ? 1 : 0 }}
      />
    </>
  )
}
