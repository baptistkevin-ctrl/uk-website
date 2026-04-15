'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Gift,
  Users,
  Copy,
  Check,
  Share2,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  MessageCircle,
  Twitter,
  Facebook,
} from 'lucide-react'
import { formatPrice } from '@/lib/utils/format'

interface ReferralData {
  referralCode: {
    id: string
    code: string
    referrer_reward_pence: number
    referee_reward_pence: number
    total_referrals: number
    total_earned_pence: number
  } | null
  referrals: Array<{
    id: string
    status: string
    referrer_reward_pence: number
    referrer_credited_at: string | null
    created_at: string
    referee: {
      full_name: string | null
      email: string
      avatar_url: string | null
    }
  }>
  credits: {
    balance_pence: number
    lifetime_earned_pence: number
    lifetime_spent_pence: number
  }
  transactions: Array<{
    id: string
    amount_pence: number
    balance_after_pence: number
    type: string
    description: string | null
    created_at: string
  }>
  shareUrl: string | null
}

export default function ReferralsPage() {
  const [data, setData] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'referrals' | 'credits'>('referrals')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/referrals')
      const json = await res.json()
      setData(json)
    } catch (error) {
      console.error('Error fetching referral data:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyCode = async () => {
    if (data?.referralCode?.code) {
      await navigator.clipboard.writeText(data.referralCode.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const copyLink = async () => {
    if (data?.shareUrl) {
      await navigator.clipboard.writeText(data.shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareVia = (platform: string) => {
    if (!data?.shareUrl) return

    const text = `Join UK Grocery Store and get ${formatPrice(data.referralCode?.referee_reward_pence || 500)} off your first order!`
    const url = data.shareUrl

    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
      email: `mailto:?subject=${encodeURIComponent('Join UK Grocery Store!')}&body=${encodeURIComponent(text + '\n\n' + url)}`,
    }

    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-(--brand-amber-soft) text-(--brand-amber) rounded-full text-xs font-medium">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        )
      case 'qualified':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-(--color-info-bg) text-(--color-info) rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            Qualified
          </span>
        )
      case 'rewarded':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-(--brand-primary-light) text-(--brand-primary) rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            Rewarded
          </span>
        )
      case 'expired':
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-background text-(--color-text-secondary) rounded-full text-xs font-medium">
            <XCircle className="w-3 h-3" />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        )
      default:
        return null
    }
  }

  const getTransactionIcon = (type: string, amount: number) => {
    if (amount > 0) {
      return <ArrowUpRight className="w-4 h-4 text-(--brand-primary)" />
    }
    return <ArrowDownRight className="w-4 h-4 text-(--color-error)" />
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-(--color-border) rounded w-48 mb-2" />
          <div className="h-4 bg-(--color-border) rounded w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-(--color-border) rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Gift className="w-7 h-7 text-(--brand-primary)" />
          Refer & Earn
        </h1>
        <p className="text-(--color-text-muted) mt-1">
          Invite friends and earn rewards when they shop
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-(--brand-primary) rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Wallet className="w-8 h-8 opacity-80" />
            <span className="text-xs bg-(--color-surface)/20 px-2 py-1 rounded-full">Available</span>
          </div>
          <p className="text-3xl font-bold">{formatPrice(data?.credits?.balance_pence || 0)}</p>
          <p className="text-white/70 text-sm mt-1">Credit Balance</p>
        </div>

        <div className="bg-(--color-surface) rounded-xl p-6 border border-(--color-border)">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-(--color-info)" />
          </div>
          <p className="text-3xl font-bold text-foreground">{data?.referralCode?.total_referrals || 0}</p>
          <p className="text-(--color-text-muted) text-sm mt-1">Friends Referred</p>
        </div>

        <div className="bg-(--color-surface) rounded-xl p-6 border border-(--color-border)">
          <div className="flex items-center justify-between mb-4">
            <Gift className="w-8 h-8 text-(--color-info)" />
          </div>
          <p className="text-3xl font-bold text-foreground">
            {formatPrice(data?.credits?.lifetime_earned_pence || 0)}
          </p>
          <p className="text-(--color-text-muted) text-sm mt-1">Total Earned</p>
        </div>
      </div>

      {/* Share Section */}
      <div className="bg-linear-to-r from-[#1C1C1E] to-[#0F4023] rounded-2xl p-6 md:p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold mb-2">Share Your Code</h2>
            <p className="text-(--color-text-disabled) text-sm">
              Give friends {formatPrice(data?.referralCode?.referee_reward_pence || 500)} off and earn{' '}
              {formatPrice(data?.referralCode?.referrer_reward_pence || 500)} when they order
            </p>
          </div>

          <div className="shrink-0">
            <div className="flex items-center gap-2 bg-(--color-surface)/10 rounded-xl p-2">
              <div className="px-4 py-2.5 bg-(--color-surface) text-foreground font-mono font-bold text-lg rounded-lg">
                {data?.referralCode?.code || 'Loading...'}
              </div>
              <button
                onClick={copyCode}
                className="p-2 bg-(--brand-primary) hover:bg-(--brand-primary-hover) rounded-lg transition-colors"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <p className="text-sm text-(--color-text-disabled) mb-3">Share via</p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={copyLink}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-(--color-surface)/10 hover:bg-(--color-surface)/20 rounded-lg transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Copy Link
            </button>
            <button
              onClick={() => shareVia('email')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-(--color-surface)/10 hover:bg-(--color-surface)/20 rounded-lg transition-colors"
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
            <button
              onClick={() => shareVia('whatsapp')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#25D366]/20 hover:bg-[#25D366]/30 rounded-lg transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </button>
            <button
              onClick={() => shareVia('twitter')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1DA1F2]/20 hover:bg-[#1DA1F2]/30 rounded-lg transition-colors"
            >
              <Twitter className="w-4 h-4" />
              Twitter
            </button>
            <button
              onClick={() => shareVia('facebook')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1877F2]/20 hover:bg-[#1877F2]/30 rounded-lg transition-colors"
            >
              <Facebook className="w-4 h-4" />
              Facebook
            </button>
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div className="bg-(--brand-primary-light) rounded-xl p-6 border border-(--brand-primary)/15">
        <h3 className="font-semibold text-foreground mb-4">How it Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-(--brand-primary) text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
              1
            </div>
            <div>
              <h4 className="font-medium text-foreground">Share Your Code</h4>
              <p className="text-sm text-(--color-text-secondary)">Send your unique referral code to friends</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-(--brand-primary) text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
              2
            </div>
            <div>
              <h4 className="font-medium text-foreground">Friend Signs Up</h4>
              <p className="text-sm text-(--color-text-secondary)">They get {formatPrice(data?.referralCode?.referee_reward_pence || 500)} credit instantly</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-(--brand-primary) text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
              3
            </div>
            <div>
              <h4 className="font-medium text-foreground">You Earn Rewards</h4>
              <p className="text-sm text-(--color-text-secondary)">Get {formatPrice(data?.referralCode?.referrer_reward_pence || 500)} when they make a purchase</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-(--color-border)">
        <nav className="flex gap-4 sm:gap-8 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('referrals')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'referrals'
                ? 'border-(--brand-primary) text-(--brand-primary)'
                : 'border-transparent text-(--color-text-muted) hover:text-(--color-text-secondary)'
            }`}
          >
            My Referrals ({data?.referrals?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('credits')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'credits'
                ? 'border-(--brand-primary) text-(--brand-primary)'
                : 'border-transparent text-(--color-text-muted) hover:text-(--color-text-secondary)'
            }`}
          >
            Credit History
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'referrals' ? (
        <div className="space-y-4">
          {data?.referrals && data.referrals.length > 0 ? (
            data.referrals.map((referral) => (
              <div
                key={referral.id}
                className="bg-(--color-surface) rounded-xl border border-(--color-border) p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-background rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-(--color-text-muted)" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {referral.referee?.full_name || referral.referee?.email?.split('@')[0] || 'Friend'}
                    </p>
                    <p className="text-sm text-(--color-text-muted)">
                      Joined {new Date(referral.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {referral.referrer_credited_at ? (
                    <span className="text-(--brand-primary) font-medium">
                      +{formatPrice(referral.referrer_reward_pence)}
                    </span>
                  ) : (
                    <span className="text-(--color-text-muted) text-sm">Waiting for first order</span>
                  )}
                  {getStatusBadge(referral.status)}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-background rounded-xl">
              <Users className="w-12 h-12 text-(--color-border) mx-auto mb-4" />
              <h3 className="font-medium text-foreground mb-1">No referrals yet</h3>
              <p className="text-sm text-(--color-text-muted)">Share your code to start earning rewards</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {data?.transactions && data.transactions.length > 0 ? (
            data.transactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-(--color-surface) rounded-xl border border-(--color-border) p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.amount_pence > 0 ? 'bg-(--brand-primary-light)' : 'bg-(--color-error-bg)'
                  }`}>
                    {getTransactionIcon(tx.type, tx.amount_pence)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {tx.description || tx.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    <p className="text-sm text-(--color-text-muted)">
                      {new Date(tx.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${tx.amount_pence > 0 ? 'text-(--brand-primary)' : 'text-(--color-error)'}`}>
                    {tx.amount_pence > 0 ? '+' : ''}{formatPrice(tx.amount_pence)}
                  </p>
                  <p className="text-sm text-(--color-text-muted)">
                    Balance: {formatPrice(tx.balance_after_pence)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-background rounded-xl">
              <Wallet className="w-12 h-12 text-(--color-border) mx-auto mb-4" />
              <h3 className="font-medium text-foreground mb-1">No transactions yet</h3>
              <p className="text-sm text-(--color-text-muted)">Your credit history will appear here</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
