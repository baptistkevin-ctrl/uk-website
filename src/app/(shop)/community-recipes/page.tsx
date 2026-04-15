'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Search,
  ChevronUp,
  ChevronDown,
  MessageCircle,
  Clock,
  Users,
  ShoppingCart,
  Crown,
  ArrowRight,
  Flame,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Container } from '@/components/layout/Container'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import {
  useCommunityRecipesStore,
  type CommunityRecipe,
} from '@/stores/community-recipes-store'

/* ──────────────────────────────────────────────
   Constants
   ────────────────────────────────────────────── */

const BREADCRUMB_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Community Recipes' },
]

const SORT_OPTIONS = ['Top Rated', 'Newest', 'Trending'] as const
type SortOption = (typeof SORT_OPTIONS)[number]

const CATEGORIES = [
  'All',
  'Quick Meals',
  'Family Dinner',
  'Healthy',
  'Comfort Food',
  'Breakfast',
] as const

const DIETARY_OPTIONS = [
  'All',
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
] as const

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: 'text-(--color-success)',
  Medium: 'text-(--brand-amber)',
  Hard: 'text-(--color-error)',
}

/* ──────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────── */

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

function sortRecipes(
  recipes: CommunityRecipe[],
  sort: SortOption,
): CommunityRecipe[] {
  const sorted = [...recipes]
  switch (sort) {
    case 'Top Rated':
      return sorted.sort(
        (a, b) => b.upvotes - b.downvotes - (a.upvotes - a.downvotes),
      )
    case 'Newest':
      return sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
    case 'Trending':
      return sorted.sort((a, b) => {
        const aDays =
          (Date.now() - new Date(a.createdAt).getTime()) /
          (1000 * 60 * 60 * 24)
        const bDays =
          (Date.now() - new Date(b.createdAt).getTime()) /
          (1000 * 60 * 60 * 24)
        const aScore = (a.upvotes - a.downvotes) / Math.max(aDays, 1)
        const bScore = (b.upvotes - b.downvotes) / Math.max(bDays, 1)
        return bScore - aScore
      })
    default:
      return sorted
  }
}

/* ──────────────────────────────────────────────
   Page component
   ────────────────────────────────────────────── */

export default function CommunityRecipesPage() {
  const {
    recipes,
    userVotes,
    upvote,
    downvote,
    getRecipeOfTheWeek,
    searchRecipes,
  } = useCommunityRecipesStore()

  const [sort, setSort] = useState<SortOption>('Top Rated')
  const [category, setCategory] = useState('All')
  const [dietary, setDietary] = useState('All')
  const [query, setQuery] = useState('')

  const recipeOfTheWeek = getRecipeOfTheWeek()

  const filtered = useMemo(() => {
    let result = query ? searchRecipes(query) : recipes.filter((r) => r.status === 'published')

    if (category !== 'All') {
      result = result.filter((r) =>
        r.categories.some(
          (c) => c.toLowerCase() === category.toLowerCase(),
        ),
      )
    }

    if (dietary !== 'All') {
      result = result.filter((r) =>
        r.dietary.some(
          (d) => d.toLowerCase() === dietary.toLowerCase(),
        ),
      )
    }

    return sortRecipes(result, sort)
  }, [recipes, query, category, dietary, sort, searchRecipes])

  return (
    <Container size="xl" className="py-8 lg:py-12">
      <Breadcrumb items={BREADCRUMB_ITEMS} className="mb-6" />

      {/* ── Header ── */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-(--color-text)">
            Community Recipes
          </h1>
          <p className="mt-1 text-(--color-text-secondary)">
            Discover recipes from fellow shoppers — shop all ingredients in
            one click
          </p>
        </div>

        <Link
          href="/community-recipes/submit"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-(--brand-amber) px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-(--brand-amber-hover)"
        >
          Submit Your Recipe
        </Link>
      </div>

      {/* ── Recipe of the Week ── */}
      {recipeOfTheWeek && (
        <Link
          href={`/community-recipes/${recipeOfTheWeek.id}`}
          className="group mb-10 block overflow-hidden rounded-2xl bg-linear-to-r from-(--brand-dark) to-(--brand-primary) p-6 text-white transition-shadow hover:shadow-(--shadow-amber) lg:p-8"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="flex-1">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium opacity-90">
                <Crown size={16} />
                Recipe of the Week
              </div>
              <h2 className="mb-2 text-2xl font-bold lg:text-3xl">
                {recipeOfTheWeek.title}
              </h2>
              <p className="mb-4 text-sm opacity-80">
                by {recipeOfTheWeek.authorName}
              </p>
              <div className="flex items-center gap-4 text-sm opacity-80">
                <span className="flex items-center gap-1">
                  <ChevronUp size={14} />
                  {recipeOfTheWeek.upvotes} upvotes
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle size={14} />
                  {recipeOfTheWeek.commentCount} comments
                </span>
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold group-hover:underline">
                View Recipe <ArrowRight size={14} />
              </span>
            </div>

            {recipeOfTheWeek.imageUrl && (
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl lg:w-72">
                <Image
                  src={recipeOfTheWeek.imageUrl}
                  alt={recipeOfTheWeek.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 288px"
                />
              </div>
            )}
          </div>
        </Link>
      )}

      {/* ── Filters ── */}
      <div className="mb-8 space-y-4">
        {/* Sort pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm font-medium text-(--color-text-secondary)">
            Sort:
          </span>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => setSort(opt)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                sort === opt
                  ? 'bg-(--brand-amber) text-white'
                  : 'bg-(--color-surface) text-(--color-text-secondary) hover:bg-(--color-elevated)',
              )}
            >
              {opt}
            </button>
          ))}
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm font-medium text-(--color-text-secondary)">
            Category:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                category === cat
                  ? 'bg-(--brand-amber) text-white'
                  : 'bg-(--color-surface) text-(--color-text-secondary) hover:bg-(--color-elevated)',
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Dietary pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm font-medium text-(--color-text-secondary)">
            Dietary:
          </span>
          {DIETARY_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => setDietary(opt)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                dietary === opt
                  ? 'bg-(--brand-amber) text-white'
                  : 'bg-(--color-surface) text-(--color-text-secondary) hover:bg-(--color-elevated)',
              )}
            >
              {opt}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-text-muted)"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search recipes, ingredients, cuisines..."
            className="w-full rounded-lg border border-(--color-border) bg-(--color-surface) py-2.5 pl-9 pr-4 text-sm text-(--color-text) placeholder:text-(--color-text-muted) transition-colors focus:border-(--brand-amber) focus:outline-none"
          />
        </div>
      </div>

      {/* ── Recipe Grid ── */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-lg font-medium text-(--color-text-secondary)">
            No recipes found
          </p>
          <p className="mt-1 text-sm text-(--color-text-muted)">
            Try adjusting your filters or search query.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              vote={userVotes[recipe.id]}
              onUpvote={() => upvote(recipe.id)}
              onDownvote={() => downvote(recipe.id)}
            />
          ))}
        </div>
      )}
    </Container>
  )
}

/* ──────────────────────────────────────────────
   Recipe Card
   ────────────────────────────────────────────── */

function RecipeCard({
  recipe,
  vote,
  onUpvote,
  onDownvote,
}: {
  recipe: CommunityRecipe
  vote?: 'up' | 'down'
  onUpvote: () => void
  onDownvote: () => void
}) {
  return (
    <div className="group overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface) transition-shadow hover:shadow-(--shadow-md)">
      {/* Image */}
      <Link
        href={`/community-recipes/${recipe.id}`}
        className="relative block aspect-[16/10] overflow-hidden"
      >
        <Image
          src={recipe.imageUrl}
          alt={recipe.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/50 to-transparent" />
      </Link>

      {/* Content */}
      <div className="p-5">
        {/* Author row */}
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-(--brand-amber) text-[11px] font-bold text-white">
            {getInitials(recipe.authorName)}
          </span>
          <span className="text-xs font-medium text-(--color-text-secondary)">
            {recipe.authorName}
          </span>
          <span className="text-xs text-(--color-text-muted)">
            {timeAgo(recipe.createdAt)}
          </span>
        </div>

        {/* Title */}
        <Link href={`/community-recipes/${recipe.id}`}>
          <h3 className="mb-1 text-lg font-semibold text-(--color-text) transition-colors hover:text-(--brand-amber)">
            {recipe.title}
          </h3>
        </Link>

        {/* Description */}
        <p className="mb-3 line-clamp-2 text-sm text-(--color-text-muted)">
          {recipe.description}
        </p>

        {/* Stats */}
        <div className="mb-3 flex items-center gap-3 text-xs text-(--color-text-secondary)">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {recipe.prepTime + recipe.cookTime} min
          </span>
          <span className="flex items-center gap-1">
            <Users size={12} />
            {recipe.servings} servings
          </span>
          <span className={cn('font-medium', DIFFICULTY_COLORS[recipe.difficulty])}>
            {recipe.difficulty}
          </span>
        </div>

        {/* Dietary tags */}
        {recipe.dietary.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {recipe.dietary.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-(--color-elevated) px-2 py-0.5 text-[11px] font-medium text-(--color-text-secondary)"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Vote bar */}
        <div className="mb-3 flex items-center gap-3">
          <button
            onClick={(e) => {
              e.preventDefault()
              onUpvote()
            }}
            className={cn(
              'flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium transition-colors',
              vote === 'up'
                ? 'bg-(--color-success)/10 text-(--color-success)'
                : 'text-(--color-text-muted) hover:text-(--color-success)',
            )}
          >
            <ChevronUp size={16} />
            {recipe.upvotes}
          </button>

          <button
            onClick={(e) => {
              e.preventDefault()
              onDownvote()
            }}
            className={cn(
              'flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium transition-colors',
              vote === 'down'
                ? 'bg-(--color-error)/10 text-(--color-error)'
                : 'text-(--color-text-muted) hover:text-(--color-error)',
            )}
          >
            <ChevronDown size={16} />
            {recipe.downvotes}
          </button>

          <span className="flex items-center gap-1 text-sm text-(--color-text-muted)">
            <MessageCircle size={14} />
            {recipe.commentCount}
          </span>
        </div>

        {/* Shop Ingredients */}
        <Link
          href={`/community-recipes/${recipe.id}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-(--brand-amber) px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-(--brand-amber-hover)"
        >
          <ShoppingCart size={12} />
          Shop Ingredients
        </Link>
      </div>
    </div>
  )
}
