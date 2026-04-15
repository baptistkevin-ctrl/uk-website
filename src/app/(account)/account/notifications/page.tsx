'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Bell,
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
  CheckCheck,
  Trash2,
  Filter,
  Loader2,
  ChevronLeft,
  ChevronRight
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

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
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
  order_placed: 'bg-(--color-info-bg) text-(--color-info)',
  order_shipped: 'bg-(--color-info-bg) text-(--color-info)',
  order_delivered: 'bg-(--brand-primary-light) text-(--brand-primary)',
  order_cancelled: 'bg-(--color-error-bg) text-(--color-error)',
  payment_received: 'bg-(--brand-primary-light) text-(--brand-primary)',
  payment_failed: 'bg-(--color-error-bg) text-(--color-error)',
  price_drop: 'bg-(--brand-amber-soft) text-(--brand-amber)',
  back_in_stock: 'bg-(--color-success-bg) text-(--color-success)',
  low_stock: 'bg-(--color-warning-bg) text-(--color-warning)',
  review_approved: 'bg-(--brand-primary-light) text-(--brand-primary)',
  review_rejected: 'bg-(--color-error-bg) text-(--color-error)',
  points_earned: 'bg-(--brand-amber-soft) text-(--brand-amber)',
  points_redeemed: 'bg-(--brand-amber-soft) text-(--brand-amber)',
  tier_upgrade: 'bg-(--color-info-bg) text-(--color-info)',
  referral_signup: 'bg-(--color-info-bg) text-(--color-info)',
  referral_reward: 'bg-(--brand-primary-light) text-(--brand-primary)',
  coupon_expiring: 'bg-(--brand-amber-soft) text-(--brand-amber)',
  new_coupon: 'bg-(--brand-primary-light) text-(--brand-primary)',
  flash_deal: 'bg-(--color-error-bg) text-(--color-error)',
  promotional: 'bg-(--color-error-bg) text-(--color-error)',
  ticket_reply: 'bg-(--color-info-bg) text-(--color-info)',
  ticket_resolved: 'bg-(--brand-primary-light) text-(--brand-primary)',
  system: 'bg-(--color-elevated) text-(--color-text-secondary)'
}

const typeLabels: Record<string, string> = {
  order_placed: 'Order Placed',
  order_shipped: 'Order Shipped',
  order_delivered: 'Order Delivered',
  order_cancelled: 'Order Cancelled',
  payment_received: 'Payment Received',
  payment_failed: 'Payment Failed',
  price_drop: 'Price Drop',
  back_in_stock: 'Back in Stock',
  low_stock: 'Low Stock',
  review_approved: 'Review Approved',
  review_rejected: 'Review Rejected',
  points_earned: 'Points Earned',
  points_redeemed: 'Points Redeemed',
  tier_upgrade: 'Tier Upgrade',
  referral_signup: 'Referral Signup',
  referral_reward: 'Referral Reward',
  coupon_expiring: 'Coupon Expiring',
  new_coupon: 'New Coupon',
  flash_deal: 'Flash Deal',
  promotional: 'Promotional',
  ticket_reply: 'Ticket Reply',
  ticket_resolved: 'Ticket Resolved',
  system: 'System'
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(filter === 'unread' && { unread: 'true' })
      })

      const res = await fetch(`/api/notifications?${params}`)
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setPagination(data.pagination)
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [page, filter])

  const markAsRead = async (ids: string[]) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_ids: ids })
      })

      setNotifications(prev =>
        prev.map(n => ids.includes(n.id) ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - ids.filter(id =>
        notifications.find(n => n.id === id && !n.is_read)
      ).length))
      setSelectedIds([])
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

  const deleteNotification = async (id: string) => {
    try {
      await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' })
      setNotifications(prev => prev.filter(n => n.id !== id))
      if (pagination) {
        setPagination({ ...pagination, total: pagination.total - 1 })
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const clearAllRead = async () => {
    try {
      await fetch('/api/notifications?clear_all=true', { method: 'DELETE' })
      setNotifications(prev => prev.filter(n => !n.is_read))
      fetchNotifications()
    } catch (error) {
      console.error('Failed to clear notifications:', error)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    if (selectedIds.length === notifications.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(notifications.map(n => n.id))
    }
  }

  const getIcon = (type: string) => {
    return notificationIcons[type] || Bell
  }

  const getColorClass = (type: string) => {
    return notificationColors[type] || 'bg-(--color-elevated) text-(--color-text-secondary)'
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <Link
            href="/account/notifications/settings"
            className="flex items-center gap-2 text-sm text-(--color-text-secondary) hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </div>
        <p className="text-(--color-text-secondary)">
          You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Actions Bar */}
      <div className="bg-(--color-surface) rounded-xl border p-4 mb-6">
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-3 sm:gap-4">
          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-(--color-text-disabled)" />
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value as 'all' | 'unread')
                setPage(1)
              }}
              className="border-0 bg-transparent text-sm font-medium text-(--color-text-secondary) focus:ring-0 cursor-pointer"
            >
              <option value="all">All Notifications</option>
              <option value="unread">Unread Only</option>
            </select>
          </div>

          {/* Bulk Actions */}
          <div className="flex items-center gap-3">
            {selectedIds.length > 0 ? (
              <>
                <span className="text-sm text-(--color-text-muted)">
                  {selectedIds.length} selected
                </span>
                <button
                  onClick={() => markAsRead(selectedIds)}
                  className="text-sm text-(--brand-primary) hover:text-(--brand-primary-hover) flex items-center gap-1"
                >
                  <Check className="h-4 w-4" />
                  Mark Read
                </button>
              </>
            ) : (
              <>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-(--brand-primary) hover:text-(--brand-primary-hover) flex items-center gap-1"
                  >
                    <CheckCheck className="h-4 w-4" />
                    Mark All Read
                  </button>
                )}
                <button
                  onClick={clearAllRead}
                  className="text-sm text-(--color-text-muted) hover:text-(--color-text-secondary) flex items-center gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear Read
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-(--color-surface) rounded-xl border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-(--brand-primary) mx-auto" />
            <p className="mt-2 text-(--color-text-muted)">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="h-16 w-16 text-(--color-text-disabled) mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No notifications</h3>
            <p className="text-(--color-text-muted)">
              {filter === 'unread' ? "You're all caught up!" : "You don't have any notifications yet."}
            </p>
          </div>
        ) : (
          <>
            {/* Select All */}
            <div className="px-4 py-3 border-b bg-background">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIds.length === notifications.length && notifications.length > 0}
                  onChange={selectAll}
                  className="w-4 h-4 text-(--brand-primary) border-(--color-border) rounded focus:ring-(--brand-primary)"
                />
                <span className="text-sm text-(--color-text-secondary)">Select All</span>
              </label>
            </div>

            {/* List */}
            <div className="divide-y">
              {notifications.map((notification) => {
                const Icon = getIcon(notification.type)
                const colorClass = getColorClass(notification.type)

                return (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-background transition-colors ${
                      !notification.is_read ? 'bg-(--brand-primary-light)/30' : ''
                    }`}
                  >
                    <div className="flex gap-4">
                      {/* Checkbox */}
                      <div className="shrink-0 pt-1">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(notification.id)}
                          onChange={() => toggleSelect(notification.id)}
                          className="w-4 h-4 text-(--brand-primary) border-(--color-border) rounded focus:ring-(--brand-primary)"
                        />
                      </div>

                      {/* Icon */}
                      <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
                        <Icon className="h-5 w-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className={`text-sm font-medium text-foreground ${!notification.is_read ? 'font-semibold' : ''}`}>
                                {notification.title}
                              </h3>
                              {!notification.is_read && (
                                <span className="w-2 h-2 bg-(--brand-primary) rounded-full"></span>
                              )}
                            </div>
                            <p className="text-sm text-(--color-text-secondary) mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs text-(--color-text-disabled)">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                              </span>
                              <span className="text-xs px-2 py-0.5 bg-(--color-elevated) text-(--color-text-secondary) rounded-full">
                                {typeLabels[notification.type] || notification.type}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {notification.action_url && (
                              <Link
                                href={notification.action_url}
                                className="text-sm text-(--brand-primary) hover:text-(--brand-primary-hover)"
                              >
                                View
                              </Link>
                            )}
                            {!notification.is_read && (
                              <button
                                onClick={() => markAsRead([notification.id])}
                                className="p-1.5 text-(--color-text-disabled) hover:text-(--brand-primary) hover:bg-(--brand-primary-light) rounded-full"
                                title="Mark as read"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="p-1.5 text-(--color-text-disabled) hover:text-(--color-error) hover:bg-(--color-error-bg) rounded-full"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="px-4 py-3 border-t bg-background flex items-center justify-between">
                <p className="text-sm text-(--color-text-secondary)">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="p-2 text-(--color-text-secondary) hover:bg-(--color-elevated) rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-(--color-text-secondary)">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === pagination.totalPages}
                    className="p-2 text-(--color-text-secondary) hover:bg-(--color-elevated) rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
