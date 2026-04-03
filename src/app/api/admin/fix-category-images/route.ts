import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/verify'

export const dynamic = 'force-dynamic'

// Category image mapping with high-quality Unsplash images
const categoryImages: Record<string, string> = {
  // Main categories
  'fruits-vegetables': 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&q=80',
  'meat-poultry': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&q=80',
  'fish-seafood': 'https://images.unsplash.com/photo-1510130387422-82bed34b37e9?w=800&q=80',
  'dairy-eggs': 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800&q=80',
  'bakery': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
  'frozen': 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800&q=80',
  'pantry': 'https://images.unsplash.com/photo-1584473457493-a2c8a5d22d93?w=800&q=80',
  'drinks': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&q=80',
  'snacks-sweets': 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=800&q=80',
  'alcohol': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80',
  'household': 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=800&q=80',
  'health-beauty': 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&q=80',

  // Alternative slugs
  'beer-cider': 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=800&q=80',
  'wine-champagne': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80',
  'spirits-liqueurs': 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=800&q=80',
  'ready-meals': 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=800&q=80',
  'pizza-garlic-bread': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
  'chips-wedges': 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=800&q=80',
  'desserts-ice-cream': 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=800&q=80',
  'cereals-breakfast': 'https://images.unsplash.com/photo-1517456793572-1d8efd6dc135?w=800&q=80',
  'rice-pasta-noodles': 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=800&q=80',
  'tinned-food': 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800&q=80',
  'world-foods': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
  'home-baking': 'https://images.unsplash.com/photo-1486427944544-d2c6128c5c92?w=800&q=80',
  'fizzy-drinks': 'https://images.unsplash.com/photo-1527960471264-932f39eb5846?w=800&q=80',
  'fruit-juice-smoothies': 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=800&q=80',
  'squash-cordials': 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800&q=80',
  'energy-sports-drinks': 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=800&q=80',
  'crisps-snacks': 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=800&q=80',
  'sweets-chocolate': 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=800&q=80',
  'pet-food': 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800&q=80',
  'baby-products': 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&q=80',
  'toiletries-skincare': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80',
  'haircare': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80',
  'dental-care': 'https://images.unsplash.com/photo-1559467274-3fbf663c4a73?w=800&q=80',
  'cleaning-household': 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&q=80',
  'kitchen-accessories': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
  'fresh-meat': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&q=80',
  'cooked-meats': 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&q=80',
  'fresh-seafood': 'https://images.unsplash.com/photo-1534422298391-e4f8c172789a?w=800&q=80',

  // Subcategories - Fruits & Vegetables
  'fresh-fruits': 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=800&q=80',
  'fresh-vegetables': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80',
  'salads-herbs': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
  'organic-produce': 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&q=80',

  // Subcategories - Meat & Poultry
  'beef': 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=800&q=80',
  'chicken': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&q=80',
  'pork': 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=800&q=80',
  'lamb': 'https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=800&q=80',

  // Subcategories - Fish & Seafood
  'fresh-fish': 'https://images.unsplash.com/photo-1534422298391-e4f8c172789a?w=800&q=80',
  'shellfish': 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800&q=80',
  'smoked-fish': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80',

  // Subcategories - Dairy & Eggs
  'milk-cream': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800&q=80',
  'cheese': 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=800&q=80',
  'butter-spreads': 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=800&q=80',
  'eggs': 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=800&q=80',
  'yogurt': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80',

  // Subcategories - Bakery
  'bread': 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=800&q=80',
  'pastries': 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&q=80',
  'cakes': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80',

  // Subcategories - Frozen
  'frozen-vegetables': 'https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=800&q=80',
  'frozen-meals': 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=800&q=80',
  'ice-cream': 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=800&q=80',
  'frozen-meat': 'https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=800&q=80',

  // Subcategories - Pantry
  'pasta-rice': 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=800&q=80',
  'canned-goods': 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800&q=80',
  'cooking-oils': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&q=80',
  'sauces-condiments': 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=800&q=80',
  'spices': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80',

  // Subcategories - Drinks
  'soft-drinks': 'https://images.unsplash.com/photo-1527960471264-932f39eb5846?w=800&q=80',
  'juices': 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=800&q=80',
  'water': 'https://images.unsplash.com/photo-1560023907-5f339617ea30?w=800&q=80',
  'tea-coffee': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&q=80',

  // Subcategories - Snacks & Sweets
  'crisps': 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=800&q=80',
  'chocolate': 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=800&q=80',
  'biscuits': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&q=80',
  'nuts-dried-fruits': 'https://images.unsplash.com/photo-1536591375620-9acd47cde682?w=800&q=80',

  // Subcategories - Alcohol
  'beer': 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=800&q=80',
  'wine': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80',
  'spirits': 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=800&q=80',

  // Subcategories - Household
  'cleaning': 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&q=80',
  'laundry': 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800&q=80',
  'kitchen-supplies': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',

  // Subcategories - Health & Beauty
  'toiletries': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80',
  'skincare': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80',
  'medicines': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80',
}

export async function POST() {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.error!

  try {
    const supabase = getSupabaseAdmin()

    // Fetch all categories
    const { data: categories, error: fetchError } = await supabase
      .from('categories')
      .select('id, slug, image_url')

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    let updated = 0
    let skipped = 0

    // Update each category with an image
    for (const category of categories || []) {
      const imageUrl = categoryImages[category.slug]

      if (imageUrl) {
        const { error: updateError } = await supabase
          .from('categories')
          .update({ image_url: imageUrl })
          .eq('id', category.id)

        if (updateError) {
          console.error(`Failed to update ${category.slug}:`, updateError)
          skipped++
        } else {
          updated++
        }
      } else {
        skipped++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updated} categories with images, skipped ${skipped}`,
      updated,
      skipped,
    })
  } catch (error) {
    console.error('Error fixing category images:', error)
    return NextResponse.json(
      { error: 'Failed to fix category images' },
      { status: 500 }
    )
  }
}
