'use client'

import { useState, useMemo, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Clock,
  Users,
  Flame,
  ShoppingBasket,
  Check,
  Lightbulb,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatPrice } from '@/lib/utils/format'
import { Container } from '@/components/layout/Container'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/hooks/use-cart'
import { RECIPES, type Recipe, type RecipeIngredient } from '@/data/recipes'

const SERVING_OPTIONS = [1, 2, 3, 4, 5, 6, 8] as const

const DIFFICULTY_COLOR: Record<string, string> = {
  Easy: 'text-(--color-success) bg-(--color-success)/10',
  Medium: 'text-(--brand-amber) bg-(--brand-amber)/10',
  Hard: 'text-(--color-error) bg-(--color-error)/10',
}

function formatQuantity(perServing: number, servings: number, unit: string): string {
  const qty = perServing * servings
  const rounded = Math.round(qty * 100) / 100

  if (rounded === 0) return ''

  const display = rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(1)
  return unit ? `${display} ${unit}` : `${display}`
}

function estimateTotalPence(
  ingredients: RecipeIngredient[],
  servings: number,
  baseServings: number,
  checkedIds: Set<number>,
): number {
  const multiplier = servings / baseServings
  return ingredients.reduce((total, ing, idx) => {
    if (!checkedIds.has(idx)) return total
    return total + Math.round(ing.perServing * baseServings * multiplier * 0.8)
  }, 0)
}

interface RecipeDetailProps {
  recipe: Recipe
}

export function RecipeDetail({ recipe }: RecipeDetailProps) {
  const [servings, setServings] = useState(recipe.servings)
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(
    () => new Set(recipe.ingredients.map((_, i) => i)),
  )
  const [addedToCart, setAddedToCart] = useState(false)

  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)

  const toggleIngredient = useCallback((index: number) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }, [])

  const estimatedTotal = useMemo(
    () =>
      estimateTotalPence(
        recipe.ingredients,
        servings,
        recipe.servings,
        checkedIngredients,
      ),
    [recipe.ingredients, servings, recipe.servings, checkedIngredients],
  )

  const checkedCount = checkedIngredients.size

  function handleAddAll() {
    recipe.ingredients.forEach((ingredient, idx) => {
      if (!checkedIngredients.has(idx)) return

      const qty = Math.ceil(ingredient.perServing * servings)
      addItem(
        {
          id: `recipe-${recipe.id}-${ingredient.searchTerm}`,
          name: ingredient.name,
          slug: ingredient.searchTerm,
          price_pence: Math.round(ingredient.perServing * recipe.servings * 0.8),
          image_url: null,
          unit: ingredient.unit,
        },
        qty,
      )
    })

    setAddedToCart(true)
    openCart()
    setTimeout(() => setAddedToCart(false), 3000)
  }

  const relatedRecipes = useMemo(() => {
    return RECIPES.filter(
      (r) =>
        r.id !== recipe.id &&
        (r.cuisine === recipe.cuisine ||
          r.categories.some((c) => recipe.categories.includes(c))),
    ).slice(0, 3)
  }, [recipe])

  const totalTime = recipe.prepTime + recipe.cookTime

  return (
    <Container size="lg" className="py-8 lg:py-12">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Recipes', href: '/recipes' },
          { label: recipe.title },
        ]}
        className="mb-6"
      />

      {/* Hero Area */}
      <div className="lg:grid lg:grid-cols-2 gap-8 mb-10">
        {/* Left: Image */}
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-(--color-elevated) mb-6 lg:mb-0">
          <Image
            src={recipe.imageUrl}
            alt={recipe.title}
            fill
            priority
            className="object-cover"
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
        </div>

        {/* Right: Info */}
        <div className="flex flex-col justify-center">
          <p className="text-xs font-semibold text-(--brand-primary) uppercase tracking-wide">
            {recipe.cuisine}
          </p>

          <h1 className="font-display text-3xl font-semibold text-foreground mt-1">
            {recipe.title}
          </h1>

          <p className="text-base text-(--color-text-secondary) mt-3">
            {recipe.description}
          </p>

          {/* Stats Row */}
          <div className="flex flex-wrap gap-3 sm:gap-6 mt-5">
            <div className="flex items-center gap-2 text-sm text-(--color-text-muted)">
              <Clock size={16} />
              <span>{recipe.prepTime} min prep</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-(--color-text-muted)">
              <Flame size={16} />
              <span>{recipe.cookTime} min cook</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-(--color-text-muted)">
              <Users size={16} />
              <span>{recipe.servings} servings</span>
            </div>
            <div className="text-sm text-(--color-text-muted)">
              {recipe.calories} kcal/serving
            </div>
            <span
              className={cn(
                'text-xs font-semibold rounded-full px-2.5 py-0.5',
                DIFFICULTY_COLOR[recipe.difficulty],
              )}
            >
              {recipe.difficulty}
            </span>
          </div>

          {/* Dietary Tags */}
          {recipe.dietary.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {recipe.dietary.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-medium rounded-full px-3 py-1 bg-(--color-elevated) text-(--color-text-secondary) capitalize"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Servings Adjuster */}
      <div className="mb-10">
        <p className="text-sm font-semibold text-foreground mb-3">
          Adjust Servings
        </p>
        <div className="flex flex-wrap gap-2">
          {SERVING_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setServings(s)}
              className={cn(
                'h-10 w-10 rounded-lg text-sm font-semibold transition-all duration-(--duration-fast) ease-(--ease-premium)',
                servings === s
                  ? 'bg-(--brand-primary) text-white'
                  : 'bg-(--color-elevated) text-foreground hover:bg-(--color-border)',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Two Column: Ingredients + Steps */}
      <div className="lg:grid lg:grid-cols-5 gap-10">
        {/* Ingredients — 2 cols */}
        <div className="lg:col-span-2 mb-10 lg:mb-0">
          <h2 className="font-display text-xl font-semibold text-foreground mb-4">
            Ingredients{' '}
            <span className="text-sm font-normal text-(--color-text-muted)">
              ({recipe.ingredients.length} items)
            </span>
          </h2>

          <div className="space-y-2">
            {recipe.ingredients.map((ingredient, idx) => {
              const isChecked = checkedIngredients.has(idx)

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleIngredient(idx)}
                  className={cn(
                    'flex items-center gap-3 w-full rounded-lg p-3.5 sm:p-3 text-left transition-colors duration-(--duration-fast) min-h-11',
                    isChecked
                      ? 'bg-(--color-surface) hover:bg-(--color-elevated)'
                      : 'bg-(--color-surface) opacity-50',
                  )}
                >
                  <div
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border transition-colors',
                      isChecked
                        ? 'border-(--brand-primary) bg-(--brand-primary)'
                        : 'border-(--color-border)',
                    )}
                  >
                    {isChecked && (
                      <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'text-sm font-medium text-foreground',
                        !isChecked && 'line-through',
                      )}
                    >
                      {ingredient.name}
                    </p>
                    <p className="text-xs text-(--color-text-muted)">
                      {formatQuantity(ingredient.perServing, servings, ingredient.unit)}
                      {ingredient.optional && (
                        <span className="ml-1 italic">(optional)</span>
                      )}
                    </p>
                  </div>

                  <span className="text-[11px] font-medium text-(--color-text-muted) uppercase tracking-wide shrink-0">
                    {ingredient.category}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Add All Button */}
          <div className="mt-6 space-y-3">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleAddAll}
              disabled={checkedCount === 0}
            >
              {addedToCart ? (
                <>
                  <Check size={18} />
                  {checkedCount} items added to basket!
                </>
              ) : (
                <>
                  <ShoppingBasket size={18} />
                  Add {checkedCount} Ingredients to Basket
                </>
              )}
            </Button>

            <p className="text-center text-xs text-(--color-text-muted)">
              Estimated total: {formatPrice(estimatedTotal)}
            </p>
          </div>
        </div>

        {/* Steps — 3 cols */}
        <div className="lg:col-span-3">
          <h2 className="font-display text-xl font-semibold text-foreground mb-4">
            Method
          </h2>

          <ol className="space-y-4">
            {recipe.steps.map((step, idx) => (
              <li
                key={idx}
                className="flex gap-4 rounded-lg bg-(--color-elevated) p-4"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--brand-primary) text-white text-sm font-bold">
                  {idx + 1}
                </div>
                <p className="text-sm text-(--color-text-secondary) leading-relaxed pt-1">
                  {step}
                </p>
              </li>
            ))}
          </ol>

          {/* Tips Section */}
          {recipe.tips && recipe.tips.length > 0 && (
            <div className="mt-10">
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                Chef&apos;s Tips
              </h2>

              <ul className="space-y-3">
                {recipe.tips.map((tip, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 text-sm text-(--color-text-secondary)"
                  >
                    <Lightbulb
                      size={16}
                      className="text-(--brand-amber) shrink-0 mt-0.5"
                    />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Related Recipes */}
      {relatedRecipes.length > 0 && (
        <div className="mt-16">
          <h2 className="font-display text-xl font-semibold text-foreground mb-6">
            You Might Also Like
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedRecipes.map((r) => {
              const rTime = r.prepTime + r.cookTime

              return (
                <Link
                  key={r.id}
                  href={`/recipes/${r.slug}`}
                  className={cn(
                    'group rounded-xl border border-(--color-border)',
                    'bg-(--color-surface) overflow-hidden',
                    'hover:shadow-(--shadow-md) transition-all duration-300 ease-(--ease-premium)',
                  )}
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-(--color-elevated)">
                    <Image
                      src={r.imageUrl}
                      alt={r.title}
                      fill
                      className="object-cover transition-transform duration-500 ease-(--ease-premium) group-hover:scale-105"
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    />
                  </div>

                  <div className="p-5">
                    <p className="text-xs font-semibold text-(--brand-primary) uppercase tracking-wide">
                      {r.cuisine}
                    </p>
                    <h3 className="text-lg font-semibold text-foreground mt-1">
                      {r.title}
                    </h3>
                    <div className="flex items-center gap-4 mt-2 text-xs text-(--color-text-muted)">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {rTime} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={14} />
                        {r.servings}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </Container>
  )
}
