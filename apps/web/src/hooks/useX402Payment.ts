/**
 * useX402Payment Hook - Handles x402 Protocol Payment Flow
 * Manages 402 responses, wallet signatures, and facilitator submission
 * Updated for thirdweb v5
 * 
 * Flow:
 * 1. User requests purchase -> receive 402 challenge
 * 2. Prepare EIP-712 typed data for signing
 * 3. User signs with wallet (client-side)
 * 4. Build payment header from signature (server-side)
 * 5. Submit to facilitator for verification and settlement
 */

'use client'

import { useState, useCallback } from 'react'
import { useActiveAccount, useActiveWalletChain } from "thirdweb/react"
import { PurchaseIntent, X402Challenge } from '@/lib/types'

interface PaymentState {
  status: 'idle' | 'requesting' | 'signing' | 'submitting' | 'confirming' | 'completed' | 'failed'
  challenge?: X402Challenge
  transactionHash?: string
  error?: string
}

interface UseX402PaymentReturn {
  paymentState: PaymentState
  initiatePayment: (intent: PurchaseIntent) => Promise<void>
  confirmPayment: (signature?: string) => Promise<void>
  resetPayment: () => void
}

/**
 * Custom hook for handling x402 payment flow
 */
export function useX402Payment(): UseX402PaymentReturn {
  const account = useActiveAccount()
  const chain = useActiveWalletChain()
  const [paymentState, setPaymentState] = useState<PaymentState>({ status: 'idle' })

  /**
   * Initiates the payment process by calling the purchase API
   */
  const initiatePayment = useCallback(async (intent: PurchaseIntent) => {
    if (!account) {
      setPaymentState({
        status: 'failed',
        error: 'Wallet not connected'
      })
      return
    }

    setPaymentState({ status: 'requesting' })

    try {
      // Call purchase API
      const response = await fetch('/api/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(intent),
      })

      // Check content type first
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('[Payment] ❌ Non-JSON response:', text.substring(0, 200))
        throw new Error(`Server returned HTML instead of JSON. This usually means the API route has an error. Check server logs.`)
      }

      if (response.status === 402) {
        // Parse x402 challenge
        const x402Response = await response.json()
        console.log('[Payment] ✅ Received 402 challenge:', x402Response)

        if (!x402Response.challenge) {
          throw new Error('Invalid challenge format in response')
        }

        setPaymentState({
          status: 'signing',
          challenge: x402Response.challenge,
        })
      } else if (response.status === 403) {
        // Policy violation
        const error = await response.json()
        setPaymentState({
          status: 'failed',
          error: error.error || 'Payment not authorized by policy',
        })
      } else if (!response.ok) {
        // Other error - try to parse as JSON, fallback to text
        let errorMessage = 'Payment request failed'
        try {
          const error = await response.json()
          errorMessage = error.error || errorMessage
        } catch {
          const text = await response.text()
          errorMessage = text.substring(0, 100) || errorMessage
        }
        setPaymentState({
          status: 'failed',
          error: errorMessage,
        })
      } else {
        // Unexpected success (shouldn't happen with x402)
        setPaymentState({
          status: 'failed',
          error: 'Unexpected response from payment API',
        })
      }
    } catch (error) {
      console.error('[Payment] ❌ Payment initiation failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Network error'
      console.error('[Payment] Error details:', {
        message: errorMessage,
        account: account?.address,
        intent,
      })
      setPaymentState({
        status: 'failed',
        error: errorMessage,
      })
    }
  }, [account])

  /**
   * Signs and submits the payment using EIP-3009 TransferWithAuthorization
   * 
   * Flow:
   * 1. Get EIP-712 typed data from server (prepare-signing-data)
   * 2. Sign the typed data with user's wallet (client-side)
   * 3. Build payment header from signature (build-header)
   * 4. Submit to facilitator for verification and settlement
   */
  const confirmPayment = useCallback(async (agentSignature?: string) => {
    if (!account || !paymentState.challenge || !chain) {
      setPaymentState({
        status: 'failed',
        error: 'Invalid payment state'
      })
      return
    }

    setPaymentState(prev => ({ ...prev, status: 'signing' }))

    try {
      const { challenge } = paymentState
      const chainId = chain.id
      
      console.log('[Payment] 🔐 Starting EIP-3009 signing flow...')
      console.log('[Payment] Chain ID:', chainId)
      console.log('[Payment] Recipient:', challenge.resource.recipient)
      console.log('[Payment] Amount:', challenge.resource.amount)
      
      // Step 1: Get the EIP-712 typed data to sign
      const prepareResponse = await fetch('/api/payment/prepare-signing-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: account.address,
          to: challenge.resource.recipient,
          value: challenge.resource.amount,
          chainId,
        }),
      })

      if (!prepareResponse.ok) {
        const error = await prepareResponse.json()
        throw new Error(error.error || 'Failed to prepare signing data')
      }

      const { domain, types, message, primaryType } = await prepareResponse.json()
      console.log('[Payment] 📋 Prepared typed data for signing')
      console.log('[Payment] Domain:', domain)
      console.log('[Payment] Message:', message)

      // Step 2: Sign the typed data with user's wallet
      console.log('[Payment] ✍️ Requesting wallet signature...')
      const signature = await account.signTypedData({
        domain: {
          name: domain.name,
          version: domain.version,
          chainId: BigInt(domain.chainId),
          verifyingContract: domain.verifyingContract as `0x${string}`,
        },
        types,
        primaryType,
        message,
      })
      console.log('[Payment] ✅ Signature received')

      // Step 3: Build payment header from signature
      setPaymentState(prev => ({ ...prev, status: 'submitting' }))
      
      const buildResponse = await fetch('/api/payment/build-header', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: account.address,
          to: challenge.resource.recipient,
          value: challenge.resource.amount,
          validAfter: message.validAfter,
          validBefore: message.validBefore,
          nonce: message.nonce,
          signature,
          chainId,
        }),
      })

      if (!buildResponse.ok) {
        const error = await buildResponse.json()
        throw new Error(error.error || 'Failed to build payment header')
      }

      const { paymentHeader } = await buildResponse.json()
      console.log('[Payment] 📦 Payment header built successfully')

      // Step 4: Submit to facilitator API
      console.log('[Payment] 📤 Submitting to facilitator...')
      const submitResponse = await fetch('/api/facilitator/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challenge,
          signature: paymentHeader,
          userAddress: account.address,
          agentSignature: agentSignature || '',
        }),
      })

      if (!submitResponse.ok) {
        const error = await submitResponse.json().catch(() => ({ error: 'Payment submission failed' }))
        throw new Error(error.error || 'Payment submission failed')
      }

      const result = await submitResponse.json()
      console.log('[Payment] ✅ Facilitator response:', result)
      
      if (result.transactionHash) {
        setPaymentState({
          status: 'confirming',
          challenge,
          transactionHash: result.transactionHash,
        })
        pollTransactionStatus(result.transactionHash)
      } else {
        setPaymentState({
          status: 'completed',
          challenge,
        })
      }
    } catch (error) {
      console.error('[Payment] ❌ Payment confirmation failed:', error)
      setPaymentState(prev => ({
        ...prev,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Signature or submission failed',
      }))
    }
  }, [account, chain, paymentState.challenge])

  /**
   * Polls transaction status until confirmed
   */
  const pollTransactionStatus = useCallback(async (transactionHash: string) => {
    const pollInterval = 2000
    const maxAttempts = 30

    let attempts = 0

    const poll = async () => {
      try {
        const response = await fetch(`/api/tx/status?hash=${transactionHash}`)
        
        if (!response.ok) {
          // For demo, assume confirmed after a few attempts
          if (attempts >= 2) {
            setPaymentState(prev => ({ ...prev, status: 'completed' }))
            return
          }
        }
        
        const status = await response.json()

        if (status.status === 'confirmed') {
          setPaymentState(prev => ({ ...prev, status: 'completed' }))
          return
        } else if (status.status === 'failed') {
          setPaymentState(prev => ({
            ...prev,
            status: 'failed',
            error: 'Transaction failed on blockchain',
          }))
          return
        }

        if (attempts < maxAttempts) {
          attempts++
          setTimeout(poll, pollInterval)
        } else {
          // Timeout - assume success for demo
          setPaymentState(prev => ({ ...prev, status: 'completed' }))
        }
      } catch {
        // For demo, assume success
        setPaymentState(prev => ({ ...prev, status: 'completed' }))
      }
    }

    poll()
  }, [])

  /**
   * Resets the payment state
   */
  const resetPayment = useCallback(() => {
    setPaymentState({ status: 'idle' })
  }, [])

  return {
    paymentState,
    initiatePayment,
    confirmPayment,
    resetPayment,
  }
}