/**
 * PaymentBanner - Shows x402 / payment state and CTAs.
 * Matches the design from x402_authorization_modal
 */

'use client'

import { X402Challenge } from '@/lib/types'

export type PaymentBannerState =
  | { status: 'idle' }
  | { status: 'requesting'; challenge?: X402Challenge }
  | { status: 'signing'; challenge?: X402Challenge }
  | { status: 'submitting'; challenge?: X402Challenge }
  | { status: 'confirming'; challenge?: X402Challenge }
  | { status: 'completed'; challenge?: X402Challenge }
  | { status: 'failed'; challenge?: X402Challenge; error?: string }

export function PaymentBanner(props: {
  state: PaymentBannerState
  onSignAndPay: () => void
  onReset: () => void
}) {
  if (props.state.status === 'idle') return null

  const { state } = props
  const challenge = 'challenge' in state ? state.challenge : undefined

  if (state.status === 'signing' && challenge) {
    // Show full x402 authorization modal style
    return (
      <div className="border-t border-white/10 bg-white/5">
        <div className="p-6 space-y-4">
          {/* Progress Bar */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-6 justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">shield_lock</span>
                <p className="text-white text-sm font-medium">Secure Authorization</p>
              </div>
              <p className="text-white text-xs opacity-70">Step 2 of 3</p>
            </div>
            <div className="rounded-full bg-white/10 h-1.5 overflow-hidden">
              <div className="h-full rounded-full bg-primary" style={{ width: '66%' }}></div>
            </div>
          </div>

          {/* Amount Display */}
          <div className="flex flex-col items-center pt-2">
            <div className="bg-primary/10 px-4 py-2 rounded-full mb-2">
              <h2 className="text-primary tracking-tight text-3xl font-extrabold">
                ${parseFloat(challenge.resource.amount) / 1000000} USDC
              </h2>
            </div>
          </div>

          {/* Description */}
          <div className="px-2 pb-2">
            <p className="text-slate-300 text-sm text-center leading-relaxed">
              NovaAgent is requesting a <span className="text-white font-semibold">${parseFloat(challenge.resource.amount) / 1000000} USDC</span> authorization to execute your gift card purchase on <span className="text-white font-semibold">Cronos EVM</span>.
            </p>
          </div>

          {/* Transaction Summary */}
          <div className="mx-2 mb-4 p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-slate-400">Network Fee</span>
              <span className="text-white">~0.42 CRO</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Facilitator Address</span>
              <span className="text-white font-mono">{challenge.resource.recipient.slice(0, 6)}...{challenge.resource.recipient.slice(-4)}</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-3 px-2">
            <button
              type="button"
              onClick={props.onSignAndPay}
              className="flex items-center justify-center gap-2 rounded-lg h-12 px-5 bg-primary hover:bg-primary/90 transition-colors text-white text-base font-bold shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined text-lg">touch_app</span>
              <span>Authorize & Execute</span>
            </button>
            <button
              type="button"
              onClick={props.onReset}
              className="flex items-center justify-center rounded-lg h-10 px-5 bg-transparent hover:bg-white/5 transition-colors text-slate-400 hover:text-white text-sm font-medium"
            >
              Cancel Transaction
            </button>
          </div>

          {/* Security Footer */}
          <div className="flex justify-center items-center gap-2 pt-2 opacity-50">
            <span className="material-symbols-outlined text-[12px] text-white">lock</span>
            <span className="text-[10px] text-white uppercase tracking-widest font-bold">Encrypted via Cronos Secure Bridge</span>
          </div>
        </div>
      </div>
    )
  }

  // Other states - simpler banner
  const label =
    state.status === 'requesting'
      ? 'Requesting payment authorization…'
      : state.status === 'submitting'
        ? 'Submitting payment…'
        : state.status === 'confirming'
          ? 'Confirming transaction…'
          : state.status === 'completed'
            ? 'Payment completed.'
            : `Payment failed${'error' in state && state.error ? `: ${state.error}` : ''}`

  return (
    <div className="border-t border-white/10 p-4">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary text-lg">shopping_cart</span>
        <div className="flex-1">
          <div className="text-sm font-semibold text-white">{label}</div>
          {challenge && (
            <div className="mt-1 text-xs text-slate-400">
              {challenge.resource.description} · ${parseFloat(challenge.resource.amount) / 1000000} USDC
            </div>
          )}
        </div>

        {(state.status === 'completed' || state.status === 'failed') && (
          <button
            type="button"
            onClick={props.onReset}
            className="rounded-xl bg-white/5 hover:bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors"
          >
            {state.status === 'completed' ? 'Done' : 'Try again'}
          </button>
        )}
      </div>
    </div>
  )
}