'use client'

import { useState, useEffect } from 'react'
import {
  Award,
  Crown,
  Gift,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Clock,
  TrendingUp,
  Sparkles,
  CheckCircle,
  Lock,
} from 'lucide-react'
import { formatPrice } from '@/lib/utils/format'
import { toast } from '@/hooks/use-toast'

interface LoyaltyData {
  account: {
    current_points: number
    lifetime_points: number
    points_expiring_soon: number
    next_expiry_date: string | null
  }
  currentTier: {
    id: string
    name: string
    slug: string
    min_points: number
    points_multiplier: number
    benefits: string[]
    icon: string
    color: string
  }
  nextTier: {
    id: string
    name: string
    min_points: number
    icon: string
    color: string
  } | null
  pointsToNextTier: number
  tiers: Array<{
    id: string
    name: string
    slug: string
    min_points: number
    points_multiplier: number
    benefits: string[]
    icon: string
    color: string
  }>
  redemptionRules: Array<{
    id: string
    name: string
    points_required: number
    reward_type: string
    reward_value: number
    min_order_pence: number
  }>
  earningRules: Array<{
    id: string
    name: string
    type: string
    points_per_pound: number
    fixed_points: number
  }>
  transactions: Array<{
    id: string
    points: number
    balance_after: number
    type: string
    description: string | null
    created_at: string
  }>
}

export default function RewardsPage() {
  const [data, setData] = useState<LoyaltyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'earn' | 'redeem' | 'history'>('earn')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/loyalty')
      const json = await res.json()
      setData(json)
    } catch (error) {
      console.error('Error fetching loyalty data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRedeem = async (ruleId: string) => {
    setRedeeming(ruleId)
    try {
      const res = await fetch('/api/loyalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rule_id: ruleId })
      })
      const result = await res.json()

      if (result.success) {
        toast.success('Points redeemed successfully! Your reward has been applied.')
        fetchData()
      } else {
        toast.error(result.error || 'Failed to redeem points')
      }
    } catch (error) {
      console.error('Error redeeming points:', error)
      toast.error('Failed to redeem points')
    } finally {
      setRedeeming(null)
    }
  }

  const getTierIcon = (icon: string) => {
    switch (icon) {
      case 'crown': return <Crown className="w-6 h-6" />
      case 'gem': return <Sparkles className="w-6 h-6" />
      default: return <Award className="w-6 h-6" />
    }
  }

  const getTransactionIcon = (points: number) => {
    if (points > 0) {
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
        <div className="h-48 bg-(--color-border) rounded-xl animate-pulse" />
      </div>
    )
  }

  const progressPercentage = data?.nextTier
    ? ((data.account.lifetime_points - (data.currentTier?.min_points || 0)) /
       (data.nextTier.min_points - (data.currentTier?.min_points || 0))) * 100
    : 100

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Award className="w-7 h-7 text-(--brand-amber)" />
          Rewards & Points
        </h1>
        <p className="text-(--color-text-muted) mt-1">
          Earn points on every purchase and redeem for rewards
        </p>
      </div>

      {/* Current Status Card */}
      <div
        className="rounded-2xl p-6 md:p-8 text-white relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${data?.currentTier?.color || '#059669'} 0%, ${data?.currentTier?.color || '#059669'}99 100%)` }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-(--color-surface)/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-(--color-surface)/10 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-(--color-surface)/20 rounded-xl flex items-center justify-center">
                  {getTierIcon(data?.currentTier?.icon || 'medal')}
                </div>
                <div>
                  <p className="text-white/70 text-sm">Current Tier</p>
                  <h2 className="text-2xl font-bold">{data?.currentTier?.name || 'Bronze'}</h2>
                </div>
              </div>
              <p className="text-white/80 text-sm">
                {data?.currentTier?.points_multiplier || 1}x points on all purchases
              </p>
            </div>

            <div className="text-center md:text-right">
              <p className="text-white/70 text-sm">Available Points</p>
              <p className="text-4xl font-bold">{data?.account.current_points.toLocaleString()}</p>
              <p className="text-white/70 text-sm mt-1">
                {data?.account.lifetime_points.toLocaleString()} lifetime points
              </p>
            </div>
          </div>

          {/* Progress to next tier */}
          {data?.nextTier && (
            <div className="mt-6 pt-6 border-t border-white/20">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-white/80">{data.currentTier?.name}</span>
                <span className="text-white/80">{data.nextTier.name}</span>
              </div>
              <div className="h-3 bg-(--color-surface)/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-(--color-surface) rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, progressPercentage)}%` }}
                />
              </div>
              <p className="text-sm text-white/80 mt-2">
                {data.pointsToNextTier.toLocaleString()} points to {data.nextTier.name}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Expiring Points Warning */}
      {data?.account.points_expiring_soon && data.account.points_expiring_soon > 0 && (
        <div className="bg-(--brand-amber-soft) border border-(--brand-amber)/20 rounded-xl p-4 flex items-center gap-4">
          <Clock className="w-6 h-6 text-(--brand-amber) shrink-0" />
          <div>
            <p className="font-medium text-(--brand-amber)">
              {data.account.points_expiring_soon.toLocaleString()} points expiring soon
            </p>
            <p className="text-sm text-(--brand-amber)">
              Use them before {data.account.next_expiry_date ? new Date(data.account.next_expiry_date).toLocaleDateString('en-GB') : 'they expire'}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-(--color-border)">
        <nav className="flex gap-4 sm:gap-8 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('earn')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'earn'
                ? 'border-(--brand-amber) text-(--brand-amber)'
                : 'border-transparent text-(--color-text-muted) hover:text-(--color-text-secondary)'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline-block mr-2" />
            How to Earn
          </button>
          <button
            onClick={() => setActiveTab('redeem')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'redeem'
                ? 'border-(--brand-amber) text-(--brand-amber)'
                : 'border-transparent text-(--color-text-muted) hover:text-(--color-text-secondary)'
            }`}
          >
            <Gift className="w-4 h-4 inline-block mr-2" />
            Redeem Rewards
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-(--brand-amber) text-(--brand-amber)'
                : 'border-transparent text-(--color-text-muted) hover:text-(--color-text-secondary)'
            }`}
          >
            <Clock className="w-4 h-4 inline-block mr-2" />
            History
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'earn' && (
        <div className="space-y-6">
          {/* Ways to Earn */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data?.earningRules?.map((rule) => (
              <div
                key={rule.id}
                className="bg-(--color-surface) rounded-xl border border-(--color-border) p-5 flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-(--brand-amber-soft) rounded-xl flex items-center justify-center shrink-0">
                  <Star className="w-6 h-6 text-(--brand-amber)" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{rule.name}</h3>
                  <p className="text-sm text-(--color-text-muted)">
                    {rule.points_per_pound > 0
                      ? `${rule.points_per_pound} point${rule.points_per_pound > 1 ? 's' : ''} per £1 spent`
                      : `+${rule.fixed_points} points`}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-(--brand-amber) font-bold">
                    +{rule.points_per_pound > 0 ? `${rule.points_per_pound}/£` : rule.fixed_points}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Tiers Overview */}
          <div className="bg-background rounded-xl p-6">
            <h3 className="font-semibold text-foreground mb-4">Membership Tiers</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {data?.tiers?.map((tier) => {
                const isCurrentTier = tier.id === data.currentTier?.id
                const isLocked = tier.min_points > data.account.lifetime_points

                return (
                  <div
                    key={tier.id}
                    className={`rounded-xl p-4 border-2 transition-all ${
                      isCurrentTier
                        ? 'border-(--brand-amber) bg-(--brand-amber-soft)'
                        : isLocked
                        ? 'border-(--color-border) bg-(--color-surface) opacity-60'
                        : 'border-(--color-border) bg-(--color-surface)'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: tier.color + '20', color: tier.color }}
                      >
                        {getTierIcon(tier.icon)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{tier.name}</h4>
                        {isCurrentTier && (
                          <span className="text-xs text-(--brand-amber)">Current</span>
                        )}
                      </div>
                      {isLocked && <Lock className="w-4 h-4 text-(--color-text-disabled) ml-auto" />}
                    </div>
                    <p className="text-sm text-(--color-text-muted) mb-2">
                      {tier.min_points.toLocaleString()}+ points
                    </p>
                    <p className="text-sm font-medium text-(--color-text-secondary)">
                      {tier.points_multiplier}x points multiplier
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'redeem' && (
        <div className="space-y-4">
          {data?.redemptionRules && data.redemptionRules.length > 0 ? (
            data.redemptionRules.map((rule) => {
              const canRedeem = data.account.current_points >= rule.points_required

              return (
                <div
                  key={rule.id}
                  className={`bg-(--color-surface) rounded-xl border p-5 flex items-center gap-4 ${
                    canRedeem ? 'border-(--color-border)' : 'border-(--color-border) opacity-60'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    canRedeem ? 'bg-(--brand-primary-light)' : 'bg-(--color-elevated)'
                  }`}>
                    <Gift className={`w-6 h-6 ${canRedeem ? 'text-(--brand-primary)' : 'text-(--color-text-disabled)'}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{rule.name}</h3>
                    <p className="text-sm text-(--color-text-muted)">
                      {rule.min_order_pence > 0 && `Min order: ${formatPrice(rule.min_order_pence)}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">{rule.points_required.toLocaleString()} pts</p>
                    <button
                      onClick={() => canRedeem && handleRedeem(rule.id)}
                      disabled={!canRedeem || redeeming === rule.id}
                      className={`mt-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        canRedeem
                          ? 'bg-(--brand-primary) text-white hover:bg-(--brand-primary-hover)'
                          : 'bg-(--color-elevated) text-(--color-text-disabled) cursor-not-allowed'
                      }`}
                    >
                      {redeeming === rule.id ? 'Redeeming...' : canRedeem ? 'Redeem' : 'Not enough points'}
                    </button>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-12 bg-background rounded-xl">
              <Gift className="w-12 h-12 text-(--color-text-disabled) mx-auto mb-4" />
              <h3 className="font-medium text-foreground mb-1">No rewards available</h3>
              <p className="text-sm text-(--color-text-muted)">Check back later for redemption options</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          {data?.transactions && data.transactions.length > 0 ? (
            data.transactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-(--color-surface) rounded-xl border border-(--color-border) p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.points > 0 ? 'bg-(--brand-primary-light)' : 'bg-(--color-error-bg)'
                  }`}>
                    {getTransactionIcon(tx.points)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {tx.description || tx.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    <p className="text-sm text-(--color-text-muted)">
                      {new Date(tx.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${tx.points > 0 ? 'text-(--brand-primary)' : 'text-(--color-error)'}`}>
                    {tx.points > 0 ? '+' : ''}{tx.points.toLocaleString()} pts
                  </p>
                  <p className="text-sm text-(--color-text-muted)">
                    Balance: {tx.balance_after.toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-background rounded-xl">
              <Clock className="w-12 h-12 text-(--color-text-disabled) mx-auto mb-4" />
              <h3 className="font-medium text-foreground mb-1">No transactions yet</h3>
              <p className="text-sm text-(--color-text-muted)">Your points history will appear here</p>
            </div>
          )}
        </div>
      )}

      {/* Benefits */}
      {data?.currentTier?.benefits && data.currentTier.benefits.length > 0 && (
        <div className="bg-(--color-surface) rounded-xl border border-(--color-border) p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-(--brand-primary)" />
            Your {data.currentTier.name} Benefits
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.currentTier.benefits.map((benefit, index) => (
              <li key={index} className="flex items-center gap-2 text-(--color-text-secondary)">
                <ChevronRight className="w-4 h-4 text-(--brand-primary)" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
