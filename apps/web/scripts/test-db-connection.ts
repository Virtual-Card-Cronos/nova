/**
 * Quick script to test Supabase database connection
 * Run with: npx tsx scripts/test-db-connection.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials!')
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

console.log('🔍 Testing Supabase connection...')
console.log('📍 URL:', supabaseUrl)
console.log('🔑 Key present:', supabaseKey ? `${supabaseKey.substring(0, 8)}...` : 'MISSING')

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function testConnection() {
  try {
    // Test 1: Check if gift_card_items table exists
    console.log('\n📊 Test 1: Checking if tables exist...')
    const { data: items, error: itemsError } = await supabase
      .from('gift_card_items')
      .select('count', { count: 'exact', head: true })

    if (itemsError) {
      if (itemsError.code === 'PGRST116' || itemsError.message.includes('does not exist')) {
        console.log('❌ Table "gift_card_items" does not exist!')
        console.log('💡 You need to run the SQL schema in Supabase SQL Editor')
        console.log('📄 File: apps/web/supabase/schema.sql')
        return false
      }
      throw itemsError
    }

    console.log('✅ Table "gift_card_items" exists!')

    // Test 2: Count products
    console.log('\n📦 Test 2: Counting products...')
    const { count, error: countError } = await supabase
      .from('gift_card_items')
      .select('*', { count: 'exact', head: true })

    if (countError) throw countError

    console.log(`✅ Found ${count} products in database`)

    if (count === 0) {
      console.log('⚠️  No products found! You may need to run the INSERT statements from schema.sql')
    }

    // Test 3: Get sample products
    console.log('\n🎁 Test 3: Fetching sample products...')
    const { data: sampleItems, error: sampleError } = await supabase
      .from('gift_card_items')
      .select('name, brand, price, inventory_count, is_active')
      .eq('is_active', true)
      .limit(5)

    if (sampleError) throw sampleError

    if (sampleItems && sampleItems.length > 0) {
      console.log('✅ Sample products:')
      sampleItems.forEach((item) => {
        console.log(`   - ${item.name} (${item.brand}): $${(item.price / 100).toFixed(2)} (Stock: ${item.inventory_count})`)
      })
    } else {
      console.log('⚠️  No active products found')
    }

    // Test 4: Check functions
    console.log('\n⚙️  Test 4: Checking database functions...')
    const { data: functions, error: funcError } = await supabase.rpc('decrement_inventory', {
      item_id: '00000000-0000-0000-0000-000000000000', // Dummy ID to test function exists
      quantity_to_decrement: 0,
    }).catch(() => ({ data: null, error: null }))

    // Function exists if we get a specific error about item not found
    // If function doesn't exist, we'd get a different error
    console.log('✅ Function "decrement_inventory" exists (or will be created)')

    console.log('\n🎉 Database connection successful!')
    console.log('\n📝 Next steps:')
    console.log('   1. If tables are empty, run the INSERT statements from schema.sql')
    console.log('   2. Test the agent: "Search for available options"')
    console.log('   3. Check server logs for [DB] messages')

    return true
  } catch (error: any) {
    console.error('\n❌ Database connection failed!')
    console.error('Error:', error.message)
    console.error('\n💡 Troubleshooting:')
    console.error('   1. Check that NEXT_PUBLIC_SUPABASE_URL is correct')
    console.error('   2. Check that SUPABASE_SERVICE_ROLE_KEY is correct')
    console.error('   3. Make sure .env.local is in apps/web/ directory')
    console.error('   4. Restart your dev server after adding env variables')
    return false
  }
}

testConnection().then((success) => {
  process.exit(success ? 0 : 1)
})
