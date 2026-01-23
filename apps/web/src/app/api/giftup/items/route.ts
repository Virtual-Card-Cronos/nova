/**
 * Gift Card Items API Route
 * Returns gift cards from database
 */

import { NextResponse } from 'next/server'
import { getAllGiftCardItems } from '@/lib/db/gift-cards'
import { GiftCardItem } from '@/lib/agent/types'

export async function GET() {
  try {
    const items = await getAllGiftCardItems()
    
    // Convert to GiftCardItem format
    const giftCardItems: GiftCardItem[] = items.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description || undefined,
      price: item.price,
      currency: item.currency,
      isActive: item.is_active,
      inventory_count: item.inventory_count,
      brand: item.brand,
    }))

    console.log('[API] 📦 Returning', giftCardItems.length, 'items from database')
    return NextResponse.json(giftCardItems)
  } catch (error) {
    console.error('[API] ❌ Error fetching items:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch gift card items',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
