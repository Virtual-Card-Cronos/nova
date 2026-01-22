/**
 * ThirdwebProvider Component (v5)
 * Using specific imports to avoid x402 dependency chain issues
 */

'use client'

import { ThirdwebProvider as TWProvider } from "thirdweb/react"

interface ThirdwebProviderProps {
  children: React.ReactNode
}

export function ThirdwebProvider({ children }: ThirdwebProviderProps) {
  return (
    <TWProvider>
      {children}
    </TWProvider>
  )
}