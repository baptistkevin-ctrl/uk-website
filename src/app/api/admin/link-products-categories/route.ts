import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

// Map product keywords to category slugs
const productCategoryMapping: Record<string, string[]> = {
  // Fruits & Vegetables
  'apple': ['fruits-vegetables', 'fresh-fruits'],
  'banana': ['fruits-vegetables', 'fresh-fruits'],
  'orange': ['fruits-vegetables', 'fresh-fruits'],
  'strawberry': ['fruits-vegetables', 'fresh-fruits'],
  'strawberries': ['fruits-vegetables', 'fresh-fruits'],
  'grape': ['fruits-vegetables', 'fresh-fruits'],
  'grapes': ['fruits-vegetables', 'fresh-fruits'],
  'mango': ['fruits-vegetables', 'fresh-fruits'],
  'pineapple': ['fruits-vegetables', 'fresh-fruits'],
  'watermelon': ['fruits-vegetables', 'fresh-fruits'],
  'blueberry': ['fruits-vegetables', 'fresh-fruits'],
  'blueberries': ['fruits-vegetables', 'fresh-fruits'],
  'raspberry': ['fruits-vegetables', 'fresh-fruits'],
  'raspberries': ['fruits-vegetables', 'fresh-fruits'],
  'lemon': ['fruits-vegetables', 'fresh-fruits'],
  'lime': ['fruits-vegetables', 'fresh-fruits'],
  'avocado': ['fruits-vegetables', 'fresh-fruits'],
  'kiwi': ['fruits-vegetables', 'fresh-fruits'],
  'pear': ['fruits-vegetables', 'fresh-fruits'],
  'peach': ['fruits-vegetables', 'fresh-fruits'],
  'plum': ['fruits-vegetables', 'fresh-fruits'],
  'cherry': ['fruits-vegetables', 'fresh-fruits'],
  'cherries': ['fruits-vegetables', 'fresh-fruits'],
  'melon': ['fruits-vegetables', 'fresh-fruits'],

  'carrot': ['fruits-vegetables', 'fresh-vegetables'],
  'carrots': ['fruits-vegetables', 'fresh-vegetables'],
  'broccoli': ['fruits-vegetables', 'fresh-vegetables'],
  'tomato': ['fruits-vegetables', 'fresh-vegetables'],
  'tomatoes': ['fruits-vegetables', 'fresh-vegetables'],
  'potato': ['fruits-vegetables', 'fresh-vegetables'],
  'potatoes': ['fruits-vegetables', 'fresh-vegetables'],
  'onion': ['fruits-vegetables', 'fresh-vegetables'],
  'onions': ['fruits-vegetables', 'fresh-vegetables'],
  'garlic': ['fruits-vegetables', 'fresh-vegetables'],
  'spinach': ['fruits-vegetables', 'fresh-vegetables'],
  'lettuce': ['fruits-vegetables', 'fresh-vegetables', 'salads-herbs'],
  'cucumber': ['fruits-vegetables', 'fresh-vegetables'],
  'pepper': ['fruits-vegetables', 'fresh-vegetables'],
  'peppers': ['fruits-vegetables', 'fresh-vegetables'],
  'mushroom': ['fruits-vegetables', 'fresh-vegetables'],
  'mushrooms': ['fruits-vegetables', 'fresh-vegetables'],
  'courgette': ['fruits-vegetables', 'fresh-vegetables'],
  'zucchini': ['fruits-vegetables', 'fresh-vegetables'],
  'aubergine': ['fruits-vegetables', 'fresh-vegetables'],
  'cabbage': ['fruits-vegetables', 'fresh-vegetables'],
  'cauliflower': ['fruits-vegetables', 'fresh-vegetables'],
  'asparagus': ['fruits-vegetables', 'fresh-vegetables'],
  'celery': ['fruits-vegetables', 'fresh-vegetables'],
  'sweetcorn': ['fruits-vegetables', 'fresh-vegetables'],
  'corn': ['fruits-vegetables', 'fresh-vegetables'],
  'beetroot': ['fruits-vegetables', 'fresh-vegetables'],
  'parsnip': ['fruits-vegetables', 'fresh-vegetables'],
  'leek': ['fruits-vegetables', 'fresh-vegetables'],
  'spring onion': ['fruits-vegetables', 'fresh-vegetables'],

  'salad': ['fruits-vegetables', 'salads-herbs'],
  'herb': ['fruits-vegetables', 'salads-herbs'],
  'basil': ['fruits-vegetables', 'salads-herbs'],
  'coriander': ['fruits-vegetables', 'salads-herbs'],
  'parsley': ['fruits-vegetables', 'salads-herbs'],
  'mint': ['fruits-vegetables', 'salads-herbs'],

  // Meat & Poultry
  'chicken': ['meat-poultry', 'chicken'],
  'beef': ['meat-poultry', 'beef'],
  'steak': ['meat-poultry', 'beef'],
  'mince': ['meat-poultry', 'beef'],
  'pork': ['meat-poultry', 'pork'],
  'bacon': ['meat-poultry', 'pork'],
  'sausage': ['meat-poultry', 'pork'],
  'sausages': ['meat-poultry', 'pork'],
  'ham': ['meat-poultry', 'pork'],
  'lamb': ['meat-poultry', 'lamb'],
  'turkey': ['meat-poultry', 'chicken'],
  'duck': ['meat-poultry'],

  // Fish & Seafood
  'salmon': ['fish-seafood', 'fresh-fish'],
  'cod': ['fish-seafood', 'fresh-fish'],
  'haddock': ['fish-seafood', 'fresh-fish'],
  'tuna': ['fish-seafood', 'fresh-fish'],
  'mackerel': ['fish-seafood', 'fresh-fish'],
  'sea bass': ['fish-seafood', 'fresh-fish'],
  'trout': ['fish-seafood', 'fresh-fish'],
  'fish': ['fish-seafood', 'fresh-fish'],
  'prawn': ['fish-seafood', 'prawns-shellfish'],
  'prawns': ['fish-seafood', 'prawns-shellfish'],
  'shrimp': ['fish-seafood', 'prawns-shellfish'],
  'mussel': ['fish-seafood', 'prawns-shellfish'],
  'mussels': ['fish-seafood', 'prawns-shellfish'],
  'crab': ['fish-seafood', 'prawns-shellfish'],
  'lobster': ['fish-seafood', 'prawns-shellfish'],
  'scallop': ['fish-seafood', 'prawns-shellfish'],
  'seafood': ['fish-seafood'],

  // Dairy & Eggs
  'milk': ['dairy-eggs', 'milk-cream'],
  'cream': ['dairy-eggs', 'milk-cream'],
  'cheese': ['dairy-eggs', 'cheese'],
  'cheddar': ['dairy-eggs', 'cheese'],
  'mozzarella': ['dairy-eggs', 'cheese'],
  'parmesan': ['dairy-eggs', 'cheese'],
  'brie': ['dairy-eggs', 'cheese'],
  'egg': ['dairy-eggs', 'eggs'],
  'eggs': ['dairy-eggs', 'eggs'],
  'butter': ['dairy-eggs', 'butter-spreads'],
  'margarine': ['dairy-eggs', 'butter-spreads'],
  'spread': ['dairy-eggs', 'butter-spreads'],
  'yogurt': ['dairy-eggs', 'yogurt'],
  'yoghurt': ['dairy-eggs', 'yogurt'],

  // Bakery
  'bread': ['bakery', 'bread'],
  'loaf': ['bakery', 'bread'],
  'sourdough': ['bakery', 'bread'],
  'wholemeal': ['bakery', 'bread'],
  'roll': ['bakery', 'rolls-baguettes'],
  'rolls': ['bakery', 'rolls-baguettes'],
  'baguette': ['bakery', 'rolls-baguettes'],
  'croissant': ['bakery', 'pastries'],
  'pastry': ['bakery', 'pastries'],
  'pain au chocolat': ['bakery', 'pastries'],
  'danish': ['bakery', 'pastries'],
  'cake': ['bakery', 'cakes-desserts'],
  'muffin': ['bakery', 'cakes-desserts'],
  'brownie': ['bakery', 'cakes-desserts'],
  'tart': ['bakery', 'cakes-desserts'],
  'scone': ['bakery'],
  'bagel': ['bakery', 'rolls-baguettes'],

  // Frozen
  'frozen': ['frozen'],
  'ice cream': ['frozen', 'ice-cream'],
  'frozen pizza': ['frozen', 'frozen-pizza-meals'],
  'pizza': ['frozen', 'frozen-pizza-meals'],
  'fish fingers': ['frozen', 'frozen-meat-fish'],
  'frozen peas': ['frozen', 'frozen-vegetables'],
  'frozen chips': ['frozen', 'frozen-pizza-meals'],
  'frozen berries': ['frozen', 'frozen-vegetables'],

  // Pantry
  'rice': ['pantry', 'rice-pasta'],
  'pasta': ['pantry', 'rice-pasta'],
  'spaghetti': ['pantry', 'rice-pasta'],
  'penne': ['pantry', 'rice-pasta'],
  'noodle': ['pantry', 'rice-pasta'],
  'noodles': ['pantry', 'rice-pasta'],
  'tin': ['pantry', 'tinned-foods'],
  'tinned': ['pantry', 'tinned-foods'],
  'canned': ['pantry', 'tinned-foods'],
  'beans': ['pantry', 'tinned-foods'],
  'baked beans': ['pantry', 'tinned-foods'],
  'chickpeas': ['pantry', 'tinned-foods'],
  'chopped tomatoes': ['pantry', 'tinned-foods'],
  'oil': ['pantry', 'oils-vinegars'],
  'olive oil': ['pantry', 'oils-vinegars'],
  'vinegar': ['pantry', 'oils-vinegars'],
  'sauce': ['pantry', 'sauces-condiments'],
  'ketchup': ['pantry', 'sauces-condiments'],
  'mayonnaise': ['pantry', 'sauces-condiments'],
  'mustard': ['pantry', 'sauces-condiments'],
  'soy sauce': ['pantry', 'sauces-condiments'],
  'cereal': ['pantry', 'cereals-breakfast'],
  'oats': ['pantry', 'cereals-breakfast'],
  'porridge': ['pantry', 'cereals-breakfast'],
  'granola': ['pantry', 'cereals-breakfast'],
  'honey': ['pantry'],
  'sugar': ['pantry'],
  'flour': ['pantry'],
  'stock': ['pantry'],
  'peanut butter': ['pantry'],
  'jam': ['pantry'],
  'coconut milk': ['pantry', 'tinned-foods'],

  // Drinks
  'water': ['drinks', 'water'],
  'sparkling': ['drinks', 'water'],
  'cola': ['drinks', 'soft-drinks'],
  'lemonade': ['drinks', 'soft-drinks'],
  'soda': ['drinks', 'soft-drinks'],
  'fizzy': ['drinks', 'soft-drinks'],
  'juice': ['drinks', 'juices'],
  'orange juice': ['drinks', 'juices'],
  'apple juice': ['drinks', 'juices'],
  'smoothie': ['drinks', 'juices'],
  'tea': ['drinks', 'tea-coffee'],
  'coffee': ['drinks', 'tea-coffee'],
  'instant coffee': ['drinks', 'tea-coffee'],

  // Snacks & Sweets
  'crisps': ['snacks-sweets', 'crisps-nuts'],
  'chips': ['snacks-sweets', 'crisps-nuts'],
  'nuts': ['snacks-sweets', 'crisps-nuts'],
  'popcorn': ['snacks-sweets', 'crisps-nuts'],
  'chocolate': ['snacks-sweets', 'chocolate'],
  'biscuit': ['snacks-sweets', 'biscuits'],
  'biscuits': ['snacks-sweets', 'biscuits'],
  'cookie': ['snacks-sweets', 'biscuits'],
  'cookies': ['snacks-sweets', 'biscuits'],
  'digestive': ['snacks-sweets', 'biscuits'],
  'sweet': ['snacks-sweets', 'sweets'],
  'sweets': ['snacks-sweets', 'sweets'],
  'candy': ['snacks-sweets', 'sweets'],
  'gum': ['snacks-sweets', 'sweets'],
  'tortilla': ['snacks-sweets', 'crisps-nuts'],

  // Alcohol
  'beer': ['alcohol', 'beer-cider'],
  'lager': ['alcohol', 'beer-cider'],
  'ale': ['alcohol', 'beer-cider'],
  'cider': ['alcohol', 'beer-cider'],
  'wine': ['alcohol', 'wine'],
  'red wine': ['alcohol', 'wine'],
  'white wine': ['alcohol', 'wine'],
  'rose': ['alcohol', 'wine'],
  'prosecco': ['alcohol', 'wine'],
  'champagne': ['alcohol', 'wine'],
  'vodka': ['alcohol', 'spirits'],
  'gin': ['alcohol', 'spirits'],
  'whisky': ['alcohol', 'spirits'],
  'rum': ['alcohol', 'spirits'],
  'brandy': ['alcohol', 'spirits'],

  // Household
  'cleaning': ['household', 'cleaning'],
  'detergent': ['household', 'cleaning'],
  'bleach': ['household', 'cleaning'],
  'spray': ['household', 'cleaning'],
  'cloth': ['household', 'cleaning'],
  'washing': ['household', 'laundry'],
  'laundry': ['household', 'laundry'],
  'fabric softener': ['household', 'laundry'],
  'kitchen roll': ['household', 'kitchen-roll-tissues'],
  'tissue': ['household', 'kitchen-roll-tissues'],
  'toilet paper': ['household', 'kitchen-roll-tissues'],

  // Health & Beauty
  'shampoo': ['health-beauty', 'toiletries'],
  'conditioner': ['health-beauty', 'toiletries'],
  'shower gel': ['health-beauty', 'toiletries'],
  'soap': ['health-beauty', 'toiletries'],
  'deodorant': ['health-beauty', 'toiletries'],
  'toothpaste': ['health-beauty', 'dental-care'],
  'toothbrush': ['health-beauty', 'dental-care'],
  'mouthwash': ['health-beauty', 'dental-care'],
  'paracetamol': ['health-beauty', 'medicine'],
  'ibuprofen': ['health-beauty', 'medicine'],
  'vitamin': ['health-beauty', 'medicine'],
  'plaster': ['health-beauty', 'medicine'],

  // Alternatives
  'almond milk': ['dairy-eggs', 'milk-cream'],
  'oat milk': ['dairy-eggs', 'milk-cream'],
  'soya milk': ['dairy-eggs', 'milk-cream'],
  'hummus': ['pantry', 'sauces-condiments'],
  'guacamole': ['pantry', 'sauces-condiments'],
}

export async function POST() {
  const supabaseAdmin = getSupabaseAdmin()

  try {
    // Fetch all products
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, name')

    if (productsError || !products) {
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    // Fetch all categories
    const { data: categories, error: categoriesError } = await supabaseAdmin
      .from('categories')
      .select('id, slug')

    if (categoriesError || !categories) {
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    // Create slug to id map
    const categoryMap = new Map<string, string>()
    categories.forEach(cat => categoryMap.set(cat.slug, cat.id))

    let linkedCount = 0
    const links: { product: string; categories: string[] }[] = []

    for (const product of products) {
      const productNameLower = product.name.toLowerCase()
      const categoryIds = new Set<string>()

      // Find matching categories based on keywords
      for (const [keyword, categorySlugs] of Object.entries(productCategoryMapping)) {
        if (productNameLower.includes(keyword.toLowerCase())) {
          for (const slug of categorySlugs) {
            const catId = categoryMap.get(slug)
            if (catId) {
              categoryIds.add(catId)
            }
          }
        }
      }

      // Insert product_categories entries
      if (categoryIds.size > 0) {
        const categoriesArray = Array.from(categoryIds)
        const productCategories = categoriesArray.map(catId => ({
          product_id: product.id,
          category_id: catId
        }))

        // Delete existing links for this product
        await supabaseAdmin
          .from('product_categories')
          .delete()
          .eq('product_id', product.id)

        // Insert new links
        const { error: insertError } = await supabaseAdmin
          .from('product_categories')
          .insert(productCategories)

        if (!insertError) {
          linkedCount += categoriesArray.length
          links.push({
            product: product.name,
            categories: categoriesArray.map(id => {
              const cat = categories.find(c => c.id === id)
              return cat?.slug || id
            })
          })
        }
      }
    }

    return NextResponse.json({
      message: `Created ${linkedCount} product-category links`,
      linkedProducts: links.length,
      totalLinks: linkedCount,
      details: links
    })
  } catch (error) {
    console.error('Error linking products:', error)
    return NextResponse.json({ error: 'Failed to link products' }, { status: 500 })
  }
}

// GET - Preview product-category mappings
export async function GET() {
  const supabaseAdmin = getSupabaseAdmin()

  const { data: products } = await supabaseAdmin
    .from('products')
    .select('id, name')
    .limit(10)

  const preview = products?.map(p => {
    const nameLower = p.name.toLowerCase()
    const matchedCategories: string[] = []

    for (const [keyword, categorySlugs] of Object.entries(productCategoryMapping)) {
      if (nameLower.includes(keyword.toLowerCase())) {
        matchedCategories.push(...categorySlugs)
      }
    }

    return {
      product: p.name,
      categories: [...new Set(matchedCategories)]
    }
  })

  return NextResponse.json({ preview })
}
