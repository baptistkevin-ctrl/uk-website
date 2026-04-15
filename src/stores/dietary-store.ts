import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type DietType =
  | 'none'
  | 'vegetarian'
  | 'vegan'
  | 'pescatarian'
  | 'keto'
  | 'paleo'

export type Allergy =
  | 'nuts'
  | 'dairy'
  | 'gluten'
  | 'eggs'
  | 'soy'
  | 'shellfish'
  | 'sesame'
  | 'celery'
  | 'mustard'
  | 'sulphites'
  | 'fish'
  | 'lupin'

export type Preference =
  | 'organic'
  | 'halal'
  | 'kosher'
  | 'low-sugar'
  | 'low-salt'
  | 'high-protein'
  | 'locally-sourced'
  | 'palm-oil-free'

export interface DietaryProfile {
  dietType: DietType
  allergies: Allergy[]
  intolerances: string[]
  preferences: Preference[]
  avoidIngredients: string[]
  householdSize: number
  isActive: boolean
}

interface ProductCheckInput {
  is_vegan?: boolean
  is_vegetarian?: boolean
  is_gluten_free?: boolean
  is_organic?: boolean
  allergens?: string | null
  name?: string
}

export interface DietaryWarning {
  type: 'allergy' | 'diet' | 'preference'
  message: string
}

interface DietaryStore extends DietaryProfile {
  setProfile: (profile: Partial<DietaryProfile>) => void
  toggleActive: () => void
  addAllergy: (allergy: Allergy) => void
  removeAllergy: (allergy: Allergy) => void
  addPreference: (preference: Preference) => void
  removePreference: (preference: Preference) => void
  reset: () => void
  isProductSafe: (product: ProductCheckInput) => {
    safe: boolean
    warnings: DietaryWarning[]
  }
}

const defaultProfile: DietaryProfile = {
  dietType: 'none',
  allergies: [],
  intolerances: [],
  preferences: [],
  avoidIngredients: [],
  householdSize: 1,
  isActive: false,
}

export const useDietaryStore = create<DietaryStore>()(
  persist(
    (set, get) => ({
      ...defaultProfile,

      setProfile: (profile) => {
        set((state) => ({ ...state, ...profile }))
      },

      toggleActive: () => {
        set((state) => ({ isActive: !state.isActive }))
      },

      addAllergy: (allergy) => {
        set((state) => ({
          allergies: state.allergies.includes(allergy)
            ? state.allergies
            : [...state.allergies, allergy],
        }))
      },

      removeAllergy: (allergy) => {
        set((state) => ({
          allergies: state.allergies.filter((a) => a !== allergy),
        }))
      },

      addPreference: (preference) => {
        set((state) => ({
          preferences: state.preferences.includes(preference)
            ? state.preferences
            : [...state.preferences, preference],
        }))
      },

      removePreference: (preference) => {
        set((state) => ({
          preferences: state.preferences.filter((p) => p !== preference),
        }))
      },

      reset: () => {
        set(defaultProfile)
      },

      isProductSafe: (product) => {
        const state = get()
        const warnings: DietaryWarning[] = []

        if (!state.isActive) {
          return { safe: true, warnings: [] }
        }

        if (state.dietType === 'vegan' && product.is_vegan === false) {
          warnings.push({
            type: 'diet',
            message: 'Not suitable for vegans',
          })
        }

        if (
          (state.dietType === 'vegetarian' || state.dietType === 'vegan') &&
          product.is_vegetarian === false
        ) {
          warnings.push({
            type: 'diet',
            message: 'Not suitable for vegetarians',
          })
        }

        if (
          state.allergies.includes('gluten') &&
          product.is_gluten_free === false
        ) {
          warnings.push({
            type: 'allergy',
            message: 'May contain gluten',
          })
        }

        if (product.allergens) {
          const allergenStr = product.allergens.toLowerCase()
          for (const allergy of state.allergies) {
            if (allergenStr.includes(allergy)) {
              warnings.push({
                type: 'allergy',
                message: `Contains ${allergy}`,
              })
            }
          }
        }

        if (
          state.preferences.includes('organic') &&
          product.is_organic === false
        ) {
          warnings.push({
            type: 'preference',
            message: 'Not certified organic',
          })
        }

        return {
          safe: warnings.length === 0,
          warnings,
        }
      },
    }),
    {
      name: 'dietary-profile-storage',
      partialize: (state) => ({
        dietType: state.dietType,
        allergies: state.allergies,
        intolerances: state.intolerances,
        preferences: state.preferences,
        avoidIngredients: state.avoidIngredients,
        householdSize: state.householdSize,
        isActive: state.isActive,
      }),
    }
  )
)
