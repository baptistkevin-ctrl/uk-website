'use client'

import {
  Package,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react'
import { type LucideIcon } from 'lucide-react'

interface ProductStats {
  total: number
  active: number
  inactive: number
  lowStock: number
}

interface ProductStatsCardsProps {
  stats: ProductStats
  loading: boolean
}

export default function ProductStatsCards({ stats, loading }: ProductStatsCardsProps) {
  const cards: { label: string; value: number; icon: LucideIcon; color: string }[] = [
    { label: 'Total Products', value: stats.total, icon: Package, color: 'emerald' },
    { label: 'Active', value: stats.active, icon: CheckCircle2, color: 'blue' },
    { label: 'Inactive', value: stats.inactive, icon: XCircle, color: 'slate' },
    { label: 'Low Stock', value: stats.lowStock, icon: AlertTriangle, color: 'amber' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((stat, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${
              stat.color === 'emerald' ? 'bg-emerald-100' :
              stat.color === 'blue' ? 'bg-blue-100' :
              stat.color === 'slate' ? 'bg-slate-100' :
              'bg-amber-100'
            }`}>
              <stat.icon className={`w-5 h-5 ${
                stat.color === 'emerald' ? 'text-emerald-600' :
                stat.color === 'blue' ? 'text-blue-600' :
                stat.color === 'slate' ? 'text-slate-600' :
                'text-amber-600'
              }`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{loading ? '...' : stat.value}</p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
