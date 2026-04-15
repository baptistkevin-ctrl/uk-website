'use client'

import { useState } from 'react'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils/format'
import { Gift, Mail, User, MessageSquare, Loader2, Check } from 'lucide-react'

interface GiftCardDesign {
  id: string
  name: string
  slug: string
  image_url: string
  background_color: string
}

interface GiftCardPurchaseFormProps {
  designs: GiftCardDesign[]
  isLoggedIn: boolean
  userEmail?: string
}

const PRESET_AMOUNTS = [1000, 2500, 5000, 10000, 15000, 20000]

export function GiftCardPurchaseForm({
  designs,
  isLoggedIn,
  userEmail
}: GiftCardPurchaseFormProps) {
  const [selectedDesign, setSelectedDesign] = useState(designs[0]?.slug || 'default')
  const [amount, setAmount] = useState(2500)
  const [customAmount, setCustomAmount] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [senderEmail, setSenderEmail] = useState(userEmail || '')
  const [giftMessage, setGiftMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleAmountSelect = (value: number) => {
    setAmount(value)
    setCustomAmount('')
  }

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value)
    const pence = Math.round(parseFloat(value) * 100)
    if (!isNaN(pence) && pence >= 500 && pence <= 50000) {
      setAmount(pence)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/gift-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_pence: amount,
          recipient_email: recipientEmail,
          recipient_name: recipientName,
          sender_email: senderEmail,
          gift_message: giftMessage,
          design_template: selectedDesign
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create gift card')
      }

      setSuccess(true)
      // In a real app, redirect to Stripe checkout here
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-(--brand-primary-light) rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="h-8 w-8 text-(--brand-primary)" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">Gift Card Created!</h3>
        <p className="text-(--color-text-muted) mb-6">
          Complete the payment to send your gift card.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="text-(--brand-primary) hover:text-(--brand-primary-dark) font-medium"
        >
          Create Another Gift Card
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Design Selection */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Choose a Design
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {designs.map((design) => (
            <button
              key={design.slug}
              type="button"
              onClick={() => setSelectedDesign(design.slug)}
              className={`relative aspect-3/2 rounded-lg overflow-hidden border-2 transition-all ${
                selectedDesign === design.slug
                  ? 'border-(--brand-primary) ring-2 ring-(--brand-primary-light)'
                  : 'border-(--color-border) hover:border-(--color-border)'
              }`}
              style={{ backgroundColor: design.background_color }}
            >
              {design.image_url && (
                <Image
                  src={design.image_url}
                  alt={design.name}
                  fill
                  className="object-cover"
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <Gift className="h-6 w-6 text-white/80" />
              </div>
              {selectedDesign === design.slug && (
                <div className="absolute top-1 right-1 w-5 h-5 bg-(--brand-primary) rounded-full flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Amount Selection */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Select Amount
        </label>
        <div className="grid grid-cols-3 gap-3 mb-3">
          {PRESET_AMOUNTS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => handleAmountSelect(value)}
              className={`py-3 rounded-lg font-semibold transition-all ${
                amount === value && !customAmount
                  ? 'bg-(--brand-primary) text-white'
                  : 'bg-background text-foreground hover:bg-(--color-elevated)'
              }`}
            >
              {formatPrice(value)}
            </button>
          ))}
        </div>
        <div className="relative">
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-(--color-text-muted)">
            £
          </span>
          <input
            type="number"
            value={customAmount}
            onChange={(e) => handleCustomAmountChange(e.target.value)}
            placeholder="Custom amount (5.00 - 500.00)"
            min="5"
            max="500"
            step="0.01"
            className="w-full pl-8 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
          />
        </div>
      </div>

      {/* Recipient Details */}
      <div className="space-y-4">
        <h3 className="font-medium text-foreground">Recipient Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-(--color-text-muted)" />
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Recipient's name"
              required
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-(--color-text-muted)" />
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="Recipient's email"
              required
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
            />
          </div>
        </div>
      </div>

      {/* Your Email */}
      {!isLoggedIn && (
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-(--color-text-muted)" />
          <input
            type="email"
            value={senderEmail}
            onChange={(e) => setSenderEmail(e.target.value)}
            placeholder="Your email"
            required
            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
          />
        </div>
      )}

      {/* Gift Message */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Add a Personal Message (Optional)
        </label>
        <div className="relative">
          <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-(--color-text-muted)" />
          <textarea
            value={giftMessage}
            onChange={(e) => setGiftMessage(e.target.value)}
            placeholder="Write a message to include with the gift card..."
            rows={3}
            maxLength={200}
            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary) resize-none"
          />
          <span className="absolute bottom-2 right-3 text-xs text-(--color-text-muted)">
            {giftMessage.length}/200
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-(--color-error-light) border border-(--color-error) rounded-lg text-(--color-error)">
          {error}
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div>
          <p className="text-sm text-(--color-text-muted)">Total</p>
          <p className="text-2xl font-bold text-foreground">{formatPrice(amount)}</p>
        </div>
        <button
          type="submit"
          disabled={loading || !recipientEmail || !recipientName}
          className="px-8 py-3 bg-(--brand-primary) text-white rounded-lg font-semibold hover:bg-(--brand-primary-dark) disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Gift className="h-5 w-5" />
              Purchase Gift Card
            </>
          )}
        </button>
      </div>
    </form>
  )
}
