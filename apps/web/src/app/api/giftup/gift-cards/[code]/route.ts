/**
 * Gift Card by Code API Route
 * Returns gift card information by redemption code
 */

import { NextRequest, NextResponse } from 'next/server'
import { GiftCard } from '@/lib/agent/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params

    if (!code) {
      return NextResponse.json(
        { error: 'Gift card code is required' },
        { status: 400 }
      )
    }

    // This should query the database, but for now return a placeholder
    // TODO: Implement database lookup
    const giftCard: GiftCard = {
      id: `gc-${code}`,
      code,
      balance: 5000, // $50.00 in cents
      currency: 'USD',
      state: 'Active',
    }

    console.log('[API] 📋 Retrieved gift card:', code)

    return NextResponse.json(giftCard)
  } catch (error) {
    console.error('[API] ❌ Error retrieving gift card:', error)
    return NextResponse.json(
      {
        error: 'Failed to retrieve gift card',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
