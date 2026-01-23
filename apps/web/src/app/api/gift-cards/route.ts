/**
 * API Route to fetch gift cards from database
 * Used by Storefront and SuggestedCards components
 */

import { NextResponse } from 'next/server'
import { getAllGiftCardItems } from '@/lib/db/gift-cards'

// Enable caching for faster responses
export const revalidate = 60 // Revalidate every 60 seconds
export const dynamic = 'force-dynamic' // Force dynamic rendering for now

export async function GET() {
  const startTime = Date.now()
  try {
    console.log('[API] 📦 Fetching gift cards from database...')
    
    // Add timeout protection
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database query timeout after 10 seconds')), 10000)
    })
    
    const items = await Promise.race([
      getAllGiftCardItems(),
      timeoutPromise,
    ]) as Awaited<ReturnType<typeof getAllGiftCardItems>>
    
    const duration = Date.now() - startTime
    console.log(`[API] ✅ Retrieved ${items.length} gift card items in ${duration}ms`)
    
    if (duration > 2000) {
      console.warn(`[API] ⚠️ Slow query: ${duration}ms (expected < 2000ms)`)
    }
    
    return NextResponse.json({
      success: true,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        brand: item.brand,
        price: item.price,
        currency: item.currency,
        image_url: item.image_url,
        inventory_count: item.inventory_count,
        is_active: item.is_active,
      })),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[API] ❌ Error fetching gift cards (${duration}ms):`, error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        items: [],
      },
      { status: 500 }
    )
  }
}
