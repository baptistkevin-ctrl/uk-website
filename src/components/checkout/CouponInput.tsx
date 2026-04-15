'use client'

import { useState } from 'react'
import { Tag, Loader2, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { formatPrice } from '@/lib/utils/format'

interface CouponInputProps {
  onApply: (discount: number) => void
  subtotal: number
}

export function CouponInput({ onApply, subtotal }: CouponInputProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [applied, setApplied] = useState<{
    code: string
    discount: number
    type: string
  } | null>(null)

  const handleApply = async () => {
    if (!code.trim()) return

    setLoading(true)
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), subtotal_pence: subtotal }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.valid && data.discount_pence > 0) {
          setApplied({
            code: code.trim().toUpperCase(),
            discount: data.discount_pence,
            type: data.discount_type,
          })
          onApply(data.discount_pence)
          toast.success(`Coupon applied! You save ${formatPrice(data.discount_pence)}`)
          setCode('')
        } else {
          toast.error(data.message || 'Invalid coupon code')
        }
      } else {
        const data = await res.json()
        toast.error(data.error || 'Invalid coupon code')
      }
    } catch {
      toast.error('Failed to validate coupon')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = () => {
    setApplied(null)
    onApply(0)
    toast.info('Coupon removed')
  }

  if (applied) {
    return (
      <div className="flex items-center justify-between p-3 bg-(--color-success)/5 border border-(--color-success)/20 rounded-lg">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-(--color-success)" />
          <span className="text-sm font-medium text-(--color-success)">{applied.code}</span>
          <span className="text-xs text-(--color-text-muted)">-{formatPrice(applied.discount)}</span>
        </div>
        <button onClick={handleRemove} className="p-1 hover:bg-(--color-elevated) rounded transition-colors">
          <X className="h-4 w-4 text-(--color-text-muted)" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--color-text-muted)" />
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          placeholder="Coupon code"
          className="w-full h-10 pl-10 pr-3 rounded-lg border border-(--color-border) bg-background text-sm text-foreground placeholder:text-(--color-text-muted) focus:border-(--brand-primary) focus:ring-1 focus:ring-(--brand-primary) outline-none"
        />
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleApply}
        disabled={loading || !code.trim()}
        className="h-10 px-4"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
      </Button>
    </div>
  )
}
