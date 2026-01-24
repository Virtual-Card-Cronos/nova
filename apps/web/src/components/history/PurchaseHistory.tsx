/**
 * PurchaseHistory Component
 * Displays user's purchase history with order details and gift cards
 */

'use client'

import { useEffect, useState } from 'react'
import { useActiveAccount } from 'thirdweb/react'
import { Order, GiftCard, GiftCardItem } from '@/lib/db/supabase'

interface OrderWithDetails {
  order: Order
  items: Array<{
    id: string
    order_id: string
    gift_card_item_id: string
    quantity: number
    price_at_purchase: number
    gift_card_item: GiftCardItem
  }>
  gift_cards: GiftCard[]
}

export function PurchaseHistory() {
  const account = useActiveAccount()
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  useEffect(() => {
    if (!account?.address) {
      setLoading(false)
      return
    }

    async function fetchOrders() {
      if (!account?.address) return
      
      try {
        setLoading(true)
        const response = await fetch(`/api/orders?userAddress=${account.address}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch orders')
        }

        const data = await response.json()
        if (data.success && data.orders) {
          // Fetch details for each order
          const ordersWithDetails = await Promise.all(
            data.orders.map(async (order: Order) => {
              try {
                const detailsResponse = await fetch(`/api/orders?orderId=${order.id}`)
                if (detailsResponse.ok) {
                  const detailsData = await detailsResponse.json()
                  if (detailsData.success && detailsData.order) {
                    return detailsData.order
                  }
                }
              } catch (err) {
                console.error(`Error fetching details for order ${order.id}:`, err)
              }
              return { order, items: [], gift_cards: [] }
            })
          )
          setOrders(ordersWithDetails)
        }
      } catch (err) {
        console.error('Error fetching orders:', err)
        setError(err instanceof Error ? err.message : 'Failed to load purchase history')
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [account?.address])

  if (!account) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Please connect your wallet to view purchase history</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-user"></div>
        <p className="mt-4 text-slate-400">Loading purchase history...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">Error: {error}</p>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="material-symbols-outlined text-6xl text-slate-600 mb-4">shopping_bag</span>
        <h2 className="text-2xl font-bold text-white mb-2">No purchases yet</h2>
        <p className="text-slate-400">Your purchase history will appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Purchase History</h1>
        <p className="text-slate-400">View all your gift card purchases and redemption codes</p>
      </div>

      {orders.map((orderData) => {
        const { order, items, gift_cards } = orderData
        const isExpanded = expandedOrder === order.id
        const totalAmount = (order.total_amount / 100).toFixed(2)
        const orderDate = new Date(order.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })

        return (
          <div
            key={order.id}
            className="bg-slate-800/50 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-colors"
          >
            {/* Order Header */}
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-symbols-outlined text-primary-user">receipt</span>
                  <h3 className="text-lg font-bold text-white">
                    Order #{order.id.substring(0, 8).toUpperCase()}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold ${
                      order.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : order.status === 'pending'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {order.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-slate-400">{orderDate}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-white">${totalAmount}</p>
                <p className="text-xs text-slate-400">{order.currency}</p>
              </div>
              <button className="ml-4 text-slate-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined">
                  {isExpanded ? 'expand_less' : 'expand_more'}
                </span>
              </button>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="mt-6 pt-6 border-t border-white/10 space-y-6">
                {/* Transaction Info */}
                {order.transaction_hash && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-400 mb-2">Transaction Hash</h4>
                    <p className="text-sm text-white font-mono break-all">{order.transaction_hash}</p>
                  </div>
                )}

                {/* Order Items */}
                <div>
                  <h4 className="text-sm font-bold text-slate-400 mb-3">Items Purchased</h4>
                  <div className="space-y-3">
                    {items.map((item) => {
                      const giftCardItem = item.gift_card_item
                      const itemPrice = (item.price_at_purchase / 100).toFixed(2)
                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg"
                        >
                          {giftCardItem?.image_url && (
                            <img
                              src={giftCardItem.image_url}
                              alt={giftCardItem.name}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <h5 className="font-bold text-white">{giftCardItem?.name || 'Unknown Item'}</h5>
                            <p className="text-sm text-slate-400">
                              {giftCardItem?.brand} • Quantity: {item.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-white">${itemPrice}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Gift Cards */}
                {gift_cards.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-400 mb-3">Gift Card Codes</h4>
                    <div className="space-y-2">
                      {gift_cards.map((card) => {
                        const cardValue = (card.balance / 100).toFixed(2)
                        return (
                          <div
                            key={card.id}
                            className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-user/10 to-primary-user/5 rounded-lg border border-primary-user/20"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="material-symbols-outlined text-primary-user text-sm">
                                  card_giftcard
                                </span>
                                <p className="font-mono font-bold text-white">{card.code}</p>
                              </div>
                              <p className="text-xs text-slate-400">
                                Balance: ${cardValue} {card.currency} • Status: {card.state}
                              </p>
                              {card.recipient_email && (
                                <p className="text-xs text-slate-500 mt-1">
                                  Sent to: {card.recipient_email}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(card.code)
                                alert('Gift card code copied to clipboard!')
                              }}
                              className="px-3 py-1.5 bg-primary-user/20 hover:bg-primary-user/30 rounded-lg text-xs font-bold text-primary-user transition-colors"
                            >
                              Copy
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Recipient Email */}
                {order.recipient_email && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-400 mb-2">Recipient Email</h4>
                    <p className="text-sm text-white">{order.recipient_email}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
