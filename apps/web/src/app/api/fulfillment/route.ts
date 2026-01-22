/**
 * Fulfillment API Route
 * Issues gift cards via Gift Up! API after payment confirmation
 * Based on: https://developer.giftup.com/api#introduction
 */

import { NextRequest, NextResponse } from 'next/server'
import { issueGiftCard, getGiftCardByCode } from '@/lib/agent'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transactionHash, giftUpItemId, recipientEmail, externalId } = body

    if (!transactionHash || !giftUpItemId || !recipientEmail) {
      return NextResponse.json(
        { error: 'Missing required fields', required: ['transactionHash', 'giftUpItemId', 'recipientEmail'] },
        { status: 400 }
      )
    }

    // Issue gift card via Gift Up! API
    const order = await issueGiftCard(recipientEmail, giftUpItemId, externalId || transactionHash)

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