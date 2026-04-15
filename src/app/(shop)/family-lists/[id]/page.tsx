'use client'

import { useState, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Link2,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/utils/format'
import { Container } from '@/components/layout/Container'
import { useFamilyListStore } from '@/stores/family-list-store'
import { useCart } from '@/hooks/use-cart'
import type { FamilyListItem } from '@/stores/family-list-store'

function MemberAvatars({
  members,
}: {
  members: { id: string; name: string }[]
}) {
  return (
    <div className="flex -space-x-2">
      {members.map((m) => (
        <div
          key={m.id}
          className={cn(
            'h-8 w-8 text-xs flex items-center justify-center rounded-full',
            'border-2 border-(--color-surface) bg-(--brand-primary) text-white font-medium'
          )}
          title={m.name}
        >
          {m.name.charAt(0).toUpperCase()}
        </div>
      ))}
    </div>
  )
}

function ShareModal({
  shareCode,
  listId,
  onClose,
}: {
  shareCode: string
  listId: string
  onClose: () => void
}) {
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)

  function copyCode() {
    navigator.clipboard.writeText(shareCode)
    setCopied('code')
    setTimeout(() => setCopied(null), 2000)
  }

  function copyLink() {
    const url = `${window.location.origin}/family-lists/${listId}?code=${shareCode}`
    navigator.clipboard.writeText(url)
    setCopied('link')
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          'relative w-full max-w-sm rounded-2xl',
          'bg-(--color-surface) border border-(--color-border)',
          'p-6 shadow-(--shadow-md)'
        )}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-(--color-text-muted) hover:text-(--color-text) transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-display font-bold text-(--color-text) mb-2">
          Share this list
        </h2>
        <p className="text-sm text-(--color-text-muted) mb-6">
          Share this code with family members so they can join your list.
        </p>

        <div
          className={cn(
            'text-center py-4 px-6 rounded-xl',
            'bg-(--color-elevated) border border-(--color-border) mb-4'
          )}
        >
          <p className="text-3xl font-mono font-bold tracking-[0.3em] text-(--color-text)">
            {shareCode}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={copyCode}
            className={cn(
              'flex items-center justify-center gap-2 w-full rounded-lg',
              'bg-(--brand-amber) text-white px-4 py-2.5 text-sm font-semibold',
              'hover:bg-(--brand-amber-hover) transition-colors'
            )}
          >
            {copied === 'code' ? (
              <>
                <Check className="h-4 w-4" /> Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" /> Copy Code
              </>
            )}
          </button>
          <button
            onClick={copyLink}
            className={cn(
              'flex items-center justify-center gap-2 w-full rounded-lg',
              'border border-(--color-border) text-(--color-text-secondary)',
              'px-4 py-2.5 text-sm font-medium',
              'hover:bg-(--color-elevated) transition-colors'
            )}
          >
            {copied === 'link' ? (
              <>
                <Check className="h-4 w-4" /> Link Copied!
              </>
            ) : (
              <>
                <Link2 className="h-4 w-4" /> Share Link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function ItemRow({
  item,
  listId,
}: {
  item: FamilyListItem
  listId: string
}) {
  const { toggleItem, removeItem, updateItemQuantity } = useFamilyListStore()

  return (
    <div
      className={cn(
        'group flex items-center gap-3 py-3',
        'border-b border-(--color-border) last:border-b-0'
      )}
    >
      <button
        onClick={() => toggleItem(listId, item.id)}
        className={cn(
          'flex-shrink-0 h-5 w-5 rounded border-2 transition-colors',
          'flex items-center justify-center',
          item.checked
            ? 'bg-(--brand-primary) border-(--brand-primary) text-white'
            : 'border-(--color-border) hover:border-(--brand-primary)'
        )}
        aria-label={item.checked ? 'Uncheck item' : 'Check item'}
      >
        {item.checked && <Check className="h-3 w-3" />}
      </button>

      {item.productImage && (
        <div className="flex-shrink-0 h-10 w-10 rounded-md overflow-hidden bg-(--color-elevated)">
          <Image
            src={item.productImage}
            alt={item.customName || item.productName || 'Product'}
            width={40}
            height={40}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-medium transition-all',
            item.checked
              ? 'line-through opacity-50 text-(--color-text-muted)'
              : 'text-(--color-text)'
          )}
        >
          {item.customName || item.productName}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <div className="flex items-center gap-0.5 h-5 w-5 text-xs">
            <div
              className={cn(
                'h-4 w-4 rounded-full flex items-center justify-center',
                'bg-(--brand-primary)/10 text-(--brand-primary) text-[11px] font-medium'
              )}
            >
              {item.addedBy.charAt(0)}
            </div>
          </div>
          <span className="text-xs text-(--color-text-muted)">
            {item.addedBy}
          </span>
          {item.note && (
            <span className="text-xs italic text-(--color-text-muted)">
              &mdash; {item.note}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() =>
              updateItemQuantity(listId, item.id, Math.max(1, item.quantity - 1))
            }
            className="h-8 w-8 sm:h-6 sm:w-6 flex items-center justify-center rounded text-(--color-text-muted) hover:bg-(--color-elevated) transition-colors"
            aria-label="Decrease quantity"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="font-mono text-xs bg-(--color-elevated) px-2 py-0.5 rounded-full min-w-[28px] text-center text-(--color-text)">
            {item.quantity}
          </span>
          <button
            onClick={() =>
              updateItemQuantity(listId, item.id, item.quantity + 1)
            }
            className="h-8 w-8 sm:h-6 sm:w-6 flex items-center justify-center rounded text-(--color-text-muted) hover:bg-(--color-elevated) transition-colors"
            aria-label="Increase quantity"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

        <button
          onClick={() => removeItem(listId, item.id)}
          className="h-6 w-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 text-(--color-text-muted) hover:text-(--color-error) transition-all"
          aria-label="Remove item"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

function AddItemSection({ listId }: { listId: string }) {
  const [mode, setMode] = useState<'product' | 'custom'>('custom')
  const [searchQuery, setSearchQuery] = useState('')
  const [customName, setCustomName] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [note, setNote] = useState('')
  const { addItem } = useFamilyListStore()

  function handleAddCustom() {
    if (!customName.trim()) return
    addItem(listId, {
      customName: customName.trim(),
      quantity,
      addedBy: 'You',
      addedById: 'local',
      note: note.trim() || undefined,
    })
    setCustomName('')
    setQuantity(1)
    setNote('')
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-(--color-border)',
        'bg-(--color-surface) p-4'
      )}
    >
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setMode('product')}
          className={cn(
            'text-xs font-medium px-3 py-1.5 rounded-lg transition-colors',
            mode === 'product'
              ? 'bg-(--brand-primary) text-white'
              : 'text-(--color-text-muted) hover:bg-(--color-elevated)'
          )}
        >
          Add Store Product
        </button>
        <button
          onClick={() => setMode('custom')}
          className={cn(
            'text-xs font-medium px-3 py-1.5 rounded-lg transition-colors',
            mode === 'custom'
              ? 'bg-(--brand-primary) text-white'
              : 'text-(--color-text-muted) hover:bg-(--color-elevated)'
          )}
        >
          Add Custom Item
        </button>
      </div>

      {mode === 'product' ? (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--color-text-muted)" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a product..."
            className={cn(
              'w-full rounded-lg border border-(--color-border)',
              'bg-(--color-bg) pl-10 pr-4 py-2.5 text-sm text-(--color-text)',
              'placeholder:text-(--color-text-muted)',
              'focus:outline-none focus:ring-2 focus:ring-(--brand-primary)/30 focus:border-(--brand-primary)',
              'transition-colors'
            )}
          />
          {searchQuery && (
            <div
              className={cn(
                'absolute top-full left-0 right-0 mt-1 z-10',
                'rounded-lg border border-(--color-border)',
                'bg-(--color-surface) shadow-(--shadow-md)',
                'p-3 text-sm text-(--color-text-muted)'
              )}
            >
              Type to search products from the store...
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
              placeholder="Item name (e.g. Semi-skimmed milk)"
              className={cn(
                'flex-1 rounded-lg border border-(--color-border)',
                'bg-(--color-bg) px-4 py-2.5 text-sm text-(--color-text)',
                'placeholder:text-(--color-text-muted)',
                'focus:outline-none focus:ring-2 focus:ring-(--brand-primary)/30 focus:border-(--brand-primary)',
                'transition-colors'
              )}
            />
            <div className="flex items-center gap-1 border border-(--color-border) rounded-lg px-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="h-6 w-6 flex items-center justify-center text-(--color-text-muted) hover:text-(--color-text) transition-colors"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="text-sm font-mono w-6 text-center text-(--color-text)">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="h-6 w-6 flex items-center justify-center text-(--color-text-muted) hover:text-(--color-text) transition-colors"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note (optional)"
            className={cn(
              'w-full rounded-lg border border-(--color-border)',
              'bg-(--color-bg) px-4 py-2 text-xs text-(--color-text)',
              'placeholder:text-(--color-text-muted)',
              'focus:outline-none focus:ring-2 focus:ring-(--brand-primary)/30 focus:border-(--brand-primary)',
              'transition-colors'
            )}
          />
          <button
            onClick={handleAddCustom}
            disabled={!customName.trim()}
            className={cn(
              'w-full rounded-lg px-4 py-2.5 text-sm font-semibold',
              'bg-(--brand-amber) text-white',
              'hover:bg-(--brand-amber-hover) transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            Add to List
          </button>
        </div>
      )}
    </div>
  )
}

export default function FamilyListDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const {
    lists,
    toggleItem,
    getUncheckedCount,
    getTotalPrice,
    addAllToCart,
    deleteList,
  } = useFamilyListStore()
  const { addItem: addToCart } = useCart()

  const [showShareModal, setShowShareModal] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState('')
  const [showChecked, setShowChecked] = useState(false)

  const list = lists.find((l) => l.id === params.id)

  const uncheckedItems = useMemo(
    () => (list?.items ?? []).filter((i) => !i.checked),
    [list?.items]
  )
  const checkedItems = useMemo(
    () => (list?.items ?? []).filter((i) => i.checked),
    [list?.items]
  )

  const uncheckedCount = list ? getUncheckedCount(list.id) : 0
  const totalPrice = list ? getTotalPrice(list.id) : 0

  const handleAddAllToCart = useCallback(() => {
    if (!list) return
    const cartItems = addAllToCart(list.id)
    for (const item of cartItems) {
      if (item.productId) {
        const itemName = item.productName || item.customName || 'Product'
        addToCart(
          {
            id: item.productId,
            name: itemName,
            slug: itemName.toLowerCase().replace(/\s+/g, '-'),
            price_pence: item.productPrice ?? 0,
            image_url: item.productImage ?? null,
          },
          item.quantity
        )
      }
    }
  }, [list, addAllToCart, addToCart])

  function handleSaveName() {
    if (!list || !editName.trim()) return
    useFamilyListStore.setState((state) => ({
      lists: state.lists.map((l) =>
        l.id === list.id ? { ...l, name: editName.trim() } : l
      ),
    }))
    setIsEditingName(false)
  }

  function handleDelete() {
    if (!list) return
    deleteList(list.id)
    router.push('/family-lists')
  }

  if (!list) {
    return (
      <Container size="lg" className="py-8 lg:py-12">
        <div className="text-center py-16">
          <h1 className="text-2xl font-display font-bold text-(--color-text) mb-2">
            List not found
          </h1>
          <p className="text-(--color-text-muted) mb-6">
            This list may have been deleted or the link is incorrect.
          </p>
          <Link
            href="/family-lists"
            className={cn(
              'inline-flex items-center gap-2 rounded-lg',
              'bg-(--brand-primary) text-white px-6 py-2.5 text-sm font-semibold',
              'hover:bg-(--brand-primary)/90 transition-colors'
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Family Lists
          </Link>
        </div>
      </Container>
    )
  }

  return (
    <Container size="lg" className="py-8 lg:py-12">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/family-lists"
            className="flex-shrink-0 h-9 w-9 flex items-center justify-center rounded-lg border border-(--color-border) hover:bg-(--color-elevated) transition-colors"
            aria-label="Back to lists"
          >
            <ArrowLeft className="h-4 w-4 text-(--color-text-muted)" />
          </Link>
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName()
                  if (e.key === 'Escape') setIsEditingName(false)
                }}
                className={cn(
                  'text-xl font-display font-bold text-(--color-text)',
                  'bg-transparent border-b-2 border-(--brand-primary)',
                  'focus:outline-none px-0 py-0.5'
                )}
                autoFocus
              />
              <button
                onClick={handleSaveName}
                className="text-(--brand-primary) hover:text-(--brand-primary)/80"
              >
                <Check className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <h1
              className="text-xl lg:text-2xl font-display font-bold text-(--color-text) cursor-pointer hover:text-(--brand-primary) transition-colors"
              onClick={() => {
                setEditName(list.name)
                setIsEditingName(true)
              }}
              title="Click to edit name"
            >
              {list.name}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-3">
          <MemberAvatars members={list.members} />
          <button
            onClick={() => setShowShareModal(true)}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg',
              'border border-(--color-border) px-3 py-2 text-sm font-medium',
              'text-(--color-text-secondary) hover:bg-(--color-elevated) transition-colors'
            )}
          >
            <UserPlus className="h-4 w-4" />
            Invite
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(list.shareCode)
            }}
            className={cn(
              'font-mono text-xs bg-(--color-elevated) px-3 py-2.5 rounded-lg',
              'text-(--color-text-muted) hover:text-(--color-text-secondary)',
              'border border-(--color-border) transition-colors'
            )}
            title="Copy share code"
          >
            {list.shareCode}
            <Copy className="inline-block ml-1.5 h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main list content */}
        <div className="lg:col-span-2 space-y-6">
          {/* To Get section */}
          <section>
            <h2 className="text-sm font-semibold text-(--color-text-muted) uppercase tracking-wider mb-2">
              To Get ({uncheckedItems.length})
            </h2>
            {uncheckedItems.length === 0 ? (
              <div className="py-8 text-center text-(--color-text-muted) text-sm">
                All items checked off. Nice work!
              </div>
            ) : (
              <div
                className={cn(
                  'rounded-xl border border-(--color-border)',
                  'bg-(--color-surface) px-4'
                )}
              >
                {uncheckedItems.map((item) => (
                  <ItemRow key={item.id} item={item} listId={list.id} />
                ))}
              </div>
            )}
          </section>

          {/* Already Got section */}
          {checkedItems.length > 0 && (
            <section>
              <button
                onClick={() => setShowChecked(!showChecked)}
                className="flex items-center gap-2 text-sm font-semibold text-(--color-text-muted) uppercase tracking-wider mb-2 hover:text-(--color-text-secondary) transition-colors"
              >
                Already Got ({checkedItems.length})
                {showChecked ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {showChecked && (
                <div
                  className={cn(
                    'rounded-xl border border-(--color-border)',
                    'bg-(--color-surface) px-4'
                  )}
                >
                  {checkedItems.map((item) => (
                    <ItemRow key={item.id} item={item} listId={list.id} />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Add item section */}
          <AddItemSection listId={list.id} />
        </div>

        {/* Sidebar / Action bar */}
        <div className="lg:col-span-1">
          <div
            className={cn(
              'sticky top-4 rounded-xl border border-(--color-border)',
              'bg-(--color-surface) p-5 space-y-4'
            )}
          >
            <h3 className="text-sm font-semibold text-(--color-text) mb-1">
              List Summary
            </h3>
            <div className="text-sm text-(--color-text-muted) space-y-1">
              <p>{list.items.length} total items</p>
              <p>{uncheckedCount} remaining</p>
              <p>{list.members.length} member{list.members.length !== 1 ? 's' : ''}</p>
            </div>

            {totalPrice > 0 && (
              <p className="text-lg font-bold text-(--color-text)">
                {formatPrice(totalPrice)}
              </p>
            )}

            <button
              onClick={handleAddAllToCart}
              disabled={uncheckedCount === 0}
              className={cn(
                'w-full inline-flex items-center justify-center gap-2 rounded-lg',
                'bg-(--brand-amber) text-white px-4 py-3 text-sm font-semibold',
                'hover:bg-(--brand-amber-hover) transition-colors',
                'shadow-(--shadow-amber)',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <ShoppingCart className="h-4 w-4" />
              Add All to Cart
              {uncheckedCount > 0 && (
                <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">
                  {uncheckedCount}
                </span>
              )}
            </button>

            <button
              onClick={handleDelete}
              className={cn(
                'w-full text-center text-xs text-(--color-text-muted)',
                'hover:text-(--color-error) transition-colors py-1'
              )}
            >
              Delete this list
            </button>
          </div>
        </div>
      </div>

      {/* Mobile bottom bar */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-40 lg:hidden',
          'bg-(--color-surface) border-t border-(--color-border)',
          'p-4 safe-area-pb'
        )}
      >
        <button
          onClick={handleAddAllToCart}
          disabled={uncheckedCount === 0}
          className={cn(
            'w-full inline-flex items-center justify-center gap-2 rounded-lg',
            'bg-(--brand-amber) text-white px-4 py-3.5 text-sm font-semibold',
            'hover:bg-(--brand-amber-hover) transition-colors',
            'shadow-(--shadow-amber)',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <ShoppingCart className="h-4 w-4" />
          Add All to Cart
          {totalPrice > 0 && (
            <span className="ml-1">({formatPrice(totalPrice)})</span>
          )}
          {uncheckedCount > 0 && (
            <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full ml-1">
              {uncheckedCount}
            </span>
          )}
        </button>
      </div>

      {/* Bottom padding for mobile bar */}
      <div className="h-20 lg:hidden" />

      {showShareModal && (
        <ShareModal
          shareCode={list.shareCode}
          listId={list.id}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </Container>
  )
}
