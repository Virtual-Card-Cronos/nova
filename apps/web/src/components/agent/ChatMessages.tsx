/**
 * ChatMessages - Renders the agent console chat history.
 * Matches the design from nova-x402_agentic_dashboard
 */

'use client'

import React from 'react'
import { motion } from 'framer-motion'

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  purchaseIntent?: {
    brand: string
    amount: string
    currency: string
    description: string
    metadata?: {
      giftUpItemName?: string
    }
  }
}

export function ChatMessages(props: { 
  messages: ChatMessage[]
  isTyping: boolean
  onAuthorize?: () => void
  onCancel?: () => void
  showAuthorizationButtons?: boolean
}) {
  return (
    <div className="p-6 space-y-6 min-h-[400px] flex flex-col justify-end">
      {props.messages.map((message) => (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start gap-4 items-end'}`}
        >
          {message.role === 'assistant' && (
            <div className="w-10 h-10 rounded-full agent-gradient flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-white text-[20px]">smart_toy</span>
            </div>
          )}
          <div className={`max-w-[70%] ${message.role === 'user' ? '' : 'flex flex-col gap-1 items-start'}`}>
            {message.role === 'assistant' && (
              <p className="text-primary text-[12px] font-bold tracking-wide uppercase">Nova-x402 Agent</p>
            )}
            <div
              className={`rounded-2xl ${
                message.role === 'user'
                  ? 'bg-primary text-white rounded-tr-none shadow-lg px-5 py-3'
                  : 'bg-cronos-card border border-white/5 text-slate-200 rounded-tl-none px-5 py-4'
              }`}
            >
              <div className="text-sm font-medium leading-relaxed whitespace-pre-line">
                {message.content.split('\n').map((line, idx, arr) => {
                  // Format lines with bold text
                  const parts: React.ReactNode[] = []
                  let lastIndex = 0
                  const boldRegex = /\*\*(.*?)\*\*/g
                  let match
                  
                  while ((match = boldRegex.exec(line)) !== null) {
                    if (match.index > lastIndex) {
                      parts.push(line.substring(lastIndex, match.index))
                    }
                    // Check if it's a price/amount (starts with $ or contains USDC/CRO)
                    const isPrice = match[1].includes('$') || match[1].includes('USDC') || match[1].includes('CRO')
                    parts.push(
                      <span key={`bold-${idx}-${match.index}`} className={`font-bold ${isPrice ? 'text-primary' : 'text-white'}`}>
                        {match[1]}
                      </span>
                    )
                    lastIndex = match.index + match[0].length
                  }
                  if (lastIndex < line.length) {
                    parts.push(line.substring(lastIndex))
                  }
                  
                  return (
                    <span key={idx}>
                      {parts.length > 0 ? parts : line}
                      {idx < arr.length - 1 && <br />}
                    </span>
                  )
                })}
              </div>
              {message.purchaseIntent && (
                <div className="mt-4 p-3 bg-black/40 rounded-lg border border-primary/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-[#171a21] flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-[20px]">sports_esports</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{message.purchaseIntent.metadata?.giftUpItemName || message.purchaseIntent.brand}</p>
                      <p className="text-[10px] text-slate-400">Merchant: Gift Up!</p>
                    </div>
                  </div>
                  <span className="text-white font-bold">${(parseFloat(message.purchaseIntent.amount) / 1000000).toFixed(2)}</span>
                </div>
              )}
            </div>
            <p className={`text-[11px] text-slate-500 mt-1 ${message.role === 'user' ? 'text-right' : ''}`}>
              {message.role === 'user' ? 'Sent' : 'Received'} {Math.floor((Date.now() - message.timestamp) / 60000)}m ago
            </p>
          </div>
        </motion.div>
      ))}

      {props.isTyping && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start gap-4 items-end">
          <div className="w-10 h-10 rounded-full agent-gradient flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-white text-[20px]">smart_toy</span>
          </div>
          <div className="bg-cronos-card border border-white/5 px-4 py-3 rounded-2xl rounded-tl-none">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
              <div
                className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                style={{ animationDelay: '0.1s' }}
              />
              <div
                className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                style={{ animationDelay: '0.2s' }}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Authorization CTA */}
      {props.showAuthorizationButtons && props.onAuthorize && props.onCancel && (
        <div className="flex justify-center pt-4">
          <div className="flex gap-3 w-full max-w-[400px]">
            <button
              type="button"
              onClick={props.onAuthorize}
              className="flex-1 bg-primary hover:bg-primary/90 text-white h-12 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/30"
            >
              <span className="material-symbols-outlined text-[20px]">verified_user</span>
              Authorize Settlement
            </button>
            <button
              type="button"
              onClick={props.onCancel}
              className="px-6 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white h-12 rounded-xl font-bold transition-all border border-white/10"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}