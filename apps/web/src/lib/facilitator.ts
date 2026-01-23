/**
 * Cronos x402 Facilitator Client
 * Uses official @crypto.com/facilitator-client SDK
 * Based on: https://github.com/cronos-labs/x402-examples
 * Documentation: https://docs.cronos.org/cronos-x402-facilitator/introduction
 * 
 * NOTE: This module uses Node.js-only dependencies (@crypto.com/facilitator-client)
 * Only import in server-side code (API routes)
 */

import type { X402Challenge, PurchaseRequest } from '@/lib/types'
import type { Signer } from 'ethers'

// Dynamic import for server-side only
let Facilitator: any
let CronosNetwork: any

async function getFacilitatorSDK() {
  if (!Facilitator) {
    const sdk = await import('@crypto.com/facilitator-client')
    Facilitator = sdk.Facilitator
    CronosNetwork = sdk.CronosNetwork
  }
  return { Facilitator, CronosNetwork }
}

// Initialize facilitator client (server-side only)
let facilitatorClient: any = null

async function getFacilitatorClient() {
  if (!facilitatorClient) {
    const { Facilitator: Fac, CronosNetwork: CN } = await getFacilitatorSDK()
    const network = (process.env.NEXT_PUBLIC_CRONOS_NETWORK as any) || CN.CronosTestnet
    
    facilitatorClient = new Fac({
      network,
      baseUrl: process.env.NEXT_PUBLIC_FACILITATOR_BASE_URL || 'https://facilitator.cronoslabs.org/v2/x402',
      // Note: The SDK might not accept 'scheme' in the constructor
      // The scheme is extracted from the payment header itself
    })
    
    console.log('[Facilitator] ✅ Initialized facilitator client with network:', network)
  }
  return facilitatorClient
}

// Response types
export interface PurchaseResponse {
  success: boolean
  transactionHash?: string
  error?: string
}

/**
 * Gets the merchant/seller recipient address (payTo)
 * For x402 payments, the recipient (payTo) should be the merchant/seller address that will receive the payment
 * The facilitator is just the service that processes the payment, not the recipient
 */
function getMerchantRecipientAddress(): string {
  // Check if explicitly set in environment
  const envAddress = process.env.NEXT_PUBLIC_MERCHANT_ADDRESS || 
                     "0x44690185E7c5137a691AB74eE62494b0618CfEd8" ||
                     process.env.NEXT_PUBLIC_FACILITATOR_ADDRESS || // Legacy support
                     process.env.FACILITATOR_ADDRESS // Legacy support
  
  if (envAddress && envAddress.startsWith('0x') && envAddress.length === 42) {
    console.log('[Facilitator] ✅ Using merchant address:', envAddress)
    return envAddress
  }

  // If not set, throw an error to force configuration
  throw new Error(
    'Merchant recipient address not configured. ' +
    'Set NEXT_PUBLIC_MERCHANT_ADDRESS in your .env.local with the address that should receive payments. ' +
    'This is your platform/merchant address, not the facilitator address. ' +
    'The facilitator is just the service that processes payments.'
  )
}

/**
 * Creates an x402 challenge for payment authorization
 * @param amount - Amount in base units (6 decimals for USDC.e)
 * @param description - Payment description
 * @param recipient - Optional recipient address (defaults to merchant address)
 * @param network - Network string ('cronos-testnet' or 'cronos')
 */
export async function createX402Challenge(
  amount: string,
  description: string,
  recipient?: string,
  network: string = 'cronos-testnet'
): Promise<X402Challenge> {
  const facilitatorUrl = process.env.NEXT_PUBLIC_FACILITATOR_BASE_URL || 'https://facilitator.cronoslabs.org/v2/x402'
  
  // Determine recipient address (payTo)
  // This should be the merchant/seller address that receives the payment
  let recipientAddress: string
  if (recipient && recipient.startsWith('0x') && recipient.length === 42) {
    recipientAddress = recipient
  } else {
    // Use merchant address (the seller who receives the payment)
    recipientAddress = getMerchantRecipientAddress()
  }
  
  const challenge: X402Challenge = {
    scheme: 'x402',
    network,
    resource: {
      type: 'payment',
      amount,
      currency: 'USDC',
      recipient: recipientAddress as `0x${string}`,
      description,
      facilitatorUrl,
    },
  }

  return challenge
}

/**
 * Generates EIP-3009 payment header using facilitator SDK
 * This is the signed authorization that will be submitted
 * @param to - Recipient address
 * @param value - Amount in base units (6 decimals for USDC)
 * @param signer - Ethers-compatible signer (use createEthersSignerAdapter for thirdweb accounts)
 */
export async function generatePaymentHeader(
  to: string,
  value: string,
  signer: Signer
): Promise<string> {
  const facilitator = await getFacilitatorClient()
  
  return await facilitator.generatePaymentHeader({
    to,
    value,
    signer,
  })
}

/**
 * Generates payment requirements for x402 protocol
 */
export async function generatePaymentRequirements(
  payTo: string,
  description: string,
  maxAmountRequired: string
) {
  const facilitator = await getFacilitatorClient()
  
  return facilitator.generatePaymentRequirements({
    payTo,
    description,
    maxAmountRequired,
  })
}

/**
 * Submits a payment request to the facilitator with signature
 * Uses official @crypto.com/facilitator-client SDK
 * Flow: generatePaymentHeader -> buildVerifyRequest -> verifyPayment -> settlePayment
 */
export async function submitPaymentRequest(
  request: PurchaseRequest,
  signature: string
): Promise<PurchaseResponse> {
  try {
    const facilitator = await getFacilitatorClient()
    const { challenge } = request
    
    console.log('[Facilitator] 📤 Submitting payment request...')
    console.log('[Facilitator] Challenge:', JSON.stringify(challenge, null, 2))
    console.log('[Facilitator] Signature (first 50 chars):', signature.substring(0, 50))
    
    // Generate payment requirements from challenge
    // payTo is the merchant/seller address (recipient in challenge)
    // asset should be USDC.e (mainnet) or devUSDC.e (testnet) contract address for the network
    const network = challenge.network === 'cronos' ? 'cronos' : 'cronos-testnet'
    const usdcContract = network === 'cronos-testnet' 
      ? '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0' // Testnet devUSDC.e (for x402 facilitator)
      : '0xf951eC28187D9E5Ca673Da8FE6757E6f0Be5F77C' // Mainnet USDC.e
    
    console.log('[Facilitator] Generating payment requirements...')
    // Note: Both payment header and payment requirements MUST use scheme: "exact"
    // Per Cronos X402 documentation: https://docs.cronos.org/cronos-x402-facilitator
    const requirements = facilitator.generatePaymentRequirements({
      payTo: challenge.resource.recipient, // Merchant/seller address
      description: challenge.resource.description,
      maxAmountRequired: challenge.resource.amount,
      asset: usdcContract, // USDC.e contract address
      scheme: 'exact', // SDK expects "exact" not "x402" for payment requirements
      mimeType: 'application/json', // Optional but recommended
      maxTimeoutSeconds: 300, // Optional but recommended
    })
    
    console.log('[Facilitator] Payment requirements:', JSON.stringify(requirements, null, 2))
    
    // Build verify request with the signature (payment header)
    // The signature is the base64-encoded payment header
    // The SDK will decode it and extract the scheme
    console.log('[Facilitator] Building verify request...')
    console.log('[Facilitator] Signature length:', signature.length)
    
    // Try to decode and inspect the payment header
    try {
      const decodedHeader = JSON.parse(atob(signature))
      console.log('[Facilitator] Decoded payment header:', JSON.stringify(decodedHeader, null, 2))
      console.log('[Facilitator] Header scheme:', decodedHeader.scheme)
      console.log('[Facilitator] Header network:', decodedHeader.network)
    } catch (e) {
      console.warn('[Facilitator] ⚠️ Could not decode payment header:', e)
    }
    
    const verifyRequest = facilitator.buildVerifyRequest(signature, requirements)
    
    console.log('[Facilitator] Verifying payment...')
    // Verify the payment first
    const verifyResult = await facilitator.verifyPayment(verifyRequest)
    
    if (!verifyResult.isValid) {
      console.error('[Facilitator] ❌ Payment verification failed:', verifyResult.invalidReason)
      return {
        success: false,
        error: verifyResult.invalidReason || 'Payment verification failed',
      }
    }
    
    console.log('[Facilitator] ✅ Payment verified, settling...')
    // If verification succeeds, settle the payment
    const settleResult = await facilitator.settlePayment(verifyRequest)
    
    console.log('[Facilitator] ✅ Payment settled. Transaction hash:', settleResult.txHash)
    return {
      success: true,
      transactionHash: settleResult.txHash,
    }
  } catch (error) {
    console.error('[Facilitator] ❌ Payment submission failed:', error)
    console.error('[Facilitator] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown facilitator error',
    }
  }
}

/**
 * Checks the status of a payment transaction
 * Uses official @crypto.com/facilitator-client SDK
 */
export async function checkPaymentStatus(transactionHash: string): Promise<{
  status: 'pending' | 'confirmed' | 'failed'
  blockNumber?: number
  confirmations?: number
}> {
  try {
    // The SDK doesn't have a direct status check method
    // We'll use the RPC to check transaction status
    const rpcUrl = process.env.NEXT_PUBLIC_CRONOS_RPC || 'https://evm-t3.cronos.org'
    
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionReceipt',
        params: [transactionHash],
        id: 1,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      const receipt = data.result
      
      if (receipt) {
        return {
          status: receipt.status === '0x1' ? 'confirmed' : 'failed',
          blockNumber: parseInt(receipt.blockNumber, 16),
          confirmations: 1, // Could calculate from current block
        }
      }
    }

    return { status: 'pending' }
  } catch (error) {
    console.error('Failed to check payment status:', error)
    return { status: 'failed' }
  }
}

/**
 * Formats amount for x402 protocol (string representation)
 */
export function formatAmount(amount: bigint): string {
  // Convert from base units (6 decimals for USDC) to human readable
  return (Number(amount) / 10 ** 6).toFixed(2)
}

/**
 * Parses amount from x402 protocol format
 */
export function parseAmount(amount: string): bigint {
  // Parse to USDC base units (6 decimals)
  return BigInt(Math.floor(parseFloat(amount) * 10 ** 6))
}

/**
 * Creates WWW-Authenticate header for x402 response
 */
export function createWWWAuthenticateHeader(challenge: X402Challenge): string {
  const { scheme, network, resource } = challenge

  const params = [
    `scheme=${scheme}`,
    `network=${network}`,
    `type=${resource.type}`,
    `amount=${resource.amount}`,
    `currency=${resource.currency}`,
    `recipient=${resource.recipient}`,
    `description="${encodeURIComponent(resource.description)}"`,
    `facilitator="${resource.facilitatorUrl}"`,
  ]

  return `${scheme} ${params.join(', ')}`
}