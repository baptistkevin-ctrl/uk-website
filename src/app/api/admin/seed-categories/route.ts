import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/verify'
import { logger } from '@/lib/utils/logger'

const log = logger.child({ context: 'api:admin:seed-categories' })

export const dynamic = 'force-dynamic'

// Default grocery categories with Unsplash images
const defaultCategories = [
  {
    name: 'Fruits & Vegetables',
    slug: 'fruits-vegetables',
    description: 'Fresh fruits and vegetables delivered to your door',
    image_url: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&h=400&fit=crop',
    display_order: 1,
    subcategories: [
      { name: 'Fresh Fruits', slug: 'fresh-fruits', description: 'Apples, bananas, oranges and more', image_url: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&h=400&fit=crop' },
      { name: 'Fresh Vegetables', slug: 'fresh-vegetables', description: 'Carrots, broccoli, peppers and more', image_url: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=400&h=400&fit=crop' },
      { name: 'Salads & Herbs', slug: 'salads-herbs', description: 'Fresh salad leaves and herbs', image_url: 'https://images.unsplash.com/photo-1556801712-76c8eb07bbc9?w=400&h=400&fit=crop' },
    ]
  },
  {
    name: 'Meat & Poultry',
    slug: 'meat-poultry',
    description: 'Quality fresh meat and poultry',
    image_url: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&h=400&fit=crop',
    display_order: 2,
    subcategories: [
      { name: 'Chicken', slug: 'chicken', description: 'Fresh chicken breasts, thighs and whole chickens', image_url: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&h=400&fit=crop' },
      { name: 'Beef', slug: 'beef', description: 'Steaks, mince and joints', image_url: 'https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=400&h=400&fit=crop' },
      { name: 'Pork', slug: 'pork', description: 'Chops, bacon and sausages', image_url: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400&h=400&fit=crop' },
      { name: 'Lamb', slug: 'lamb', description: 'Lamb chops, mince and joints', image_url: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&h=400&fit=crop' },
    ]
  },
  {
    name: 'Fish & Seafood',
    slug: 'fish-seafood',
    description: 'Fresh and frozen fish and seafood',
    image_url: 'https://images.unsplash.com/photo-1510130387422-82bed34b37e9?w=400&h=400&fit=crop',
    display_order: 3,
    subcategories: [
      { name: 'Fresh Fish', slug: 'fresh-fish', description: 'Salmon, cod, haddock and more', image_url: 'https://images.unsplash.com/photo-1499125562588-29fb8a56b5d5?w=400&h=400&fit=crop' },
      { name: 'Prawns & Shellfish', slug: 'prawns-shellfish', description: 'Prawns, mussels and more', image_url: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400&h=400&fit=crop' },
    ]
  },
  {
    name: 'Dairy & Eggs',
    slug: 'dairy-eggs',
    description: 'Milk, cheese, eggs and dairy products',
    image_url: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400&h=400&fit=crop',
    display_order: 4,
    subcategories: [
      { name: 'Milk & Cream', slug: 'milk-cream', description: 'Fresh milk, cream and milk alternatives', image_url: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop' },
      { name: 'Cheese', slug: 'cheese', description: 'Cheddar, mozzarella and specialty cheeses', image_url: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&h=400&fit=crop' },
      { name: 'Eggs', slug: 'eggs', description: 'Free range and organic eggs', image_url: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&h=400&fit=crop' },
      { name: 'Butter & Spreads', slug: 'butter-spreads', description: 'Butter, margarine and spreads', image_url: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&h=400&fit=crop' },
      { name: 'Yogurt', slug: 'yogurt', description: 'Greek, natural and flavoured yogurts', image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop' },
    ]
  },
  {
    name: 'Bakery',
    slug: 'bakery',
    description: 'Fresh bread, cakes and pastries',
    image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop',
    display_order: 5,
    subcategories: [
      { name: 'Bread', slug: 'bread', description: 'White, wholemeal and specialty breads', image_url: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400&h=400&fit=crop' },
      { name: 'Rolls & Baguettes', slug: 'rolls-baguettes', description: 'Fresh rolls and baguettes', image_url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=400&fit=crop' },
      { name: 'Cakes & Desserts', slug: 'cakes-desserts', description: 'Cakes, tarts and sweet treats', image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop' },
      { name: 'Pastries', slug: 'pastries', description: 'Croissants, pain au chocolat and more', image_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=400&fit=crop' },
    ]
  },
  {
    name: 'Frozen',
    slug: 'frozen',
    description: 'Frozen foods and ice cream',
    image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=400&fit=crop',
    display_order: 6,
    subcategories: [
      { name: 'Frozen Vegetables', slug: 'frozen-vegetables', description: 'Peas, sweetcorn and mixed veg', image_url: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=400&h=400&fit=crop' },
      { name: 'Frozen Meat & Fish', slug: 'frozen-meat-fish', description: 'Frozen chicken, fish fingers and more', image_url: 'https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=400&h=400&fit=crop' },
      { name: 'Ice Cream', slug: 'ice-cream', description: 'Ice cream tubs, lollies and desserts', image_url: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400&h=400&fit=crop' },
      { name: 'Frozen Pizza & Meals', slug: 'frozen-pizza-meals', description: 'Ready meals and pizzas', image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop' },
    ]
  },
  {
    name: 'Pantry',
    slug: 'pantry',
    description: 'Cupboard essentials and dry goods',
    image_url: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&h=400&fit=crop',
    display_order: 7,
    subcategories: [
      { name: 'Rice & Pasta', slug: 'rice-pasta', description: 'Rice, pasta, noodles and grains', image_url: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=400&h=400&fit=crop' },
      { name: 'Tinned Foods', slug: 'tinned-foods', description: 'Beans, tomatoes and canned goods', image_url: 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=400&h=400&fit=crop' },
      { name: 'Oils & Vinegars', slug: 'oils-vinegars', description: 'Olive oil, vegetable oil and vinegars', image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop' },
      { name: 'Sauces & Condiments', slug: 'sauces-condiments', description: 'Ketchup, mayonnaise and cooking sauces', image_url: 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=400&h=400&fit=crop' },
      { name: 'Cereals & Breakfast', slug: 'cereals-breakfast', description: 'Cereals, porridge and breakfast items', image_url: 'https://images.unsplash.com/photo-1521483451569-e33803c0330c?w=400&h=400&fit=crop' },
    ]
  },
  {
    name: 'Drinks',
    slug: 'drinks',
    description: 'Soft drinks, juices and hot drinks',
    image_url: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=400&fit=crop',
    display_order: 8,
    subcategories: [
      { name: 'Water', slug: 'water', description: 'Still and sparkling water', image_url: 'https://images.unsplash.com/photo-1560023907-5f339617ea30?w=400&h=400&fit=crop' },
      { name: 'Soft Drinks', slug: 'soft-drinks', description: 'Cola, lemonade and fizzy drinks', image_url: 'https://images.unsplash.com/photo-1527960471264-932f39eb5846?w=400&h=400&fit=crop' },
      { name: 'Juices', slug: 'juices', description: 'Orange juice, apple juice and smoothies', image_url: 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=400&h=400&fit=crop' },
      { name: 'Tea & Coffee', slug: 'tea-coffee', description: 'Tea bags, ground coffee and instant', image_url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop' },
    ]
  },
  {
    name: 'Snacks & Sweets',
    slug: 'snacks-sweets',
    description: 'Crisps, chocolate and confectionery',
    image_url: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&h=400&fit=crop',
    display_order: 9,
    subcategories: [
      { name: 'Crisps & Nuts', slug: 'crisps-nuts', description: 'Crisps, popcorn and nuts', image_url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&h=400&fit=crop' },
      { name: 'Chocolate', slug: 'chocolate', description: 'Chocolate bars and boxes', image_url: 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=400&h=400&fit=crop' },
      { name: 'Biscuits', slug: 'biscuits', description: 'Digestives, cookies and biscuit bars', image_url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&h=400&fit=crop' },
      { name: 'Sweets', slug: 'sweets', description: 'Sweets, mints and chewing gum', image_url: 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400&h=400&fit=crop' },
    ]
  },
  {
    name: 'Alcohol',
    slug: 'alcohol',
    description: 'Beer, wine and spirits',
    image_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=400&fit=crop',
    display_order: 10,
    subcategories: [
      { name: 'Beer & Cider', slug: 'beer-cider', description: 'Lager, ale and cider', image_url: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&h=400&fit=crop' },
      { name: 'Wine', slug: 'wine', description: 'Red, white and rose wines', image_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=400&fit=crop' },
      { name: 'Spirits', slug: 'spirits', description: 'Vodka, gin, whisky and more', image_url: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&h=400&fit=crop' },
    ]
  },
  {
    name: 'Household',
    slug: 'household',
    description: 'Cleaning and household essentials',
    image_url: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&h=400&fit=crop',
    display_order: 11,
    subcategories: [
      { name: 'Cleaning', slug: 'cleaning', description: 'Detergents, sprays and cloths', image_url: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=400&h=400&fit=crop' },
      { name: 'Laundry', slug: 'laundry', description: 'Washing powder, fabric softener', image_url: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400&h=400&fit=crop' },
      { name: 'Kitchen Roll & Tissues', slug: 'kitchen-roll-tissues', description: 'Kitchen roll, tissues and toilet paper', image_url: 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=400&h=400&fit=crop' },
    ]
  },
  {
    name: 'Health & Beauty',
    slug: 'health-beauty',
    description: 'Personal care and health products',
    image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop',
    display_order: 12,
    subcategories: [
      { name: 'Toiletries', slug: 'toiletries', description: 'Shampoo, shower gel and soap', image_url: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop' },
      { name: 'Dental Care', slug: 'dental-care', description: 'Toothpaste, brushes and mouthwash', image_url: 'https://images.unsplash.com/photo-1559589689-577aabd1db4f?w=400&h=400&fit=crop' },
      { name: 'Medicine', slug: 'medicine', description: 'Pain relief, cold remedies and vitamins', image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop' },
    ]
  },
]

export async function POST() {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.error!

  const supabaseAdmin = getSupabaseAdmin()

  try {
    let addedCount = 0
    const addedCategories: string[] = []

    for (const category of defaultCategories) {
      // Check if parent category already exists
      const { data: existing } = await supabaseAdmin
        .from('categories')
        .select('id')
        .eq('slug', category.slug)
        .single()

      let parentId: string

      if (existing) {
        parentId = existing.id
      } else {
        // Insert parent category
        const { data: parentData, error: parentError } = await supabaseAdmin
          .from('categories')
          .insert({
            name: category.name,
            slug: category.slug,
            description: category.description,
            image_url: category.image_url,
            display_order: category.display_order,
            is_active: true,
          })
          .select()
          .single()

        if (parentError) {
          log.error('Error inserting ${category.name}', { error: parentError instanceof Error ? parentError.message : String(parentError) })
          continue
        }

        parentId = parentData.id
        addedCount++
        addedCategories.push(category.name)
      }

      // Insert subcategories
      if (category.subcategories) {
        for (let i = 0; i < category.subcategories.length; i++) {
          const sub = category.subcategories[i]

          // Check if subcategory exists
          const { data: existingSub } = await supabaseAdmin
            .from('categories')
            .select('id')
            .eq('slug', sub.slug)
            .single()

          if (!existingSub) {
            const { error: subError } = await supabaseAdmin
              .from('categories')
              .insert({
                name: sub.name,
                slug: sub.slug,
                description: sub.description,
                image_url: sub.image_url,
                parent_id: parentId,
                display_order: i + 1,
                is_active: true,
              })

            if (!subError) {
              addedCount++
              addedCategories.push(`  - ${sub.name}`)
            }
          }
        }
      }
    }

    return NextResponse.json({
      message: `Added ${addedCount} categories`,
      added: addedCount,
      categories: addedCategories
    })
  } catch (error) {
    log.error('Error seeding categories', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Failed to seed categories' }, { status: 500 })
  }
}

// GET - Preview categories that would be added
export async function GET() {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.error!

  return NextResponse.json({
    categories: defaultCategories.map(cat => ({
      name: cat.name,
      subcategories: cat.subcategories?.map(s => s.name) || []
    }))
  })
}
