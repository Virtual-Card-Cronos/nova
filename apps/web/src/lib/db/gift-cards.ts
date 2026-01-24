/**
 * Gift Card Database Operations
 */

import { supabase, type GiftCardItem, type Order, type OrderItem, type GiftCard } from './supabase'

/**
 * Get all active gift card items
 */
export async function getAllGiftCardItems(): Promise<GiftCardItem[]> {
  if (!supabase) {
    console.error('[DB] ❌ Supabase client not initialized')
    throw new Error('Database not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  }

  const startTime = Date.now()
  console.log('[DB] 📦 Fetching all gift card items from database...')
  
  // Only select needed columns for better performance
  const { data, error } = await supabase
    .from('gift_card_items')
    .select('id, name, description, brand, price, currency, image_url, inventory_count, is_active, created_at, updated_at')
    .eq('is_active', true)
    .order('brand', { ascending: true })

  const duration = Date.now() - startTime

  if (error) {
    console.error(`[DB] ❌ Error fetching gift card items (${duration}ms):`, error)
    throw error
  }

  console.log(`[DB] ✅ Retrieved ${data?.length || 0} gift card items from database in ${duration}ms`)
  
  if (duration > 1000) {
    console.warn(`[DB] ⚠️ Slow query: ${duration}ms (expected < 1000ms). Consider adding database indexes.`)
  }
  
  return data || []
}

/**
 * Find gift card items by brand name
 */
export async function findGiftCardItemsByBrand(brand: string): Promise<GiftCardItem[]> {
  if (!supabase) {
    throw new Error('Database not configured')
  }

  const { data, error } = await supabase
    .from('gift_card_items')
    .select('*')
    .eq('is_active', true)
    .ilike('brand', `%${brand}%`)

  if (error) {
    console.error('[DB] ❌ Error finding gift card items:', error)
    throw error
  }

  return data || []
}

/**
 * Get gift card item by ID
 */
export async function getGiftCardItemById(id: string): Promise<GiftCardItem | null> {
  if (!supabase) {
    throw new Error('Database not configured')
  }

  const { data, error } = await supabase
    .from('gift_card_items')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null
    }
    console.error('[DB] ❌ Error fetching gift card item:', error)
    throw error
  }

  return data
}

/**
 * Decrement inventory for a gift card item
 * Uses the database function to ensure atomic operation
 */
export async function decrementInventory(itemId: string, quantity: number): Promise<boolean> {
  if (!supabase) {
    throw new Error('Database not configured')
  }

  // Call the database function
  const { data, error } = await supabase.rpc('decrement_inventory', {
    item_id: itemId,
    quantity_to_decrement: quantity,
  })

  if (error) {
    console.error('[DB] ❌ Error decrementing inventory:', error)
    throw error
  }

  return data === true
}

/**
 * Create an order
 */
export async function createOrder(
  userAddress: string,
  items: Array<{ itemId: string; quantity: number; price: number }>,
  recipientEmail?: string,
  transactionHash?: string
): Promise<Order> {
  if (!supabase) {
    throw new Error('Database not configured')
  }

  // Calculate total
  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_address: userAddress,
      recipient_email: recipientEmail,
      transaction_hash: transactionHash,
      total_amount: totalAmount,
      currency: 'USD',
      status: 'pending',
    })
    .select()
    .single()

  if (orderError) {
    console.error('[DB] ❌ Error creating order:', orderError)
    throw orderError
  }

  // Create order items
  const orderItems = items.map((item) => ({
    order_id: order.id,
    gift_card_item_id: item.itemId,
    quantity: item.quantity,
    price_at_purchase: item.price,
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)

  if (itemsError) {
    console.error('[DB] ❌ Error creating order items:', itemsError)
    // Rollback order creation
    await supabase.from('orders').delete().eq('id', order.id)
    throw itemsError
  }

  // Decrement inventory for each item
  for (const item of items) {
    try {
      await decrementInventory(item.itemId, item.quantity)
    } catch (error) {
      console.error(`[DB] ❌ Failed to decrement inventory for item ${item.itemId}:`, error)
      // Update order status to failed
      await supabase
        .from('orders')
        .update({ status: 'failed' })
        .eq('id', order.id)
      throw error
    }
  }

  // Update order status to completed
  const { data: updatedOrder, error: updateError } = await supabase
    .from('orders')
    .update({ status: 'completed' })
    .eq('id', order.id)
    .select()
    .single()

  if (updateError) {
    console.error('[DB] ❌ Error updating order status:', updateError)
  }

  return updatedOrder || order
}

/**
 * Issue gift cards for an order
 */
export async function issueGiftCards(
  orderId: string,
  items: Array<{ itemId: string; quantity: number }>,
  recipientEmail?: string
): Promise<GiftCard[]> {
  if (!supabase) {
    throw new Error('Database not configured')
  }

  const giftCards: GiftCard[] = []

  for (const item of items) {
    // Get item details to get price
    const giftCardItem = await getGiftCardItemById(item.itemId)
    if (!giftCardItem) {
      throw new Error(`Gift card item ${item.itemId} not found`)
    }

    // Generate gift card codes and create gift cards
    for (let i = 0; i < item.quantity; i++) {
      const code = generateGiftCardCode()
      
      const { data: giftCard, error } = await supabase
        .from('gift_cards')
        .insert({
          order_id: orderId,
          gift_card_item_id: item.itemId,
          code,
          balance: giftCardItem.price,
          currency: 'USD',
          state: 'active',
          recipient_email: recipientEmail,
        })
        .select()
        .single()

      if (error) {
        console.error('[DB] ❌ Error creating gift card:', error)
        throw error
      }

      giftCards.push(giftCard)
    }
  }

  return giftCards
}

/**
 * Get gift card by code
 */
export async function getGiftCardByCode(code: string): Promise<GiftCard | null> {
  if (!supabase) {
    throw new Error('Database not configured')
  }

  const { data, error } = await supabase
    .from('gift_cards')
    .select('*')
    .eq('code', code)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('[DB] ❌ Error fetching gift card:', error)
    throw error
  }

  return data
}

/**
 * Get orders by user address (wallet address)
 */
export async function getOrdersByUserAddress(userAddress: string): Promise<Order[]> {
  if (!supabase) {
    throw new Error('Database not configured')
  }

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_address', userAddress)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[DB] ❌ Error fetching orders:', error)
    throw error
  }

  return data || []
}

/**
 * Get order with items and gift cards
 */
export async function getOrderWithDetails(orderId: string): Promise<{
  order: Order
  items: Array<OrderItem & { gift_card_item: GiftCardItem }>
  gift_cards: GiftCard[]
} | null> {
  if (!supabase) {
    throw new Error('Database not configured')
  }

  // Get order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    console.error('[DB] ❌ Error fetching order:', orderError)
    return null
  }

  // Get order items with gift card item details
  const { data: orderItems, error: itemsError } = await supabase
    .from('order_items')
    .select(`
      *,
      gift_card_item:gift_card_items(*)
    `)
    .eq('order_id', orderId)

  if (itemsError) {
    console.error('[DB] ❌ Error fetching order items:', itemsError)
    throw itemsError
  }

  // Get gift cards for this order
  const { data: giftCards, error: cardsError } = await supabase
    .from('gift_cards')
    .select('*')
    .eq('order_id', orderId)

  if (cardsError) {
    console.error('[DB] ❌ Error fetching gift cards:', cardsError)
    throw cardsError
  }

  return {
    order,
    items: (orderItems || []).map((item: any) => ({
      id: item.id,
      order_id: item.order_id,
      gift_card_item_id: item.gift_card_item_id,
      quantity: item.quantity,
      price_at_purchase: item.price_at_purchase,
      created_at: item.created_at,
      gift_card_item: item.gift_card_item as GiftCardItem,
    })),
    gift_cards: giftCards || [],
  }
}

/**
 * Generate a unique gift card code
 */
function generateGiftCardCode(): string {
  // Generate a random alphanumeric code
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude confusing chars
  let code = ''
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) {
      code += '-'
    }
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
