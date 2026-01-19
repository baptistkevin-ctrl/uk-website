import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

// GET all products
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const includeInactive = searchParams.get('includeInactive') === 'true'

  const supabaseAdmin = getSupabaseAdmin()
  let query = supabaseAdmin.from('products').select('*, categories(name)')

  if (category) {
    query = query.eq('category_id', category)
  }

  if (!includeInactive) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST new product
export async function POST(request: NextRequest) {
  const body = await request.json()

  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('products')
    .insert([body])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
