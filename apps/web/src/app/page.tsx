'use client'

import { AppShell } from '@/components/AppShell'
import { Storefront } from '@/components/store/Storefront'
import { AgentConsole } from '@/components/agent/AgentConsole'
import { SuggestedCards } from '@/components/agent/SuggestedCards'
import { StatsFooter } from '@/components/agent/StatsFooter'

export default function Home() {
  return (
    <AppShell initialView="store">
      {(view) => {
        if (view === 'store') {
          return <Storefront />
        }
        
        return (
          <>
            {/* Hero Section */}
            <section className="max-w-[800px] mx-auto mb-16">
              <div className="text-center mb-10">
                <h1 className="text-white tracking-tight text-4xl md:text-5xl font-extrabold mb-4">
                  Web3 Gift Card <span className="text-primary">Concierge</span>
                </h1>
                <p className="text-slate-400 text-lg max-w-xl mx-auto">
                  Search our gift card inventory and settle instantly on Cronos EVM with Nova-x402.
                </p>
              </div>
              
              {/* Agent Console */}
              <AgentConsole />
            </section>
            
            {/* Suggested Cards */}
            <SuggestedCards />
            
            {/* Stats Footer */}
            <StatsFooter />
          </>
        )
      }}
    </AppShell>
  )
}