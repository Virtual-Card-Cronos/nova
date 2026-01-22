/**
 * Policy Engine Client
 * Handles on-chain policy validation for agent spending limits
 * Uses thirdweb SDK instead of direct viem imports
 */

import { readContract } from "thirdweb"
import { getPolicyContract } from "@/app/contract"

// Policy check result
export interface PolicyCheck {
  agent: string
  amount: bigint
  approved: boolean
  timestamp: number
}

/**
 * Checks if policy contract is configured
 */
function isPolicyConfigured(): boolean {
  return !!(process.env.POLICY_CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_POLICY_CONTRACT_ADDRESS)
}

/**
 * Checks if an agent can spend the specified amount
 */
export async function checkPolicy(agent: string, amount: bigint): Promise<PolicyCheck> {
  if (!isPolicyConfigured()) {
    console.warn('POLICY_CONTRACT_ADDRESS not set, allowing by default for demo')
    return {
      agent,
      amount,
      approved: true,
      timestamp: Date.now(),
    }
  }

  const contract = getPolicyContract()
  if (!contract) {
    console.warn('Policy contract not available, allowing by default for demo')
    return {
      agent,
      amount,
      approved: true,
      timestamp: Date.now(),
    }
  }

  try {
    const approved = await readContract({
      contract,
      method: "checkPolicy",
      params: [agent as `0x${string}`, amount],
    })

    return {
      agent,
      amount,
      approved,
      timestamp: Date.now(),
    }
  } catch (error) {
    console.error('Policy check failed:', error)
    // For demo purposes, allow if contract call fails
    return {
      agent,
      amount,
      approved: true,
      timestamp: Date.now(),
    }
  }
}

/**
 * Gets the current spending limit for an agent
 */
export async function getSpendingLimit(agent: string): Promise<bigint> {
  if (!isPolicyConfigured()) {
    return BigInt(1000000000) // 1000 USDC default for demo
  }

  const contract = getPolicyContract()
  if (!contract) {
    return BigInt(1000000000) // 1000 USDC default for demo
  }

  try {
    const limit = await readContract({
      contract,
      method: "getSpendingLimit",
      params: [agent as `0x${string}`],
    })

    return limit
  } catch (error) {
    console.error('Failed to get spending limit:', error)
    return BigInt(0)
  }
}

/**
 * Validates agent policy before allowing a purchase
 */
export async function validateAgentPolicy(agent: string, amount: bigint): Promise<boolean> {
  const result = await checkPolicy(agent, amount)
  return result.approved
}

/**
 * Gets the policy engine functions
 */
export function getPolicyEngine() {
  return {
    checkPolicy,
    getSpendingLimit,
  }
}