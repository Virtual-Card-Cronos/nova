/**
 * AppShell - Shared layout for Human + Agent views.
 * Matches the header design from the UI designs
 */

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ConnectWallet } from '@/components/ConnectWallet'
import { useActiveAccount } from "thirdweb/react"

export type AppView = 'store' | 'agent'

export function AppShell(props: { initialView?: AppView; children: (view: AppView) => React.ReactNode }) {
  const account = useActiveAccount()
  const [view, setView] = useState<AppView>(props.initialView ?? 'agent')

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background-dark/80 backdrop-blur-md">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Nova-x402 Logo"
              width={32}
              height={32}
              className="rounded-lg"
              priority
            />
            <h2 className="text-xl font-extrabold tracking-tight text-white">Nova-x402</h2>
          </div>

          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
              <button
                onClick={() => setView('store')}
                className={view === 'store' ? 'text-white' : 'hover:text-white transition-colors'}
              >
                Storefront
              </button>
              <button
                onClick={() => setView('agent')}
                className={view === 'agent' ? 'text-white' : 'hover:text-white transition-colors'}
              >
                Agent
              </button>
              <a href="#" className="hover:text-white transition-colors">History</a>
            </nav>

            <div className="flex items-center gap-4 border-l border-white/10 pl-6">
              {account && (
                <div className="flex flex-col items-end mr-2">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Network</span>
                  <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Cronos Testnet
                  </span>
                </div>
              )}
              <ConnectWallet />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1200px] mx-auto px-6 py-10">
        {props.children(view)}
      </main>

      {/* Ambient Glow Effects */}
      <div className="fixed top-1/4 -left-64 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-0 -right-64 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
    </div>
  )
}