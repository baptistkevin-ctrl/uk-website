'use client'

import Link from 'next/link'
import { Plus, ShoppingCart, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFamilyListStore } from '@/stores/family-list-store'

export function FamilyListWidget() {
  const { lists, getActiveList, getUncheckedCount } = useFamilyListStore()
  const activeList = getActiveList()

  if (!activeList) {
    return (
      <div
        className={cn(
          'rounded-xl border border-(--color-border)',
          'bg-(--color-surface) p-4'
        )}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 flex items-center justify-center rounded-full bg-(--brand-primary)/10">
            <Users className="h-4 w-4 text-(--brand-primary)" />
          </div>
          <div>
            <p className="text-sm font-semibold text-(--color-text)">
              Family Lists
            </p>
            <p className="text-xs text-(--color-text-muted)">
              Shop together with your household
            </p>
          </div>
        </div>
        <Link
          href="/family-lists"
          className={cn(
            'flex items-center justify-center gap-2 w-full rounded-lg',
            'bg-(--brand-amber) text-white px-4 py-2.5 text-sm font-semibold',
            'hover:bg-(--brand-amber-hover) transition-colors'
          )}
        >
          <Plus className="h-4 w-4" />
          Create a Family List
        </Link>
      </div>
    )
  }

  const uncheckedCount = getUncheckedCount(activeList.id)

  return (
    <div
      className={cn(
        'rounded-xl border border-(--color-border)',
        'bg-(--color-surface) p-4'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-(--color-text) truncate">
          {activeList.name}
        </p>
        <div className="flex -space-x-1.5">
          {activeList.members.slice(0, 3).map((m) => (
            <div
              key={m.id}
              className={cn(
                'h-5 w-5 rounded-full flex items-center justify-center',
                'border border-(--color-surface) bg-(--brand-primary) text-white text-[11px] font-medium'
              )}
            >
              {m.name.charAt(0)}
            </div>
          ))}
          {activeList.members.length > 3 && (
            <div
              className={cn(
                'h-5 w-5 rounded-full flex items-center justify-center',
                'border border-(--color-surface) bg-(--color-elevated) text-(--color-text-muted) text-[11px] font-medium'
              )}
            >
              +{activeList.members.length - 3}
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-(--color-text-muted) mb-3">
        {uncheckedCount} item{uncheckedCount !== 1 ? 's' : ''} remaining
      </p>

      <div className="flex gap-2">
        <Link
          href={`/family-lists/${activeList.id}`}
          className={cn(
            'flex-1 text-center rounded-lg px-3 py-2.5 text-xs font-medium',
            'border border-(--color-border) text-(--color-text-secondary)',
            'hover:bg-(--color-elevated) transition-colors'
          )}
        >
          View List &rarr;
        </Link>
        <Link
          href={`/family-lists/${activeList.id}`}
          className={cn(
            'flex items-center justify-center gap-1.5 rounded-lg',
            'bg-(--brand-amber) text-white px-3 py-2.5 text-xs font-semibold',
            'hover:bg-(--brand-amber-hover) transition-colors'
          )}
        >
          <ShoppingCart className="h-3 w-3" />
          Add All
        </Link>
      </div>
    </div>
  )
}
