/**
 * API Route to fetch gift cards from database
 * Used by Storefront and SuggestedCards components
 */

import { NextResponse } from 'next/server'
import { getAllGiftCardItems } from '@/lib/db/gift-cards'

export async function GET() {
  try {
    console.log('[API] 📦 Fetching gift cards from database...')
    const items = await getAllGiftCardItems()
    console.log('[API] ✅ Retrieved', items.length, 'gift card items')
    
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
    })
  } catch (error) {
    console.error('[API] ❌ Error fetching gift cards:', error)
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
