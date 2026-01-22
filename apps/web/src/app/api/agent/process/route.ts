/**
 * Agent Process API Route
 * Handles agent requests using Crypto.com AI SDK
 */

import { NextRequest, NextResponse } from 'next/server'
import { processAgentRequest } from '@/lib/agent'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, userAddress, context } = body

    console.log('[API] /api/agent/process - Request received')
    console.log('[API] Message:', message)
    console.log('[API] User address:', userAddress)

    if (!message || typeof message !== 'string') {
      console.error('[API] ❌ Invalid message')
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 })
    }

    if (!userAddress || typeof userAddress !== 'string') {
      console.error('[API] ❌ Invalid userAddress')
      return NextResponse.json({ error: 'Invalid userAddress' }, { status: 400 })
    }

    console.log('[API] 🚀 Processing agent request...')
    const response = await processAgentRequest({
      message,
      userAddress,
      context,
    })

    console.log('[API] ✅ Agent response:', response.intent, response.confidence)
    return NextResponse.json(response)
  } catch (error) {
    console.error('[API] ❌ Agent process error:', error)
    console.error('[API] Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      {
        error: 'Failed to process agent request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}