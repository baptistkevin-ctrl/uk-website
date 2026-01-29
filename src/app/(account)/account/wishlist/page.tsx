'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Heart, ShoppingBag, Loader2, Trash2, Plus, Share2, Globe,
  Lock, MoreVertical, Pencil, Copy, Check, ShoppingCart, ExternalLink
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Heart className="h-6 w-6 text-pink-600" />
            My Wishlists
          </h1>
          <p className="text-gray-500 mt-1">Products you've saved for later</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Heart className="h-6 w-6 text-pink-600" />
            My Wishlists
          </h1>
          <p className="text-gray-500 mt-1">Organize your saved products</p>
        </div>
        <Button
          onClick={() => setShowNewList(true)}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Wishlist
        </Button>
      </div>

      {/* Wishlist Tabs */}
      {wishlists.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {wishlists.map((wishlist) => (
            <div key={wishlist.id} className="relative group flex-shrink-0">
              <button
                onClick={() => setActiveWishlist(wishlist.id)}
                className={`px-4 py-2 rounded-lg border transition-all ${
                  activeWishlist === wishlist.id
                    ? 'bg-pink-50 border-pink-300 text-pink-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {wishlist.is_public ? (
                    <Globe className="h-4 w-4" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                  <span className="font-medium">{wishlist.name}</span>
                  <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded">
                    {wishlist.itemCount}
                  </span>
                </div>
              </button>

              {/* Menu */}
              <div className="absolute right-0 top-0 -mt-1 -mr-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(menuOpen === wishlist.id ? null : wishlist.id)
                  }}
                  className="p-1 rounded-full bg-white shadow-sm border opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-3 w-3 text-gray-500" />
                </button>

                {menuOpen === wishlist.id && (
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border py-1 z-10">
                    <button
                      onClick={() => {
                        setEditingId(wishlist.id)
                        setEditName(wishlist.name)
                        setMenuOpen(null)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Pencil className="h-4 w-4" />
                      Rename
                    </button>
                    <button
                      onClick={() => handleUpdateWishlist(wishlist.id, { is_public: !wishlist.is_public })}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      {wishlist.is_public ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                      Make {wishlist.is_public ? 'Private' : 'Public'}
                    </button>
                    {wishlist.is_public && (
                      <button
                        onClick={() => handleCopyShareLink(wishlist.share_token)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        {copiedToken === wishlist.share_token ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copiedToken === wishlist.share_token ? 'Copied!' : 'Copy Share Link'}
                      </button>
                    )}
                    {wishlists.length > 1 && (
                      <button
                        onClick={() => handleDeleteWishlist(wishlist.id)}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
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
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{currentWishlist.itemCount}</div>
              <div className="text-sm text-gray-500">Items</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{formatPrice(currentWishlist.totalValue)}</div>
              <div className="text-sm text-gray-500">Total Value</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-green-600">{currentWishlist.priceDrops}</div>
              <div className="text-sm text-gray-500">Price Drops</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Items */}
      {validItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {validItems.map((item) => {
            const product = item.products!
            const hasDiscount = product.compare_at_price_pence && product.compare_at_price_pence > product.price_pence
            const hasPriceDrop = item.added_price_pence && product.price_pence < item.added_price_pence
            const isOutOfStock = product.stock_quantity <= 0

            return (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Link href={`/products/${product.slug}`} className="relative w-24 h-24 flex-shrink-0">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          fill
                          className="object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                          <ShoppingBag className="h-8 w-8 text-gray-300" />
                        </div>
                      )}
                      {hasPriceDrop && (
                        <div className="absolute -top-1 -left-1 px-1.5 py-0.5 bg-green-600 text-white text-xs font-medium rounded">
                          Price Drop!
                        </div>
                      )}
                    </Link>

                    <div className="flex-1 min-w-0">
                      <Link href={`/products/${product.slug}`} className="hover:text-green-600">
                        <h3 className="font-medium text-gray-900 line-clamp-2">{product.name}</h3>
                      </Link>

                      <div className="mt-1 flex items-center gap-2">
                        <span className="font-bold text-gray-900">{formatPrice(product.price_pence)}</span>
                        {hasDiscount && (
                          <span className="text-sm text-gray-500 line-through">
                            {formatPrice(product.compare_at_price_pence!)}
                          </span>
                        )}
                      </div>

                      {hasPriceDrop && (
                        <p className="text-xs text-green-600 mt-1">
                          Was {formatPrice(item.added_price_pence!)} when added
                        </p>
                      )}

                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={isOutOfStock}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                        <button
                          onClick={() => handleRemoveItem(currentWishlist!.id, product.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <Link
                          href={`/products/${product.slug}`}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-pink-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {currentWishlist ? `${currentWishlist.name} is empty` : 'Your wishlist is empty'}
              </h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                Start adding products you love by clicking the heart icon on any product.
              </p>
              <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                <Link href="/products">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Browse Products
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Share Info */}
      {currentWishlist?.is_public && validItems.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Share2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">This wishlist is public</p>
                  <p className="text-sm text-gray-600">
                    Share it with friends and family
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleCopyShareLink(currentWishlist.share_token)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {copiedToken === currentWishlist.share_token ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiedToken === currentWishlist.share_token ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* New Wishlist Modal */}
      {showNewList && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Wishlist</h2>
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="Wishlist name"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowNewList(false)
                  setNewListName('')
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={handleCreateWishlist}
                disabled={!newListName.trim()}
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Name Modal */}
      {editingId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Rename Wishlist</h2>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Wishlist name"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setEditingId(null)
                  setEditName('')
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => handleUpdateWishlist(editingId, { name: editName })}
                disabled={!editName.trim()}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
