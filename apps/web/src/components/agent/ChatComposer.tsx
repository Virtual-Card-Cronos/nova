/**
 * ChatComposer - Input + send button.
 * Matches the design from nova-x402_agentic_dashboard
 */

'use client'

import { Send } from 'lucide-react'

export function ChatComposer(props: {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  disabled?: boolean
}) {
  return (
    <div className="p-4 bg-black/30 border-t border-white/10">
      <div className="relative">
        <input
          type="text"
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !props.disabled && props.onSend()}
          placeholder="Reply to Nova-x402..."
          className="w-full bg-cronos-card/50 border border-white/10 rounded-xl py-4 pl-5 pr-14 text-sm text-white focus:ring-primary focus:border-primary placeholder:text-slate-500 transition-all"
          disabled={props.disabled}
        />
        <button
          type="button"
          onClick={props.onSend}
          disabled={props.disabled || !props.value.trim()}
          className="absolute right-2 top-2 bottom-2 aspect-square bg-primary/20 hover:bg-primary/30 text-primary rounded-lg flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}