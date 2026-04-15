'use client'

import { useCallback } from 'react'
import { useDietaryStore } from '@/stores/dietary-store'
import type { DietaryProfile } from '@/stores/dietary-store'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'

export function useDietary() {
  const store = useDietaryStore()
  const { user } = useAuth()

  const saveProfile = useCallback(
    async (profile?: Partial<DietaryProfile>) => {
      if (profile) {
        store.setProfile(profile)
      }

      if (!user) return

      const supabase = createClient()
      const currentProfile: DietaryProfile = {
        dietType: profile?.dietType ?? store.dietType,
        allergies: profile?.allergies ?? store.allergies,
        intolerances: profile?.intolerances ?? store.intolerances,
        preferences: profile?.preferences ?? store.preferences,
        avoidIngredients: profile?.avoidIngredients ?? store.avoidIngredients,
        householdSize: profile?.householdSize ?? store.householdSize,
        isActive: profile?.isActive ?? store.isActive,
      }

      await supabase
        .from('dietary_profiles')
        .upsert(
          {
            user_id: user.id,
            ...currentProfile,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
    },
    [user, store]
  )

  return {
    ...store,
    saveProfile,
    isLoggedIn: !!user,
  }
}
