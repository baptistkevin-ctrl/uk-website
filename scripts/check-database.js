/**
 * Database Status Check Script
 * Verifies which tables exist in Supabase
 *
 * Usage: node scripts/check-database.js
 */

const https = require('https')

const SUPABASE_URL = 'https://nggkjchmnexdlmmntrtn.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nZ2tqY2htbmV4ZGxtbW50cnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MDAzMjMsImV4cCI6MjA4NDI3NjMyM30.Ss8tAN-4lD1hQYZlobjakNLYcGG9erk99BqQlolQ3O4'

const tables = [
  'profiles',
  'addresses',
  'categories',
  'products',
  'product_categories',
  'vendors',
  'orders',
  'order_items',
  'carts',
  'cart_items',
  'reviews',
  'hero_slides',
  'store_settings',
  'coupons',
  'support_tickets',
  'notifications',
  'newsletter_subscribers',
  'delivery_slots',
  'recently_viewed',
  'stock_alerts',
  'price_history',
  'price_alerts',
  'loyalty_points',
  'points_transactions',
  'fraud_checks',
  'vendor_metrics',
  'product_discounts',
  'notification_preferences',
  'wishlists',
  'abandoned_carts',
  'returns',
  'return_items',
  'store_credits',
  'audit_logs'
]

async function checkTable(tableName) {
  return new Promise((resolve) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${tableName}?select=id&limit=1`)

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => data += chunk)
      res.on('end', () => {
        // 200 = table exists, 404 = not found, 400 = permission (table might exist but no access)
        const exists = res.statusCode === 200 || res.statusCode === 400
        resolve({ table: tableName, exists, status: res.statusCode })
      })
    })

    req.on('error', () => {
      resolve({ table: tableName, exists: false, status: 0 })
    })

    req.end()
  })
}

async function main() {
  console.log('🗄️  UK Grocery Store - Database Status Check\n')
  console.log('Supabase URL:', SUPABASE_URL)
  console.log('=' .repeat(60))
  console.log('')

  const results = []
  let existCount = 0
  let missingCount = 0

  for (const table of tables) {
    const result = await checkTable(table)
    results.push(result)

    if (result.exists) {
      console.log(`✅ ${table}`)
      existCount++
    } else {
      console.log(`❌ ${table} (status: ${result.status})`)
      missingCount++
    }
  }

  console.log('')
  console.log('=' .repeat(60))
  console.log(`\n📊 Summary:`)
  console.log(`   Tables Found: ${existCount}/${tables.length}`)
  console.log(`   Tables Missing: ${missingCount}`)

  if (missingCount > 0) {
    console.log(`\n⚠️  Migration Required!`)
    console.log(`\n📋 To migrate:`);
    console.log(`   1. Open: https://supabase.com/dashboard/project/nggkjchmnexdlmmntrtn/sql/new`)
    console.log(`   2. Copy contents of: supabase/FULL_DATABASE_SETUP.sql`)
    console.log(`   3. Paste and click "Run"`)
  } else {
    console.log(`\n✅ All tables exist! Database is ready.`)
  }

  console.log('')
}

main().catch(console.error)
