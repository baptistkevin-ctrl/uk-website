'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Truck } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useCart } from '@/hooks/use-cart'
import { formatPrice } from '@/lib/utils/format'

export function CartSheet() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, subtotal, itemCount } = useCart()

  const deliveryFee = subtotal >= 5000 ? 0 : 399
  const amountUntilFreeDelivery = 5000 - subtotal
  const freeDeliveryProgress = Math.min((subtotal / 5000) * 100, 100)

  return (
    <Sheet open={isOpen} onOpenChange={closeCart}>
      <SheetContent className="flex flex-col w-full sm:max-w-lg p-0">
        <SheetHeader className="p-6 pb-4 border-b bg-slate-50">
          <SheetTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold">Shopping Cart</span>
              <p className="text-sm text-gray-500 font-normal">{itemCount} items</p>
            </div>
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
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
              className="bg-emerald-600 hover:bg-emerald-700"
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
              <div className="px-6 py-3 bg-emerald-50 border-b border-emerald-100">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="h-4 w-4 text-emerald-600" />
                  <p className="text-sm font-medium text-emerald-900">
                    Add {formatPrice(amountUntilFreeDelivery)} more for FREE delivery!
                  </p>
                </div>
                <div className="h-1.5 bg-emerald-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${freeDeliveryProgress}%` }}
                  />
                </div>
              </div>
            )}

            {amountUntilFreeDelivery <= 0 && (
              <div className="px-6 py-3 bg-emerald-100 border-b border-emerald-200 flex items-center gap-2">
                <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center">
                  <Truck className="h-3 w-3 text-white" />
                </div>
                <p className="text-sm font-semibold text-emerald-900">
                  FREE delivery unlocked!
                </p>
              </div>
            )}

            <div className="flex-1 overflow-y-auto py-4 px-6">
              <ul className="space-y-4">
                {items.map((item) => (
                  <li key={item.product.id} className="bg-slate-50 rounded-xl p-3">
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
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 line-clamp-2">
                          {item.product.name}
                        </h4>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {formatPrice(item.product.price_pence)}
                        </p>
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
                        <p className="text-sm font-bold text-gray-900">
                          {formatPrice(item.product.price_pence * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t p-6 space-y-4 bg-slate-50">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Delivery</span>
                  <span>
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-600 font-medium">FREE</span>
                    ) : (
                      formatPrice(deliveryFee)
                    )}
                  </span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-emerald-600">{formatPrice(subtotal + deliveryFee)}</span>
              </div>
              <div className="space-y-2">
                <Button
                  className="w-full h-11 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/25"
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
