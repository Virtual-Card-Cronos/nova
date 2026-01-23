/**
 * Fulfillment API Route
 * Issues gift cards via database after payment confirmation
 */

import { NextRequest, NextResponse } from 'next/server'
import { issueGiftCard, getGiftCardByCode } from '@/lib/agent'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transactionHash, giftCardItemId, recipientEmail, userAddress } = body

    if (!transactionHash || !giftCardItemId || !recipientEmail || !userAddress) {
      return NextResponse.json(
        { error: 'Missing required fields', required: ['transactionHash', 'giftCardItemId', 'recipientEmail', 'userAddress'] },
        { status: 400 }
      )
    }

    // Issue gift card via database (decrements inventory automatically)
    const order = await issueGiftCard(recipientEmail, giftCardItemId, userAddress, transactionHash)

    return NextResponse.json({
      success: true,
      orderId: order.id,
      externalId: order.externalId,
      message: 'Gift card issued successfully',
    })
  } catch (error) {
    console.error('Fulfillment error:', error)
    return NextResponse.json(
      {
        error: 'Failed to issue gift card',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to retrieve gift card by code
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: 'code parameter required' }, { status: 400 })
    }

    const giftCard = await getGiftCardByCode(code)

    if (!giftCard) {
      return NextResponse.json({ error: 'Gift card not found' }, { status: 404 })
    }

    return NextResponse.json(giftCard)
  } catch (error) {
    console.error('Get gift card error:', error)
    return NextResponse.json(
      {
        error: 'Failed to retrieve gift card',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}