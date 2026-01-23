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

// Gift Card Types (database-backed)
export interface GiftCardItem {
  id: string
  name: string
  description?: string
  price: number // in cents
  currency: string
  isActive: boolean
  itemGroupId?: string
  inventory_count?: number // Available quantity
  brand?: string
}

export interface GiftCardOrder {
  id: string
  recipientEmail: string
  items: Array<{
    itemId: string
    quantity: number
  }>
  externalId?: string // For mapping to our order_id
}

export interface GiftCard {
  id: string
  code: string
  balance: number
  currency: string
  state: 'Active' | 'Redeemed' | 'Void' | 'Expired'
}
