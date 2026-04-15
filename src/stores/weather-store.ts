import { create } from "zustand"
import type { WeatherState, WeatherPromotion } from "@/lib/weather/weather-engine"

const STALE_AFTER_MS = 30 * 60_000 // 30 minutes

interface WeatherStore {
  weather: WeatherState | null
  promotions: WeatherPromotion[]
  products: Record<string, unknown[]>
  lastFetched: number | null
  isLoading: boolean
  fetchWeather: () => Promise<void>
  isStale: () => boolean
}

export const useWeatherStore = create<WeatherStore>()((set, get) => ({
  weather: null,
  promotions: [],
  products: {},
  lastFetched: null,
  isLoading: false,

  isStale() {
    const { lastFetched } = get()
    if (!lastFetched) return true
    return Date.now() - lastFetched > STALE_AFTER_MS
  },

  async fetchWeather() {
    const state = get()

    // Skip if data is fresh
    if (!state.isStale() && state.weather) return
    // Prevent concurrent fetches
    if (state.isLoading) return

    set({ isLoading: true })

    try {
      const res = await fetch("/api/weather")

      if (!res.ok) {
        throw new Error(`Weather API responded with ${res.status}`)
      }

      const data = await res.json()

      set({
        weather: data.weather,
        promotions: data.promotions,
        products: data.products,
        lastFetched: Date.now(),
        isLoading: false,
      })
    } catch {
      set({ isLoading: false })
    }
  },
}))
