import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Product slug patterns mapped to category slugs
const categoryMapping: Record<string, string[]> = {
  'fruits-vegetables': [
    'organic-bananas', 'royal-gala-apples', 'fresh-strawberries', 'seedless-red-grapes',
    'ripe-avocados', 'organic-carrots', 'vine-tomatoes', 'baby-spinach', 'cucumber',
    'red-onions', 'garlic-bulbs', 'iceberg-lettuce', 'chestnut-mushrooms', 'sweet-corn',
    'mixed-bell-peppers', 'lemons', 'fresh-blueberries', 'mango', 'tenderstem-broccoli',
    'fresh-pineapple'
  ],
  'dairy-eggs': [
    'semi-skimmed-milk', 'organic-whole-milk', 'salted-butter', 'greek-style-yogurt',
    'mature-cheddar', 'mozzarella-ball', 'double-cream', 'free-range-large-eggs',
    'organic-eggs', 'parmesan-wedge', 'feta-cheese', 'brie'
  ],
  'bakery': [
    'white-bread-loaf', 'wholemeal-bread', 'croissants', 'seeded-batch-loaf',
    'pain-au-chocolat', 'bagels', 'brioche-buns', 'sourdough-boule'
  ],
  'meat-poultry': [
    'chicken-thighs', 'chicken-wings', 'beef-mince', 'ribeye-steak', 'sirloin-steak',
    'pork-sausages', 'smoked-back-bacon', 'lamb-mince', 'pork-chops', 'turkey-breast-mince',
    'beef-burgers', 'chicken-drumsticks', 'whole-chicken', 'diced-beef'
  ],
  'fish-seafood': [
    'fresh-cod-fillets', 'haddock-fillets', 'king-prawns', 'smoked-salmon',
    'sea-bass-fillets', 'tuna-steaks'
  ],
  'pantry': [
    'basmati-rice', 'spaghetti', 'penne-pasta', 'chopped-tomatoes', 'extra-virgin-olive-oil',
    'baked-beans', 'organic-porridge-oats', 'honey', 'peanut-butter', 'tomato-ketchup',
    'coconut-milk', 'chickpeas', 'red-kidney-beans', 'vegetable-stock-cubes', 'soy-sauce'
  ],
  'drinks': [
    'orange-juice', 'apple-juice', 'ground-coffee', 'english-breakfast-tea',
    'sparkling-water', 'almond-milk', 'oat-milk'
  ],
  'snacks-sweets': [
    'milk-chocolate-bar', 'dark-chocolate', 'salted-crisps', 'cheese-onion-crisps',
    'mixed-nuts', 'chocolate-chip-cookies', 'digestive-biscuits', 'popcorn-sweet-salted',
    'hummus', 'guacamole', 'tortilla-chips'
  ],
  'frozen': [
    'vanilla-ice-cream', 'chocolate-ice-cream', 'frozen-garden-peas', 'frozen-chips',
    'frozen-pizza-margherita', 'fish-fingers', 'frozen-berries-mix'
  ]
}

export async function POST(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()

  try {
    // Get all categories
    const { data: categories, error: catError } = await supabaseAdmin
      .from('categories')
      .select('id, slug, name')

    if (catError || !categories) {
      return NextResponse.json({ error: 'Failed to fetch categories', details: catError?.message }, { status: 500 })
    }

    // Create a slug to ID map
    const categoryIdMap: Record<string, string> = {}
    categories.forEach(cat => {
      categoryIdMap[cat.slug] = cat.id
    })

    // Get all products
    const { data: products, error: prodError } = await supabaseAdmin
      .from('products')
      .select('id, slug, name')

    if (prodError || !products) {
      return NextResponse.json({ error: 'Failed to fetch products', details: prodError?.message }, { status: 500 })
    }

    const updates: { id: string; category_id: string; productName: string; categoryName: string }[] = []
    const notFound: string[] = []

    // Match products to categories
    for (const product of products) {
      let foundCategory = false

      for (const [categorySlug, productSlugs] of Object.entries(categoryMapping)) {
        // Check if product slug starts with any of the patterns
        const matchesPattern = productSlugs.some(pattern =>
          product.slug.startsWith(pattern) || product.slug.includes(pattern)
        )

        if (matchesPattern) {
          const categoryId = categoryIdMap[categorySlug]
          if (categoryId) {
            updates.push({
              id: product.id,
              category_id: categoryId,
              productName: product.name,
              categoryName: categorySlug
            })
            foundCategory = true
            break
          }
        }
      }

      if (!foundCategory) {
        notFound.push(product.slug)
      }
    }

    // Update products in batches
    let updated = 0
    for (const update of updates) {
      const { error: updateError } = await supabaseAdmin
        .from('products')
        .update({ category_id: update.category_id })
        .eq('id', update.id)

      if (!updateError) {
        updated++
      }
    }

    return NextResponse.json({
      message: 'Products fixed successfully',
      totalProducts: products.length,
      updated,
      notMatched: notFound,
      categories: Object.keys(categoryIdMap)
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to fix products' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Fix Products API - Updates products with correct category_id',
    usage: 'POST /api/admin/fix-products'
  })
}
