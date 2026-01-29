'use client'

import { useState } from 'react'
import { formatPrice } from '@/lib/utils/format'
import { Search, Loader2, Gift, Calendar, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

export function GiftCardBalance() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    valid: boolean
    balance_pence: number
    expires_at: string
  } | null>(null)
  const [error, setError] = useState('')

  const checkBalance = async () => {
    if (!code.trim()) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch(`/api/gift-cards?code=${encodeURIComponent(code)}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to check balance')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid gift card code')
    } finally {
      setLoading(false)
    }
  }

  const formatCode = (value: string) => {
    // Remove non-alphanumeric characters and convert to uppercase
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    // Add dashes every 4 characters
    const parts = cleaned.match(/.{1,4}/g) || []
    return parts.join('-').slice(0, 19) // Max 16 chars + 3 dashes
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(formatCode(e.target.value))}
          placeholder="XXXX-XXXX-XXXX-XXXX"
          maxLength={19}
          className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-center uppercase"
        />
        <button
          onClick={checkBalance}
          disabled={loading || !code.trim()}
          className="px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Search className="h-5 w-5" />
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {result && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <Gift className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-emerald-600 font-medium">Available Balance</p>
              <p className="text-2xl font-bold text-emerald-800">
                {formatPrice(result.balance_pence)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-emerald-600">
            <Calendar className="h-4 w-4" />
            <span>
              Valid until {format(new Date(result.expires_at), 'dd MMM yyyy')}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
