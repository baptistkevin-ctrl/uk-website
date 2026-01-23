import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

// Grocery-related Unsplash images (free to use)
const groceryImages: Record<string, string> = {
  // Bread & Bakery
  'sourdough': 'https://images.unsplash.com/photo-1585478259715-876acc5be8fc?w=400&h=400&fit=crop',
  'bread': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop',
  'baguette': 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400&h=400&fit=crop',
  'croissant': 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=400&fit=crop',
  'bagel': 'https://images.unsplash.com/photo-1585535936432-734a9cff5fdb?w=400&h=400&fit=crop',

  // Dairy & Eggs
  'milk': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop',
  'eggs': 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&h=400&fit=crop',
  'egg': 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&h=400&fit=crop',
  'cheese': 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&h=400&fit=crop',
  'cheddar': 'https://images.unsplash.com/photo-1618164436241-4473940d1f5c?w=400&h=400&fit=crop',
  'butter': 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&h=400&fit=crop',
  'yogurt': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop',
  'cream': 'https://images.unsplash.com/photo-1559598467-f8b76c8155d0?w=400&h=400&fit=crop',

  // Meat & Fish
  'chicken': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&h=400&fit=crop',
  'beef': 'https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=400&h=400&fit=crop',
  'steak': 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400&h=400&fit=crop',
  'salmon': 'https://images.unsplash.com/photo-1499125562588-29fb8a56b5d5?w=400&h=400&fit=crop',
  'fish': 'https://images.unsplash.com/photo-1510130387422-82bed34b37e9?w=400&h=400&fit=crop',
  'bacon': 'https://images.unsplash.com/photo-1606851091851-e8c8c0fca5ba?w=400&h=400&fit=crop',
  'sausage': 'https://images.unsplash.com/photo-1601628828688-632f38a5a7d0?w=400&h=400&fit=crop',
  'pork': 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400&h=400&fit=crop',

  // Fruits
  'apple': 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&h=400&fit=crop',
  'banana': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=400&fit=crop',
  'orange': 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=400&h=400&fit=crop',
  'strawberry': 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&h=400&fit=crop',
  'grape': 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400&h=400&fit=crop',
  'lemon': 'https://images.unsplash.com/photo-1582087463261-ddea03f80f5d?w=400&h=400&fit=crop',
  'avocado': 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400&h=400&fit=crop',
  'mango': 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&h=400&fit=crop',
  'blueberry': 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=400&h=400&fit=crop',
  'raspberry': 'https://images.unsplash.com/photo-1577069861033-55d04cec4ef5?w=400&h=400&fit=crop',
  'peach': 'https://images.unsplash.com/photo-1629226182277-a07be488b3f2?w=400&h=400&fit=crop',
  'pear': 'https://images.unsplash.com/photo-1514756331096-242fdeb70d4a?w=400&h=400&fit=crop',
  'watermelon': 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&h=400&fit=crop',
  'pineapple': 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=400&h=400&fit=crop',

  // Vegetables
  'broccoli': 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&h=400&fit=crop',
  'carrot': 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&h=400&fit=crop',
  'tomato': 'https://images.unsplash.com/photo-1546470427-e26264be0b11?w=400&h=400&fit=crop',
  'potato': 'https://images.unsplash.com/photo-1518977676601-b53f82ber31f?w=400&h=400&fit=crop',
  'onion': 'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=400&h=400&fit=crop',
  'garlic': 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=400&h=400&fit=crop',
  'spinach': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&h=400&fit=crop',
  'lettuce': 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400&h=400&fit=crop',
  'cucumber': 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=400&h=400&fit=crop',
  'pepper': 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400&h=400&fit=crop',
  'mushroom': 'https://images.unsplash.com/photo-1504545102780-26774c1bb073?w=400&h=400&fit=crop',
  'corn': 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&h=400&fit=crop',
  'cabbage': 'https://images.unsplash.com/photo-1598030343246-eec71cb44231?w=400&h=400&fit=crop',
  'celery': 'https://images.unsplash.com/photo-1580391564590-aeca65c5e2d3?w=400&h=400&fit=crop',
  'asparagus': 'https://images.unsplash.com/photo-1515471209610-dae1c92d8777?w=400&h=400&fit=crop',
  'zucchini': 'https://images.unsplash.com/photo-1563252722-6434563a985d?w=400&h=400&fit=crop',

  // Beverages
  'coffee': 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop',
  'tea': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop',
  'juice': 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=400&h=400&fit=crop',
  'water': 'https://images.unsplash.com/photo-1560023907-5f339617ea30?w=400&h=400&fit=crop',
  'wine': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=400&fit=crop',
  'beer': 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&h=400&fit=crop',
  'soda': 'https://images.unsplash.com/photo-1527960471264-932f39eb5846?w=400&h=400&fit=crop',

  // Pantry
  'rice': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop',
  'pasta': 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=400&h=400&fit=crop',
  'cereal': 'https://images.unsplash.com/photo-1521483451569-e33803c0330c?w=400&h=400&fit=crop',
  'oats': 'https://images.unsplash.com/photo-1614961233913-a5113a4a34ed?w=400&h=400&fit=crop',
  'flour': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=400&fit=crop',
  'sugar': 'https://images.unsplash.com/photo-1581441117193-63e8f0f7c5e6?w=400&h=400&fit=crop',
  'honey': 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&h=400&fit=crop',
  'oil': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop',
  'olive': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop',
  'sauce': 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=400&h=400&fit=crop',
  'ketchup': 'https://images.unsplash.com/photo-1461009683693-342af2f2d6ce?w=400&h=400&fit=crop',

  // Snacks
  'chips': 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&h=400&fit=crop',
  'chocolate': 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=400&h=400&fit=crop',
  'cookie': 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&h=400&fit=crop',
  'candy': 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400&h=400&fit=crop',
  'nuts': 'https://images.unsplash.com/photo-1536816579748-4ecb3f03d72a?w=400&h=400&fit=crop',
  'popcorn': 'https://images.unsplash.com/photo-1585238342070-61e1e768b1ff?w=400&h=400&fit=crop',

  // Frozen
  'ice cream': 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400&h=400&fit=crop',
  'frozen': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=400&fit=crop',
  'pizza': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop',
}

// Default grocery image
const defaultImage = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop'

function findImageForProduct(productName: string): string {
  const nameLower = productName.toLowerCase()

  // Check each keyword
  for (const [keyword, imageUrl] of Object.entries(groceryImages)) {
    if (nameLower.includes(keyword)) {
      return imageUrl
    }
  }

  return defaultImage
}

// POST - Update all products with placeholder images
export async function POST() {
  const supabaseAdmin = getSupabaseAdmin()

  try {
    // Get all products
    const { data: products, error: fetchError } = await supabaseAdmin
      .from('products')
      .select('id, name, image_url')

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ message: 'No products found', updated: 0 })
    }

    let updated = 0
    const updates: { id: string; name: string; oldUrl: string; newUrl: string }[] = []

    // Update each product
    for (const product of products) {
      // Only update if image_url is missing or is a relative path
      if (!product.image_url || product.image_url.startsWith('/')) {
        const newImageUrl = findImageForProduct(product.name)

        const { error: updateError } = await supabaseAdmin
          .from('products')
          .update({ image_url: newImageUrl })
          .eq('id', product.id)

        if (!updateError) {
          updated++
          updates.push({
            id: product.id,
            name: product.name,
            oldUrl: product.image_url || 'none',
            newUrl: newImageUrl
          })
        }
      }
    }

    return NextResponse.json({
      message: `Updated ${updated} products with placeholder images`,
      updated,
      total: products.length,
      updates
    })
  } catch (error) {
    console.error('Error updating images:', error)
    return NextResponse.json({ error: 'Failed to update images' }, { status: 500 })
  }
}

// GET - Preview what would be updated
export async function GET() {
  const supabaseAdmin = getSupabaseAdmin()

  try {
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('id, name, image_url')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const needsUpdate = products?.filter(p => !p.image_url || p.image_url.startsWith('/')) || []

    const preview = needsUpdate.map(p => ({
      id: p.id,
      name: p.name,
      currentUrl: p.image_url || 'none',
      newUrl: findImageForProduct(p.name)
    }))

    return NextResponse.json({
      total: products?.length || 0,
      needsUpdate: needsUpdate.length,
      preview
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to preview' }, { status: 500 })
  }
}
