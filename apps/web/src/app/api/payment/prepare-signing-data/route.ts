/**
 * Prepare EIP-712 Signing Data API Route
 * Returns the typed data that must be signed by the user's wallet for EIP-3009 TransferWithAuthorization
 */

import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

// Constants for USDC.e contracts
const USDC_CONTRACTS: Record<number, string> = {
  25: '0xf951eC28187D9E5Ca673Da8FE6757E6f0Be5F77C',    // Cronos Mainnet
  338: '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0',   // Cronos Testnet
}

// Network names for the EIP-712 domain
const USDC_NAMES: Record<number, string> = {
  25: 'Bridged USDC (Stargate)',
  338: 'Bridged USDC (Stargate)',
}

// Signature validity duration in seconds (1 hour)
const SIGNATURE_VALIDITY_SECONDS = 3600

/**
 * Generate a cryptographically secure random 32-byte nonce as hex string
 * Uses Node.js crypto.randomBytes which is cryptographically secure
 */
function generateNonce(): string {
  return '0x' + randomBytes(32).toString('hex')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { from, to, value, chainId } = body

    if (!from || !to || !value) {
      return NextResponse.json(
        { error: 'Missing required fields', required: ['from', 'to', 'value'] },
        { status: 400 }
      )
    }

    // Default to Cronos testnet if chainId not provided
    const networkChainId = chainId || 338
    const usdcContract = USDC_CONTRACTS[networkChainId]
    const usdcName = USDC_NAMES[networkChainId]
    
    if (!usdcContract) {
      return NextResponse.json(
        { error: 'Unsupported chain. Use Cronos Mainnet (25) or Cronos Testnet (338)' },
        { status: 400 }
      )
    }

    // Generate timestamps
    const validAfter = 0 // Immediately valid
    const validBefore = Math.floor(Date.now() / 1000) + SIGNATURE_VALIDITY_SECONDS
    
    // Generate unique nonce
    const nonce = generateNonce()

    // Build EIP-712 typed data for TransferWithAuthorization (EIP-3009)
    const domain = {
      name: usdcName,
      version: '2',
      chainId: networkChainId,
      verifyingContract: usdcContract as `0x${string}`,
    }

    const types = {
      TransferWithAuthorization: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'validAfter', type: 'uint256' },
        { name: 'validBefore', type: 'uint256' },
        { name: 'nonce', type: 'bytes32' },
      ],
    }

    const message = {
      from,
      to,
      value: value.toString(),
      validAfter,
      validBefore,
      nonce,
    }

    // Return the typed data that needs to be signed
    return NextResponse.json({
      domain,
      types,
      primaryType: 'TransferWithAuthorization',
      message,
      // Include metadata for building the payment header later
      metadata: {
        chainId: networkChainId,
        usdcContract,
        network: networkChainId === 25 ? 'cronos-mainnet' : 'cronos-testnet',
      },
    })
  } catch (error) {
    console.error('Prepare signing data error:', error)
    return NextResponse.json(
      {
        error: 'Failed to prepare signing data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
