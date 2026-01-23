/**
 * Agent Tools - Functions the AI Agent can call
 * Uses Supabase/PostgreSQL database for gift card inventory management
 */

import { GiftCardItem, GiftCardOrder, GiftCard } from './types'
import {
  getAllGiftCardItems,
  findGiftCardItemsByBrand,
  getGiftCardItemById,
  createOrder as dbCreateOrder,
  issueGiftCards as dbIssueGiftCards,
  getGiftCardByCode as dbGetGiftCardByCode,
} from '@/lib/db/gift-cards'

/**
 * Find a gift card item by brand name
 * Uses database to search for gift cards
 */
export async function findCard(brand: string): Promise<GiftCardItem | null> {
  console.log('[DB] 🔍 Searching for card:', brand)
  try {
    const items = await findGiftCardItemsByBrand(brand)
    console.log('[DB] ✅ Found', items.length, 'items matching brand:', brand)

    if (items.length === 0) {
      console.log('[DB] ❌ No matching item found for:', brand)
      return null
    }

    // Return the first item with available inventory
    const availableItem = items.find(item => item.inventory_count > 0) || items[0]
    
    console.log('[DB] ✅ Selected item:', availableItem.name, `$${(availableItem.price / 100).toFixed(2)}`, `(Inventory: ${availableItem.inventory_count})`)

    // Convert database format to GiftCardItem format
    return {
      id: availableItem.id,
      name: availableItem.name,
      description: availableItem.description || undefined,
      price: availableItem.price,
      currency: availableItem.currency,
      isActive: availableItem.is_active,
      inventory_count: availableItem.inventory_count,
      brand: availableItem.brand,
    }
  } catch (error) {
    console.error('[DB] ❌ Error finding card:', error)
    throw error
  }
}

/**
 * Issue a gift card after payment is confirmed
 * Creates order in database and decrements inventory
 */
export async function issueGiftCard(
  email: string,
  itemId: string,
  userAddress: string,
  transactionHash?: string
): Promise<GiftCardOrder> {
  try {
    console.log('[DB] 🎫 Issuing gift card for item:', itemId)
    
    // Get item details
    const item = await getGiftCardItemById(itemId)
    if (!item) {
      throw new Error(`Gift card item ${itemId} not found`)
    }

    if (item.inventory_count < 1) {
      throw new Error(`Insufficient inventory for ${item.name}. Available: ${item.inventory_count}`)
    }

    // Create order (this will decrement inventory automatically)
    const order = await dbCreateOrder(
      userAddress,
      [{ itemId, quantity: 1, price: item.price }],
      email,
      transactionHash
    )

    // Issue gift cards
    const giftCards = await dbIssueGiftCards(order.id, [{ itemId, quantity: 1 }], email)

    console.log('[DB] ✅ Order created:', order.id, 'with', giftCards.length, 'gift card(s)')

    // Convert to GiftCardOrder format
    return {
      id: order.id,
      recipientEmail: order.recipient_email || email,
      items: [{ itemId, quantity: 1 }],
      externalId: transactionHash,
    }
  } catch (error) {
    console.error('[DB] ❌ Error issuing gift card:', error)
    throw error
  }
}

/**
 * Get a gift card by code
 * Uses database to lookup gift card
 */
export async function getGiftCardByCode(code: string): Promise<GiftCard | null> {
  try {
    console.log('[DB] 🔍 Looking up gift card by code:', code)
    const giftCard = await dbGetGiftCardByCode(code)
    
    if (!giftCard) {
      console.log('[DB] ❌ Gift card not found:', code)
      return null
    }

    console.log('[DB] ✅ Found gift card:', code, 'Balance:', `$${(giftCard.balance / 100).toFixed(2)}`)

    // Return gift card from database
    return {
      id: giftCard.id,
      code: giftCard.code,
      balance: giftCard.balance,
      currency: giftCard.currency,
      state: giftCard.state as 'Active' | 'Redeemed' | 'Void' | 'Expired',
    }
  } catch (error) {
    console.error('[DB] ❌ Error getting gift card:', error)
    return null
  }
}

/**
 * List all available gift card items
 * Uses database to fetch all active gift cards
 */
export async function listAllItems(): Promise<GiftCardItem[]> {
  console.log('[DB] 📋 Listing all items')
  try {
    const items = await getAllGiftCardItems()
    console.log('[DB] ✅ Retrieved', items.length, 'active items from database')
    
    // Log first few items for debugging
    if (items.length > 0) {
      console.log('[DB] 📦 Sample items:', items.slice(0, 3).map(item => `${item.name} ($${(item.price / 100).toFixed(2)}, Stock: ${item.inventory_count})`).join(', '))
    }

    // Convert database format to GiftCardItem format
    return items.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description || undefined,
      price: item.price,
      currency: item.currency,
      isActive: item.is_active,
      inventory_count: item.inventory_count,
      brand: item.brand,
    }))
  } catch (error) {
    console.error('[DB] ❌ Error listing items:', error)
    throw error
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

// Mock data for development/demo (fallback only)
function getMockItem(brand: string): GiftCardItem | null {
  const mockItems: Record<string, GiftCardItem> = {
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

function getMockItems(): GiftCardItem[] {
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
