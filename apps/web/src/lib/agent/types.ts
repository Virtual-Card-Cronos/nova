/**
 * Agent Service Types
 */

export interface AgentRequest {
  message: string
  userAddress: string
  context?: {
    previousMessages?: Array<{ role: 'user' | 'assistant'; content: string }>
    preferences?: Record<string, any>
  }
}

export interface AgentResponse {
  reasoning: string
  intent: 'purchase' | 'query' | 'clarification' | 'error'
  purchaseIntent?: {
    brand: string
    amount: string // USDC in base units (6 decimals)
    currency: 'USDC'
    description: string
    country?: string
    metadata?: Record<string, any>
  }
  message: string
  confidence: number // 0-1
}

// Gift Up! API Types
export interface GiftUpItem {
  id: string
  name: string
  description?: string
  price: number
  currency: string
  isActive: boolean
  itemGroupId?: string
}

export interface GiftUpOrder {
  id: string
  recipientEmail: string
  items: Array<{
    itemId: string
    quantity: number
  }>
  externalId?: string // For mapping to our order_id
}

export interface GiftUpGiftCard {
  id: string
  code: string
  balance: number
  currency: string
  state: 'Active' | 'Redeemed' | 'Void' | 'Expired'
}
