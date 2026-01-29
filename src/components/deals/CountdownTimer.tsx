'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface CountdownTimerProps {
  endTime: string | Date
  onExpire?: () => void
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function calculateTimeLeft(endTime: Date): TimeLeft | null {
  const difference = endTime.getTime() - Date.now()

  if (difference <= 0) {
    return null
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  }
}

export function CountdownTimer({
  endTime,
  onExpire,
  size = 'md',
  showIcon = true,
  className,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const end = new Date(endTime)

    const updateTimer = () => {
      const remaining = calculateTimeLeft(end)
      setTimeLeft(remaining)

      if (!remaining && onExpire) {
        onExpire()
      }
    }

    updateTimer()
    const timer = setInterval(updateTimer, 1000)

    return () => clearInterval(timer)
  }, [endTime, onExpire])

  if (!mounted) {
    return (
      <div className={cn('flex items-center gap-2 text-gray-500', className)}>
        <Clock className="h-4 w-4" />
        <span>Loading...</span>
      </div>
    )
  }

  if (!timeLeft) {
    return (
      <div className={cn('flex items-center gap-2 text-red-600', className)}>
        <Clock className="h-4 w-4" />
        <span>Deal Expired</span>
      </div>
    )
  }

  const sizeClasses = {
    sm: {
      container: 'gap-1',
      unit: 'text-sm font-semibold px-1.5 py-0.5',
      label: 'text-xs',
      icon: 'h-3 w-3',
    },
    md: {
      container: 'gap-2',
      unit: 'text-lg font-bold px-2 py-1',
      label: 'text-xs',
      icon: 'h-4 w-4',
    },
    lg: {
      container: 'gap-3',
      unit: 'text-2xl font-bold px-3 py-2',
      label: 'text-sm',
      icon: 'h-5 w-5',
    },
  }

  const classes = sizeClasses[size]

  // Show urgency colors
  const isUrgent = timeLeft.days === 0 && timeLeft.hours < 2
  const textColor = isUrgent ? 'text-red-600' : 'text-gray-900'
  const bgColor = isUrgent ? 'bg-red-50' : 'bg-gray-100'

  return (
    <div className={cn('flex items-center', classes.container, className)}>
      {showIcon && <Clock className={cn(classes.icon, isUrgent ? 'text-red-600' : 'text-gray-500')} />}
      <div className="flex items-center gap-1">
        {timeLeft.days > 0 && (
          <div className="text-center">
            <span className={cn('rounded', classes.unit, textColor, bgColor)}>
              {timeLeft.days}
            </span>
            <span className={cn('block', classes.label, 'text-gray-500')}>days</span>
          </div>
        )}
        <div className="text-center">
          <span className={cn('rounded', classes.unit, textColor, bgColor)}>
            {String(timeLeft.hours).padStart(2, '0')}
          </span>
          <span className={cn('block', classes.label, 'text-gray-500')}>hrs</span>
        </div>
        <span className={textColor}>:</span>
        <div className="text-center">
          <span className={cn('rounded', classes.unit, textColor, bgColor)}>
            {String(timeLeft.minutes).padStart(2, '0')}
          </span>
          <span className={cn('block', classes.label, 'text-gray-500')}>min</span>
        </div>
        <span className={textColor}>:</span>
        <div className="text-center">
          <span className={cn('rounded', classes.unit, textColor, bgColor)}>
            {String(timeLeft.seconds).padStart(2, '0')}
          </span>
          <span className={cn('block', classes.label, 'text-gray-500')}>sec</span>
        </div>
      </div>
    </div>
  )
}

// Compact inline version
export function CountdownTimerInline({
  endTime,
  className,
}: {
  endTime: string | Date
  className?: string
}) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const end = new Date(endTime)

    const updateTimer = () => {
      setTimeLeft(calculateTimeLeft(end))
    }

    updateTimer()
    const timer = setInterval(updateTimer, 1000)

    return () => clearInterval(timer)
  }, [endTime])

  if (!mounted || !timeLeft) {
    return <span className={className}>--:--:--</span>
  }

  const formatTime = () => {
    if (timeLeft.days > 0) {
      return `${timeLeft.days}d ${timeLeft.hours}h`
    }
    return `${String(timeLeft.hours).padStart(2, '0')}:${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')}`
  }

  return <span className={className}>{formatTime()}</span>
}
