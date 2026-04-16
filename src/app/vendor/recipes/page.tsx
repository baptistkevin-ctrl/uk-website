'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  Plus, Pencil, Trash2, Loader2, ChefHat, X, Clock, Users,
  Flame, Eye, EyeOff, Save, Upload,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface VendorProduct {
  id: string
  name: string
  slug: string
  price_pence: number
  image_url: string | null
}

interface Recipe {
  id: string
  title: string
  slug: string
  description: string | null
  image_url: string | null
  prep_time: number
  cook_time: number
  servings: number
  difficulty: string
  cuisine: string | null
  ingredients: { name: string; quantity: string; unit: string; productId?: string }[]
  steps: string[]
  tips: string[]
  is_published: boolean
  created_at: string
}

const EMPTY_FORM = {
  title: '',
  description: '',
  image_url: '',
  prep_time: '15',
  cook_time: '30',
  servings: '4',
  difficulty: 'Easy',
  cuisine: '',
  ingredients: [{ name: '', quantity: '', unit: '', productId: '' }],
  steps: [''],
  tips: [''],
}

export default function VendorRecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [products, setProducts] = useState<VendorProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => { fetchRecipes() }, [])

  const fetchRecipes = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/vendor/recipes')
      if (res.ok) {
        const data = await res.json()
        setRecipes(data.recipes || [])
        setProducts(data.products || [])
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
  }

  const openEdit = (recipe: Recipe) => {
    setEditingId(recipe.id)
    setForm({
      title: recipe.title,
      description: recipe.description || '',
      image_url: recipe.image_url || '',
      prep_time: String(recipe.prep_time),
      cook_time: String(recipe.cook_time),
      servings: String(recipe.servings),
      difficulty: recipe.difficulty,
      cuisine: recipe.cuisine || '',
      ingredients: recipe.ingredients.length > 0 ? recipe.ingredients.map(i => ({ ...i, productId: i.productId || '' })) : [{ name: '', quantity: '', unit: '', productId: '' }],
      steps: recipe.steps.length > 0 ? recipe.steps : [''],
      tips: recipe.tips?.length > 0 ? recipe.tips : [''],
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) { toast.warning('Recipe title is required'); return }
    if (form.steps.filter(s => s.trim()).length === 0) { toast.warning('At least one step is required'); return }

    setSaving(true)
    try {
      const payload = {
        ...(editingId ? { id: editingId } : {}),
        title: form.title,
        description: form.description || null,
        image_url: form.image_url || null,
        prep_time: parseInt(form.prep_time) || 0,
        cook_time: parseInt(form.cook_time) || 0,
        servings: parseInt(form.servings) || 4,
        difficulty: form.difficulty,
        cuisine: form.cuisine || null,
        ingredients: form.ingredients.filter(i => i.name.trim()),
        steps: form.steps.filter(s => s.trim()),
        tips: form.tips.filter(t => t.trim()),
      }

      const res = await fetch('/api/vendor/recipes', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast.success(editingId ? 'Recipe updated!' : 'Recipe created!')
        setShowModal(false)
        resetForm()
        fetchRecipes()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to save recipe')
      }
    } catch {
      toast.error('Failed to save recipe')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this recipe?')) return
    await fetch(`/api/vendor/recipes?id=${id}`, { method: 'DELETE' })
    toast.success('Recipe deleted')
    fetchRecipes()
  }

  const addIngredient = () => setForm(f => ({ ...f, ingredients: [...f.ingredients, { name: '', quantity: '', unit: '', productId: '' }] }))
  const removeIngredient = (i: number) => setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, idx) => idx !== i) }))
  const updateIngredient = (i: number, field: string, value: string) => {
    setForm(f => ({
      ...f,
      ingredients: f.ingredients.map((ing, idx) => idx === i ? { ...ing, [field]: value } : ing)
    }))
  }

  const addStep = () => setForm(f => ({ ...f, steps: [...f.steps, ''] }))
  const removeStep = (i: number) => setForm(f => ({ ...f, steps: f.steps.filter((_, idx) => idx !== i) }))
  const updateStep = (i: number, value: string) => {
    setForm(f => ({ ...f, steps: f.steps.map((s, idx) => idx === i ? value : s) }))
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-(--brand-primary)" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ChefHat className="h-6 w-6 text-(--brand-primary)" />
            My Recipes
          </h1>
          <p className="text-(--color-text-secondary)">Create recipes featuring your products</p>
        </div>
        <Button onClick={() => { resetForm(); setShowModal(true) }} className="bg-(--brand-primary) hover:bg-(--brand-primary-hover)">
          <Plus className="h-4 w-4 mr-2" /> Create Recipe
        </Button>
      </div>

      {/* Recipe List */}
      {recipes.length === 0 ? (
        <div className="bg-(--color-surface) rounded-xl border border-(--color-border) p-12 text-center">
          <ChefHat className="h-12 w-12 mx-auto text-(--color-text-disabled) mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No recipes yet</h3>
          <p className="text-(--color-text-muted) mb-4">Create recipes to showcase how customers can use your products</p>
          <Button onClick={() => { resetForm(); setShowModal(true) }} className="bg-(--brand-primary) hover:bg-(--brand-primary-hover)">
            <Plus className="h-4 w-4 mr-2" /> Create Your First Recipe
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {recipes.map(recipe => (
            <div key={recipe.id} className="bg-(--color-surface) rounded-xl border border-(--color-border) p-5 flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl bg-(--color-elevated) overflow-hidden shrink-0">
                {recipe.image_url ? (
                  <Image src={recipe.image_url} alt={recipe.title} width={80} height={80} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ChefHat className="h-8 w-8 text-(--color-text-disabled)" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground">{recipe.title}</h3>
                <div className="flex items-center gap-3 mt-1 text-sm text-(--color-text-muted)">
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {recipe.prep_time + recipe.cook_time} min</span>
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {recipe.servings} servings</span>
                  <span className="flex items-center gap-1"><Flame className="h-3.5 w-3.5" /> {recipe.difficulty}</span>
                </div>
                <p className="text-xs text-(--color-text-muted) mt-1">{recipe.ingredients.length} ingredients · {recipe.steps.length} steps</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => openEdit(recipe)} className="p-2 hover:bg-(--color-elevated) rounded-lg"><Pencil className="h-4 w-4 text-(--color-text-muted)" /></button>
                <button onClick={() => handleDelete(recipe.id)} className="p-2 hover:bg-(--color-error-bg) rounded-lg"><Trash2 className="h-4 w-4 text-(--color-error)" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-(--color-surface) rounded-2xl max-w-2xl w-full my-8">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">{editingId ? 'Edit Recipe' : 'Create Recipe'}</h2>
              <button onClick={() => { setShowModal(false); resetForm() }} className="p-2 hover:bg-(--color-elevated) rounded-lg"><X className="h-5 w-5" /></button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label>Recipe Title *</Label>
                  <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g., Creamy Garlic Pasta" className="mt-1" />
                </div>
                <div>
                  <Label>Description</Label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="mt-1 w-full px-3 py-2 border border-(--color-border) rounded-lg text-sm" placeholder="A quick weeknight favourite..." />
                </div>
                <div>
                  <Label>Recipe Image</Label>
                  {form.image_url ? (
                    <div className="mt-1 relative w-full aspect-video rounded-lg overflow-hidden bg-(--color-elevated)">
                      <img src={form.image_url} alt="Recipe" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setForm(f => ({ ...f, image_url: '' }))} className="absolute top-2 right-2 p-1.5 bg-(--color-error) text-white rounded-full">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="mt-1 flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-(--color-border) rounded-lg hover:border-(--brand-primary) hover:bg-(--brand-primary-light) transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          try {
                            const fd = new FormData()
                            fd.append('file', file)
                            const res = await fetch('/api/upload', { method: 'POST', body: fd })
                            if (res.ok) {
                              const { url } = await res.json()
                              setForm(f => ({ ...f, image_url: url }))
                            }
                          } catch { /* ignore */ }
                          e.target.value = ''
                        }}
                      />
                      <Upload className="h-8 w-8 text-(--color-text-disabled) mb-2" />
                      <span className="text-sm text-(--color-text-muted)">Click to upload recipe photo</span>
                      <span className="text-xs text-(--color-text-disabled) mt-1">JPEG, PNG, or WebP (max 5MB)</span>
                    </label>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div><Label>Prep (min)</Label><Input type="number" value={form.prep_time} onChange={e => setForm(f => ({ ...f, prep_time: e.target.value }))} className="mt-1" /></div>
                  <div><Label>Cook (min)</Label><Input type="number" value={form.cook_time} onChange={e => setForm(f => ({ ...f, cook_time: e.target.value }))} className="mt-1" /></div>
                  <div><Label>Servings</Label><Input type="number" value={form.servings} onChange={e => setForm(f => ({ ...f, servings: e.target.value }))} className="mt-1" /></div>
                  <div>
                    <Label>Difficulty</Label>
                    <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-(--color-border) rounded-lg text-sm">
                      <option>Easy</option><option>Medium</option><option>Hard</option>
                    </select>
                  </div>
                  <div>
                    <Label>Cuisine</Label>
                    <select value={form.cuisine} onChange={e => setForm(f => ({ ...f, cuisine: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-(--color-border) rounded-lg text-sm">
                      <option value="">Select cuisine</option>
                      <option>British</option><option>Italian</option><option>Indian</option><option>Chinese</option><option>Mexican</option><option>Thai</option><option>Japanese</option><option>Mediterranean</option><option>American</option><option>French</option><option>Other</option>
                    </select>
                  </div>
                </div>

                {/* Recipe Tips Panel */}
                <div className="bg-(--brand-amber)/5 border border-(--brand-amber)/20 rounded-lg p-4">
                  <p className="text-xs font-semibold text-(--brand-amber) mb-2">Recipe Tips</p>
                  <ul className="space-y-1 text-xs text-(--color-text-secondary)">
                    <li>• Add a clear, appetising photo — recipes with images get 5x more views</li>
                    <li>• Link ingredients to your products so customers can buy directly</li>
                    <li>• Write step-by-step instructions that anyone can follow</li>
                    <li>• Include prep and cook times to help customers plan</li>
                  </ul>
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Ingredients *</Label>
                  <button onClick={addIngredient} className="text-xs text-(--brand-primary) font-medium hover:underline flex items-center gap-1"><Plus className="h-3 w-3" /> Add</button>
                </div>
                <div className="space-y-2">
                  {form.ingredients.map((ing, i) => (
                    <div key={i} className="flex gap-2">
                      <Input value={ing.name} onChange={e => updateIngredient(i, 'name', e.target.value)} placeholder="Ingredient name" className="flex-1" />
                      <Input value={ing.quantity} onChange={e => updateIngredient(i, 'quantity', e.target.value)} placeholder="Qty" className="w-20" />
                      <Input value={ing.unit} onChange={e => updateIngredient(i, 'unit', e.target.value)} placeholder="Unit" className="w-20" />
                      {products.length > 0 && (
                        <select value={ing.productId || ''} onChange={e => updateIngredient(i, 'productId', e.target.value)} className="w-40 px-2 border border-(--color-border) rounded-lg text-xs">
                          <option value="">Link product...</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      )}
                      <button onClick={() => removeIngredient(i)} className="p-2 text-(--color-text-muted) hover:text-(--color-error)"><X className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Steps */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Steps *</Label>
                  <button onClick={addStep} className="text-xs text-(--brand-primary) font-medium hover:underline flex items-center gap-1"><Plus className="h-3 w-3" /> Add Step</button>
                </div>
                <div className="space-y-2">
                  {form.steps.map((step, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <span className="h-8 w-8 rounded-full bg-(--brand-primary-light) text-(--brand-primary) flex items-center justify-center text-sm font-bold shrink-0 mt-1">{i + 1}</span>
                      <textarea value={step} onChange={e => updateStep(i, e.target.value)} rows={2} placeholder={`Step ${i + 1}...`} className="flex-1 px-3 py-2 border border-(--color-border) rounded-lg text-sm" />
                      <button onClick={() => removeStep(i)} className="p-2 text-(--color-text-muted) hover:text-(--color-error) mt-1"><X className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setShowModal(false); resetForm() }}>Cancel</Button>
              <Button className="flex-1 bg-(--brand-primary) hover:bg-(--brand-primary-hover)" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                {editingId ? 'Update Recipe' : 'Create Recipe'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
