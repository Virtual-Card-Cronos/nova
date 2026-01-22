/**
 * Transaction Status API Route
 * Checks the status of a payment transaction on-chain
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkPaymentStatus } from '@/lib/facilitator'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const hash = searchParams.get('hash')

    if (!hash) {
      return NextResponse.json(
        { error: 'Missing transaction hash parameter' },
        { status: 400 }
      )
    }

    // Validate hash format
    if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) {
      return NextResponse.json(
        { error: 'Invalid transaction hash format' },
        { status: 400 }
      )
    }

    const status = await checkPaymentStatus(hash)

    return NextResponse.json({
      status: status.status,
      blockNumber: status.blockNumber,
      confirmations: status.confirmations,
      transactionHash: hash,
    })
  } catch (error) {
    console.error('Transaction status check error:', error)
    return NextResponse.json(
      {
        error: 'Failed to check transaction status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
