'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Smartphone, Share } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'pwa-install-dismissed'
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

function isIOS() {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

function isMobile() {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 1024
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [showIOSGuide, setShowIOSGuide] = useState(false)

  useEffect(() => {
    if (!isMobile()) return

    // Check if already dismissed recently
    const dismissedAt = localStorage.getItem(DISMISS_KEY)
    if (dismissedAt && Date.now() - Number(dismissedAt) < DISMISS_DURATION) return

    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) return
    if ((navigator as { standalone?: boolean }).standalone) return

    // Listen for browser install prompt (Chrome/Edge/Samsung)
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setTimeout(() => setShow(true), 3000)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // Fallback: show manual banner after 10 seconds if no browser prompt
    const fallbackTimer = setTimeout(() => {
      if (!deferredPrompt) {
        setShow(true)
      }
    }, 10000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      clearTimeout(fallbackTimer)
    }
  }, [deferredPrompt])

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShow(false)
      }
      setDeferredPrompt(null)
    } else if (isIOS()) {
      setShowIOSGuide(true)
    } else {
      // Android/desktop without prompt — show instructions
      setShowIOSGuide(true)
    }
  }, [deferredPrompt])

  const handleDismiss = useCallback(() => {
    setShow(false)
    setShowIOSGuide(false)
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-20 left-3 right-3 z-40 lg:hidden"
        >
          <div className="bg-(--color-surface) rounded-2xl border border-(--color-border) shadow-xl p-4">
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 h-7 w-7 flex items-center justify-center rounded-full text-(--color-text-muted) hover:bg-(--color-elevated) transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>

            {showIOSGuide ? (
              /* iOS / manual install guide */
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-(--brand-primary) text-white shrink-0">
                  <Share className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <h3 className="text-sm font-bold text-foreground">
                    Add to Home Screen
                  </h3>
                  <p className="text-xs text-(--color-text-muted) mt-1 leading-relaxed">
                    {isIOS()
                      ? 'Tap the Share button in Safari, then tap "Add to Home Screen".'
                      : 'Tap the menu (⋮) in your browser, then tap "Add to Home Screen" or "Install App".'}
                  </p>
                  <button
                    onClick={handleDismiss}
                    className="mt-2.5 text-xs font-semibold text-(--brand-primary) hover:underline"
                  >
                    Got it
                  </button>
                </div>
              </div>
            ) : (
              /* Standard install prompt */
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-(--brand-primary) text-white shrink-0">
                  <Smartphone className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <h3 className="text-sm font-bold text-foreground">
                    Get the UK Grocery App
                  </h3>
                  <p className="text-xs text-(--color-text-muted) mt-0.5">
                    Faster access, offline browsing, and a native app experience.
                  </p>
                  <button
                    onClick={handleInstall}
                    className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-(--brand-primary) text-white text-sm font-semibold px-4 py-2 hover:bg-(--brand-primary-hover) active:scale-95 transition-all"
                  >
                    <Download className="h-4 w-4" />
                    Install App
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
