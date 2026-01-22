/**
 * Storefront - Human purchase flow UI (manual checkout).
 * Matches the design from novacard_home_dashboard and novacard_dashboard_(connected)
 */

'use client'

import { useMemo, useState } from 'react'
import { useActiveAccount } from "thirdweb/react"
import { motion } from 'framer-motion'

type CatalogItem = {
  id: string
  brand: string
  category: string
  imageUrl?: string
  denominationRange: string
  supportedCurrencies: string[]
}

export function Storefront() {
  const account = useActiveAccount()
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const items = useMemo<CatalogItem[]>(
    () => [
      { id: 'amazon', brand: 'Amazon', category: 'shopping', denominationRange: '$10 - $2,000', supportedCurrencies: ['ETH', 'USDT'] },
      { id: 'steam', brand: 'Steam', category: 'gaming', denominationRange: '$5 - $100', supportedCurrencies: ['ETH', 'POL'] },
      { id: 'roblox', brand: 'Roblox', category: 'gaming', denominationRange: '$10 - $200', supportedCurrencies: ['ETH', 'USDC'] },
      { id: 'starbucks', brand: 'Starbucks', category: 'food', denominationRange: '$5 - $200', supportedCurrencies: ['ETH', 'USDT'] },
    ],
    []
  )

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="group bg-card-dark rounded-2xl overflow-hidden border border-white/5 hover:border-primary-user/50 transition-all hover:shadow-2xl hover:shadow-primary-user/10"
            >
              <div className="w-full aspect-video bg-slate-800 flex items-center justify-center p-8">
                <div className="text-4xl font-bold text-white opacity-50">{item.brand.charAt(0)}</div>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-white text-lg font-bold">{item.brand}</p>
                  <span className="text-[10px] font-bold bg-green-500/10 text-green-500 px-2 py-0.5 rounded uppercase">
                    Instant
                  </span>
                </div>
                <p className="text-slate-500 text-sm font-medium mb-4">Shop everything</p>
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
                    disabled={!account}
                    onClick={() => alert('Manual checkout coming soon')}
                    className="bg-primary-user/10 hover:bg-primary-user text-primary-user hover:text-white transition-all px-4 py-1.5 rounded-lg text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Buy
                  </button>
                </div>
                <div className="mt-3 text-xs text-slate-400">{item.denominationRange}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  )
}