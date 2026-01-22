/**
 * SuggestedCards - "Suggested for You" section with gift card cards
 * Matches the design from nova-x402_agentic_dashboard
 */

'use client'

import { motion } from 'framer-motion'

export function SuggestedCards() {
  const cards = [
    {
      id: 'steam',
      title: 'Steam',
      description: 'Instantly top up your Steam Wallet with zero fees using CRO or USDC.',
      icon: 'sports_esports',
      iconBg: 'bg-[#171a21]',
      tag: { text: '5% Cashback', color: 'bg-primary/10 text-primary' },
      glowColor: 'bg-primary/10',
    },
    {
      id: 'amazon',
      title: 'Amazon',
      description: 'Shop millions of items. Redeem instantly for US, UK, and DE stores.',
      icon: 'shopping_bag',
      iconBg: 'bg-white',
      tag: { text: 'Popular', color: 'bg-white/5 text-slate-500' },
      glowColor: 'bg-orange-500/10',
    },
    {
      id: 'uber',
      title: 'Uber & Eats',
      description: 'Get a ride or order food. Easy settlement via Cronos smart contracts.',
      icon: 'directions_car',
      iconBg: 'bg-black',
      tag: { text: 'Instant', color: 'bg-emerald-500/10 text-emerald-500' },
      glowColor: 'bg-slate-500/10',
    },
  ]

  return (
    <section className="mt-16">
      <div className="flex items-center justify-between px-4 mb-6">
        <h2 className="text-white text-2xl font-bold tracking-tight">Suggested for You</h2>
        <button className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">
          View All Inventory <span className="material-symbols-outlined text-[18px]">chevron_right</span>
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
              <div className={`w-14 h-14 ${card.iconBg} rounded-xl flex items-center justify-center mb-6 shadow-xl border border-white/10`}>
                <span className="material-symbols-outlined text-white text-[32px]">{card.icon}</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">{card.title}</h3>
              <p className="text-slate-400 text-sm mb-6 flex-grow leading-relaxed">{card.description}</p>
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <span className="text-primary font-bold text-sm">Buy with CRO</span>
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
