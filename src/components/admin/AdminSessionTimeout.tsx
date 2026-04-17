'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, LogOut } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

const TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes
const WARNING_MS = 5 * 60 * 1000 // Warning 5 minutes before timeout

export function AdminSessionTimeout() {
  const router = useRouter()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningRef = useRef<NodeJS.Timeout | null>(null)
  const [showWarning, setShowWarning] = useState(false)

  const resetTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (warningRef.current) clearTimeout(warningRef.current)
    setShowWarning(false)

    // Warning at 25 minutes
    warningRef.current = setTimeout(() => {
      setShowWarning(true)
      toast.warning('Session expiring in 5 minutes', {
        description: 'Move your mouse or click to stay logged in.',
      })
    }, TIMEOUT_MS - WARNING_MS)

    // Logout at 30 minutes
    timeoutRef.current = setTimeout(async () => {
      toast.error('Session expired — logging out for security')
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login/admin?reason=session_expired')
    }, TIMEOUT_MS)
  }

  useEffect(() => {
    resetTimer()

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    const handler = () => resetTimer()

    events.forEach(e => window.addEventListener(e, handler, { passive: true }))

    return () => {
      events.forEach(e => window.removeEventListener(e, handler))
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (warningRef.current) clearTimeout(warningRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!showWarning) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-in slide-in-from-bottom-4">
      <div className="bg-(--color-surface) border border-(--color-warning)/30 rounded-xl p-4 shadow-xl flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-(--color-warning)/10 flex items-center justify-center shrink-0">
          <Clock className="h-5 w-5 text-(--color-warning)" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground text-sm">Session expiring soon</p>
          <p className="text-xs text-(--color-text-muted) mt-0.5">
            Your admin session will expire in 5 minutes due to inactivity.
          </p>
          <button
            onClick={resetTimer}
            className="mt-2 text-xs font-medium text-(--brand-primary) hover:underline"
          >
            Stay logged in
          </button>
        </div>
      </div>
    </div>
  )
}
