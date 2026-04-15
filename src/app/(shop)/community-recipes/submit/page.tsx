'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ImageIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Container } from '@/components/layout/Container'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { useCommunityRecipesStore } from '@/stores/community-recipes-store'

/* ──────────────────────────────────────────────
   Constants
   ────────────────────────────────────────────── */

const BREADCRUMB_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Community Recipes', href: '/community-recipes' },
  { label: 'Submit Recipe' },
]

const CUISINE_OPTIONS = [
  'British',
  'Italian',
  'Asian',
  'Mexican',
  'Indian',
  'Middle Eastern',
  'French',
  'Japanese',
  'Thai',
  'American',
  'Mediterranean',
  'Other',
] as const

const CATEGORY_OPTIONS = [
  'Quick Meals',
  'Family Dinner',
  'Healthy',
  'Comfort Food',
  'Breakfast',
  'Batch Cooking',
  'Snacks',
  'Weekend',
] as const

const DIETARY_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Dairy-Free',
] as const

const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard'] as const

/* ──────────────────────────────────────────────
   Types
   ────────────────────────────────────────────── */

interface IngredientRow {
  name: string
  quantity: string
  unit: string
  searchTerm: string
}

/* ──────────────────────────────────────────────
   Page
   ────────────────────────────────────────────── */

export default function SubmitRecipePage() {
  const router = useRouter()
  const addRecipe = useCommunityRecipesStore((s) => s.addRecipe)

  /* ── Form state ── */
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [cuisine, setCuisine] = useState('British')
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy')
  const [prepTime, setPrepTime] = useState('')
  const [cookTime, setCookTime] = useState('')
  const [servings, setServings] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [dietary, setDietary] = useState<string[]>([])
  const [ingredients, setIngredients] = useState<IngredientRow[]>([
    { name: '', quantity: '', unit: 'g', searchTerm: '' },
  ])
  const [steps, setSteps] = useState<string[]>([''])
  const [tips, setTips] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  /* ── Category toggle ── */
  function toggleCategory(cat: string) {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    )
  }

  /* ── Dietary toggle ── */
  function toggleDietary(d: string) {
    setDietary((prev) =>
      prev.includes(d) ? prev.filter((v) => v !== d) : [...prev, d],
    )
  }

  /* ── Ingredient helpers ── */
  function updateIngredient(
    idx: number,
    field: keyof IngredientRow,
    value: string,
  ) {
    setIngredients((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row)),
    )
  }

  function addIngredientRow() {
    setIngredients((prev) => [
      ...prev,
      { name: '', quantity: '', unit: 'g', searchTerm: '' },
    ])
  }

  function removeIngredientRow(idx: number) {
    if (ingredients.length <= 1) return
    setIngredients((prev) => prev.filter((_, i) => i !== idx))
  }

  /* ── Step helpers ── */
  function updateStep(idx: number, value: string) {
    setSteps((prev) => prev.map((s, i) => (i === idx ? value : s)))
  }

  function addStep() {
    setSteps((prev) => [...prev, ''])
  }

  function removeStep(idx: number) {
    if (steps.length <= 1) return
    setSteps((prev) => prev.filter((_, i) => i !== idx))
  }

  function moveStep(idx: number, dir: -1 | 1) {
    const target = idx + dir
    if (target < 0 || target >= steps.length) return
    setSteps((prev) => {
      const next = [...prev]
      const temp = next[idx]
      next[idx] = next[target]
      next[target] = temp
      return next
    })
  }

  /* ── Tip helpers ── */
  function updateTip(idx: number, value: string) {
    setTips((prev) => prev.map((t, i) => (i === idx ? value : t)))
  }

  function addTip() {
    setTips((prev) => [...prev, ''])
  }

  function removeTip(idx: number) {
    setTips((prev) => prev.filter((_, i) => i !== idx))
  }

  /* ── Submit ── */
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !description.trim()) return
    setSubmitting(true)

    const validIngredients = ingredients.filter(
      (i) => i.name.trim() && i.quantity.trim(),
    )
    const validSteps = steps.filter((s) => s.trim())
    const validTips = tips.filter((t) => t.trim())

    const newRecipe = addRecipe({
      title: title.trim(),
      description: description.trim(),
      imageUrl:
        imageUrl.trim() ||
        'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600&q=80',
      authorId: 'current-user',
      authorName: 'You',
      prepTime: Number(prepTime) || 0,
      cookTime: Number(cookTime) || 0,
      servings: Number(servings) || 2,
      difficulty,
      cuisine,
      dietary,
      categories,
      ingredients: validIngredients.map((i) => ({
        name: i.name.trim(),
        quantity: i.quantity.trim(),
        unit: i.unit,
        searchTerm: i.searchTerm.trim() || i.name.trim().toLowerCase(),
      })),
      steps: validSteps,
      tips: validTips,
    })

    router.push(`/community-recipes/${newRecipe.id}`)
  }

  /* ── Shared input classes ── */
  const inputClass =
    'w-full rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-2.5 text-sm text-(--color-text) placeholder:text-(--color-text-muted) transition-colors focus:border-(--brand-amber) focus:outline-none'

  const labelClass = 'mb-1 block text-sm font-medium text-(--color-text)'

  return (
    <Container size="md" className="py-8">
      <Breadcrumb items={BREADCRUMB_ITEMS} className="mb-6" />

      <h1 className="mb-2 font-display text-3xl font-bold tracking-tight text-(--color-text)">
        Share Your Recipe
      </h1>
      <p className="mb-8 text-(--color-text-secondary)">
        Share your favourite recipes with the community. Fill in the details
        below and let others cook along!
      </p>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ── 1. Basics ── */}
        <FormSection title="Basics">
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className={labelClass}>
                Recipe Title *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Creamy Tomato Pasta"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="description" className={labelClass}>
                Description *
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe your recipe..."
                rows={3}
                required
                className={cn(inputClass, 'resize-none')}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="cuisine" className={labelClass}>
                  Cuisine
                </label>
                <select
                  id="cuisine"
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                  className={inputClass}
                >
                  {CUISINE_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Difficulty</label>
                <div className="flex gap-2">
                  {DIFFICULTY_OPTIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className={cn(
                        'flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors',
                        difficulty === d
                          ? 'border-(--brand-amber) bg-(--brand-amber)/10 text-(--brand-amber)'
                          : 'border-(--color-border) text-(--color-text-secondary) hover:bg-(--color-elevated)',
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="prepTime" className={labelClass}>
                  Prep (min)
                </label>
                <input
                  id="prepTime"
                  type="number"
                  min={0}
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                  placeholder="10"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="cookTime" className={labelClass}>
                  Cook (min)
                </label>
                <input
                  id="cookTime"
                  type="number"
                  min={0}
                  value={cookTime}
                  onChange={(e) => setCookTime(e.target.value)}
                  placeholder="25"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="servings" className={labelClass}>
                  Servings
                </label>
                <input
                  id="servings"
                  type="number"
                  min={1}
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  placeholder="4"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </FormSection>

        {/* ── 2. Photo ── */}
        <FormSection title="Photo">
          <div>
            <label htmlFor="imageUrl" className={labelClass}>
              Image URL
            </label>
            <div className="flex gap-3">
              <input
                id="imageUrl"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className={cn(inputClass, 'flex-1')}
              />
              <span className="flex items-center justify-center rounded-lg border border-(--color-border) bg-(--color-surface) px-3 text-(--color-text-muted)">
                <ImageIcon size={18} />
              </span>
            </div>
            <p className="mt-1 text-xs text-(--color-text-muted)">
              Paste an Unsplash link or any public image URL.
            </p>
          </div>
        </FormSection>

        {/* ── 3. Categories ── */}
        <FormSection title="Categories">
          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                  categories.includes(cat)
                    ? 'bg-(--brand-amber) text-white'
                    : 'bg-(--color-elevated) text-(--color-text-secondary) hover:bg-(--color-border)',
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </FormSection>

        {/* ── 4. Dietary ── */}
        <FormSection title="Dietary">
          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => toggleDietary(d)}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                  dietary.includes(d)
                    ? 'bg-(--brand-amber) text-white'
                    : 'bg-(--color-elevated) text-(--color-text-secondary) hover:bg-(--color-border)',
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </FormSection>

        {/* ── 5. Ingredients ── */}
        <FormSection title="Ingredients">
          <div className="space-y-3">
            {ingredients.map((ing, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <div className="grid flex-1 grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={ing.name}
                    onChange={(e) =>
                      updateIngredient(idx, 'name', e.target.value)
                    }
                    placeholder="Name"
                    className={cn(inputClass, 'col-span-2')}
                  />
                  <input
                    type="text"
                    value={ing.quantity}
                    onChange={(e) =>
                      updateIngredient(idx, 'quantity', e.target.value)
                    }
                    placeholder="Qty"
                    className={inputClass}
                  />
                  <select
                    value={ing.unit}
                    onChange={(e) =>
                      updateIngredient(idx, 'unit', e.target.value)
                    }
                    className={inputClass}
                  >
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="ml">ml</option>
                    <option value="L">L</option>
                    <option value="tsp">tsp</option>
                    <option value="tbsp">tbsp</option>
                    <option value="pieces">pieces</option>
                    <option value="whole">whole</option>
                    <option value="cloves">cloves</option>
                    <option value="bunch">bunch</option>
                    <option value="pack">pack</option>
                    <option value="fillets">fillets</option>
                    <option value="slices">slices</option>
                  </select>
                </div>
                <input
                  type="text"
                  value={ing.searchTerm}
                  onChange={(e) =>
                    updateIngredient(idx, 'searchTerm', e.target.value)
                  }
                  placeholder="Search term"
                  className={cn(inputClass, 'w-32')}
                />
                <button
                  type="button"
                  onClick={() => removeIngredientRow(idx)}
                  disabled={ingredients.length <= 1}
                  className="mt-2 text-(--color-text-muted) transition-colors hover:text-(--color-error) disabled:opacity-30"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addIngredientRow}
              className="flex items-center gap-1.5 text-sm font-medium text-(--brand-amber) transition-colors hover:text-(--brand-amber-hover)"
            >
              <Plus size={14} />
              Add Ingredient
            </button>
          </div>
        </FormSection>

        {/* ── 6. Steps ── */}
        <FormSection title="Steps">
          <div className="space-y-3">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="mt-2.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-(--brand-amber) text-xs font-bold text-white">
                  {idx + 1}
                </span>
                <textarea
                  value={step}
                  onChange={(e) => updateStep(idx, e.target.value)}
                  placeholder={`Step ${idx + 1}...`}
                  rows={2}
                  className={cn(inputClass, 'flex-1 resize-none')}
                />
                <div className="flex flex-col gap-1 pt-1">
                  <button
                    type="button"
                    onClick={() => moveStep(idx, -1)}
                    disabled={idx === 0}
                    className="text-(--color-text-muted) transition-colors hover:text-(--brand-amber) disabled:opacity-30"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveStep(idx, 1)}
                    disabled={idx === steps.length - 1}
                    className="text-(--color-text-muted) transition-colors hover:text-(--brand-amber) disabled:opacity-30"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeStep(idx)}
                    disabled={steps.length <= 1}
                    className="text-(--color-text-muted) transition-colors hover:text-(--color-error) disabled:opacity-30"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addStep}
              className="flex items-center gap-1.5 text-sm font-medium text-(--brand-amber) transition-colors hover:text-(--brand-amber-hover)"
            >
              <Plus size={14} />
              Add Step
            </button>
          </div>
        </FormSection>

        {/* ── 7. Tips ── */}
        <FormSection title="Tips (optional)">
          <div className="space-y-3">
            {tips.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <input
                  type="text"
                  value={tip}
                  onChange={(e) => updateTip(idx, e.target.value)}
                  placeholder="Handy tip..."
                  className={cn(inputClass, 'flex-1')}
                />
                <button
                  type="button"
                  onClick={() => removeTip(idx)}
                  className="mt-2 text-(--color-text-muted) transition-colors hover:text-(--color-error)"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addTip}
              className="flex items-center gap-1.5 text-sm font-medium text-(--brand-amber) transition-colors hover:text-(--brand-amber-hover)"
            >
              <Plus size={14} />
              Add Tip
            </button>
          </div>
        </FormSection>

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={submitting || !title.trim() || !description.trim()}
          className="w-full rounded-lg bg-(--brand-amber) py-3 text-sm font-semibold text-white transition-colors hover:bg-(--brand-amber-hover) disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Publishing...' : 'Publish Recipe'}
        </button>
      </form>
    </Container>
  )
}

/* ──────────────────────────────────────────────
   Form Section wrapper
   ────────────────────────────────────────────── */

function FormSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5 shadow-sm hover:shadow-md transition-shadow">
      <h2 className="mb-4 text-lg font-semibold text-(--color-text)">
        {title}
      </h2>
      {children}
    </section>
  )
}
