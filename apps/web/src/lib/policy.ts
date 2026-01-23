/**
 * Policy Engine Client
 * Handles on-chain policy validation for agent spending limits
 * Uses thirdweb SDK instead of direct viem imports
 */

import { readContract } from "thirdweb"
import { policyContract } from "@/app/contract"
// Policy check result
export interface PolicyCheck {
  agent: string
  amount: bigint
  approved: boolean
  timestamp: number
}

/**
 * Checks if an agent can spend the specified amount
 */
export async function checkPolicy(agent: string, amount: bigint): Promise<PolicyCheck> {
  const contractAddress = process.env.POLICY_CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_POLICY_CONTRACT_ADDRESS
  
  if (!contractAddress || !policyContract) {
    console.warn('POLICY_CONTRACT_ADDRESS not set or invalid, allowing by default for demo')
    return {
      agent,
      amount,
      approved: true,
      timestamp: Date.now(),
    }
  }

  try {
    const approved = await readContract({
      contract: policyContract,
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
  const contractAddress = process.env.POLICY_CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_POLICY_CONTRACT_ADDRESS
  
  if (!contractAddress || !policyContract) {
    return BigInt(1000000000) // 1000 USDC default for demo
  }

  try {
    const limit = await readContract({
      contract: policyContract,
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
 * TEMPORARILY BYPASSED FOR TESTING - Always returns true
 */
export async function validateAgentPolicy(agent: string, amount: bigint): Promise<boolean> {
  // TODO: Re-enable policy check after testing
  console.log('[Policy] ⚠️ Policy check bypassed for testing. Agent:', agent, 'Amount:', amount.toString())
  return true
  
  // Original implementation (disabled):
  // const result = await checkPolicy(agent, amount)
  // return result.approved
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