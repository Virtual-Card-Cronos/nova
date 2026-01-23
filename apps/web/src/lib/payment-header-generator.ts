/**
 * Client-side Payment Header Generator
 * Based on Cronos X402 Facilitator documentation
 * https://docs.cronos.org/cronos-x402-facilitator/quick-start-for-buyers
 * 
 * Generates EIP-3009 payment headers for x402 protocol
 */

import type { Account } from 'thirdweb/wallets'
import { ethers } from 'ethers'

// Network constants
const TOKEN_NAME = 'Bridged USDC (Stargate)'
const TOKEN_VERSION = '1'

// Testnet devUSDC.e contract (for x402 facilitator on testnet)
const USDC_TESTNET = '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0' // This is devUSDC.e on testnet
// Mainnet USDC.e contract  
const USDC_MAINNET = '0xf951eC28187D9E5Ca673Da8FE6757E6f0Be5F77C'

/**
 * Generates a random 32-byte nonce for EIP-3009 authorization
 */
export function generateNonce(): string {
  return ethers.hexlify(ethers.randomBytes(32))
}

/**
 * Creates a signed payment header for x402 payments
 * Based on the official Cronos X402 documentation
 */
export async function createPaymentHeader({
  account,
  paymentRequirements,
  network = 'cronos-testnet',
}: {
  account: Account
  paymentRequirements: {
    payTo: string
    asset?: string
    maxAmountRequired: string
    maxTimeoutSeconds?: number
    scheme?: string
  }
  network?: string
}): Promise<string> {
  const { payTo, maxAmountRequired, maxTimeoutSeconds = 300, scheme = 'exact' } = paymentRequirements
  
  // Determine USDC contract address based on network
  const asset = paymentRequirements.asset || (network === 'cronos-testnet' ? USDC_TESTNET : USDC_MAINNET)
  
  // Generate unique nonce
  const nonce = generateNonce()
  
  // Calculate validity window
  const validAfter = 0 // Valid immediately
  const validBefore = Math.floor(Date.now() / 1000) + maxTimeoutSeconds

  // Get chain ID
  const chainId = network === 'cronos-testnet' ? '338' : '25'

  // Set up EIP-712 domain
  const domain = {
    name: TOKEN_NAME,
    version: TOKEN_VERSION,
    chainId: chainId,
    verifyingContract: asset,
  }

  // Define EIP-712 typed data structure
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

  // Create the message to sign
  const message = {
    from: account.address,
    to: payTo,
    value: maxAmountRequired,
    validAfter: validAfter,
    validBefore: validBefore,
    nonce: nonce,
  }

  // Sign using EIP-712 via thirdweb account
  // Note: thirdweb accounts support signTypedData
  // Convert domain format for thirdweb
  const thirdwebDomain = {
    name: domain.name,
    version: domain.version,
    chainId: BigInt(domain.chainId),
    verifyingContract: domain.verifyingContract as `0x${string}`,
  }
  
  const signature = await account.signTypedData({
    domain: thirdwebDomain,
    types: types as any,
    primaryType: 'TransferWithAuthorization',
    message: message as any,
  })

  // Construct payment header (x402 format)
  // According to Cronos X402 documentation, the payment header MUST have scheme: "exact"
  // The scheme in the header must match the scheme in payment requirements
  const paymentHeader = {
    x402Version: 1,
    scheme: 'exact', // MUST be "exact" per Cronos X402 documentation, not "x402"
    network: network,
    payload: {
      from: account.address,
      to: payTo,
      value: maxAmountRequired,
      validAfter: validAfter,
      validBefore: validBefore,
      nonce: nonce,
      signature: signature,
      asset: asset,
    },
  }

  // Base64-encode the payment header
  // Use browser-compatible base64 encoding
  const jsonString = JSON.stringify(paymentHeader)
  
  if (typeof window !== 'undefined') {
    // Browser environment - use TextEncoder for proper Unicode handling
    const bytes = new TextEncoder().encode(jsonString)
    const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('')
    return btoa(binary)
  } else {
    // Node.js environment
    return Buffer.from(jsonString).toString('base64')
  }
}

/**
 * Creates payment requirements from x402 challenge
 */
export function createPaymentRequirementsFromChallenge(challenge: {
  resource: {
    recipient: string
    amount: string
    description: string
  }
  network: string
  scheme?: string
}): {
  payTo: string
  maxAmountRequired: string
  maxTimeoutSeconds: number
  scheme: string
  asset?: string
} {
  const network = challenge.network === 'cronos' ? 'cronos' : 'cronos-testnet'
  const asset = network === 'cronos-testnet' ? USDC_TESTNET : USDC_MAINNET

  return {
    payTo: challenge.resource.recipient,
    maxAmountRequired: challenge.resource.amount,
    maxTimeoutSeconds: 300, // 5 minutes default
    scheme: challenge.scheme || 'exact',
    asset: asset,
  }
}
