/**
 * Supabase Database Client
 * For use with Supabase or Neon (PostgreSQL)
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[DB] ⚠️ Supabase credentials not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
}

// Create Supabase client for server-side operations
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null

// Database Types (matching schema)
export interface GiftCardItem {
  id: string
  name: string
  description: string | null
  brand: string
  price: number // in cents
  currency: string
  image_url: string | null
  is_active: boolean
  inventory_count: number
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  user_address: string
  recipient_email: string | null
  transaction_hash: string | null
  total_amount: number // in cents
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  gift_card_item_id: string
  quantity: number
  price_at_purchase: number // in cents
  created_at: string
}

export interface GiftCard {
  id: string
  order_id: string
  gift_card_item_id: string
  code: string
  balance: number // in cents
  currency: string
  state: 'active' | 'redeemed' | 'void' | 'expired'
  recipient_email: string | null
  issued_at: string
  expires_at: string | null
  redeemed_at: string | null
}
