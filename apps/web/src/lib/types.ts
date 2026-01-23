/**
 * Local types for NovaAgent Web App
 */

// x402 Protocol Types
export interface X402Challenge {
  scheme: 'x402'
  network: string
  resource: X402Resource
  signature?: string
}

export interface X402Resource {
  type: 'payment'
  amount: string
  currency: 'USDC'
  recipient: string
  description: string
  facilitatorUrl: string
}

// Purchase Types
export interface PurchaseIntent {
  agentId: string
  amount: string
  currency: 'USDC'
  description: string
  recipient?: string  // Optional - defaults to merchant address on server
  metadata?: Record<string, unknown>
}

export interface PurchaseRequest {
  challenge: X402Challenge
  signature: string
  userAddress: string
  agentSignature?: string
}

// Gift Card Types
export interface GiftCard {
  id: string
  brand: string
  name: string
  description: string
  imageUrl: string
  denominations: number[]
  currency: string
  category: string
}

// Agent Message Types
export interface AgentMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  metadata?: {
    purchaseIntent?: PurchaseIntent
    giftCard?: GiftCard
  }
}

// Payment State
export interface PaymentState {
  status: 'idle' | 'requesting' | 'signing' | 'submitting' | 'confirming' | 'completed' | 'failed'
  challenge?: X402Challenge
  transactionHash?: string
  error?: string
}