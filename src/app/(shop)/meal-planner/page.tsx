'use client'

import { useState, useMemo, useCallback, Fragment } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Calendar,
  ShoppingCart,
  Flame,
  Clock,
  Users,
  Trash2,
  Check,
  UtensilsCrossed,
  Minus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Container } from '@/components/layout/Container'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { RECIPES, type Recipe } from '@/data/recipes'
import {
  useMealPlannerStore,
  DAYS,
  MEALS,
  type DayOfWeek,
  type MealType,
} from '@/stores/meal-planner-store'
import { useCart } from '@/hooks/use-cart'

/* ──────────────────────────────────────────────
   Constants
   ────────────────────────────────────────────── */

const BREADCRUMB_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Meal Planner' },
]

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
}

const DAY_SHORT: Record<DayOfWeek, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
}

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}

const CATEGORY_FILTERS = [
  'All',
  'Quick Meals',
  'Healthy',
  'Family Dinner',
  'Comfort Food',
  'Budget Friendly',
  'Breakfast',
] as const

const INGREDIENT_CATEGORIES_ORDER = [
  'Fresh Produce',
  'Meat',
  'Dairy',
  'Pantry',
]

const CALORIE_TARGET = 2000

/* ──────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────── */

function getWeekDates(weekStartDate: string): { start: Date; end: Date } {
  const start = new Date(weekStartDate)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return { start, end }
}

function formatWeekRange(weekStartDate: string): string {
  const { start, end } = getWeekDates(weekStartDate)
  const startDay = start.getDate()
  const endDay = end.getDate()
  const month = end.toLocaleDateString('en-GB', { month: 'short' })
  const year = end.getFullYear()
  return `Mon ${startDay} - Sun ${endDay} ${month} ${year}`
}

function shiftWeek(weekStartDate: string, direction: number): string {
  const date = new Date(weekStartDate)
  date.setDate(date.getDate() + direction * 7)
  return date.toISOString().split('T')[0]
}

/* ──────────────────────────────────────────────
   Recipe Picker Modal
   ────────────────────────────────────────────── */

function RecipePickerModal({
  isOpen,
  onClose,
  onSelect,
  defaultServings,
}: {
  isOpen: boolean
  onClose: () => void
  onSelect: (recipe: Recipe, servings: number) => void
  defaultServings: number
}) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [servings, setServings] = useState(defaultServings)

  const filtered = useMemo(() => {
    let result = [...RECIPES]
    if (category !== 'All') {
      result = result.filter((r) =>
        r.categories.some((c) => c.toLowerCase() === category.toLowerCase()),
      )
    }
    if (search.trim()) {
      const term = search.toLowerCase()
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(term) ||
          r.cuisine.toLowerCase().includes(term) ||
          r.categories.some((c) => c.toLowerCase().includes(term)),
      )
    }
    return result
  }, [search, category])

  function handleConfirm() {
    if (selectedRecipe) {
      onSelect(selectedRecipe, servings)
      handleClose()
    }
  }

  function handleClose() {
    setSearch('')
    setCategory('All')
    setSelectedRecipe(null)
    setServings(defaultServings)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={cn(
          'relative w-full max-w-2xl max-h-[85vh] flex flex-col',
          'bg-(--color-surface) rounded-2xl border border-(--color-border)',
          'shadow-(--shadow-md) overflow-hidden',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-(--color-border)">
          <h3 className="text-lg font-semibold text-(--color-text)">
            {selectedRecipe ? 'Confirm Recipe' : 'Choose a Recipe'}
          </h3>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-(--color-elevated) text-(--color-text-muted) hover:text-(--color-text) transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {selectedRecipe ? (
          /* ── Confirm view ── */
          <div className="p-5 space-y-5">
            <div className="flex gap-4">
              <div className="relative w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-(--color-elevated)">
                <Image
                  src={selectedRecipe.imageUrl}
                  alt={selectedRecipe.title}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-semibold text-(--color-text) truncate">
                  {selectedRecipe.title}
                </h4>
                <p className="text-sm text-(--color-text-muted) mt-0.5">
                  {selectedRecipe.cuisine} &middot;{' '}
                  {selectedRecipe.prepTime + selectedRecipe.cookTime} min
                </p>
                <p className="text-sm text-(--color-text-secondary) mt-1">
                  {Math.round(
                    (selectedRecipe.calories / selectedRecipe.servings) *
                      servings,
                  )}{' '}
                  kcal total
                </p>
              </div>
            </div>

            {/* Servings adjuster */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-(--color-text-secondary)">
                Servings
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setServings(Math.max(1, servings - 1))}
                  disabled={servings <= 1}
                  className={cn(
                    'w-8 h-8 flex items-center justify-center rounded-lg',
                    'border border-(--color-border) text-(--color-text-secondary)',
                    'hover:bg-(--color-elevated) transition-colors',
                    'disabled:opacity-40 disabled:cursor-not-allowed',
                  )}
                >
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center font-semibold text-(--color-text)">
                  {servings}
                </span>
                <button
                  onClick={() => setServings(Math.min(12, servings + 1))}
                  disabled={servings >= 12}
                  className={cn(
                    'w-8 h-8 flex items-center justify-center rounded-lg',
                    'border border-(--color-border) text-(--color-text-secondary)',
                    'hover:bg-(--color-elevated) transition-colors',
                    'disabled:opacity-40 disabled:cursor-not-allowed',
                  )}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedRecipe(null)}
                className={cn(
                  'flex-1 py-2.5 rounded-lg text-sm font-medium',
                  'border border-(--color-border) text-(--color-text-secondary)',
                  'hover:bg-(--color-elevated) transition-colors',
                )}
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                className={cn(
                  'flex-1 py-2.5 rounded-lg text-sm font-semibold',
                  'bg-(--brand-amber) text-white',
                  'hover:bg-(--brand-amber-hover) transition-colors',
                  'shadow-(--shadow-amber)',
                )}
              >
                Add to Plan
              </button>
            </div>
          </div>
        ) : (
          /* ── Browse view ── */
          <>
            {/* Search */}
            <div className="p-4 border-b border-(--color-border) space-y-3">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-text-muted)"
                />
                <input
                  type="text"
                  placeholder="Search recipes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={cn(
                    'w-full pl-10 pr-4 py-2.5 rounded-lg',
                    'bg-(--color-elevated) border border-(--color-border)',
                    'text-sm text-(--color-text) placeholder:text-(--color-text-muted)',
                    'focus:outline-none focus:ring-2 focus:ring-(--brand-amber)/40 focus:border-(--brand-amber)',
                    'transition-colors',
                  )}
                />
              </div>

              {/* Category pills */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {CATEGORY_FILTERS.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
                      cat === category
                        ? 'bg-(--brand-amber) text-white'
                        : 'bg-(--color-elevated) text-(--color-text-secondary) hover:text-(--color-text)',
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Recipe list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filtered.length === 0 ? (
                <div className="py-12 text-center text-(--color-text-muted) text-sm">
                  No recipes match your search
                </div>
              ) : (
                filtered.map((recipe) => {
                  const totalTime = recipe.prepTime + recipe.cookTime
                  return (
                    <button
                      key={recipe.id}
                      onClick={() => {
                        setSelectedRecipe(recipe)
                        setServings(defaultServings)
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-lg',
                        'text-left hover:bg-(--color-elevated) transition-colors',
                      )}
                    >
                      <div className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-(--color-elevated)">
                        <Image
                          src={recipe.imageUrl}
                          alt={recipe.title}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-(--color-text) truncate">
                          {recipe.title}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-(--color-text-muted)">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {totalTime}m
                          </span>
                          <span className="flex items-center gap-1">
                            <Flame size={12} />
                            {recipe.calories} kcal
                          </span>
                          <span
                            className={cn(
                              'font-medium',
                              recipe.difficulty === 'Easy' &&
                                'text-(--color-success)',
                              recipe.difficulty === 'Medium' &&
                                'text-(--brand-amber)',
                              recipe.difficulty === 'Hard' &&
                                'text-(--color-warning)',
                            )}
                          >
                            {recipe.difficulty}
                          </span>
                        </div>
                      </div>
                      <ChevronRight
                        size={16}
                        className="shrink-0 text-(--color-text-muted)"
                      />
                    </button>
                  )
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────
   Meal Cell (Desktop)
   ────────────────────────────────────────────── */

function MealCell({
  day,
  meal,
  onAdd,
}: {
  day: DayOfWeek
  meal: MealType
  onAdd: (day: DayOfWeek, meal: MealType) => void
}) {
  const planned = useMealPlannerStore((s) => s.plan[day][meal])
  const removeMeal = useMealPlannerStore((s) => s.removeMeal)

  if (!planned) {
    return (
      <button
        onClick={() => onAdd(day, meal)}
        className={cn(
          'w-full min-h-[90px] rounded-lg',
          'border border-dashed border-(--color-border)',
          'flex flex-col items-center justify-center gap-1.5',
          'text-(--color-text-muted) hover:text-(--brand-amber)',
          'hover:border-(--brand-amber)/50 hover:bg-(--brand-amber)/5',
          'transition-all duration-200 cursor-pointer group',
        )}
      >
        <Plus
          size={18}
          className="opacity-60 group-hover:opacity-100 transition-opacity"
        />
        <span className="text-[11px] font-medium">Add meal</span>
      </button>
    )
  }

  return (
    <div
      className={cn(
        'relative w-full min-h-[90px] rounded-lg',
        'border border-(--color-border) bg-(--color-elevated)',
        'overflow-hidden group cursor-pointer',
      )}
      onClick={() => onAdd(day, meal)}
    >
      {/* Remove button on hover */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          removeMeal(day, meal)
        }}
        className={cn(
          'absolute top-1.5 right-1.5 z-10',
          'w-5 h-5 flex items-center justify-center rounded-full',
          'bg-black/60 text-white opacity-0 group-hover:opacity-100',
          'hover:bg-(--color-error) transition-all duration-150',
        )}
      >
        <X size={12} />
      </button>

      <div className="relative w-full h-12">
        <Image
          src={planned.recipeImage}
          alt={planned.recipeTitle}
          fill
          className="object-cover"
          sizes="180px"
        />
      </div>
      <div className="p-1.5">
        <p className="text-[11px] font-medium text-(--color-text) leading-tight line-clamp-2">
          {planned.recipeTitle}
        </p>
        <p className="text-[11px] text-(--color-text-muted) mt-0.5">
          {planned.calories} kcal
        </p>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────
   Day Accordion (Mobile)
   ────────────────────────────────────────────── */

function DayAccordion({
  day,
  onAdd,
}: {
  day: DayOfWeek
  onAdd: (day: DayOfWeek, meal: MealType) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dayPlan = useMealPlannerStore((s) => s.plan[day])
  const getDayCalories = useMealPlannerStore((s) => s.getDayCalories)
  const removeMeal = useMealPlannerStore((s) => s.removeMeal)

  const mealCount = MEALS.filter((m) => dayPlan[m] !== null).length
  const calories = getDayCalories(day)

  return (
    <div className="border border-(--color-border) rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between p-4',
          'bg-(--color-surface) hover:bg-(--color-elevated) transition-colors',
        )}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-(--color-text)">
            {DAY_LABELS[day]}
          </span>
          {mealCount > 0 && (
            <span className="text-xs bg-(--brand-amber)/15 text-(--brand-amber) px-2 py-0.5 rounded-full font-medium">
              {mealCount} meal{mealCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {calories > 0 && (
            <span className="text-xs text-(--color-text-muted)">
              {calories} kcal
            </span>
          )}
          <ChevronDown
            size={16}
            className={cn(
              'text-(--color-text-muted) transition-transform duration-200',
              isOpen && 'rotate-180',
            )}
          />
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-(--color-border) divide-y divide-(--color-border)">
          {MEALS.map((meal) => {
            const planned = dayPlan[meal]
            return (
              <div key={meal} className="p-3 flex items-center gap-3">
                <span className="text-xs font-medium text-(--color-text-muted) w-16 shrink-0">
                  {MEAL_LABELS[meal]}
                </span>

                {planned ? (
                  <div className="flex-1 flex items-center gap-3 min-w-0">
                    <div className="relative w-10 h-10 shrink-0 rounded-lg overflow-hidden bg-(--color-elevated)">
                      <Image
                        src={planned.recipeImage}
                        alt={planned.recipeTitle}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-(--color-text) truncate">
                        {planned.recipeTitle}
                      </p>
                      <p className="text-xs text-(--color-text-muted)">
                        {planned.calories} kcal &middot; {planned.servings}{' '}
                        serving{planned.servings !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => removeMeal(day, meal)}
                      className="p-1.5 rounded-lg text-(--color-text-muted) hover:text-(--color-error) hover:bg-(--color-error)/10 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => onAdd(day, meal)}
                    className={cn(
                      'flex-1 flex items-center gap-2 py-2 px-3',
                      'rounded-lg border border-dashed border-(--color-border)',
                      'text-xs text-(--color-text-muted) hover:text-(--brand-amber)',
                      'hover:border-(--brand-amber)/50 transition-colors',
                    )}
                  >
                    <Plus size={14} />
                    Add meal
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ──────────────────────────────────────────────
   Nutrition Summary
   ────────────────────────────────────────────── */

function NutritionSummary() {
  const plan = useMealPlannerStore((s) => s.plan)
  const getDayCalories = useMealPlannerStore((s) => s.getDayCalories)
  const getWeekNutrition = useMealPlannerStore((s) => s.getWeekNutrition)

  const nutrition = getWeekNutrition()
  const totalSlots = DAYS.length * MEALS.length

  const maxDayCalories = useMemo(() => {
    let max = CALORIE_TARGET
    for (const day of DAYS) {
      const cal = getDayCalories(day)
      if (cal > max) max = cal
    }
    return max
  }, [plan, getDayCalories])

  return (
    <div
      className={cn(
        'rounded-xl border border-(--color-border)',
        'bg-(--color-surface) p-5 space-y-5',
      )}
    >
      <h3 className="text-sm font-semibold text-(--color-text) uppercase tracking-wide">
        This Week&apos;s Nutrition
      </h3>

      {/* Total calories */}
      <div className="text-center py-3">
        <p className="text-3xl font-bold text-(--brand-amber)">
          {nutrition.calories.toLocaleString()}
        </p>
        <p className="text-xs text-(--color-text-muted) mt-1">
          Total calories
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-(--color-elevated) rounded-lg p-3 text-center">
          <p className="text-lg font-semibold text-(--color-text)">
            {nutrition.calories > 0
              ? Math.round(nutrition.calories / 7).toLocaleString()
              : 0}
          </p>
          <p className="text-[11px] text-(--color-text-muted)">Daily avg</p>
        </div>
        <div className="bg-(--color-elevated) rounded-lg p-3 text-center">
          <p className="text-lg font-semibold text-(--color-text)">
            {nutrition.mealsPlanned}
            <span className="text-sm text-(--color-text-muted) font-normal">
              /{totalSlots}
            </span>
          </p>
          <p className="text-[11px] text-(--color-text-muted)">Meals planned</p>
        </div>
      </div>

      {/* Per-day calorie bars */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-(--color-text-secondary)">
          Daily Breakdown
        </p>
        {DAYS.map((day) => {
          const cal = getDayCalories(day)
          const barPercent = maxDayCalories > 0 ? (cal / maxDayCalories) * 100 : 0
          const isOverTarget = cal > CALORIE_TARGET

          return (
            <div key={day} className="flex items-center gap-2">
              <span className="text-[11px] text-(--color-text-muted) w-8 shrink-0">
                {DAY_SHORT[day]}
              </span>
              <div className="flex-1 h-4 bg-(--color-elevated) rounded-full overflow-hidden relative">
                {/* Target line */}
                <div
                  className="absolute top-0 bottom-0 w-px bg-(--color-text-muted)/30 z-10"
                  style={{
                    left: `${(CALORIE_TARGET / maxDayCalories) * 100}%`,
                  }}
                />
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    cal === 0 && 'w-0',
                    isOverTarget
                      ? 'bg-(--color-warning)'
                      : 'bg-(--brand-amber)',
                  )}
                  style={{ width: `${barPercent}%` }}
                />
              </div>
              <span className="text-[11px] text-(--color-text-muted) w-12 text-right tabular-nums">
                {cal > 0 ? `${cal}` : '-'}
              </span>
            </div>
          )
        })}
        <p className="text-[11px] text-(--color-text-muted) text-right">
          Target: {CALORIE_TARGET.toLocaleString()} kcal/day
        </p>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────
   Shopping List Section
   ────────────────────────────────────────────── */

function ShoppingListSection() {
  const generateShoppingList = useMealPlannerStore(
    (s) => s.generateShoppingList,
  )
  const getMealCount = useMealPlannerStore((s) => s.getMealCount)
  const { addItem } = useCart()

  const shoppingList = useMemo(
    () => generateShoppingList(RECIPES),
    [generateShoppingList],
  )

  const [excluded, setExcluded] = useState<Set<string>>(new Set())
  const [addedToCart, setAddedToCart] = useState(false)

  const mealCount = getMealCount()

  function toggleItem(searchTerm: string) {
    setExcluded((prev) => {
      const next = new Set(prev)
      if (next.has(searchTerm)) {
        next.delete(searchTerm)
      } else {
        next.add(searchTerm)
      }
      return next
    })
  }

  const activeItems = shoppingList.items.filter(
    (item) => !excluded.has(item.searchTerm),
  )

  const groupedItems = useMemo(() => {
    const groups = new Map<string, typeof shoppingList.items>()

    for (const cat of INGREDIENT_CATEGORIES_ORDER) {
      groups.set(cat, [])
    }

    for (const item of shoppingList.items) {
      const existing = groups.get(item.category)
      if (existing) {
        existing.push(item)
      } else {
        groups.set(item.category, [item])
      }
    }

    return Array.from(groups.entries()).filter(([, items]) => items.length > 0)
  }, [shoppingList.items])

  function handleAddAllToCart() {
    for (const item of activeItems) {
      addItem({
        id: `meal-plan-${item.searchTerm}`,
        name: item.ingredientName,
        slug: item.searchTerm.replace(/\s+/g, '-'),
        price_pence: 0,
        image_url: null,
      })
    }
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 3000)
  }

  if (mealCount === 0) return null

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-(--color-text) font-display flex items-center gap-2">
            <ShoppingCart size={20} className="text-(--brand-amber)" />
            Shopping List
            <span className="text-sm font-normal text-(--color-text-muted)">
              ({shoppingList.totalIngredients} ingredient
              {shoppingList.totalIngredients !== 1 ? 's' : ''})
            </span>
          </h2>
          <p className="text-sm text-(--color-text-muted) mt-1">
            From {shoppingList.recipesUsed} recipe
            {shoppingList.recipesUsed !== 1 ? 's' : ''} in your plan
          </p>
        </div>

        <button
          onClick={handleAddAllToCart}
          disabled={activeItems.length === 0}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-lg',
            'text-sm font-semibold transition-all duration-200',
            addedToCart
              ? 'bg-(--color-success) text-white'
              : 'bg-(--brand-amber) text-white hover:bg-(--brand-amber-hover) shadow-(--shadow-amber)',
            'disabled:opacity-40 disabled:cursor-not-allowed',
          )}
        >
          {addedToCart ? (
            <>
              <Check size={16} />
              Added!
            </>
          ) : (
            <>
              <ShoppingCart size={16} />
              Add All to Cart
            </>
          )}
        </button>
      </div>

      {/* Grouped items */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {groupedItems.map(([category, items]) => (
          <div key={category}>
            <h4 className="text-xs font-semibold text-(--brand-amber) uppercase tracking-wider mb-3">
              {category}
            </h4>
            <div className="space-y-1.5">
              {items.map((item) => {
                const isExcluded = excluded.has(item.searchTerm)
                return (
                  <button
                    key={item.searchTerm}
                    onClick={() => toggleItem(item.searchTerm)}
                    className={cn(
                      'w-full flex items-center gap-2.5 p-2.5 rounded-lg',
                      'text-left transition-colors',
                      isExcluded
                        ? 'opacity-50 bg-transparent'
                        : 'bg-(--color-surface) hover:bg-(--color-elevated)',
                    )}
                  >
                    <div
                      className={cn(
                        'w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                        isExcluded
                          ? 'bg-(--color-text-muted)/20 border-(--color-text-muted)/30'
                          : 'border-(--brand-amber) bg-(--brand-amber)',
                      )}
                    >
                      {!isExcluded && <Check size={10} className="text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-sm text-(--color-text)',
                          isExcluded && 'line-through',
                        )}
                      >
                        {item.ingredientName}
                      </p>
                      <p className="text-[11px] text-(--color-text-muted)">
                        {item.totalQuantity}
                        {item.fromRecipes.length > 1 &&
                          ` (from ${item.fromRecipes.length} recipes)`}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ──────────────────────────────────────────────
   Empty State
   ────────────────────────────────────────────── */

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div
        className={cn(
          'w-20 h-20 rounded-full flex items-center justify-center',
          'bg-(--brand-amber)/10 text-(--brand-amber) mb-5',
        )}
      >
        <Calendar size={36} />
      </div>
      <h3 className="text-lg font-semibold text-(--color-text) mb-2">
        Start planning your week
      </h3>
      <p className="text-sm text-(--color-text-muted) max-w-sm mb-6">
        Browse recipes and add them to your meal plan. We&apos;ll generate a
        shopping list automatically.
      </p>
      <Link
        href="/recipes"
        className={cn(
          'inline-flex items-center gap-2 px-6 py-2.5 rounded-lg',
          'bg-(--brand-amber) text-white text-sm font-semibold',
          'hover:bg-(--brand-amber-hover) transition-colors',
          'shadow-(--shadow-amber)',
        )}
      >
        <UtensilsCrossed size={16} />
        Browse Recipes
      </Link>
    </div>
  )
}

/* ──────────────────────────────────────────────
   Main Page Component
   ────────────────────────────────────────────── */

export default function MealPlannerPage() {
  const {
    plan,
    householdSize,
    weekStartDate,
    assignMeal,
    clearWeek,
    setHouseholdSize,
    setWeekStartDate,
    getMealCount,
  } = useMealPlannerStore()

  const [pickerSlot, setPickerSlot] = useState<{
    day: DayOfWeek
    meal: MealType
  } | null>(null)

  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const mealCount = getMealCount()

  const handleOpenPicker = useCallback(
    (day: DayOfWeek, meal: MealType) => {
      setPickerSlot({ day, meal })
    },
    [],
  )

  function handleSelectRecipe(recipe: Recipe, servings: number) {
    if (pickerSlot) {
      assignMeal(pickerSlot.day, pickerSlot.meal, recipe, servings)
      setPickerSlot(null)
    }
  }

  function handleClearWeek() {
    clearWeek()
    setShowClearConfirm(false)
  }

  return (
    <main className="py-8 lg:py-12">
      <Container>
        {/* Breadcrumb */}
        <Breadcrumb items={BREADCRUMB_ITEMS} className="mb-6" />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-(--color-text) font-display">
            Weekly Meal Planner
          </h1>
          <p className="text-(--color-text-muted) mt-2 max-w-2xl">
            Plan your meals for the week and generate a shopping list in one
            click
          </p>
        </div>

        {/* Top Controls Bar */}
        <div
          className={cn(
            'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
            'p-4 rounded-xl bg-(--color-surface) border border-(--color-border)',
            'mb-8',
          )}
        >
          {/* Household size */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-(--color-text-secondary)">
              Cooking for
            </span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  onClick={() => setHouseholdSize(n)}
                  className={cn(
                    'w-8 h-8 rounded-lg text-sm font-medium transition-all duration-200',
                    n === householdSize
                      ? 'bg-(--brand-amber) text-white shadow-(--shadow-amber)'
                      : 'bg-(--color-elevated) text-(--color-text-secondary) hover:text-(--color-text) hover:bg-(--color-border)',
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Week navigator */}
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setWeekStartDate(shiftWeek(weekStartDate, -1))
              }
              className="p-2 rounded-lg text-(--color-text-muted) hover:text-(--color-text) hover:bg-(--color-elevated) transition-colors"
              aria-label="Previous week"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-medium text-(--color-text) min-w-[200px] text-center">
              {formatWeekRange(weekStartDate)}
            </span>
            <button
              onClick={() =>
                setWeekStartDate(shiftWeek(weekStartDate, 1))
              }
              className="p-2 rounded-lg text-(--color-text-muted) hover:text-(--color-text) hover:bg-(--color-elevated) transition-colors"
              aria-label="Next week"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Clear week */}
          <div className="relative">
            {showClearConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-(--color-text-muted)">
                  Clear all?
                </span>
                <button
                  onClick={handleClearWeek}
                  className="px-3 py-2.5 text-xs font-medium text-(--color-error) bg-(--color-error)/10 rounded-lg hover:bg-(--color-error)/20 transition-colors"
                >
                  Yes, clear
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-3 py-2.5 text-xs font-medium text-(--color-text-muted) hover:text-(--color-text) transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowClearConfirm(true)}
                disabled={mealCount === 0}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2.5 rounded-lg',
                  'text-xs font-medium text-(--color-text-muted)',
                  'hover:text-(--color-error) hover:bg-(--color-error)/10 transition-colors',
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                )}
              >
                <Trash2 size={14} />
                Clear Week
              </button>
            )}
          </div>
        </div>

        {mealCount === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Grid / Accordion area */}
            <div className="flex-1 min-w-0">
              {/* Desktop Grid */}
              <div className="hidden lg:block overflow-x-auto">
                <div className="min-w-[900px]">
                  {/* Column headers */}
                  <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-2 mb-2">
                    <div />
                    {DAYS.map((day) => (
                      <div key={day} className="text-center">
                        <p className="text-xs font-semibold text-(--color-text-secondary) uppercase tracking-wider">
                          {DAY_SHORT[day]}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Rows per meal */}
                  {MEALS.map((meal) => (
                    <div
                      key={meal}
                      className="grid grid-cols-[80px_repeat(7,1fr)] gap-2 mb-2"
                    >
                      <div className="flex items-center">
                        <span className="text-xs font-medium text-(--color-text-muted)">
                          {MEAL_LABELS[meal]}
                        </span>
                      </div>
                      {DAYS.map((day) => (
                        <MealCell
                          key={`${day}-${meal}`}
                          day={day}
                          meal={meal}
                          onAdd={handleOpenPicker}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile Accordion */}
              <div className="lg:hidden space-y-3">
                {DAYS.map((day) => (
                  <DayAccordion
                    key={day}
                    day={day}
                    onAdd={handleOpenPicker}
                  />
                ))}
              </div>
            </div>

            {/* Nutrition sidebar (desktop) */}
            <div className="hidden lg:block w-72 shrink-0">
              <div className="sticky top-24">
                <NutritionSummary />
              </div>
            </div>
          </div>
        )}

        {/* Mobile nutrition (below grid when meals exist) */}
        {mealCount > 0 && (
          <div className="lg:hidden mt-8">
            <NutritionSummary />
          </div>
        )}

        {/* Shopping List */}
        <ShoppingListSection />
      </Container>

      {/* Recipe Picker Modal */}
      <RecipePickerModal
        isOpen={pickerSlot !== null}
        onClose={() => setPickerSlot(null)}
        onSelect={handleSelectRecipe}
        defaultServings={householdSize}
      />
    </main>
  )
}
