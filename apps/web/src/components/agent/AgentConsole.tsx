/**
 * AgentConsole - Primary UI for agentic (x402) purchases.
 * Matches the design from nova-x402_agentic_dashboard
 * Now integrated with Crypto.com AI Agent SDK
 */

'use client'

import { useState } from 'react'
import { useActiveAccount } from "thirdweb/react"
import { useX402Payment } from '@/hooks/useX402Payment'
import { PurchaseIntent } from '@/lib/types'
import { ChatComposer } from '@/components/agent/ChatComposer'
import { ChatMessages, ChatMessage } from '@/components/agent/ChatMessages'
import { PaymentBanner, PaymentBannerState } from '@/components/agent/PaymentBanner'

export function AgentConsole() {
  const account = useActiveAccount()
  const { paymentState, initiatePayment, confirmPayment, resetPayment } = useX402Payment()
  const [isTyping, setIsTyping] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'boot',
      role: 'assistant',
      content:
        "I am NovaAgent. Tell me what to buy and I will request an x402 payment challenge, then you sign once to authorize USDC.",
      timestamp: Date.now(),
    },
  ])
  const [pendingPurchaseIntent, setPendingPurchaseIntent] = useState<PurchaseIntent | null>(null)

  const send = async () => {
    if (!input.trim() || !account) return
    const user = input.trim()
    setInput('')
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: 'user', content: user, timestamp: Date.now() }])
    setIsTyping(true)

    try {
      // Call Crypto.com AI Agent SDK via API
      const response = await fetch('/api/agent/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: user,
          userAddress: account.address,
          context: {
            previousMessages: messages.slice(-5).map((m) => ({
              role: m.role,
              content: m.content,
            })),
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Agent processing failed')
      }

      const agentResponse = await response.json()

      // Show agent reasoning
      if (agentResponse.reasoning) {
        setMessages((m) => [
          ...m,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `🤔 ${agentResponse.reasoning}`,
            timestamp: Date.now(),
          },
        ])
      }

      // If purchase intent, format message with payment details
      let purchaseMessage: ChatMessage | null = null
      if (agentResponse.intent === 'purchase' && agentResponse.purchaseIntent) {
        const amount = parseFloat(agentResponse.purchaseIntent.amount) / 1000000
        const brandName = agentResponse.purchaseIntent.metadata?.giftCardItemName || agentResponse.purchaseIntent.brand
        const messageContent = `Searching inventory for ${agentResponse.purchaseIntent.brand} cards...\n\nFound a **$${amount.toFixed(2)} ${brandName}** (Digital Code).\nSettlement amount: **${amount.toFixed(2)} USDC** + Gas.\n\nWould you like to authorize this x402 settlement on Cronos?`
        
        purchaseMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: messageContent,
          timestamp: Date.now(),
          purchaseIntent: {
            brand: agentResponse.purchaseIntent.brand,
            amount: agentResponse.purchaseIntent.amount,
            currency: agentResponse.purchaseIntent.currency,
            description: agentResponse.purchaseIntent.description,
            metadata: agentResponse.purchaseIntent.metadata,
          },
        }
        
        const intent: PurchaseIntent = {
          agentId: account.address,
          amount: agentResponse.purchaseIntent.amount,
          currency: agentResponse.purchaseIntent.currency,
          description: agentResponse.purchaseIntent.description,
          // Recipient will be set by the API to facilitator address
          recipient: '', // Will be determined server-side
          metadata: {
            ...agentResponse.purchaseIntent.metadata,
            brand: agentResponse.purchaseIntent.brand,
            country: agentResponse.purchaseIntent.country,
            requestedBy: account.address,
          },
        }
        setPendingPurchaseIntent(intent)
      } else {
        // Regular message
        setMessages((m) => [
          ...m,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: agentResponse.message,
            timestamp: Date.now(),
          },
        ])
      }

      if (purchaseMessage) {
        setMessages((m) => [...m, purchaseMessage!])
      }
      setIsTyping(false)
    } catch (error) {
      console.error('Agent error:', error)
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
          timestamp: Date.now(),
        },
      ])
      setIsTyping(false)
    }
  }

  if (!account) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <span className="material-symbols-outlined text-5xl text-slate-400 mb-4">account_balance_wallet</span>
        <div className="mt-3 text-lg font-semibold text-white">Connect your wallet</div>
        <div className="mt-1 text-sm text-slate-400">The agent console needs a wallet to sign the x402 authorization.</div>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden shadow-2xl border-primary/20">
      <div className="bg-primary/10 px-6 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Nova-x402 Active</span>
        </div>
        <span className="text-[11px] font-mono text-slate-500">Session: {account.address.slice(0, 4)}...{account.address.slice(-4)}</span>
      </div>

      <ChatMessages 
        messages={messages} 
        isTyping={isTyping}
        showAuthorizationButtons={!!pendingPurchaseIntent && paymentState.status === 'idle'}
        onAuthorize={async () => {
          if (pendingPurchaseIntent) {
            await initiatePayment(pendingPurchaseIntent)
            setPendingPurchaseIntent(null)
          }
        }}
        onCancel={() => setPendingPurchaseIntent(null)}
      />

      {paymentState.status !== 'idle' && (() => {
        const bannerState: PaymentBannerState =
          paymentState.status === 'failed'
            ? { status: 'failed', challenge: paymentState.challenge, error: paymentState.error }
            : { status: paymentState.status, challenge: paymentState.challenge }

        return <PaymentBanner state={bannerState} onSignAndPay={() => confirmPayment('')} onReset={() => { resetPayment(); setPendingPurchaseIntent(null) }} />
      })()}

      <ChatComposer value={input} onChange={setInput} onSend={send} disabled={isTyping || paymentState.status === 'requesting'} />
    </div>
  )
}