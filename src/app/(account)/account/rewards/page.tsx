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
        alert('Points redeemed successfully! Your reward has been applied.')
        fetchData()
      } else {
        alert(result.error || 'Failed to redeem points')
      }
    } catch (error) {
      console.error('Error redeeming points:', error)
      alert('Failed to redeem points')
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
      return <ArrowUpRight className="w-4 h-4 text-emerald-600" />
    }
    return <ArrowDownRight className="w-4 h-4 text-red-600" />
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-48 mb-2" />
          <div className="h-4 bg-slate-200 rounded w-64" />
        </div>
        <div className="h-48 bg-slate-200 rounded-xl animate-pulse" />
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
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Award className="w-7 h-7 text-amber-500" />
          Rewards & Points
        </h1>
        <p className="text-slate-500 mt-1">
          Earn points on every purchase and redeem for rewards
        </p>
      </div>

      {/* Current Status Card */}
      <div
        className="rounded-2xl p-6 md:p-8 text-white relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${data?.currentTier?.color || '#059669'} 0%, ${data?.currentTier?.color || '#059669'}99 100%)` }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
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
              <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
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
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-4">
          <Clock className="w-6 h-6 text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-amber-800">
              {data.account.points_expiring_soon.toLocaleString()} points expiring soon
            </p>
            <p className="text-sm text-amber-600">
              Use them before {data.account.next_expiry_date ? new Date(data.account.next_expiry_date).toLocaleDateString('en-GB') : 'they expire'}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('earn')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'earn'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline-block mr-2" />
            How to Earn
          </button>
          <button
            onClick={() => setActiveTab('redeem')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'redeem'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Gift className="w-4 h-4 inline-block mr-2" />
            Redeem Rewards
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
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
                className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Star className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{rule.name}</h3>
                  <p className="text-sm text-slate-500">
                    {rule.points_per_pound > 0
                      ? `${rule.points_per_pound} point${rule.points_per_pound > 1 ? 's' : ''} per £1 spent`
                      : `+${rule.fixed_points} points`}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-amber-600 font-bold">
                    +{rule.points_per_pound > 0 ? `${rule.points_per_pound}/£` : rule.fixed_points}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Tiers Overview */}
          <div className="bg-slate-50 rounded-xl p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Membership Tiers</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {data?.tiers?.map((tier) => {
                const isCurrentTier = tier.id === data.currentTier?.id
                const isLocked = tier.min_points > data.account.lifetime_points

                return (
                  <div
                    key={tier.id}
                    className={`rounded-xl p-4 border-2 transition-all ${
                      isCurrentTier
                        ? 'border-amber-400 bg-amber-50'
                        : isLocked
                        ? 'border-slate-200 bg-white opacity-60'
                        : 'border-slate-200 bg-white'
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
                        <h4 className="font-semibold text-slate-900">{tier.name}</h4>
                        {isCurrentTier && (
                          <span className="text-xs text-amber-600">Current</span>
                        )}
                      </div>
                      {isLocked && <Lock className="w-4 h-4 text-slate-400 ml-auto" />}
                    </div>
                    <p className="text-sm text-slate-500 mb-2">
                      {tier.min_points.toLocaleString()}+ points
                    </p>
                    <p className="text-sm font-medium text-slate-700">
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
                  className={`bg-white rounded-xl border p-5 flex items-center gap-4 ${
                    canRedeem ? 'border-slate-200' : 'border-slate-100 opacity-60'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    canRedeem ? 'bg-emerald-100' : 'bg-slate-100'
                  }`}>
                    <Gift className={`w-6 h-6 ${canRedeem ? 'text-emerald-600' : 'text-slate-400'}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{rule.name}</h3>
                    <p className="text-sm text-slate-500">
                      {rule.min_order_pence > 0 && `Min order: ${formatPrice(rule.min_order_pence)}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{rule.points_required.toLocaleString()} pts</p>
                    <button
                      onClick={() => canRedeem && handleRedeem(rule.id)}
                      disabled={!canRedeem || redeeming === rule.id}
                      className={`mt-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        canRedeem
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {redeeming === rule.id ? 'Redeeming...' : canRedeem ? 'Redeem' : 'Not enough points'}
                    </button>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-xl">
              <Gift className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-medium text-slate-900 mb-1">No rewards available</h3>
              <p className="text-sm text-slate-500">Check back later for redemption options</p>
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
                className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.points > 0 ? 'bg-emerald-100' : 'bg-red-100'
                  }`}>
                    {getTransactionIcon(tx.points)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {tx.description || tx.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    <p className="text-sm text-slate-500">
                      {new Date(tx.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${tx.points > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {tx.points > 0 ? '+' : ''}{tx.points.toLocaleString()} pts
                  </p>
                  <p className="text-sm text-slate-500">
                    Balance: {tx.balance_after.toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-xl">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-medium text-slate-900 mb-1">No transactions yet</h3>
              <p className="text-sm text-slate-500">Your points history will appear here</p>
            </div>
          )}
        </div>
      )}

      {/* Benefits */}
      {data?.currentTier?.benefits && data.currentTier.benefits.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            Your {data.currentTier.name} Benefits
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.currentTier.benefits.map((benefit, index) => (
              <li key={index} className="flex items-center gap-2 text-slate-600">
                <ChevronRight className="w-4 h-4 text-emerald-600" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
