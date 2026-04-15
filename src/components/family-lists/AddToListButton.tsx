'use client'

import { useState, useRef, useEffect } from 'react'
import { ListPlus, Check, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFamilyListStore } from '@/stores/family-list-store'

interface AddToListButtonProps {
  product: {
    id: string
    name: string
    image_url?: string
    price_pence: number
  }
}

export function AddToListButton({ product }: AddToListButtonProps) {
  const { lists, addItem, createList } = useFamilyListStore()
  const [open, setOpen] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [addedToListId, setAddedToListId] = useState<string | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function handleAdd(listId: string) {
    addItem(listId, {
      productId: product.id,
      productName: product.name,
      productImage: product.image_url,
      productPrice: product.price_pence,
      quantity,
      addedBy: 'You',
      addedById: 'local',
    })
    setAddedToListId(listId)
    setTimeout(() => {
      setAddedToListId(null)
      setOpen(false)
      setQuantity(1)
    }, 1200)
  }

  function handleCreateAndAdd() {
    const newList = createList('My Family List')
    handleAdd(newList.id)
  }

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'h-10 w-10 flex items-center justify-center rounded-lg',
          'border border-(--color-border) bg-(--color-surface)',
          'text-(--color-text-muted) hover:text-(--brand-primary) hover:border-(--brand-primary)/30',
          'transition-colors'
        )}
        aria-label="Add to family list"
        title="Add to family list"
      >
        <ListPlus className="h-4 w-4" />
      </button>

      {open && (
        <div
          className={cn(
            'absolute right-0 top-full mt-2 z-50 w-64',
            'rounded-xl border border-(--color-border)',
            'bg-(--color-surface) shadow-(--shadow-md) p-3'
          )}
        >
          <p className="text-xs font-semibold text-foreground mb-2">
            Add to Family List
          </p>

          {lists.length === 0 ? (
            <button
              onClick={handleCreateAndAdd}
              className={cn(
                'flex items-center gap-2 w-full rounded-lg',
                'bg-(--brand-amber) text-white px-3 py-2.5 text-sm font-semibold',
                'hover:bg-(--brand-amber-hover) transition-colors'
              )}
            >
              <Plus className="h-4 w-4" />
              Create Family List
            </button>
          ) : (
            <>
              <div className="space-y-1 max-h-40 overflow-y-auto mb-3">
                {lists.map((list) => (
                  <button
                    key={list.id}
                    onClick={() => handleAdd(list.id)}
                    disabled={addedToListId === list.id}
                    className={cn(
                      'flex items-center justify-between w-full rounded-lg',
                      'px-3 py-2 text-sm text-foreground',
                      'hover:bg-(--color-elevated) transition-colors',
                      'disabled:opacity-70'
                    )}
                  >
                    <span className="truncate">{list.name}</span>
                    {addedToListId === list.id ? (
                      <Check className="h-4 w-4 text-(--color-success) shrink-0" />
                    ) : (
                      <Plus className="h-3.5 w-3.5 text-(--color-text-muted) shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-(--color-border) pt-2">
                <label className="text-xs text-(--color-text-muted)">Qty</label>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-6 w-6 flex items-center justify-center rounded text-(--color-text-muted) hover:bg-(--color-elevated) text-xs"
                  >
                    -
                  </button>
                  <span className="text-xs font-mono w-6 text-center text-foreground">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="h-6 w-6 flex items-center justify-center rounded text-(--color-text-muted) hover:bg-(--color-elevated) text-xs"
                  >
                    +
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
