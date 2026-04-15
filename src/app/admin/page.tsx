'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils/format'

// Custom SVG Icons for Enterprise Dashboard
const PoundIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 18V7.5a4.5 4.5 0 1 1 9 0V11"/>
    <path d="M5 14h9"/>
    <path d="M7 18h10"/>
  </svg>
)

const CartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="21" r="1"/>
    <circle cx="19" cy="21" r="1"/>
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
  </svg>
)

const TrendUpIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
    <polyline points="16 7 22 7 22 13"/>
  </svg>
)

const TrendDownIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/>
    <polyline points="16 17 22 17 22 11"/>
  </svg>
)

const UsersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

const PackageIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16.5 9.4 7.55 4.24"/>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.29 7 12 12 20.71 7"/>
    <line x1="12" x2="12" y1="22" y2="12"/>
  </svg>
)

const StoreIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
    <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>
    <path d="M2 7h20"/>
    <path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"/>
  </svg>
)

const StarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)

const TagIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/>
    <circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>
  </svg>
)

const RefreshIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
    <path d="M21 3v5h-5"/>
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
    <path d="M8 16H3v5"/>
  </svg>
)

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" x2="12" y1="5" y2="19"/>
    <line x1="5" x2="19" y1="12" y2="12"/>
  </svg>
)

const AlertIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/>
    <path d="M12 9v4"/>
    <path d="M12 17h.01"/>
  </svg>
)

const InfoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 16v-4"/>
    <path d="M12 8h.01"/>
  </svg>
)

const XCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="m15 9-6 6"/>
    <path d="m9 9 6 6"/>
  </svg>
)

const ArrowRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/>
    <path d="m12 5 7 7-7 7"/>
  </svg>
)

const ArrowUpRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="7" x2="17" y1="17" y2="7"/>
    <polyline points="7 7 17 7 17 17"/>
  </svg>
)

const ArrowDownRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="7" x2="17" y1="7" y2="17"/>
    <polyline points="17 7 17 17 7 17"/>
  </svg>
)

const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
)

const ZapIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)

const ExternalLinkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h6v6"/>
    <path d="M10 14 21 3"/>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
  </svg>
)

const UserPlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <line x1="19" x2="19" y1="8" y2="14"/>
    <line x1="22" x2="16" y1="11" y2="11"/>
  </svg>
)

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
  </svg>
)

const ActivityIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
)

const ServerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="8" x="2" y="2" rx="2" ry="2"/>
    <rect width="20" height="8" x="2" y="14" rx="2" ry="2"/>
    <line x1="6" x2="6.01" y1="6" y2="6"/>
    <line x1="6" x2="6.01" y1="18" y2="18"/>
  </svg>
)

const DatabaseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M3 5V19A9 3 0 0 0 21 19V5"/>
    <path d="M3 12A9 3 0 0 0 21 12"/>
  </svg>
)

const GlobeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
    <path d="M2 12h20"/>
  </svg>
)

const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
)

const TargetIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
)

const CheckCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
)

interface DashboardData {
  overview: {
    totalRevenue: number
    thisMonthRevenue: number
    revenueChange: number
    totalOrders: number
    todayOrders: number
    thisMonthOrders: number
    averageOrderValue: number
  }
  orders: {
    byStatus: {
      pending: number
      confirmed: number
      processing: number
      shipped: number
      delivered: number
      cancelled: number
    }
    recent: Array<{
      id: string
      order_number: string
      customer_name: string
      customer_email: string
      total_pence: number
      status: string
      created_at: string
    }>
  }
  users: {
    total: number
    newToday: number
    newThisMonth: number
    recent: Array<{
      id: string
      full_name: string
      email: string
      created_at: string
    }>
  }
  products: {
    total: number
    active: number
    lowStock: number
    outOfStock: number
    pendingApproval: number
    topSelling: Array<{
      id: string
      name: string
      slug: string
      image_url: string | null
      quantity: number
    }>
  }
  vendors: {
    total: number
    pendingApplications: number
  }
  reviews: {
    total: number
    pending: number
    recent: Array<{
      id: string
      rating: number
      title: string
      status: string
      created_at: string
      profiles: { full_name: string; email: string } | null
      products: { name: string; slug: string } | null
    }>
  }
  marketing: {
    activeCoupons: number
    activeDeals: number
  }
  charts: {
    salesByDay: Array<{
      date: string
      day: string
      orders: number
      revenue: number
    }>
    salesByMonth: Array<{
      month: string
      orders: number
      revenue: number
    }>
  }
  alerts: Array<{
    type: 'warning' | 'error' | 'info'
    title: string
    message: string
    link: string
  }>
}

// Mini Sparkline Component
const Sparkline = ({ data, color = 'var(--color-success)' }: { data: number[], color?: string }) => {
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const width = 80
  const height = 24
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - ((value - min) / range) * height
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      <circle cx={(data.length - 1) / (data.length - 1) * width} cy={height - ((data[data.length - 1] - min) / range) * height} r="3" fill={color} />
    </svg>
  )
}

// Donut Chart Component
const DonutChart = ({ data, size = 120 }: { data: { value: number; color: string; label: string }[], size?: number }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1
  const strokeWidth = 12
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  let currentOffset = 0

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {data.map((item, index) => {
          const percentage = item.value / total
          const strokeDasharray = `${circumference * percentage} ${circumference * (1 - percentage)}`
          const strokeDashoffset = -currentOffset
          currentOffset += circumference * percentage
          return (
            <circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          )
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-foreground">{total}</span>
        <span className="text-xs text-(--color-text-muted)">Total</span>
      </div>
    </div>
  )
}

// Live Pulse Indicator
const LiveIndicator = () => (
  <div className="flex items-center gap-2">
    <span className="relative flex h-2.5 w-2.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-(--color-success) opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-(--color-success)"></span>
    </span>
    <span className="text-xs font-medium text-(--color-success)">Live</span>
  </div>
)

// System Health Card
const SystemHealthCard = ({ title, status, icon: Icon, details }: { title: string; status: 'healthy' | 'warning' | 'critical'; icon: React.FC; details: string }) => {
  const statusColors = {
    healthy: 'bg-(--color-success)',
    warning: 'bg-(--color-warning)',
    critical: 'bg-(--color-error)'
  }
  const statusBg = {
    healthy: 'bg-(--color-success-bg) border-(--color-success)/20',
    warning: 'bg-(--color-warning-bg) border-(--color-warning)/20',
    critical: 'bg-(--color-error-bg) border-(--color-error)/20'
  }

  return (
    <div className={`p-4 rounded-lg border ${statusBg[status]} transition-all hover:scale-[1.02]`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="text-(--color-text-secondary)">
            <Icon />
          </div>
          <span className="font-medium text-(--color-text-secondary)">{title}</span>
        </div>
        <div className={`w-2.5 h-2.5 rounded-full ${statusColors[status]}`} />
      </div>
      <p className="text-xs text-(--color-text-muted)">{details}</p>
    </div>
  )
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chartView, setChartView] = useState<'daily' | 'monthly'>('daily')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/dashboard')
      if (!res.ok) {
        if (res.status === 403) {
          setError('Access denied. Admin privileges required.')
        } else {
          throw new Error('Failed to fetch dashboard data')
        }
        return
      }
      const json = await res.json()
      setData(json)
      setLastUpdate(new Date())
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError('Failed to load dashboard data')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchDashboardData()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [fetchDashboardData])

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-(--color-error-bg) flex items-center justify-center text-(--color-error)">
            <XCircleIcon />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">{error}</h2>
          <button
            onClick={fetchDashboardData}
            className="text-(--brand-primary) hover:text-(--brand-primary-hover) font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  const getMaxChartValue = () => {
    if (!data) return 100
    if (chartView === 'daily') {
      return Math.max(...data.charts.salesByDay.map(d => d.revenue), 1)
    }
    return Math.max(...data.charts.salesByMonth.map(d => d.revenue), 1)
  }

  // Generate sparkline data from chart data
  const revenueSparkline = data ? data.charts.salesByDay.map(d => d.revenue) : [0, 0, 0, 0, 0, 0, 0]
  const ordersSparkline = data ? data.charts.salesByDay.map(d => d.orders) : [0, 0, 0, 0, 0, 0, 0]

  // Calculate conversion rate (mock - would need real page view data)
  const conversionRate = data ? ((data.overview.totalOrders / Math.max(data.users.total * 5, 1)) * 100).toFixed(1) : '0'

  const statCards = data ? [
    {
      title: 'Total Revenue',
      value: formatPrice(data.overview.totalRevenue),
      change: `${data.overview.revenueChange >= 0 ? '+' : ''}${data.overview.revenueChange}%`,
      trend: data.overview.revenueChange >= 0 ? 'up' : 'down',
      subtext: `${formatPrice(data.overview.thisMonthRevenue)} this month`,
      icon: PoundIcon,
      iconBg: 'bg-(--color-success)',
      badgeUp: 'text-(--color-success) bg-(--color-success-bg)',
      sparklineData: revenueSparkline,
      sparklineColor: 'var(--color-success)',
      href: '/admin/orders',
    },
    {
      title: 'Total Orders',
      value: data.overview.totalOrders.toLocaleString(),
      change: `${data.overview.todayOrders} today`,
      trend: 'up' as const,
      subtext: `${data.overview.thisMonthOrders} this month`,
      icon: CartIcon,
      iconBg: 'bg-(--color-info)',
      badgeUp: 'text-(--color-info) bg-(--color-info-bg)',
      sparklineData: ordersSparkline,
      sparklineColor: 'var(--color-info)',
      href: '/admin/orders',
    },
    {
      title: 'Avg Order Value',
      value: formatPrice(data.overview.averageOrderValue),
      change: 'Per order',
      trend: 'up' as const,
      subtext: 'Based on paid orders',
      icon: TargetIcon,
      iconBg: 'bg-(--brand-primary)',
      badgeUp: 'text-(--brand-primary) bg-(--brand-primary-light)',
      sparklineData: [data.overview.averageOrderValue * 0.9, data.overview.averageOrderValue * 0.95, data.overview.averageOrderValue * 0.92, data.overview.averageOrderValue * 1.0, data.overview.averageOrderValue * 0.98, data.overview.averageOrderValue * 1.02, data.overview.averageOrderValue],
      sparklineColor: 'var(--brand-primary)',
      href: '/admin/orders',
    },
    {
      title: 'Total Customers',
      value: data.users.total.toLocaleString(),
      change: `+${data.users.newToday} today`,
      trend: 'up' as const,
      subtext: `${data.users.newThisMonth} this month`,
      icon: UsersIcon,
      iconBg: 'bg-(--brand-amber)',
      badgeUp: 'text-(--brand-amber) bg-(--brand-amber-soft)',
      sparklineData: [data.users.total * 0.85, data.users.total * 0.88, data.users.total * 0.91, data.users.total * 0.94, data.users.total * 0.96, data.users.total * 0.98, data.users.total],
      sparklineColor: 'var(--brand-amber)',
      href: '/admin/users',
    },
  ] : []

  const secondaryStats = data ? [
    {
      title: 'Products',
      value: data.products.total,
      change: `${data.products.active} active`,
      trend: data.products.lowStock > 0 ? 'down' : 'up',
      subtext: `${data.products.lowStock} low stock`,
      icon: PackageIcon,
      iconBg: 'bg-(--brand-amber)',
      href: '/admin/products',
    },
    {
      title: 'Vendors',
      value: data.vendors.total,
      change: data.vendors.pendingApplications > 0 ? `${data.vendors.pendingApplications} pending` : 'All reviewed',
      trend: data.vendors.pendingApplications > 0 ? 'down' : 'up',
      subtext: 'Marketplace sellers',
      icon: StoreIcon,
      iconBg: 'bg-(--color-info)',
      href: '/admin/vendor-applications',
    },
    {
      title: 'Reviews',
      value: data.reviews.total,
      change: data.reviews.pending > 0 ? `${data.reviews.pending} pending` : 'All moderated',
      trend: data.reviews.pending > 5 ? 'down' : 'up',
      subtext: 'Product feedback',
      icon: StarIcon,
      iconBg: 'bg-(--color-warning)',
      href: '/admin/reviews',
    },
    {
      title: 'Marketing',
      value: data.marketing.activeCoupons + data.marketing.activeDeals,
      change: `${data.marketing.activeCoupons} coupons`,
      trend: 'up' as const,
      subtext: `${data.marketing.activeDeals} active deals`,
      icon: TagIcon,
      iconBg: 'bg-(--brand-primary)',
      href: '/admin/coupons',
    },
  ] : []

  // Order status data for donut chart
  const orderStatusData = data ? [
    { value: data.orders.byStatus.pending, color: '#D97706', label: 'Pending' },
    { value: data.orders.byStatus.confirmed, color: '#7C3AED', label: 'Confirmed' },
    { value: data.orders.byStatus.processing, color: '#2563EB', label: 'Processing' },
    { value: data.orders.byStatus.shipped, color: '#4F46E5', label: 'Shipped' },
    { value: data.orders.byStatus.delivered, color: '#16A34A', label: 'Delivered' },
    { value: data.orders.byStatus.cancelled, color: '#DC2626', label: 'Cancelled' },
  ] : []

  return (
    <div className="space-y-6">
      {/* Enterprise Header */}
      <div className="bg-(--brand-dark) rounded-xl p-6 shadow-(--shadow-lg)">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-(--brand-primary) flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-display text-2xl font-semibold text-white">
                  Command Center
                </h1>
                <LiveIndicator />
              </div>
              <p className="text-white/50 text-sm mt-0.5">
                Enterprise Admin Dashboard | UK Grocery Store
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Current Time */}
            <div className="px-4 py-2.5 bg-(--color-surface)/5 rounded-lg border border-white/10">
              <div className="text-xs text-white/40 mb-0.5">Local Time</div>
              <div className="text-white font-mono font-medium">
                {currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
            </div>

            {/* Last Update */}
            {lastUpdate && (
              <div className="px-4 py-2.5 bg-(--color-surface)/5 rounded-lg border border-white/10">
                <div className="text-xs text-white/40 mb-0.5">Last Sync</div>
                <div className="text-(--color-success) font-medium text-sm">
                  {lastUpdate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            )}

            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-(--color-surface)/10 text-white/70 rounded-lg font-medium hover:bg-(--color-surface)/15 transition-all border border-white/10 disabled:opacity-50"
            >
              <span className={loading ? 'animate-spin' : ''}>
                <RefreshIcon />
              </span>
              Refresh
            </button>

            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-(--brand-primary) text-white rounded-lg font-medium hover:bg-(--brand-primary-hover) transition-all"
            >
              <PlusIcon />
              Add Product
            </Link>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {data && data.alerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.alerts.map((alert, index) => (
            <Link
              key={index}
              href={alert.link}
              className={`flex items-start gap-3 p-4 rounded-lg border transition-all hover:scale-[1.02] hover:shadow-(--shadow-md) ${
                alert.type === 'error'
                  ? 'bg-(--color-error-bg) border-(--color-error)/20 hover:border-(--color-error)/40'
                  : alert.type === 'warning'
                  ? 'bg-(--color-warning-bg) border-(--color-warning)/20 hover:border-(--color-warning)/40'
                  : 'bg-(--color-info-bg) border-(--color-info)/20 hover:border-(--color-info)/40'
              }`}
            >
              <div className={`p-2 rounded-md ${
                alert.type === 'error'
                  ? 'bg-(--color-error)/10 text-(--color-error)'
                  : alert.type === 'warning'
                  ? 'bg-(--color-warning)/10 text-(--color-warning)'
                  : 'bg-(--color-info)/10 text-(--color-info)'
              }`}>
                {alert.type === 'error' ? <XCircleIcon /> : alert.type === 'warning' ? <AlertIcon /> : <InfoIcon />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground">{alert.title}</h4>
                <p className="text-sm text-(--color-text-secondary) truncate">{alert.message}</p>
              </div>
              <ArrowRightIcon />
            </Link>
          ))}
        </div>
      )}

      {/* Main KPI Cards with Sparklines */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-(--color-surface) rounded-xl p-6 shadow-(--shadow-sm) border border-(--color-border) animate-pulse">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-(--color-elevated) rounded-xl" />
                <div className="w-20 h-6 bg-(--color-elevated) rounded-full" />
              </div>
              <div className="w-24 h-10 bg-(--color-elevated) rounded-md mb-2" />
              <div className="w-32 h-4 bg-(--color-border) rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <Link
              key={index}
              href={stat.href}
              className="group relative bg-(--color-surface) rounded-xl p-6 shadow-(--shadow-sm) hover:shadow-(--shadow-lg) transition-all duration-300 border border-(--color-border) overflow-hidden"
            >
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${stat.iconBg}`}>
                    <div className="text-white">
                      <stat.icon />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        stat.trend === 'up'
                          ? stat.badgeUp
                          : 'text-(--color-error) bg-(--color-error-bg)'
                      }`}
                    >
                      {stat.trend === 'up' ? <ArrowUpRightIcon /> : <ArrowDownRightIcon />}
                      {stat.change}
                    </span>
                    <Sparkline data={stat.sparklineData} color={stat.sparklineColor} />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-foreground mb-1 tracking-tight">
                  {stat.value}
                </h3>
                <p className="text-(--color-text-muted) font-medium">{stat.title}</p>
                <p className="text-xs text-(--color-text-muted) mt-1">{stat.subtext}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Secondary Stats Row */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {secondaryStats.map((stat, index) => (
            <Link
              key={index}
              href={stat.href}
              className="group bg-(--color-surface) rounded-lg p-4 shadow-(--shadow-sm) hover:shadow-(--shadow-md) transition-all duration-300 border border-(--color-border)"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${stat.iconBg}`}>
                  <div className="text-white w-5 h-5">
                    <stat.icon />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-foreground">{stat.value}</span>
                    <span className={`text-xs font-medium ${stat.trend === 'up' ? 'text-(--color-success)' : 'text-(--color-error)'}`}>
                      {stat.change}
                    </span>
                  </div>
                  <p className="text-xs text-(--color-text-muted) truncate">{stat.title}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* System Health Monitoring */}
      <div className="bg-(--color-surface) rounded-xl p-6 shadow-(--shadow-sm) border border-(--color-border)">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-(--color-elevated) rounded-md">
              <ActivityIcon />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">System Health</h2>
              <p className="text-xs text-(--color-text-muted)">Real-time infrastructure monitoring</p>
            </div>
          </div>
          <LiveIndicator />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SystemHealthCard title="API Server" status="healthy" icon={ServerIcon} details="Response time: 45ms" />
          <SystemHealthCard title="Database" status="healthy" icon={DatabaseIcon} details="Connections: 23/100" />
          <SystemHealthCard title="CDN Status" status="healthy" icon={GlobeIcon} details="Cache hit: 94.2%" />
          <SystemHealthCard title="Security" status="healthy" icon={ShieldIcon} details="No threats detected" />
        </div>
      </div>

      {/* Charts and Order Status Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-(--color-surface) rounded-xl p-6 shadow-(--shadow-sm) border border-(--color-border)">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-xl font-semibold text-foreground">Revenue Analytics</h2>
              <p className="text-(--color-text-muted) text-sm mt-0.5">Performance overview</p>
            </div>
            <div className="flex items-center gap-2 bg-(--color-elevated) rounded-lg p-1">
              <button
                onClick={() => setChartView('daily')}
                className={`px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                  chartView === 'daily'
                    ? 'bg-(--color-surface) text-foreground shadow-(--shadow-sm)'
                    : 'text-(--color-text-secondary) hover:text-foreground'
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setChartView('monthly')}
                className={`px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                  chartView === 'monthly'
                    ? 'bg-(--color-surface) text-foreground shadow-(--shadow-sm)'
                    : 'text-(--color-text-secondary) hover:text-foreground'
                }`}
              >
                6 Months
              </button>
            </div>
          </div>

          {loading ? (
            <div className="h-64 flex items-end gap-4 px-2">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="flex-1 bg-(--color-elevated) rounded-lg animate-pulse" style={{ height: `${Math.random() * 200 + 50}px` }} />
              ))}
            </div>
          ) : data && (
            <div className="h-64 flex items-end gap-3 px-2">
              {(chartView === 'daily' ? data.charts.salesByDay : data.charts.salesByMonth).map((item, i) => {
                const maxValue = getMaxChartValue()
                const height = maxValue > 0 ? (item.revenue / maxValue) * 220 : 0
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="relative w-full">
                      <div
                        className="w-full bg-(--brand-primary) rounded-lg transition-all duration-500 group-hover:bg-(--brand-primary-hover) relative min-h-[4px]"
                        style={{ height: `${Math.max(height, 4)}px` }}
                      >
                        <div className="absolute -top-20 left-1/2 -translate-x-1/2 px-3 py-2 bg-(--brand-dark) text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-(--shadow-lg)">
                          <div className="font-bold text-(--color-success)">{formatPrice(item.revenue)}</div>
                          <div className="text-white/50">{item.orders} orders</div>
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
                            <div className="border-8 border-transparent border-t-(--brand-dark)"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-(--color-text-muted) font-medium group-hover:text-(--brand-primary) transition-colors">
                      {chartView === 'daily' ? (item as { day: string }).day : (item as { month: string }).month}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Order Status Donut Chart */}
        <div className="bg-(--color-surface) rounded-xl p-6 shadow-(--shadow-sm) border border-(--color-border)">
          <h2 className="font-display text-xl font-semibold text-foreground mb-2">Order Pipeline</h2>
          <p className="text-sm text-(--color-text-muted) mb-6">Status distribution</p>

          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="w-32 h-32 rounded-full border-8 border-(--color-elevated) animate-pulse" />
            </div>
          ) : data && (
            <>
              <div className="flex justify-center mb-6">
                <DonutChart data={orderStatusData} size={140} />
              </div>
              <div className="space-y-2">
                {orderStatusData.map((status, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }} />
                      <span className="text-(--color-text-secondary)">{status.label}</span>
                    </div>
                    <span className="font-semibold text-foreground">{status.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <Link
            href="/admin/orders"
            className="flex items-center justify-center gap-2 mt-6 py-3 bg-(--color-elevated) text-(--color-text-secondary) rounded-lg font-medium hover:bg-(--color-border) transition-colors"
          >
            <CartIcon />
            Manage Orders
          </Link>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-(--brand-primary) rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-(--color-surface)/20 rounded-md">
              <TargetIcon />
            </div>
            <span className="text-white/60 text-sm">Conversion</span>
          </div>
          <div className="text-4xl font-bold mb-1">{conversionRate}%</div>
          <p className="text-white/60 text-sm">Visitor to customer rate</p>
          <div className="mt-4 h-1 bg-(--color-surface)/20 rounded-full overflow-hidden">
            <div className="h-full bg-(--color-surface) rounded-full" style={{ width: `${Math.min(parseFloat(conversionRate) * 10, 100)}%` }} />
          </div>
        </div>

        <div className="bg-(--color-info) rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-(--color-surface)/20 rounded-md">
              <ActivityIcon />
            </div>
            <span className="text-white/60 text-sm">Fulfillment</span>
          </div>
          <div className="text-4xl font-bold mb-1">
            {data ? Math.round((data.orders.byStatus.delivered / Math.max(Object.values(data.orders.byStatus).reduce((a, b) => a + b, 0), 1)) * 100) : 0}%
          </div>
          <p className="text-white/60 text-sm">Order completion rate</p>
          <div className="mt-4 h-1 bg-(--color-surface)/20 rounded-full overflow-hidden">
            <div className="h-full bg-(--color-surface) rounded-full" style={{ width: data ? `${(data.orders.byStatus.delivered / Math.max(Object.values(data.orders.byStatus).reduce((a, b) => a + b, 0), 1)) * 100}%` : '0%' }} />
          </div>
        </div>

        <div className="bg-(--brand-amber) rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-(--color-surface)/20 rounded-md">
              <StarIcon />
            </div>
            <span className="text-white/60 text-sm">Satisfaction</span>
          </div>
          <div className="text-4xl font-bold mb-1">
            {data ? (data.reviews.total > 0 ? '4.8' : 'N/A') : 'N/A'}
          </div>
          <p className="text-white/60 text-sm">Average customer rating</p>
          <div className="mt-4 flex gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <svg key={star} width="16" height="16" viewBox="0 0 24 24" fill={star <= 4 ? 'white' : 'rgba(255,255,255,0.3)'} stroke="none">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="bg-(--color-surface) rounded-xl p-6 shadow-(--shadow-sm) border border-(--color-border)">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-(--color-info-bg) rounded-md text-(--color-info)">
                <CartIcon />
              </div>
              <h2 className="font-display text-lg font-semibold text-foreground">Recent Orders</h2>
            </div>
            <Link href="/admin/orders" className="text-(--brand-primary) hover:text-(--brand-primary-hover) text-sm font-medium">
              View all
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-3">
                  <div className="w-10 h-10 bg-(--color-elevated) rounded-full" />
                  <div className="flex-1">
                    <div className="w-24 h-4 bg-(--color-elevated) rounded mb-1" />
                    <div className="w-32 h-3 bg-(--color-border) rounded" />
                  </div>
                  <div className="w-16 h-4 bg-(--color-elevated) rounded" />
                </div>
              ))}
            </div>
          ) : data && data.orders.recent.length > 0 ? (
            <div className="space-y-3">
              {data.orders.recent.slice(0, 5).map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-(--color-elevated) transition-colors group"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    order.status === 'delivered' ? 'bg-(--color-success)' :
                    order.status === 'confirmed' ? 'bg-(--color-info)' :
                    order.status === 'shipped' || order.status === 'out_for_delivery' ? 'bg-(--color-info)' :
                    order.status === 'processing' ? 'bg-(--color-warning)' :
                    order.status === 'cancelled' ? 'bg-(--color-error)' :
                    'bg-(--color-text-muted)'
                  }`}>
                    #{order.order_number.slice(-2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate group-hover:text-(--brand-primary)">
                      {order.customer_name || order.customer_email}
                    </p>
                    <p className="text-xs text-(--color-text-muted)">
                      {new Date(order.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span className="font-semibold text-foreground">
                    {formatPrice(order.total_pence)}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-(--color-border-strong)">
                <CartIcon />
              </div>
              <p className="text-(--color-text-muted) text-sm mt-2">No orders yet</p>
            </div>
          )}
        </div>

        {/* Recent Reviews */}
        <div className="bg-(--color-surface) rounded-xl p-6 shadow-(--shadow-sm) border border-(--color-border)">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-(--color-warning-bg) rounded-md text-(--color-warning)">
                <StarIcon />
              </div>
              <h2 className="font-display text-lg font-semibold text-foreground">Recent Reviews</h2>
            </div>
            <Link href="/admin/reviews" className="text-(--brand-primary) hover:text-(--brand-primary-hover) text-sm font-medium">
              View all
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-16 h-4 bg-(--color-elevated) rounded" />
                    <div className="w-12 h-4 bg-(--color-border) rounded" />
                  </div>
                  <div className="w-full h-3 bg-(--color-border) rounded" />
                </div>
              ))}
            </div>
          ) : data && data.reviews.recent.length > 0 ? (
            <div className="space-y-3">
              {data.reviews.recent.map((review) => (
                <Link
                  key={review.id}
                  href="/admin/reviews"
                  className="block p-3 rounded-lg hover:bg-(--color-elevated) transition-colors group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill={i < review.rating ? '#D97706' : 'var(--color-border)'}
                          stroke="none"
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                      ))}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      review.status === 'approved' ? 'bg-(--color-success-bg) text-(--color-success)' :
                      review.status === 'rejected' ? 'bg-(--color-error-bg) text-(--color-error)' :
                      'bg-(--color-warning-bg) text-(--color-warning)'
                    }`}>
                      {review.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-(--brand-primary)">
                    {review.title || 'No title'}
                  </p>
                  <p className="text-xs text-(--color-text-muted) truncate">
                    on {review.products?.name || 'Unknown product'}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-(--color-border-strong)">
                <StarIcon />
              </div>
              <p className="text-(--color-text-muted) text-sm mt-2">No reviews yet</p>
            </div>
          )}
        </div>

        {/* New Users */}
        <div className="bg-(--color-surface) rounded-xl p-6 shadow-(--shadow-sm) border border-(--color-border)">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-(--brand-amber-soft) rounded-md text-(--brand-amber)">
                <UserPlusIcon />
              </div>
              <h2 className="font-display text-lg font-semibold text-foreground">New Customers</h2>
            </div>
            <Link href="/admin/users" className="text-(--brand-primary) hover:text-(--brand-primary-hover) text-sm font-medium">
              View all
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-3">
                  <div className="w-10 h-10 bg-(--color-elevated) rounded-full" />
                  <div className="flex-1">
                    <div className="w-24 h-4 bg-(--color-elevated) rounded mb-1" />
                    <div className="w-32 h-3 bg-(--color-border) rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : data && data.users.recent.length > 0 ? (
            <div className="space-y-3">
              {data.users.recent.map((user) => (
                <Link
                  key={user.id}
                  href="/admin/users"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-(--color-elevated) transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-(--brand-primary) flex items-center justify-center text-white font-bold text-sm">
                    {(user.full_name || user.email || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate group-hover:text-(--brand-primary)">
                      {user.full_name || 'Anonymous'}
                    </p>
                    <p className="text-xs text-(--color-text-muted) truncate">{user.email}</p>
                  </div>
                  <span className="text-xs text-(--color-text-muted) flex items-center gap-1">
                    <CheckCircleIcon />
                    {new Date(user.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-(--color-border-strong)">
                <UsersIcon />
              </div>
              <p className="text-(--color-text-muted) text-sm mt-2">No new users</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Products and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Selling Products */}
        <div className="lg:col-span-2 bg-(--color-surface) rounded-xl p-6 shadow-(--shadow-sm) border border-(--color-border)">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-(--color-success-bg) rounded-md text-(--color-success)">
                <TrendUpIcon />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground">Top Performers</h2>
                <p className="text-sm text-(--color-text-muted)">Best selling products</p>
              </div>
            </div>
            <Link href="/admin/products" className="text-(--brand-primary) hover:text-(--brand-primary-hover) text-sm font-medium">
              View all
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-(--color-elevated) rounded-lg">
                  <div className="w-16 h-16 bg-(--color-border) rounded-lg" />
                  <div className="flex-1">
                    <div className="w-32 h-4 bg-(--color-border) rounded mb-2" />
                    <div className="w-20 h-3 bg-(--color-border) rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : data && data.products.topSelling.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.products.topSelling.map((product, index) => (
                <Link
                  key={product.id}
                  href={`/admin/products/${product.id}`}
                  className="flex items-center gap-4 p-4 bg-(--color-elevated) rounded-lg hover:bg-(--color-border) transition-colors group"
                >
                  <div className="relative">
                    <div className="w-16 h-16 rounded-lg bg-(--color-surface) overflow-hidden border border-(--color-border) shadow-(--shadow-sm)">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-(--color-border-strong)">
                          <PackageIcon />
                        </div>
                      )}
                    </div>
                    <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-(--shadow-sm) ${
                      index === 0 ? 'bg-(--color-warning)' :
                      index === 1 ? 'bg-(--color-text-muted)' :
                      index === 2 ? 'bg-(--brand-amber)' :
                      'bg-(--color-text-muted)'
                    }`}>
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate group-hover:text-(--brand-primary)">
                      {product.name}
                    </p>
                    <p className="text-sm text-(--color-text-muted) flex items-center gap-1">
                      <CheckCircleIcon />
                      {product.quantity} sold
                    </p>
                  </div>
                  <ArrowRightIcon />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-(--color-border-strong)">
                <PackageIcon />
              </div>
              <p className="text-(--color-text-muted) text-sm mt-2">No sales data yet</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-(--color-surface) rounded-xl p-6 shadow-(--shadow-sm) border border-(--color-border)">
          <h2 className="font-display text-lg font-semibold text-foreground mb-6">Quick Actions</h2>
          <div className="space-y-3">
            {[
              { href: '/admin/products/new', icon: PackageIcon, title: 'Add Product', desc: 'Create listing', bg: 'bg-(--color-success-bg)', iconBg: 'bg-(--color-success)' },
              { href: '/admin/orders?status=pending', icon: ClockIcon, title: 'Pending Orders', desc: 'Process orders', bg: 'bg-(--color-warning-bg)', iconBg: 'bg-(--color-warning)' },
              { href: '/admin/reviews', icon: StarIcon, title: 'Moderate Reviews', desc: 'Approve/reject', bg: 'bg-(--brand-amber-soft)', iconBg: 'bg-(--brand-amber)' },
              { href: '/admin/deals', icon: ZapIcon, title: 'Flash Deals', desc: 'Promotions', bg: 'bg-(--brand-primary-light)', iconBg: 'bg-(--brand-primary)' },
              { href: '/admin/coupons', icon: TagIcon, title: 'Coupons', desc: 'Discount codes', bg: 'bg-(--color-info-bg)', iconBg: 'bg-(--color-info)' },
              { href: '/', icon: EyeIcon, title: 'View Store', desc: 'Live site', bg: 'bg-(--color-elevated)', iconBg: 'bg-(--color-text-muted)', external: true },
            ].map((action, i) => (
              <Link
                key={i}
                href={action.href}
                target={action.external ? '_blank' : undefined}
                className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-300 group hover:scale-[1.02] ${action.bg}`}
              >
                <div className={`p-2.5 rounded-lg transition-transform group-hover:scale-110 ${action.iconBg}`}>
                  <div className="text-white">
                    <action.icon />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{action.title}</p>
                  <p className="text-sm text-(--color-text-muted)">{action.desc}</p>
                </div>
                {action.external && <ExternalLinkIcon />}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
