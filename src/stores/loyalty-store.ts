import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { LoyaltyLevel, Badge, Challenge, Charity, StreakData } from "@/lib/loyalty/gamification-engine"

interface BadgeState {
  badge: Badge
  unlockedAt: string | null
  progress: number
}

interface ChallengeState {
  challenge: Challenge
  progress: number
  completed: boolean
}

interface GamificationStats {
  totalOrders: number
  totalSpent: number
  reviewCount: number
  referralCount: number
  organicCount: number
}

interface LoyaltyGameStore {
  // State
  xp: number
  level: LoyaltyLevel | null
  levels: LoyaltyLevel[]
  xpProgress: { current: number; nextLevel: number; percentage: number }
  streak: StreakData
  badges: BadgeState[]
  challenges: ChallengeState[]
  charityTotal: number
  selectedCharity: string | null
  charities: Charity[]
  roundUpEnabled: boolean
  stats: GamificationStats | null
  isLoading: boolean
  error: string | null
  lastFetched: number | null

  // Actions
  fetchGamificationState: () => Promise<void>
  setCharity: (charityId: string | null) => void
  toggleRoundUp: () => void
}

export const useLoyaltyGameStore = create<LoyaltyGameStore>()(
  persist(
    (set, get) => ({
      // Initial state
      xp: 0,
      level: null,
      levels: [],
      xpProgress: { current: 0, nextLevel: 200, percentage: 0 },
      streak: { current: 0, best: 0, lastOrderDate: null },
      badges: [],
      challenges: [],
      charityTotal: 0,
      selectedCharity: null,
      charities: [],
      roundUpEnabled: false,
      stats: null,
      isLoading: false,
      error: null,
      lastFetched: null,

      fetchGamificationState: async () => {
        // Debounce: skip if fetched within last 30 seconds
        const now = Date.now()
        const { lastFetched, isLoading } = get()
        if (isLoading) return
        if (lastFetched && now - lastFetched < 30_000) return

        set({ isLoading: true, error: null })

        try {
          const res = await fetch("/api/loyalty/gamification", {
            credentials: "include",
          })

          if (!res.ok) {
            const err = await res.json().catch(() => ({ message: "Request failed" }))
            throw new Error(err.message ?? `HTTP ${res.status}`)
          }

          const data = await res.json()

          set({
            xp: data.xp,
            level: data.level,
            levels: data.levels ?? [],
            xpProgress: data.xpProgress,
            streak: data.streak,
            badges: data.badges,
            challenges: data.challenges,
            charityTotal: data.charityTotal,
            selectedCharity: data.selectedCharity ?? get().selectedCharity,
            charities: data.charities ?? [],
            stats: data.stats,
            isLoading: false,
            lastFetched: Date.now(),
          })
        } catch (err) {
          set({
            isLoading: false,
            error: err instanceof Error ? err.message : "Unknown error",
          })
        }
      },

      setCharity: (charityId: string | null) => {
        set({ selectedCharity: charityId })
      },

      toggleRoundUp: () => {
        set(state => ({ roundUpEnabled: !state.roundUpEnabled }))
      },
    }),
    {
      name: "uk-loyalty-game",
      partialize: (state) => ({
        selectedCharity: state.selectedCharity,
        roundUpEnabled: state.roundUpEnabled,
      }),
    }
  )
)
