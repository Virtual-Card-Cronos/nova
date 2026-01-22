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
    // Parse request body
    const body = await request.json()
    const { agentId, amount, currency, description, recipient }: PurchaseIntent = body

    // Validate required fields
    if (!agentId || !amount || !currency || !description || !recipient) {
      return NextResponse.json(
        { error: 'Missing required fields', required: ['agentId', 'amount', 'currency', 'description', 'recipient'] },
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

    // Validate recipient address
    if (!recipient.startsWith('0x') || recipient.length !== 42) {
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
    const challenge = await createX402Challenge(
      amount.toString(),
      description,
      recipient,
      'cronos-testnet' // Cronos Testnet
    )

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
    console.error('Purchase API error:', error)

    // Handle unexpected errors
    return NextResponse.json(
      { error: 'Internal server error' },
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