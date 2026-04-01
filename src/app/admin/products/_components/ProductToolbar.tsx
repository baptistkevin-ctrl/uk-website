'use client'

import {
  Search,
  Filter,
  Grid3X3,
  List,
  Package,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Star,
} from 'lucide-react'
import { type LucideIcon } from 'lucide-react'

interface FilterButton {
  key: string
  label: string
  count: number
  icon: LucideIcon
}

interface ProductToolbarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  filter: string
  onFilterChange: (filter: string) => void
  filterButtons: FilterButton[]
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
}

export default function ProductToolbar({
  searchQuery,
  onSearchChange,
  filter,
  onFilterChange,
  filterButtons,
  viewMode,
  onViewModeChange,
}: ProductToolbarProps) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search products by name or SKU..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
          {filterButtons.map((btn) => (
            <button
              key={btn.key}
              onClick={() => onFilterChange(btn.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                filter === btn.key
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <btn.icon className="w-4 h-4" />
              {btn.label}
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                filter === btn.key ? 'bg-white/20' : 'bg-slate-200'
              }`}>
                {btn.count}
              </span>
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="hidden lg:flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-2.5 rounded-lg transition-all ${
              viewMode === 'list' ? 'bg-white shadow text-emerald-600' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-2.5 rounded-lg transition-all ${
              viewMode === 'grid' ? 'bg-white shadow text-emerald-600' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Grid3X3 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
