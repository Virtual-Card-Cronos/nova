/**
 * Agent Tools - Functions the AI Agent can call
 * Based on Gift Up! API: https://developer.giftup.com/api#introduction
 */

import { GiftUpItem, GiftUpOrder, GiftUpGiftCard } from './types'

// Fetch is available in Next.js runtime
declare const fetch: typeof globalThis.fetch

const GIFTUP_API_BASE = 'https://api.giftup.app'
const GIFTUP_API_KEY = process.env.GIFTUP_API_KEY || ''

/**
 * Find a gift card item by brand name
 * Uses GET /items from Gift Up! API
 */
export async function findCard(brand: string): Promise<GiftUpItem | null> {
  console.log('[GiftUp] 🔍 Searching for card:', brand)
  try {
    if (!GIFTUP_API_KEY) {
      console.warn('[GiftUp] ⚠️ GIFTUP_API_KEY not set, using mock data')
      return getMockItem(brand)
    }

    console.log('[GiftUp] 📡 Calling Gift Up! API: GET /items')
    const response = await fetch(`${GIFTUP_API_BASE}/items`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${GIFTUP_API_KEY}`,
        'Accept': 'application/json',
      },
    })

    console.log('[GiftUp] 📥 Response status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[GiftUp] ❌ API error:', response.status, errorText)
      throw new Error(`Gift Up! API error: ${response.statusText}`)
    }

    const items: GiftUpItem[] = await response.json()
    console.log('[GiftUp] ✅ Received', items.length, 'items from API')

    // Search for matching brand (case-insensitive)
    const brandLower = brand.toLowerCase()
    const matchingItem = items.find(
      (item) =>
        item.isActive &&
        (item.name.toLowerCase().includes(brandLower) ||
          item.description?.toLowerCase().includes(brandLower))
    )

    if (matchingItem) {
      console.log('[GiftUp] ✅ Found matching item:', matchingItem.name, `$${(matchingItem.price / 100).toFixed(2)}`)
    } else {
      console.log('[GiftUp] ❌ No matching item found for:', brand)
    }

    return matchingItem || null
  } catch (error) {
    console.error('[GiftUp] ❌ Error finding card:', error)
    // Fallback to mock for demo
    console.log('[GiftUp] 🔄 Falling back to mock data')
    return getMockItem(brand)
  }
}

/**
 * Issue a gift card after payment is confirmed
 * Uses POST /orders from Gift Up! API
 */
export async function issueGiftCard(
  email: string,
  itemId: string,
  externalId?: string
): Promise<GiftUpOrder> {
  try {
    if (!GIFTUP_API_KEY) {
      throw new Error('GIFTUP_API_KEY is required')
    }

    const orderData: Partial<GiftUpOrder> = {
      recipientEmail: email,
      items: [{ itemId, quantity: 1 }],
    }

    if (externalId) {
      orderData.externalId = externalId
    }

    const response = await fetch(`${GIFTUP_API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GIFTUP_API_KEY}`,
        'x-giftup-testmode': 'true', // Use test mode for hackathon
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(orderData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Gift Up! API error: ${response.statusText} - ${errorText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error issuing gift card:', error)
    throw error
  }
}

/**
 * Get a gift card by code
 * Uses GET /gift-cards/{code} from Gift Up! API
 */
export async function getGiftCardByCode(code: string): Promise<GiftUpGiftCard | null> {
  try {
    if (!GIFTUP_API_KEY) {
      return null
    }

    const response = await fetch(`${GIFTUP_API_BASE}/gift-cards/${code}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${GIFTUP_API_KEY}`,
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`Gift Up! API error: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error getting gift card:', error)
    return null
  }
}

/**
 * List all available gift card items
 * Uses GET /items from Gift Up! API
 */
export async function listAllItems(): Promise<GiftUpItem[]> {
  console.log('[GiftUp] 📋 Listing all items')
  try {
    if (!GIFTUP_API_KEY) {
      console.warn('[GiftUp] ⚠️ GIFTUP_API_KEY not set, using mock data')
      const mockItems = getMockItems()
      console.log('[GiftUp] 📦 Returning', mockItems.length, 'mock items')
      return mockItems
    }

    console.log('[GiftUp] 📡 Calling Gift Up! API: GET /items')
    const response = await fetch(`${GIFTUP_API_BASE}/items`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${GIFTUP_API_KEY}`,
        'Accept': 'application/json',
      },
    })

    console.log('[GiftUp] 📥 Response status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[GiftUp] ❌ API error:', response.status, errorText)
      throw new Error(`Gift Up! API error: ${response.statusText}`)
    }

    const items: GiftUpItem[] = await response.json()
    const activeItems = items.filter(item => item.isActive)
    console.log('[GiftUp] ✅ Received', items.length, 'total items,', activeItems.length, 'active items')
    
    // Log first few items for debugging
    if (activeItems.length > 0) {
      console.log('[GiftUp] 📦 Sample items:', activeItems.slice(0, 3).map(item => `${item.name} ($${(item.price / 100).toFixed(2)})`).join(', '))
    }

    return activeItems
  } catch (error) {
    console.error('[GiftUp] ❌ Error listing items:', error)
    // Fallback to mock for demo
    console.log('[GiftUp] 🔄 Falling back to mock data')
    return getMockItems()
  }
}

/**
 * Trigger x402 payment challenge
 * This function is called by the agent to initiate the payment flow
 */
export async function triggerX402(
  amount: string, // USDC in base units
  description: string,
  recipient: string
): Promise<{ challenge: any; requiresSignature: boolean }> {
  // This will be handled by the /api/purchase route
  // The agent just needs to know it should trigger this
  return {
    challenge: {
      scheme: 'x402',
      network: 'cronos',
      resource: {
        type: 'payment',
        amount,
        currency: 'USDC',
        recipient,
        description,
      },
    },
    requiresSignature: true,
  }
}

// Mock data for development/demo
function getMockItem(brand: string): GiftUpItem | null {
  const mockItems: Record<string, GiftUpItem> = {
    steam: {
      id: 'mock-steam-001',
      name: 'Steam Gift Card',
      description: 'Steam digital gift card',
      price: 1000, // $10.00 in cents
      currency: 'USD',
      isActive: true,
    },
    amazon: {
      id: 'mock-amazon-001',
      name: 'Amazon Gift Card',
      description: 'Amazon digital gift card',
      price: 2500, // $25.00 in cents
      currency: 'USD',
      isActive: true,
    },
    roblox: {
      id: 'mock-roblox-001',
      name: 'Roblox Gift Card',
      description: 'Roblox digital gift card',
      price: 1000, // $10.00 in cents
      currency: 'USD',
      isActive: true,
    },
  }

  const brandLower = brand.toLowerCase()
  for (const [key, item] of Object.entries(mockItems)) {
    if (brandLower.includes(key)) {
      return item
    }
  }

  return null
}

function getMockItems(): GiftUpItem[] {
  return [
    {
      id: 'mock-steam-001',
      name: 'Steam Gift Card',
      description: 'Steam digital gift card',
      price: 1000,
      currency: 'USD',
      isActive: true,
    },
    {
      id: 'mock-amazon-001',
      name: 'Amazon Gift Card',
      description: 'Amazon digital gift card',
      price: 2500,
      currency: 'USD',
      isActive: true,
    },
    {
      id: 'mock-roblox-001',
      name: 'Roblox Gift Card',
      description: 'Roblox digital gift card',
      price: 1000,
      currency: 'USD',
      isActive: true,
    },
  ]
}
