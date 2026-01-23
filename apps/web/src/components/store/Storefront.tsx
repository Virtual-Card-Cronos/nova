/**
 * Storefront - Human purchase flow UI (manual checkout).
 * Matches the design from novacard_home_dashboard and novacard_dashboard_(connected)
 */

'use client'

import { useMemo, useState, useEffect } from 'react'
import { useActiveAccount } from "thirdweb/react"
import { motion } from 'framer-motion'
import { useX402Payment } from '@/hooks/useX402Payment'
import { PaymentBanner } from '@/components/agent/PaymentBanner'
import type { PurchaseIntent } from '@/lib/types'

type CatalogItem = {
  id: string
  brand: string
  name: string
  description?: string | null
  price: number // in cents
  currency: string
  image_url?: string | null
  inventory_count: number
  category: string
  denominationRange: string
  supportedCurrencies: string[]
}

// Map brands to categories
function getCategory(brand: string): string {
  const brandLower = brand.toLowerCase()
  if (['steam', 'roblox', 'xbox', 'playstation', 'nintendo'].includes(brandLower)) return 'gaming'
  if (['amazon', 'target', 'walmart', 'best buy', 'ebay'].includes(brandLower)) return 'shopping'
  if (['starbucks', 'doordash', 'grubhub', 'uber'].includes(brandLower)) return 'food'
  if (['airbnb'].includes(brandLower)) return 'travel'
  return 'other'
}

export function Storefront() {
  const account = useActiveAccount()
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [items, setItems] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null)
  const { paymentState, initiatePayment, confirmPayment, resetPayment } = useX402Payment()

  useEffect(() => {
    async function fetchItems() {
      try {
        setLoading(true)
        const response = await fetch('/api/gift-cards')
        const data = await response.json()
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch gift cards')
        }

        // Transform database items to CatalogItem format
        const transformedItems: CatalogItem[] = data.items
          .filter((item: any) => item.is_active && item.inventory_count > 0)
          .map((item: any) => ({
            id: item.id,
            brand: item.brand,
            name: item.name,
            description: item.description,
            price: item.price,
            currency: item.currency,
            image_url: item.image_url,
            inventory_count: item.inventory_count,
            category: getCategory(item.brand),
            denominationRange: `$${(item.price / 100).toFixed(2)}`,
            supportedCurrencies: ['USDC', 'CRO'],
          }))

        setItems(transformedItems)
        console.log('[Storefront] ✅ Loaded', transformedItems.length, 'gift cards')
      } catch (err) {
        console.error('[Storefront] ❌ Error fetching items:', err)
        setError(err instanceof Error ? err.message : 'Failed to load gift cards')
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [])

  // Handle fulfillment after payment completes
  useEffect(() => {
    if (paymentState.status === 'completed' && paymentState.transactionHash && selectedItem) {
      handleFulfillment(selectedItem, paymentState.transactionHash)
    }
  }, [paymentState.status, paymentState.transactionHash, selectedItem])

  async function handlePurchase(item: CatalogItem) {
    if (!account) {
      alert('Please connect your wallet first')
      return
    }

    if (item.inventory_count === 0) {
      alert('This item is out of stock')
      return
    }

    setSelectedItem(item)
    
    // Convert price to USDC base units (6 decimals)
    const usdcAmount = Math.floor((item.price / 100) * 1_000_000).toString()
    
    console.log('[Storefront] 🛒 Initiating purchase:', {
      item: item.name,
      price: `$${(item.price / 100).toFixed(2)}`,
      usdcAmount,
    })
    
    const intent: PurchaseIntent = {
      agentId: account.address,
      amount: usdcAmount,
      currency: 'USDC',
      description: `${item.name} - $${(item.price / 100).toFixed(2)} ${item.currency}`,
      recipient: process.env.NEXT_PUBLIC_FACILITATOR_ADDRESS || account.address,
      metadata: {
        giftCardItemId: item.id,
        giftCardItemName: item.name,
        giftCardPrice: item.price,
        giftCardCurrency: item.currency,
        brand: item.brand,
        requestedBy: account.address,
      },
    }

    try {
      await initiatePayment(intent)
      console.log('[Storefront] ✅ Payment initiated, status:', paymentState.status)
    } catch (error) {
      console.error('[Storefront] ❌ Payment initiation error:', error)
      alert(`Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      resetPayment()
      setSelectedItem(null)
    }
  }

  async function handleFulfillment(item: CatalogItem, transactionHash: string) {
    if (!account) return

    try {
      // Prompt for email
      const email = prompt('Enter recipient email for gift card delivery:')
      if (!email) {
        alert('Email is required for gift card delivery')
        resetPayment()
        setSelectedItem(null)
        return
      }

      const response = await fetch('/api/fulfillment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionHash,
          giftCardItemId: item.id,
          recipientEmail: email,
          userAddress: account.address,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Fulfillment failed')
      }

      const result = await response.json()
      alert(`✅ Gift card issued successfully! Order ID: ${result.orderId}`)
      
      // Refresh items to update inventory
      const refreshResponse = await fetch('/api/gift-cards')
      const refreshData = await refreshResponse.json()
      if (refreshData.success) {
        const transformedItems: CatalogItem[] = refreshData.items
          .filter((i: any) => i.is_active && i.inventory_count > 0)
          .map((i: any) => ({
            id: i.id,
            brand: i.brand,
            name: i.name,
            description: i.description,
            price: i.price,
            currency: i.currency,
            image_url: i.image_url,
            inventory_count: i.inventory_count,
            category: getCategory(i.brand),
            denominationRange: `$${(i.price / 100).toFixed(2)}`,
            supportedCurrencies: ['USDC', 'CRO'],
          }))
        setItems(transformedItems)
      }

      resetPayment()
      setSelectedItem(null)
    } catch (error) {
      console.error('Fulfillment error:', error)
      alert(`Failed to issue gift card: ${error instanceof Error ? error.message : 'Unknown error'}`)
      resetPayment()
      setSelectedItem(null)
    }
  }

  const categories = [
    { id: 'all', label: 'All', icon: 'apps' },
    { id: 'popular', label: 'Popular', icon: 'star' },
    { id: 'gaming', label: 'Gaming', icon: 'sports_esports' },
    { id: 'shopping', label: 'E-commerce', icon: 'shopping_bag' },
    { id: 'food', label: 'Food & Drink', icon: 'restaurant' },
    { id: 'travel', label: 'Travel', icon: 'flight' },
  ]

  const filtered = useMemo(() => {
    let result = items
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      result = result.filter((it) => it.brand.toLowerCase().includes(q))
    }
    if (selectedCategory !== 'all' && selectedCategory !== 'popular') {
      result = result.filter((it) => it.category === selectedCategory)
    }
    return result
  }, [items, query, selectedCategory])

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 p-8 md:p-12">
        <div className="relative z-10 max-w-2xl">
          <span className="mb-4 inline-block rounded-full bg-primary-user/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary-user">
            Web3 Gift Cards
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-6xl mb-6">
            Spend Your Crypto anywhere. <span className="text-primary-user">Instant Delivery.</span>
          </h1>
          <p className="text-lg text-slate-400 mb-8 leading-relaxed">
            Purchase gift cards from 5,000+ global brands using your favorite cryptocurrencies including BTC, ETH, and USDC.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="flex min-w-[160px] items-center justify-center rounded-lg bg-primary-user py-3 px-6 text-base font-bold text-white hover:bg-blue-600 transition-all">
              Explore Catalog
            </button>
            <button className="flex min-w-[160px] items-center justify-center rounded-lg border border-white/10 bg-white/5 py-3 px-6 text-base font-bold text-white hover:bg-white/10 transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <label className="relative flex w-full">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <span className="material-symbols-outlined">search</span>
              </div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-xl border-none bg-card-dark py-4 pl-12 pr-4 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-primary-user/50"
                placeholder="Search 5,000+ brands (e.g. Amazon, Netflix, Uber)..."
                type="text"
              />
            </label>
          </div>
          <button className="flex items-center gap-2 rounded-xl bg-card-dark px-6 py-4 text-white border border-white/5 hover:border-white/20 transition-all">
            <span className="material-symbols-outlined">public</span>
            <span className="font-medium">United States</span>
            <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
          </button>
        </div>

        {/* Category Filter Rail */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-primary-user text-white shadow-md shadow-primary-user/20'
                  : 'bg-card-dark text-slate-300 hover:text-white border border-white/5'
              }`}
            >
              <span className="material-symbols-outlined text-lg">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Brand Grid */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white">Popular Brands</h2>
            <p className="text-slate-500 text-sm mt-1 font-medium">Redeem your crypto for top global brands instantly.</p>
          </div>
          <a className="text-sm font-bold text-primary-user hover:underline" href="#">
            View All
          </a>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-user"></div>
            <p className="text-slate-400 mt-4">Loading gift cards...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-400">Error: {error}</p>
            <p className="text-slate-400 text-sm mt-2">Make sure your database is configured and the schema is run.</p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400">No gift cards found. Try a different search or category.</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="group bg-card-dark rounded-2xl overflow-hidden border border-white/5 hover:border-primary-user/50 transition-all hover:shadow-2xl hover:shadow-primary-user/10"
            >
              <div className="w-full aspect-video bg-slate-800 flex items-center justify-center p-8 overflow-hidden">
                {item.image_url ? (
                  <img 
                    src={item.image_url} 
                    alt={item.brand}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      // Fallback to initial if image fails
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      target.parentElement!.innerHTML = `<div class="text-4xl font-bold text-white opacity-50">${item.brand.charAt(0)}</div>`
                    }}
                  />
                ) : (
                  <div className="text-4xl font-bold text-white opacity-50">{item.brand.charAt(0)}</div>
                )}
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-white text-lg font-bold">{item.brand}</p>
                  <span className="text-[10px] font-bold bg-green-500/10 text-green-500 px-2 py-0.5 rounded uppercase">
                    {item.inventory_count > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
                <p className="text-slate-500 text-sm font-medium mb-4">{item.description || item.name}</p>
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {item.supportedCurrencies.map((curr, idx) => (
                      <div
                        key={idx}
                        className="size-6 rounded-full bg-slate-800 border-2 border-card-dark flex items-center justify-center text-[8px] font-bold text-white"
                      >
                        {curr}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={!account || item.inventory_count === 0 || (paymentState.status !== 'idle' && selectedItem?.id !== item.id)}
                    onClick={() => handlePurchase(item)}
                    className="bg-primary-user/10 hover:bg-primary-user text-primary-user hover:text-white transition-all px-4 py-1.5 rounded-lg text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {paymentState.status !== 'idle' && selectedItem?.id === item.id
                      ? paymentState.status === 'requesting' 
                        ? 'Requesting...'
                        : paymentState.status === 'signing'
                        ? 'Signing...'
                        : paymentState.status === 'submitting'
                        ? 'Submitting...'
                        : paymentState.status === 'confirming'
                        ? 'Confirming...'
                        : 'Processing...'
                      : 'Buy'}
                  </button>
                </div>
                <div className="mt-3 text-xs text-slate-400">{item.denominationRange}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Payment Banner - Fixed position at bottom */}
      {paymentState.status !== 'idle' && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background-dark border-t border-white/10 shadow-2xl">
          <div className="max-w-[1200px] mx-auto px-6 py-4">
            <PaymentBanner
              state={
                paymentState.status === 'failed'
                  ? { status: 'failed', challenge: paymentState.challenge, error: paymentState.error }
                  : { status: paymentState.status, challenge: paymentState.challenge }
              }
              onSignAndPay={() => confirmPayment('')}
              onReset={() => {
                resetPayment()
                setSelectedItem(null)
              }}
            />
          </div>
        </div>
      )}

      {/* Spacer to prevent content from being hidden behind fixed payment banner */}
      {paymentState.status !== 'idle' && <div className="h-32"></div>}
    </div>
  )
}