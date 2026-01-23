/**
 * Purchase API Route - x402 Protocol Implementation
 * Validates agent intent and returns HTTP 402 Payment Required
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateAgentPolicy, getSpendingLimit } from '@/lib/policy'
import { createX402Challenge, createWWWAuthenticateHeader } from '@/lib/facilitator'
import type { PurchaseIntent } from '@/lib/types'

// HTTP Status codes
const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  INTERNAL_SERVER_ERROR: 500,
} as const

// Error messages
const ERROR_MESSAGES = {
  CONTRACT_ERROR: 'Smart contract interaction failed',
  POLICY_VIOLATION: 'Transaction violates agent policy',
} as const

export async function POST(request: NextRequest) {
  try {
    console.log('[Purchase API] 📥 Received purchase request')
    
    // Parse request body
    let body: PurchaseIntent
    try {
      body = await request.json()
    } catch (error) {
      console.error('[Purchase API] ❌ Failed to parse request body:', error)
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }
    
    const { agentId, amount, currency, description, recipient } = body
    console.log('[Purchase API] 📋 Request details:', { agentId, amount, currency, description: description?.substring(0, 50) })

    // Validate required fields (recipient is optional - will default to merchant address)
    if (!agentId || !amount || !currency || !description) {
      return NextResponse.json(
        { error: 'Missing required fields', required: ['agentId', 'amount', 'currency', 'description'] },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    // Validate currency (only USDC supported for now)
    if (currency !== 'USDC') {
      return NextResponse.json(
        { error: 'Unsupported currency. Only USDC is currently supported.' },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    // Validate amount format
    let parsedAmount: bigint
    try {
      parsedAmount = BigInt(amount)
      if (parsedAmount <= 0n) {
        throw new Error('Amount must be positive')
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid amount format. Must be a valid positive integer.' },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    // Validate agent address
    if (!agentId.startsWith('0x') || agentId.length !== 42) {
      return NextResponse.json(
        { error: 'Invalid agent address format' },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    // Validate recipient address if provided (optional - defaults to merchant address)
    const isRecipientInvalid = recipient && 
      typeof recipient === 'string' && 
      recipient.length > 0 && 
      (!recipient.startsWith('0x') || recipient.length !== 42)
    
    if (isRecipientInvalid) {
      return NextResponse.json(
        { error: 'Invalid recipient address format' },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    // Check agent policy on-chain
    let policyApproved: boolean
    try {
      policyApproved = await validateAgentPolicy(agentId, parsedAmount)
    } catch (error) {
      console.error('Policy validation error:', error)
      return NextResponse.json(
        { error: ERROR_MESSAGES.CONTRACT_ERROR },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      )
    }

    // If policy check fails, return forbidden
    if (!policyApproved) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.POLICY_VIOLATION },
        { status: HTTP_STATUS.FORBIDDEN }
      )
    }

    // Policy passed - create x402 challenge
    console.log('[Purchase API] ✅ Policy approved, creating x402 challenge...')
    let challenge
    try {
      // Use facilitator address as recipient (not user's address)
      // If recipient was provided and is valid, use it; otherwise get facilitator address
      const facilitatorRecipient = recipient && recipient.startsWith('0x') && recipient.length === 42 
        ? recipient 
        : undefined // Let createX402Challenge get facilitator address
      
      challenge = await createX402Challenge(
        amount.toString(),
        description,
        facilitatorRecipient,
        'cronos-testnet' // Cronos Testnet
      )
      console.log('[Purchase API] ✅ Challenge created successfully')
      console.log('[Purchase API] 📍 Facilitator recipient:', challenge.resource.recipient)
    } catch (error) {
      console.error('[Purchase API] ❌ Failed to create challenge:', error)
      return NextResponse.json(
        { error: 'Failed to create payment challenge' },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      )
    }

    // Create WWW-Authenticate header
    const wwwAuthenticate = createWWWAuthenticateHeader(challenge)

    // Return HTTP 402 Payment Required
    const response = {
      status: HTTP_STATUS.PAYMENT_REQUIRED,
      challenge,
      headers: {
        'WWW-Authenticate': wwwAuthenticate,
      },
    }

    return new NextResponse(JSON.stringify(response), {
      status: HTTP_STATUS.PAYMENT_REQUIRED,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': wwwAuthenticate,
        'X-Payment-Network': 'cronos',
        'X-Payment-Currency': 'USDC',
        'X-Facilitator-URL': challenge.resource.facilitatorUrl,
      },
    })

  } catch (error) {
    console.error('[Purchase API] ❌ Unexpected error:', error)
    console.error('[Purchase API] Error stack:', error instanceof Error ? error.stack : 'No stack trace')

    // Handle unexpected errors
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}

/**
 * GET endpoint for purchase status or supported options
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  switch (action) {
    case 'supported-networks':
      return NextResponse.json({
        networks: ['cronos', 'cronos_testnet'],
        currencies: ['USDC'],
      })

    case 'policy-limits':
      try {
        const agentId = searchParams.get('agentId')
        if (!agentId) {
          return NextResponse.json(
            { error: 'agentId parameter required' },
            { status: HTTP_STATUS.BAD_REQUEST }
          )
        }

        const limit = await getSpendingLimit(agentId)

        return NextResponse.json({
          agentId,
          spendingLimit: limit.toString(),
          currency: 'USDC',
        })
      } catch (error) {
        console.error('Policy limits error:', error)
        return NextResponse.json(
          { error: 'Failed to fetch policy limits' },
          { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
        )
      }

    default:
      return NextResponse.json(
        { error: 'Invalid action parameter' },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
  }
}