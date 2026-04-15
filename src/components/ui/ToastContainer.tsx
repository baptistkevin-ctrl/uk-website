'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useToastStore, type Toast, type ToastType } from '@/hooks/use-toast'
import { cn } from '@/lib/utils/cn'

const iconMap: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const styleMap: Record<ToastType, string> = {
  success: 'border-l-4 border-l-(--color-success)',
  error: 'border-l-4 border-l-(--color-error)',
  warning: 'border-l-4 border-l-(--color-warning)',
  info: 'border-l-4 border-l-(--color-info)',
}

const iconColorMap: Record<ToastType, string> = {
  success: 'text-(--color-success)',
  error: 'text-(--color-error)',
  warning: 'text-(--color-warning)',
  info: 'text-(--color-info)',
}

const progressColorMap: Record<ToastType, string> = {
  success: 'bg-(--color-success)',
  error: 'bg-(--color-error)',
  warning: 'bg-(--color-warning)',
  info: 'bg-(--color-info)',
}

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useToastStore()
  const [progress, setProgress] = useState(100)
  const Icon = iconMap[toast.type]

  useEffect(() => {
    if (!toast.duration || toast.duration === Infinity) return

    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 100 - (elapsed / toast.duration!) * 100)
      setProgress(remaining)
      if (remaining <= 0) clearInterval(interval)
    }, 50)

    return () => clearInterval(interval)
  }, [toast.duration])

  return (
    <motion.div
      layout
      initial={{ y: 50, opacity: 0, scale: 0.95 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ x: 100, opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn(
        'relative overflow-hidden rounded-xl bg-(--color-surface) shadow-xl border border-(--color-border)',
        styleMap[toast.type]
      )}
    >
      <div className="flex items-start gap-3 p-3.5">
        <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', iconColorMap[toast.type])} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{toast.title}</p>
          {toast.description && (
            <p className="text-xs text-(--color-text-muted) mt-0.5">{toast.description}</p>
          )}
          {toast.action && (
            <button
              onClick={() => {
                toast.action!.onClick()
                removeToast(toast.id)
              }}
              className="mt-1.5 text-xs font-semibold text-(--brand-primary) hover:underline"
            >
              {toast.action.label}
            </button>
          )}
        </div>
        {toast.dismissable && (
          <button
            onClick={() => removeToast(toast.id)}
            className="shrink-0 h-7 w-7 flex items-center justify-center rounded-full text-(--color-text-muted) hover:bg-(--color-elevated) transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Progress bar */}
      {toast.duration && toast.duration !== Infinity && (
        <div className="h-0.5 bg-(--color-border)">
          <div
            className={cn('h-full transition-none', progressColorMap[toast.type])}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </motion.div>
  )
}

export function ToastContainer() {
  const { toasts } = useToastStore()

  return (
    <div className="fixed bottom-20 lg:bottom-6 right-4 left-4 sm:left-auto sm:w-96 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}
