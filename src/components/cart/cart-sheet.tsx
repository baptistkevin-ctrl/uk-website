'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Truck, Tag, Sparkles } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useCart } from '@/hooks/use-cart'
import { formatPrice } from '@/lib/utils/format'

export function CartSheet() {
  const {
    itemsWithSavings,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    subtotal,
    subtotalBeforeDiscounts,
    totalSavings,
    hasOffersApplied,
    itemCount
  } = useCart()

  const deliveryFee = subtotal >= 5000 ? 0 : 399
  const amountUntilFreeDelivery = 5000 - subtotal
  const freeDeliveryProgress = Math.min((subtotal / 5000) * 100, 100)

  return (
    <Sheet open={isOpen} onOpenChange={closeCart}>
      <SheetContent className="flex flex-col w-full sm:max-w-lg p-0">
        <SheetHeader className="p-6 pb-4 border-b bg-slate-50">
          <SheetTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold">Shopping Cart</span>
              <p className="text-sm text-gray-500 font-normal">{itemCount} items</p>
            </div>
          </SheetTitle>
        </SheetHeader>

        {itemsWithSavings.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-gray-500 mb-6 text-sm">
              Add some items to your cart to get started
            </p>
            <Button
              onClick={closeCart}
              asChild
              className="bg-green-500 hover:bg-green-600"
            >
              <Link href="/products">
                Browse Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Free delivery progress */}
            {amountUntilFreeDelivery > 0 && (
              <div className="px-6 py-3 bg-green-50 border-b border-green-100">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="h-4 w-4 text-green-500" />
                  <p className="text-sm font-medium text-green-900">
                    Add {formatPrice(amountUntilFreeDelivery)} more for FREE delivery!
                  </p>
                </div>
                <div className="h-1.5 bg-green-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-400 rounded-full transition-all duration-300"
                    style={{ width: `${freeDeliveryProgress}%` }}
                  />
                </div>
              </div>
            )}

            {amountUntilFreeDelivery <= 0 && (
              <div className="px-6 py-3 bg-green-100 border-b border-green-200 flex items-center gap-2">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <Truck className="h-3 w-3 text-white" />
                </div>
                <p className="text-sm font-semibold text-green-900">
                  FREE delivery unlocked!
                </p>
              </div>
            )}

            <div className="flex-1 overflow-y-auto py-4 px-6">
              <ul className="space-y-4">
                {itemsWithSavings.map((item) => (
                  <li key={item.product.id} className={`rounded-xl p-3 ${item.offerApplied ? 'bg-orange-50 border border-orange-200' : 'bg-slate-50'}`}>
                    <div className="flex gap-3">
                      <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-white shrink-0">
                        {item.product.image_url ? (
                          <Image
                            src={item.product.image_url}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <ShoppingBag className="h-8 w-8" />
                          </div>
                        )}
                        {item.offerApplied && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                            <Tag className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 line-clamp-2">
                          {item.product.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-sm text-gray-500">
                            {formatPrice(item.product.price_pence)} each
                          </p>
                          {item.offerBadge && (
                            <Badge className="bg-orange-500 hover:bg-orange-600 text-white text-[10px] px-1.5 py-0">
                              {item.offerBadge}
                            </Badge>
                          )}
                        </div>
                        {item.product.track_inventory && item.product.stock_quantity !== undefined && item.product.stock_quantity !== null && item.product.stock_quantity > 0 && item.product.stock_quantity <= (item.product.low_stock_threshold ?? 5) && (
                          <p className="text-[11px] text-amber-600 font-medium mt-0.5">
                            Only {item.product.stock_quantity} left in stock
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border rounded-lg bg-white overflow-hidden">
                            <button
                              onClick={() =>
                                updateQuantity(item.product.id, item.quantity - 1)
                              }
                              className="p-1.5 hover:bg-gray-100 transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-8 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(item.product.id, item.quantity + 1)
                              }
                              className="p-1.5 hover:bg-gray-100 transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.product.id)}
                            className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        {item.offerApplied ? (
                          <>
                            <p className="text-xs text-gray-400 line-through">
                              {formatPrice(item.originalPrice)}
                            </p>
                            <p className="text-sm font-bold text-orange-600">
                              {formatPrice(item.discountedPrice)}
                            </p>
                            <p className="text-[10px] text-green-500 font-medium">
                              Save {formatPrice(item.savings)}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm font-bold text-gray-900">
                            {formatPrice(item.originalPrice)}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t p-6 space-y-4 bg-slate-50">
              {/* Savings Banner */}
              {hasOffersApplied && totalSavings > 0 && (
                <div className="bg-gradient-to-r from-green-400 to-green-500 rounded-xl p-3 flex items-center gap-3 text-white shadow-lg shadow-green-400/25">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Multi-buy savings applied!</p>
                    <p className="text-xs opacity-90">You're saving {formatPrice(totalSavings)} with offers</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {hasOffersApplied && (
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Original price</span>
                    <span className="line-through">{formatPrice(subtotalBeforeDiscounts)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {hasOffersApplied && (
                  <div className="flex justify-between text-sm text-green-500 font-medium">
                    <span>Offer savings</span>
                    <span>-{formatPrice(totalSavings)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Delivery</span>
                  <span>
                    {deliveryFee === 0 ? (
                      <span className="text-green-500 font-medium">FREE</span>
                    ) : (
                      formatPrice(deliveryFee)
                    )}
                  </span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-green-500">{formatPrice(subtotal + deliveryFee)}</span>
              </div>
              <div className="space-y-2">
                <Button
                  className="w-full h-11 bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 shadow-lg shadow-green-400/25"
                  size="lg"
                  asChild
                  onClick={closeCart}
                >
                  <Link href="/checkout">
                    Checkout
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  asChild
                  onClick={closeCart}
                >
                  <Link href="/cart">View Full Cart</Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
