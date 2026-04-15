'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Clock, Users, Flame } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Container } from '@/components/layout/Container'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { RECIPES, type Recipe } from '@/data/recipes'

const CATEGORY_FILTERS = [
  'All',
  'Quick Meals',
  'Family Dinner',
  'Healthy',
  'Budget Friendly',
  'Comfort Food',
  'Breakfast',
] as const

const DIETARY_FILTERS = [
  'All',
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Dairy-Free',
] as const

const DIFFICULTY_COLOR: Record<string, string> = {
  Easy: 'text-(--color-success)',
  Medium: 'text-(--brand-amber)',
  Hard: 'text-(--color-error)',
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const totalTime = recipe.prepTime + recipe.cookTime

  return (
    <Link
      href={`/recipes/${recipe.slug}`}
      className={cn(
        'group rounded-xl border border-(--color-border)',
        'bg-(--color-surface) overflow-hidden',
        'hover:shadow-(--shadow-md) transition-all duration-300 ease-(--ease-premium)',
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-(--color-elevated)">
        <Image
          src={recipe.imageUrl}
          alt={recipe.title}
          fill
          className="object-cover transition-transform duration-500 ease-(--ease-premium) group-hover:scale-105"
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        />
      </div>

      <div className="p-5">
        <p className="text-xs font-semibold text-(--brand-primary) uppercase tracking-wide">
          {recipe.cuisine}
        </p>

        <h3 className="text-lg font-semibold text-foreground mt-1">
          {recipe.title}
        </h3>

        <p className="text-sm text-(--color-text-muted) line-clamp-2 mt-1">
          {recipe.description}
        </p>

        <div className="flex items-center gap-4 mt-3 text-xs text-(--color-text-muted)">
          <span className="flex items-center gap-1">
            <Clock size={14} />
            {totalTime} min
          </span>
          <span className="flex items-center gap-1">
            <Users size={14} />
            {recipe.servings}
          </span>
          <span className={cn('font-medium', DIFFICULTY_COLOR[recipe.difficulty])}>
            {recipe.difficulty}
          </span>
          <span className="flex items-center gap-1">
            <Flame size={14} />
            {recipe.calories} kcal
          </span>
        </div>

        {recipe.dietary.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {recipe.dietary.map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-medium rounded-full px-2 py-0.5 bg-(--color-elevated) text-(--color-text-secondary) capitalize"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}

export default function RecipesPage() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [activeDietary, setActiveDietary] = useState('All')

  const filteredRecipes = useMemo(() => {
    let results = [...RECIPES]

    if (activeCategory !== 'All') {
      results = results.filter((r) =>
        r.categories.some(
          (c) => c.toLowerCase() === activeCategory.toLowerCase(),
        ),
      )
    }

    if (activeDietary !== 'All') {
      const diet = activeDietary.toLowerCase().replace('-', '-')
      results = results.filter((r) =>
        r.dietary.some((d) => d.toLowerCase() === diet.toLowerCase()),
      )
    }

    return results
  }, [activeCategory, activeDietary])

  return (
    <Container size="xl" className="py-8 lg:py-12">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Recipes' },
        ]}
        className="mb-6"
      />

      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-foreground">
          Delicious Recipes
        </h1>
        <p className="text-base text-(--color-text-secondary) mt-2">
          Browse recipes and add all ingredients to your basket in one click
        </p>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {CATEGORY_FILTERS.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-(--duration-fast) ease-(--ease-premium)',
              activeCategory === cat
                ? 'bg-(--brand-primary) text-white'
                : 'bg-(--color-elevated) text-(--color-text-secondary) hover:bg-(--color-border)',
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Dietary Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {DIETARY_FILTERS.map((diet) => (
          <button
            key={diet}
            onClick={() => setActiveDietary(diet)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-(--duration-fast) ease-(--ease-premium)',
              activeDietary === diet
                ? 'bg-(--brand-amber) text-white'
                : 'bg-(--color-elevated) text-(--color-text-secondary) hover:bg-(--color-border)',
            )}
          >
            {diet}
          </button>
        ))}
      </div>

      {/* Recipe Grid */}
      {filteredRecipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-lg font-medium text-(--color-text-muted)">
            No recipes match your filters
          </p>
          <button
            onClick={() => {
              setActiveCategory('All')
              setActiveDietary('All')
            }}
            className="mt-4 text-sm text-(--brand-primary) hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </Container>
  )
}
