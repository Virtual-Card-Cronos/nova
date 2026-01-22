/**
 * Facilitator Submit API Route
 * Uses official @crypto.com/facilitator-client SDK
 * Based on: https://github.com/cronos-labs/x402-examples
 */

import { NextRequest, NextResponse } from 'next/server'
import { submitPaymentRequest } from '@/lib/facilitator'
import type { X402Challenge } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { challenge, signature, userAddress, agentSignature } = body

    if (!challenge || !signature || !userAddress) {
      return NextResponse.json(
        { error: 'Missing required fields', required: ['challenge', 'signature', 'userAddress'] },
        { status: 400 }
      )
    }

    // Validate challenge structure
    const x402Challenge = challenge as X402Challenge
    if (!x402Challenge.scheme || !x402Challenge.resource) {
      return NextResponse.json(
        { error: 'Invalid challenge format' },
        { status: 400 }
      )
    }

    // Submit payment request using facilitator client
    const result = await submitPaymentRequest(
      {
        challenge: x402Challenge,
        signature,
        userAddress,
        agentSignature: agentSignature || '',
      },
      signature
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Payment submission failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      transactionHash: result.transactionHash,
    })
  } catch (error) {
    console.error('Facilitator submit error:', error)
    return NextResponse.json(
      {
        error: 'Failed to submit payment',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}