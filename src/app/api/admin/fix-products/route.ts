import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Product slug patterns mapped to category slugs (using actual DB slugs)
const categoryMapping: Record<string, string[]> = {
  // Fruits (batch 1) - use fresh-fruits
  'fresh-fruits': [
    'organic-bananas', 'royal-gala-apples', 'fresh-strawberries', 'seedless-red-grapes',
    'ripe-avocados', 'lemons', 'fresh-blueberries', 'mango', 'fresh-pineapple'
  ],
  // Vegetables (batch 1) - use fresh-vegetables
  'fresh-vegetables': [
    'organic-carrots', 'vine-tomatoes', 'baby-spinach', 'cucumber',
    'red-onions', 'garlic-bulbs', 'iceberg-lettuce', 'chestnut-mushrooms', 'sweet-corn',
    'mixed-bell-peppers', 'tenderstem-broccoli'
  ],
  // Dairy (batch 2) - use milk-cream for milk, cheese for cheese, etc.
  'milk-cream': [
    'semi-skimmed-milk', 'organic-whole-milk', 'double-cream'
  ],
  'butter-spreads': [
    'salted-butter'
  ],
  'yogurt': [
    'greek-style-yogurt'
  ],
  'cheese': [
    'mature-cheddar', 'mozzarella-ball', 'parmesan-wedge', 'feta-cheese', 'brie'
  ],
  'eggs': [
    'free-range-large-eggs', 'organic-eggs'
  ],
  // Bakery (batch 2)
  'bread': [
    'white-bread-loaf', 'wholemeal-bread', 'seeded-batch-loaf', 'sourdough-boule', 'bagels', 'brioche-buns'
  ],
  'pastries': [
    'croissants', 'pain-au-chocolat'
  ],
  // Meat (batch 3)
  'chicken': [
    'chicken-thighs', 'chicken-wings', 'chicken-drumsticks', 'whole-chicken', 'turkey-breast-mince'
  ],
  'beef': [
    'beef-mince', 'ribeye-steak', 'sirloin-steak', 'beef-burgers', 'diced-beef'
  ],
  'pork': [
    'pork-sausages', 'smoked-back-bacon', 'pork-chops'
  ],
  'lamb': [
    'lamb-mince'
  ],
  // Fish (batch 3)
  'fresh-fish': [
    'fresh-cod-fillets', 'haddock-fillets', 'sea-bass-fillets', 'tuna-steaks', 'smoked-salmon'
  ],
  'prawns-shellfish': [
    'king-prawns'
  ],
  // Pantry (batch 4)
  'rice-pasta': [
    'basmati-rice', 'spaghetti', 'penne-pasta'
  ],
  'tinned-foods': [
    'chopped-tomatoes', 'baked-beans', 'chickpeas', 'red-kidney-beans', 'coconut-milk'
  ],
  'oils-vinegars': [
    'extra-virgin-olive-oil'
  ],
  'cereals-breakfast': [
    'organic-porridge-oats'
  ],
  'sauces-condiments': [
    'honey', 'peanut-butter', 'tomato-ketchup', 'vegetable-stock-cubes', 'soy-sauce'
  ],
  // Drinks (batch 4)
  'juices': [
    'orange-juice', 'apple-juice'
  ],
  'tea-coffee': [
    'ground-coffee', 'english-breakfast-tea'
  ],
  'water': [
    'sparkling-water'
  ],
  'milk': [
    'almond-milk', 'oat-milk'
  ],
  // Snacks (batch 5)
  'chocolate': [
    'milk-chocolate-bar', 'dark-chocolate'
  ],
  'crisps-nuts': [
    'salted-crisps', 'cheese-onion-crisps', 'mixed-nuts', 'tortilla-chips', 'popcorn-sweet-salted'
  ],
  'biscuits': [
    'chocolate-chip-cookies', 'digestive-biscuits'
  ],
  // Frozen (batch 5)
  'ice-cream': [
    'vanilla-ice-cream', 'chocolate-ice-cream'
  ],
  'frozen-vegetables': [
    'frozen-garden-peas', 'frozen-chips', 'frozen-berries-mix'
  ],
  'frozen-pizza-meals': [
    'frozen-pizza-margherita'
  ],
  'frozen-meat-fish': [
    'fish-fingers'
  ],
  // Dips - use salads-herbs or create match
  'salads-herbs': [
    'hummus', 'guacamole'
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
    const debugMatches: { product: string; matchedPattern: string; category: string }[] = []

    // Match products to categories using normalized comparison
    for (const product of products) {
      let foundCategory = false
      const productSlugNormalized = product.slug.toLowerCase()

      for (const [categorySlug, productSlugs] of Object.entries(categoryMapping)) {
        // Check if product slug contains any of the patterns
        for (const pattern of productSlugs) {
          const patternNormalized = pattern.toLowerCase()
          // Check if the product slug starts with the pattern (ignoring trailing parts like -500g, -1kg, etc.)
          if (productSlugNormalized.startsWith(patternNormalized) ||
              productSlugNormalized.includes(patternNormalized)) {
            const categoryId = categoryIdMap[categorySlug]
            if (categoryId) {
              updates.push({
                id: product.id,
                category_id: categoryId,
                productName: product.name,
                categoryName: categorySlug
              })
              debugMatches.push({ product: product.slug, matchedPattern: pattern, category: categorySlug })
              foundCategory = true
              break
            }
          }
        }
        if (foundCategory) break
      }

      if (!foundCategory) {
        notFound.push(product.slug)
      }
    }

    // Insert into product_categories junction table
    let inserted = 0
    const insertErrors: string[] = []

    // First, delete existing product_category relationships for these products
    const productIds = updates.map(u => u.id)
    await supabaseAdmin
      .from('product_categories')
      .delete()
      .in('product_id', productIds)

    // Insert new relationships
    const insertData = updates.map(update => ({
      product_id: update.id,
      category_id: update.category_id
    }))

    // Insert in batches of 50
    const batchSize = 50
    for (let i = 0; i < insertData.length; i += batchSize) {
      const batch = insertData.slice(i, i + batchSize)
      const { error: insertError, data: insertedData } = await supabaseAdmin
        .from('product_categories')
        .insert(batch)
        .select()

      if (!insertError && insertedData) {
        inserted += insertedData.length
      } else if (insertError) {
        insertErrors.push(`Batch ${Math.floor(i/batchSize) + 1}: ${insertError.message}`)
      }
    }

    return NextResponse.json({
      message: 'Products fixed successfully',
      totalProducts: products.length,
      matched: updates.length,
      inserted,
      notMatched: notFound,
      insertErrors: insertErrors.slice(0, 10),
      sampleMatches: debugMatches.slice(0, 10),
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
