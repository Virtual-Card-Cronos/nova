/**
 * Gift Card Orders API Route
 * Creates orders for gift card fulfillment
 */

import { NextRequest, NextResponse } from 'next/server'
import { GiftCardOrder } from '@/lib/agent/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recipientEmail, items, externalId } = body

    if (!recipientEmail || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields', required: ['recipientEmail', 'items'] },
        { status: 400 }
      )
    }

    // Generate an order ID
    const orderId = `order-${Date.now()}-${Math.random().toString(36).substring(7)}`

    const order: GiftCardOrder = {
      id: orderId,
      recipientEmail,
      items,
      externalId: externalId || orderId,
    }

    console.log('[API] ✅ Created order:', orderId, 'for', recipientEmail)

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('[API] ❌ Error creating order:', error)
    return NextResponse.json(
      {
        error: 'Failed to create order',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
