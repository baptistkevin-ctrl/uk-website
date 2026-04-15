'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  Bell,
  X,
  Package,
  CreditCard,
  Tag,
  Star,
  Gift,
  Users,
  Ticket,
  Megaphone,
  MessageSquare,
  Settings,
  Check,
  CheckCheck
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  data: Record<string, any>
  action_url: string | null
  image_url: string | null
  is_read: boolean
  read_at: string | null
  created_at: string
}

const notificationIcons: Record<string, typeof Bell> = {
  order_placed: Package,
  order_shipped: Package,
  order_delivered: Package,
  order_cancelled: Package,
  payment_received: CreditCard,
  payment_failed: CreditCard,
  price_drop: Tag,
  back_in_stock: Package,
  low_stock: Package,
  review_approved: Star,
  review_rejected: Star,
  points_earned: Gift,
  points_redeemed: Gift,
  tier_upgrade: Gift,
  referral_signup: Users,
  referral_reward: Users,
  coupon_expiring: Ticket,
  new_coupon: Ticket,
  flash_deal: Megaphone,
  promotional: Megaphone,
  ticket_reply: MessageSquare,
  ticket_resolved: MessageSquare,
  system: Bell
}

const notificationColors: Record<string, string> = {
  order_placed: 'bg-blue-100 text-blue-600',
  order_shipped: 'bg-purple-100 text-purple-600',
  order_delivered: 'bg-(--brand-primary-light) text-(--brand-primary)',
  order_cancelled: 'bg-red-100 text-red-600',
  payment_received: 'bg-(--brand-primary-light) text-(--brand-primary)',
  payment_failed: 'bg-red-100 text-red-600',
  price_drop: 'bg-orange-100 text-orange-600',
  back_in_stock: 'bg-teal-100 text-teal-600',
  low_stock: 'bg-yellow-100 text-yellow-600',
  review_approved: 'bg-(--brand-primary-light) text-(--brand-primary)',
  review_rejected: 'bg-red-100 text-red-600',
  points_earned: 'bg-amber-100 text-amber-600',
  points_redeemed: 'bg-amber-100 text-amber-600',
  tier_upgrade: 'bg-purple-100 text-purple-600',
  referral_signup: 'bg-blue-100 text-blue-600',
  referral_reward: 'bg-(--brand-primary-light) text-(--brand-primary)',
  coupon_expiring: 'bg-orange-100 text-orange-600',
  new_coupon: 'bg-(--brand-primary-light) text-(--brand-primary)',
  flash_deal: 'bg-red-100 text-red-600',
  promotional: 'bg-pink-100 text-pink-600',
  ticket_reply: 'bg-blue-100 text-blue-600',
  ticket_resolved: 'bg-(--brand-primary-light) text-(--brand-primary)',
  system: 'bg-(--color-elevated) text-(--color-text-secondary)'
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=10')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_ids: [notificationId] })
      })

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mark_all: true })
      })

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id)
    }
    setIsOpen(false)
  }

  const getIcon = (type: string) => {
    const IconComponent = notificationIcons[type] || Bell
    return IconComponent
  }

  const getColorClass = (type: string) => {
    return notificationColors[type] || 'bg-(--color-elevated) text-(--color-text-secondary)'
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-(--color-text-secondary) hover:text-foreground hover:bg-(--color-elevated) rounded-full transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-(--color-surface) rounded-xl shadow-xl border border-(--color-border) z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b bg-background flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-(--brand-primary) hover:text-(--brand-primary) flex items-center gap-1"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
              <Link
                href="/account/notifications/settings"
                onClick={() => setIsOpen(false)}
                className="p-1 text-(--color-text-disabled) hover:text-(--color-text-secondary)"
              >
                <Settings className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-100 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-(--brand-primary) border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 text-(--color-text-disabled) mx-auto mb-3" />
                <p className="text-(--color-text-muted)">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => {
                  const Icon = getIcon(notification.type)
                  const colorClass = getColorClass(notification.type)

                  const content = (
                    <div
                      className={`px-4 py-3 hover:bg-background transition-colors cursor-pointer ${
                        !notification.is_read ? 'bg-(--brand-primary-light)/50' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex gap-3">
                        <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-medium text-foreground ${!notification.is_read ? 'font-semibold' : ''}`}>
                              {notification.title}
                            </p>
                            {!notification.is_read && (
                              <span className="shrink-0 w-2 h-2 bg-(--brand-primary) rounded-full mt-1.5"></span>
                            )}
                          </div>
                          <p className="text-sm text-(--color-text-secondary) line-clamp-2 mt-0.5">
                            {notification.message}
                          </p>
                          <p className="text-xs text-(--color-text-disabled) mt-1">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )

                  return notification.action_url ? (
                    <Link
                      key={notification.id}
                      href={notification.action_url}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      {content}
                    </Link>
                  ) : (
                    <div key={notification.id}>{content}</div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t bg-background text-center">
              <Link
                href="/account/notifications"
                onClick={() => setIsOpen(false)}
                className="text-sm text-(--brand-primary) hover:text-(--brand-primary) font-medium"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
