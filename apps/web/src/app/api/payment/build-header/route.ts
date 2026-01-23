/**
 * Build Payment Header API Route
 * Constructs the x402 payment header from the signed EIP-712 typed data
 */

import { NextRequest, NextResponse } from 'next/server'

// USDC.e contract addresses
const USDC_CONTRACTS: Record<number, string> = {
  25: '0xf951eC28187D9E5Ca673Da8FE6757E6f0Be5F77C',    // Cronos Mainnet
  338: '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0',   // Cronos Testnet
}

// Signature validity duration in seconds (1 hour)
const SIGNATURE_VALIDITY_SECONDS = 3600

interface Eip3009Payload {
  from: string
  to: string
  value: string
  validAfter: number
  validBefore: number
  nonce: string
  signature: string
  asset: string
}

interface Eip3009PaymentHeader {
  x402Version: number
  scheme: 'exact'
  network: 'cronos-mainnet' | 'cronos-testnet'
  payload: Eip3009Payload
}

/**
 * Base64 encode a payment header
 */
function encodePaymentHeader(header: Eip3009PaymentHeader): string {
  const jsonString = JSON.stringify(header)
  return Buffer.from(jsonString).toString('base64')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { from, to, value, validAfter, validBefore, nonce, signature, chainId } = body

    if (!from || !to || !value || !nonce || !signature) {
      return NextResponse.json(
        { error: 'Missing required fields', required: ['from', 'to', 'value', 'nonce', 'signature'] },
        { status: 400 }
      )
    }

    // Default to Cronos testnet
    const networkChainId = chainId || 338
    const usdcContract = USDC_CONTRACTS[networkChainId]
    
    if (!usdcContract) {
      return NextResponse.json(
        { error: 'Unsupported chain' },
        { status: 400 }
      )
    }

    const network: 'cronos-mainnet' | 'cronos-testnet' = networkChainId === 25 ? 'cronos-mainnet' : 'cronos-testnet'

    // Build the EIP-3009 payload
    const payload: Eip3009Payload = {
      from,
      to,
      value: value.toString(),
      validAfter: validAfter || 0,
      validBefore: validBefore || Math.floor(Date.now() / 1000) + SIGNATURE_VALIDITY_SECONDS,
      nonce,
      signature,
      asset: usdcContract,
    }

    // Build the full payment header
    const paymentHeader: Eip3009PaymentHeader = {
      x402Version: 1,
      scheme: 'exact',
      network,
      payload,
    }

    // Encode to base64
    const encodedHeader = encodePaymentHeader(paymentHeader)

    console.log('[Payment] ✅ Built payment header for', from, '->', to, 'amount:', value)

    return NextResponse.json({
      paymentHeader: encodedHeader,
      raw: paymentHeader,
    })
  } catch (error) {
    console.error('Build header error:', error)
    return NextResponse.json(
      {
        error: 'Failed to build payment header',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
