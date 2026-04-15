"use client"

import { useCallback } from "react"
import {
  Leaf,
  Fish,
  Flame,
  Mountain,
  AlertTriangle,
  Ban,
  Users,
  Minus,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { useDietary } from "@/hooks/use-dietary"
import type { DietType, Allergy, Preference } from "@/stores/dietary-store"

interface DietaryProfileSetupProps {
  onComplete?: () => void
  compact?: boolean
}

const DIET_OPTIONS: {
  value: DietType
  label: string
  description: string
  icon: typeof Leaf
  color: string
}[] = [
  {
    value: "none",
    label: "None",
    description: "No restrictions",
    icon: Ban,
    color: "text-(--color-text-muted)",
  },
  {
    value: "vegetarian",
    label: "Vegetarian",
    description: "No meat or fish",
    icon: Leaf,
    color: "text-emerald-500",
  },
  {
    value: "vegan",
    label: "Vegan",
    description: "No animal products",
    icon: Leaf,
    color: "text-green-700",
  },
  {
    value: "pescatarian",
    label: "Pescatarian",
    description: "Fish but no meat",
    icon: Fish,
    color: "text-blue-500",
  },
  {
    value: "keto",
    label: "Keto",
    description: "Low carb, high fat",
    icon: Flame,
    color: "text-orange-500",
  },
  {
    value: "paleo",
    label: "Paleo",
    description: "Whole foods only",
    icon: Mountain,
    color: "text-amber-700",
  },
]

const ALLERGY_OPTIONS: { value: Allergy; label: string }[] = [
  { value: "nuts", label: "Nuts" },
  { value: "dairy", label: "Dairy" },
  { value: "gluten", label: "Gluten" },
  { value: "eggs", label: "Eggs" },
  { value: "soy", label: "Soy" },
  { value: "shellfish", label: "Shellfish" },
  { value: "sesame", label: "Sesame" },
  { value: "celery", label: "Celery" },
  { value: "mustard", label: "Mustard" },
  { value: "sulphites", label: "Sulphites" },
  { value: "fish", label: "Fish" },
  { value: "lupin", label: "Lupin" },
]

const PREFERENCE_OPTIONS: { value: Preference; label: string }[] = [
  { value: "organic", label: "Organic Only" },
  { value: "halal", label: "Halal" },
  { value: "kosher", label: "Kosher" },
  { value: "low-sugar", label: "Low Sugar" },
  { value: "low-salt", label: "Low Salt" },
  { value: "high-protein", label: "High Protein" },
  { value: "locally-sourced", label: "Locally Sourced" },
  { value: "palm-oil-free", label: "Palm Oil Free" },
]

export function DietaryProfileSetup({
  onComplete,
  compact = false,
}: DietaryProfileSetupProps) {
  const {
    dietType,
    allergies,
    preferences,
    householdSize,
    isActive,
    setProfile,
    toggleActive,
    addAllergy,
    removeAllergy,
    addPreference,
    removePreference,
    saveProfile,
    isLoggedIn,
  } = useDietary()

  const handleAllergyToggle = useCallback(
    (allergy: Allergy) => {
      if (allergies.includes(allergy)) {
        removeAllergy(allergy)
      } else {
        addAllergy(allergy)
      }
    },
    [allergies, addAllergy, removeAllergy]
  )

  const handlePreferenceToggle = useCallback(
    (preference: Preference) => {
      if (preferences.includes(preference)) {
        removePreference(preference)
      } else {
        addPreference(preference)
      }
    },
    [preferences, addPreference, removePreference]
  )

  const handleHouseholdChange = useCallback(
    (delta: number) => {
      const next = Math.min(10, Math.max(1, householdSize + delta))
      setProfile({ householdSize: next })
    },
    [householdSize, setProfile]
  )

  const handleSave = useCallback(async () => {
    await saveProfile()
    onComplete?.()
  }, [saveProfile, onComplete])

  return (
    <div
      className={cn(
        "rounded-2xl border border-(--color-border) bg-(--color-surface)",
        compact ? "p-4" : "p-6 lg:p-8"
      )}
    >
      {/* Master Toggle */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">
            Enable Dietary Filtering
          </h2>
          {!isActive && (
            <p className="mt-1 text-sm text-(--color-text-secondary)">
              Turn on to filter products based on your dietary needs
            </p>
          )}
        </div>
        <Switch
          checked={isActive}
          onCheckedChange={toggleActive}
          className="data-[state=checked]:bg-(--brand-primary)"
        />
      </div>

      {isActive && (
        <div className={cn("mt-6 space-y-8", compact && "mt-4 space-y-6")}>
          {/* Section 1: Diet Type */}
          <section>
            <h3 className="font-display text-base font-semibold text-foreground">
              What best describes your diet?
            </h3>
            <div
              className={cn(
                "mt-3 grid gap-3",
                compact ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3"
              )}
            >
              {DIET_OPTIONS.map((option) => {
                const Icon = option.icon
                const isSelected = dietType === option.value

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setProfile({ dietType: option.value })}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all duration-200",
                      isSelected
                        ? "border-(--brand-primary) bg-(--brand-primary)/5 shadow-(--shadow-sm)"
                        : "border-(--color-border) hover:border-(--color-text-muted)"
                    )}
                  >
                    <Icon
                      className={cn("h-6 w-6", option.color)}
                      strokeWidth={isSelected ? 2.5 : 2}
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {option.label}
                      </p>
                      <p className="text-xs text-(--color-text-muted)">
                        {option.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Section 2: Allergies */}
          <section>
            <h3 className="font-display text-base font-semibold text-foreground">
              Do you have any allergies?
            </h3>
            <p className="mt-1 text-xs text-(--color-text-muted)">
              Products containing these allergens will be flagged
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {ALLERGY_OPTIONS.map((option) => {
                const isSelected = allergies.includes(option.value)

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleAllergyToggle(option.value)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isSelected
                        ? "bg-(--color-error) text-white shadow-(--shadow-sm)"
                        : "border border-(--color-border) bg-(--color-elevated) text-foreground hover:border-(--color-text-muted)"
                    )}
                  >
                    {isSelected && <AlertTriangle className="h-3 w-3" />}
                    {option.label}
                  </button>
                )
              })}
            </div>
          </section>

          {/* Section 3: Preferences */}
          <section>
            <h3 className="font-display text-base font-semibold text-foreground">
              Any other preferences?
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {PREFERENCE_OPTIONS.map((option) => {
                const isSelected = preferences.includes(option.value)

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handlePreferenceToggle(option.value)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isSelected
                        ? "bg-(--brand-primary) text-white shadow-(--shadow-sm)"
                        : "border border-(--color-border) bg-(--color-elevated) text-foreground hover:border-(--color-text-muted)"
                    )}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </section>

          {/* Section 4: Household Size */}
          <section>
            <h3 className="font-display text-base font-semibold text-foreground">
              Household size
            </h3>
            <p className="mt-1 text-xs text-(--color-text-muted)">
              Used for recipe serving adjustments
            </p>
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleHouseholdChange(-1)}
                disabled={householdSize <= 1}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg border border-(--color-border) transition-colors",
                  householdSize <= 1
                    ? "cursor-not-allowed opacity-40"
                    : "hover:bg-(--color-elevated)"
                )}
              >
                <Minus className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-(--color-text-muted)" />
                <span className="min-w-[2ch] text-center text-lg font-semibold text-foreground">
                  {householdSize}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleHouseholdChange(1)}
                disabled={householdSize >= 10}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg border border-(--color-border) transition-colors",
                  householdSize >= 10
                    ? "cursor-not-allowed opacity-40"
                    : "hover:bg-(--color-elevated)"
                )}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </section>

          {/* Save */}
          <div className="border-t border-(--color-border) pt-6">
            {isLoggedIn ? (
              <button
                type="button"
                onClick={handleSave}
                className={cn(
                  "w-full rounded-lg bg-(--brand-amber) px-6 py-3 text-sm font-semibold text-white transition-colors",
                  "hover:bg-(--brand-amber-hover) focus:outline-none focus:ring-2 focus:ring-(--brand-amber) focus:ring-offset-2"
                )}
              >
                Save Preferences
              </button>
            ) : (
              <p className="text-center text-sm text-(--color-text-muted)">
                Preferences saved locally on this device
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
