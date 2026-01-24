/**
 * SuggestedCards - "Suggested for You" section with gift card cards
 * Fetches from database and displays top gift cards
 */

'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import { ChevronRight, Gamepad2, ShoppingBag, Car, Gift } from 'lucide-react'
import { motion } from 'framer-motion'

type Card = {
  id: string
  title: string
  description: string
  icon: string
  iconBg: string
  tag: { text: string; color: string }
  glowColor: string
  price: number
  image_url?: string | null
}

// Map brands to icons and styles
function getBrandConfig(brand: string): { icon: React.ComponentType<{ className?: string }>; iconBg: string; tag: { text: string; color: string }; glowColor: string } {
  const brandLower = brand.toLowerCase()
  if (brandLower.includes('steam')) {
    return {
      icon: Gamepad2,
      iconBg: 'bg-[#171a21]',
      tag: { text: 'Gaming', color: 'bg-primary/10 text-primary' },
      glowColor: 'bg-primary/10',
    }
  }
  if (brandLower.includes('amazon')) {
    return {
      icon: ShoppingBag,
      iconBg: 'bg-white',
      tag: { text: 'Popular', color: 'bg-white/5 text-slate-500' },
      glowColor: 'bg-orange-500/10',
    }
  }
  if (brandLower.includes('uber')) {
    return {
      icon: Car,
      iconBg: 'bg-black',
      tag: { text: 'Instant', color: 'bg-emerald-500/10 text-emerald-500' },
      glowColor: 'bg-slate-500/10',
    }
  }
  return {
    icon: Gift,
    iconBg: 'bg-slate-800',
    tag: { text: 'Available', color: 'bg-primary/10 text-primary' },
    glowColor: 'bg-primary/10',
  }
}

export function SuggestedCards() {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCards() {
      try {
        const response = await fetch('/api/gift-cards')
        const data = await response.json()
        
        if (data.success && data.items) {
          // Get top 3 most popular/in-stock items
          const topItems = data.items
            .filter((item: any) => item.is_active && item.inventory_count > 0)
            .slice(0, 3)
            .map((item: any) => {
              const config = getBrandConfig(item.brand)
              return {
                id: item.id,
                title: item.brand,
                description: item.description || `${item.name} - $${(item.price / 100).toFixed(2)}`,
                price: item.price,
                image_url: item.image_url,
                ...config,
              }
            })
          
          setCards(topItems)
          console.log('[SuggestedCards] ✅ Loaded', topItems.length, 'suggested cards')
        }
      } catch (error) {
        console.error('[SuggestedCards] ❌ Error fetching cards:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCards()
  }, [])

  if (loading) {
    return (
      <section className="mt-16">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      </section>
    )
  }

  if (cards.length === 0) {
    return null
  }

  return (
    <section className="mt-16">
      <div className="flex items-center justify-between px-4 mb-6">
        <h2 className="text-white text-2xl font-bold tracking-tight">Suggested for You</h2>
        <button className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">
          View All Inventory <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card group hover:border-primary/50 transition-all rounded-2xl p-6 cursor-pointer overflow-hidden relative"
          >
            <div className={`absolute -right-4 -top-4 w-24 h-24 ${card.glowColor} rounded-full blur-2xl group-hover:opacity-50 transition-all`}></div>
            <div className="flex flex-col h-full">
              {card.image_url ? (
                <div className="w-14 h-14 rounded-xl overflow-hidden mb-6 shadow-xl border border-white/10 flex items-center justify-center bg-slate-800">
                  <img src={card.image_url} alt={card.title} className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className={`w-14 h-14 ${card.iconBg} rounded-xl flex items-center justify-center mb-6 shadow-xl border border-white/10`}>
                  {React.createElement(card.icon, { className: "w-8 h-8 text-white" })}
                </div>
              )}
              <h3 className="text-xl font-bold mb-2 text-white">{card.title}</h3>
              <p className="text-slate-400 text-sm mb-6 flex-grow leading-relaxed">{card.description}</p>
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <span className="text-primary font-bold text-sm">${(card.price / 100).toFixed(2)}</span>
                <span className={`${card.tag.color} text-[10px] font-bold uppercase px-2 py-1 rounded`}>
                  {card.tag.text}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
