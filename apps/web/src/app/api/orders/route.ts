/**
 * Orders API Route
 * Fetches orders for a specific user address
 */

import { NextRequest, NextResponse } from 'next/server'
import { getOrdersByUserAddress, getOrderWithDetails } from '@/lib/db/gift-cards'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userAddress = searchParams.get('userAddress')
    const orderId = searchParams.get('orderId')

    if (orderId) {
      // Get specific order with details
      const orderDetails = await getOrderWithDetails(orderId)
      if (!orderDetails) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }
      return NextResponse.json({
        success: true,
        order: orderDetails,
      })
    }

    if (!userAddress) {
      return NextResponse.json(
        { error: 'userAddress parameter required' },
        { status: 400 }
      )
    }

    const orders = await getOrdersByUserAddress(userAddress)

    return NextResponse.json({
      success: true,
      orders,
    })
  } catch (error) {
    console.error('[API] ❌ Error fetching orders:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch orders',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
