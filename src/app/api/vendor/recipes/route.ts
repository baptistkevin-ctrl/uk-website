import { NextRequest, NextResponse } from 'next/server'
import { createClient, getSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET vendor's recipes
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabaseAdmin = getSupabaseAdmin()
    const { data: vendor } = await supabaseAdmin
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })

    const { data: recipes, error } = await supabaseAdmin
      .from('vendor_recipes')
      .select('*')
      .eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false })

    if (error) {
      // Table may not exist — return empty
      if (error.code === '42P01') return NextResponse.json({ recipes: [] })
      return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 })
    }

    // Also get vendor's products for the recipe ingredient picker
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id, name, slug, price_pence, image_url')
      .eq('vendor_id', vendor.id)
      .eq('is_active', true)
      .order('name')

    return NextResponse.json({ recipes: recipes || [], products: products || [] })
  } catch (error) {
    console.error('Vendor recipes error:', error)
    return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 })
  }
}

// CREATE recipe
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabaseAdmin = getSupabaseAdmin()
    const { data: vendor } = await supabaseAdmin
      .from('vendors')
      .select('id, business_name')
      .eq('user_id', user.id)
      .single()

    if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })

    const body = await request.json()
    const { title, description, image_url, prep_time, cook_time, servings, difficulty, cuisine, dietary, categories, ingredients, steps, tips } = body

    if (!title || !ingredients || !steps) {
      return NextResponse.json({ error: 'Title, ingredients, and steps are required' }, { status: 400 })
    }

    // Generate slug
    const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    let slug = baseSlug
    let counter = 1
    while (true) {
      const { data: existing } = await supabaseAdmin
        .from('vendor_recipes')
        .select('id')
        .eq('slug', slug)
        .single()
      if (!existing) break
      slug = `${baseSlug}-${counter}`
      counter++
    }

    const { data: recipe, error } = await supabaseAdmin
      .from('vendor_recipes')
      .insert({
        vendor_id: vendor.id,
        title,
        slug,
        description: description || null,
        image_url: image_url || null,
        prep_time: prep_time || 0,
        cook_time: cook_time || 0,
        servings: servings || 4,
        difficulty: difficulty || 'Easy',
        cuisine: cuisine || null,
        dietary: dietary || [],
        categories: categories || [],
        ingredients: ingredients || [],
        steps: steps || [],
        tips: tips || [],
        author: vendor.business_name,
        is_published: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Recipe creation error:', error)
      return NextResponse.json({ error: `Failed to create recipe: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ recipe }, { status: 201 })
  } catch (error) {
    console.error('Vendor recipe create error:', error)
    return NextResponse.json({ error: 'Failed to create recipe' }, { status: 500 })
  }
}

// UPDATE recipe
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabaseAdmin = getSupabaseAdmin()
    const { data: vendor } = await supabaseAdmin.from('vendors').select('id').eq('user_id', user.id).single()
    if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })

    const body = await request.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'Recipe ID required' }, { status: 400 })

    const { data: recipe, error } = await supabaseAdmin
      .from('vendor_recipes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('vendor_id', vendor.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: 'Failed to update recipe' }, { status: 500 })
    return NextResponse.json({ recipe })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update recipe' }, { status: 500 })
  }
}

// DELETE recipe
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabaseAdmin = getSupabaseAdmin()
    const { data: vendor } = await supabaseAdmin.from('vendors').select('id').eq('user_id', user.id).single()
    if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Recipe ID required' }, { status: 400 })

    await supabaseAdmin.from('vendor_recipes').delete().eq('id', id).eq('vendor_id', vendor.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete recipe' }, { status: 500 })
  }
}
