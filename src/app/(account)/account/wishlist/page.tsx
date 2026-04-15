'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Heart, ShoppingBag, Loader2, Trash2, Plus, Share2, Globe,
  Lock, MoreVertical, Pencil, Copy, Check, ShoppingCart, ExternalLink
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { useCart } from '@/hooks/use-cart'

interface WishlistItem {
  id: string
  product_id: string
  added_price_pence: number | null
  notes: string | null
  created_at: string
  products: {
    id: string
    name: string
    slug: string
    price_pence: number
    compare_at_price_pence: number | null
    image_url: string | null
    is_active: boolean
    stock_quantity: number
  } | null
}

interface Wishlist {
  id: string
  name: string
  is_public: boolean
  share_token: string
  created_at: string
  itemCount: number
  totalValue: number
  priceDrops: number
  wishlist_items: WishlistItem[]
}

export default function WishlistPage() {
  const { addItem } = useCart()
  const [wishlists, setWishlists] = useState<Wishlist[]>([])
  const [activeWishlist, setActiveWishlist] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showNewList, setShowNewList] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  useEffect(() => {
    fetchWishlists()
  }, [])

  const fetchWishlists = async () => {
    try {
      const response = await fetch('/api/wishlist')
      const data = await response.json()

      if (data.wishlists) {
        setWishlists(data.wishlists)
        if (data.wishlists.length > 0 && !activeWishlist) {
          setActiveWishlist(data.wishlists[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching wishlists:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateWishlist = async () => {
    if (!newListName.trim()) return

    try {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newListName })
      })
      const data = await response.json()

      if (data.wishlist) {
        setWishlists([{ ...data.wishlist, wishlist_items: [], itemCount: 0, totalValue: 0, priceDrops: 0 }, ...wishlists])
        setActiveWishlist(data.wishlist.id)
        setNewListName('')
        setShowNewList(false)
      }
    } catch (error) {
      console.error('Error creating wishlist:', error)
    }
  }

  const handleUpdateWishlist = async (id: string, updates: { name?: string; is_public?: boolean }) => {
    try {
      const response = await fetch(`/api/wishlist/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        setWishlists(wishlists.map(w =>
          w.id === id ? { ...w, ...updates } : w
        ))
        setEditingId(null)
        setMenuOpen(null)
      }
    } catch (error) {
      console.error('Error updating wishlist:', error)
    }
  }

  const handleDeleteWishlist = async (id: string) => {
    if (!confirm('Are you sure you want to delete this wishlist?')) return

    try {
      const response = await fetch(`/api/wishlist/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const newWishlists = wishlists.filter(w => w.id !== id)
        setWishlists(newWishlists)
        if (activeWishlist === id && newWishlists.length > 0) {
          setActiveWishlist(newWishlists[0].id)
        }
        setMenuOpen(null)
      }
    } catch (error) {
      console.error('Error deleting wishlist:', error)
    }
  }

  const handleRemoveItem = async (wishlistId: string, productId: string) => {
    try {
      const response = await fetch(`/api/wishlist/${wishlistId}/items?product_id=${productId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setWishlists(wishlists.map(w => {
          if (w.id === wishlistId) {
            const newItems = w.wishlist_items.filter(item => item.product_id !== productId)
            return {
              ...w,
              wishlist_items: newItems,
              itemCount: newItems.length
            }
          }
          return w
        }))
      }
    } catch (error) {
      console.error('Error removing item:', error)
    }
  }

  const handleAddToCart = (product: NonNullable<WishlistItem['products']>) => {
    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price_pence: product.price_pence,
      image_url: product.image_url,
    } as Parameters<typeof addItem>[0])
  }

  const handleCopyShareLink = async (token: string) => {
    const url = `${window.location.origin}/wishlist/${token}`
    await navigator.clipboard.writeText(url)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  const formatPrice = (pence: number) => `£${(pence / 100).toFixed(2)}`

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          My Wishlists
        </h1>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-(--brand-primary)" />
        </div>
      </div>
    )
  }

  const currentWishlist = wishlists.find(w => w.id === activeWishlist)
  const validItems = currentWishlist?.wishlist_items.filter(item => item.products !== null) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-semibold text-foreground">
            My Wishlists
          </h1>
          {currentWishlist && currentWishlist.itemCount > 0 && (
            <Badge variant="secondary">
              {currentWishlist.itemCount} {currentWishlist.itemCount === 1 ? 'item' : 'items'}
            </Badge>
          )}
        </div>
        <button
          onClick={() => setShowNewList(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-(--brand-amber) px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          New Wishlist
        </button>
      </div>

      {/* Wishlist Tabs */}
      {wishlists.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {wishlists.map((wishlist) => (
            <div key={wishlist.id} className="relative group shrink-0">
              <button
                onClick={() => setActiveWishlist(wishlist.id)}
                className={`px-4 py-2.5 rounded-lg border text-sm transition-colors duration-200 ${
                  activeWishlist === wishlist.id
                    ? 'bg-(--brand-primary)/10 border-(--brand-primary) text-(--brand-primary)'
                    : 'bg-(--color-surface) border-(--color-border) text-(--color-text-secondary) hover:border-(--color-border-strong)'
                }`}
              >
                <div className="flex items-center gap-2">
                  {wishlist.is_public ? (
                    <Globe className="h-3.5 w-3.5" />
                  ) : (
                    <Lock className="h-3.5 w-3.5" />
                  )}
                  <span className="font-medium">{wishlist.name}</span>
                  <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-(--color-elevated)">
                    {wishlist.itemCount}
                  </span>
                </div>
              </button>

              {/* Menu trigger */}
              <div className="absolute right-0 top-0 -mt-1 -mr-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(menuOpen === wishlist.id ? null : wishlist.id)
                  }}
                  className="p-1 rounded-full bg-(--color-surface) shadow-(--shadow-sm) border border-(--color-border) opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-3 w-3 text-(--color-text-muted)" />
                </button>

                {menuOpen === wishlist.id && (
                  <div className="absolute right-0 mt-1 w-48 bg-(--color-surface) rounded-lg shadow-(--shadow-sm) border border-(--color-border) py-1 z-10">
                    <button
                      onClick={() => {
                        setEditingId(wishlist.id)
                        setEditName(wishlist.name)
                        setMenuOpen(null)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-(--color-text-secondary) hover:bg-(--color-elevated) flex items-center gap-2"
                    >
                      <Pencil className="h-4 w-4" />
                      Rename
                    </button>
                    <button
                      onClick={() => handleUpdateWishlist(wishlist.id, { is_public: !wishlist.is_public })}
                      className="w-full px-4 py-2 text-left text-sm text-(--color-text-secondary) hover:bg-(--color-elevated) flex items-center gap-2"
                    >
                      {wishlist.is_public ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                      Make {wishlist.is_public ? 'Private' : 'Public'}
                    </button>
                    {wishlist.is_public && (
                      <button
                        onClick={() => handleCopyShareLink(wishlist.share_token)}
                        className="w-full px-4 py-2 text-left text-sm text-(--color-text-secondary) hover:bg-(--color-elevated) flex items-center gap-2"
                      >
                        {copiedToken === wishlist.share_token ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copiedToken === wishlist.share_token ? 'Copied!' : 'Copy Share Link'}
                      </button>
                    )}
                    {wishlists.length > 1 && (
                      <button
                        onClick={() => handleDeleteWishlist(wishlist.id)}
                        className="w-full px-4 py-2 text-left text-sm text-(--color-error) hover:bg-(--color-error-bg) flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {currentWishlist && currentWishlist.itemCount > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-(--color-border) bg-(--color-surface) py-4 text-center">
            <div className="text-2xl font-semibold text-foreground">{currentWishlist.itemCount}</div>
            <div className="text-xs text-(--color-text-muted)">Items</div>
          </div>
          <div className="rounded-lg border border-(--color-border) bg-(--color-surface) py-4 text-center">
            <div className="text-2xl font-semibold font-mono text-foreground">{formatPrice(currentWishlist.totalValue)}</div>
            <div className="text-xs text-(--color-text-muted)">Total Value</div>
          </div>
          <div className="rounded-lg border border-(--color-border) bg-(--color-surface) py-4 text-center">
            <div className="text-2xl font-semibold text-(--color-success)">{currentWishlist.priceDrops}</div>
            <div className="text-xs text-(--color-text-muted)">Price Drops</div>
          </div>
        </div>
      )}

      {/* Items Grid */}
      {validItems.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
          {validItems.map((item) => {
            const product = item.products!
            const hasDiscount = product.compare_at_price_pence && product.compare_at_price_pence > product.price_pence
            const hasPriceDrop = item.added_price_pence && product.price_pence < item.added_price_pence
            const isOutOfStock = product.stock_quantity <= 0

            return (
              <div
                key={item.id}
                className="rounded-xl border border-(--color-border) bg-(--color-surface) overflow-hidden hover:border-(--color-border-strong) transition-colors duration-200"
              >
                {/* Product image */}
                <Link href={`/products/${product.slug}`} className="relative block aspect-square">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-(--color-elevated) flex items-center justify-center">
                      <ShoppingBag className="h-8 w-8 text-(--color-text-muted)" />
                    </div>
                  )}
                  {hasPriceDrop && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-(--color-success) text-white text-[11px] font-bold uppercase rounded-full">
                      Price Drop
                    </div>
                  )}
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                      <span className="text-xs font-bold uppercase text-(--color-text-muted)">Out of Stock</span>
                    </div>
                  )}
                </Link>

                {/* Product info */}
                <div className="p-3">
                  <Link href={`/products/${product.slug}`} className="hover:text-(--brand-primary) transition-colors">
                    <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
                      {product.name}
                    </h3>
                  </Link>

                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="font-mono font-semibold text-foreground">
                      {formatPrice(product.price_pence)}
                    </span>
                    {hasDiscount && (
                      <span className="text-xs text-(--color-text-muted) line-through">
                        {formatPrice(product.compare_at_price_pence!)}
                      </span>
                    )}
                  </div>

                  {hasPriceDrop && (
                    <p className="text-[11px] text-(--color-success) mt-1 font-medium">
                      Was {formatPrice(item.added_price_pence!)} when added
                    </p>
                  )}

                  {/* Actions */}
                  <div className="mt-3 flex items-center gap-1.5">
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={isOutOfStock}
                      className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-(--brand-primary) px-3 py-2.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-40"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      Add
                    </button>
                    <button
                      onClick={() => handleRemoveItem(currentWishlist!.id, product.id)}
                      className="rounded-md p-2 text-(--color-text-muted) hover:text-(--color-error) hover:bg-(--color-error-bg) transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <Link
                      href={`/products/${product.slug}`}
                      className="rounded-md p-2 text-(--color-text-muted) hover:text-(--color-text-secondary) hover:bg-(--color-elevated) transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-(--color-border) bg-(--color-surface) py-16 px-6">
          <Heart className="h-16 w-16 text-(--color-text-muted) mb-4" />
          <h2 className="font-display text-lg font-semibold text-foreground mb-1">
            {currentWishlist ? `${currentWishlist.name} is empty` : 'Your wishlist is empty'}
          </h2>
          <p className="text-sm text-(--color-text-muted) mb-6 text-center max-w-xs">
            Save your favourite items here
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-lg bg-(--brand-amber) px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            <ShoppingBag className="h-4 w-4" />
            Start Shopping
          </Link>
        </div>
      )}

      {/* Share Info */}
      {currentWishlist?.is_public && validItems.length > 0 && (
        <div className="rounded-xl border border-(--color-info)/30 bg-(--color-info-bg) p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-(--color-info)/15 shrink-0">
                <Share2 className="h-5 w-5 text-(--color-info)" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">This wishlist is public</p>
                <p className="text-xs text-(--color-text-muted)">Share it with friends and family</p>
              </div>
            </div>
            <button
              onClick={() => handleCopyShareLink(currentWishlist.share_token)}
              className="inline-flex items-center gap-2 rounded-lg bg-(--color-info) px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity shrink-0"
            >
              {copiedToken === currentWishlist.share_token ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiedToken === currentWishlist.share_token ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>
      )}

      {/* New Wishlist Modal */}
      {showNewList && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-(--color-surface) rounded-xl max-w-sm w-full p-6 shadow-(--shadow-sm)">
            <h2 className="font-display text-xl font-semibold text-foreground mb-4">Create New Wishlist</h2>
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="Wishlist name"
              className="w-full px-4 py-2.5 rounded-md border border-(--color-border) bg-background text-foreground placeholder:text-(--color-text-muted) focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary) outline-none"
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                className="flex-1 rounded-md border border-(--color-border) px-4 py-2.5 text-sm font-medium text-(--color-text-secondary) hover:bg-(--color-elevated) transition-colors"
                onClick={() => {
                  setShowNewList(false)
                  setNewListName('')
                }}
              >
                Cancel
              </button>
              <button
                className="flex-1 rounded-md bg-(--brand-amber) px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-40"
                onClick={handleCreateWishlist}
                disabled={!newListName.trim()}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Name Modal */}
      {editingId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-(--color-surface) rounded-xl max-w-sm w-full p-6 shadow-(--shadow-sm)">
            <h2 className="font-display text-xl font-semibold text-foreground mb-4">Rename Wishlist</h2>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Wishlist name"
              className="w-full px-4 py-2.5 rounded-md border border-(--color-border) bg-background text-foreground placeholder:text-(--color-text-muted) focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary) outline-none"
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                className="flex-1 rounded-md border border-(--color-border) px-4 py-2.5 text-sm font-medium text-(--color-text-secondary) hover:bg-(--color-elevated) transition-colors"
                onClick={() => {
                  setEditingId(null)
                  setEditName('')
                }}
              >
                Cancel
              </button>
              <button
                className="flex-1 rounded-md bg-(--brand-amber) px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-40"
                onClick={() => handleUpdateWishlist(editingId, { name: editName })}
                disabled={!editName.trim()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
