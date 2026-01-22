/**
 * Crypto.com AI Agent Processor
 * Main entry point that uses Crypto.com AI SDK
 */

import { AgentRequest, AgentResponse } from './types'
import { initializeCryptoAI, processWithAgent } from './agent'

let agentInitialized = false

/**
 * Initialize the Crypto.com AI SDK (called once at startup)
 */
export async function initializeAgent() {
  if (!agentInitialized) {
    await initializeCryptoAI()
    agentInitialized = true
  }
}

/**
 * Process agent request using Crypto.com AI SDK
 */
export async function processAgentRequest(request: AgentRequest): Promise<AgentResponse> {
  // Ensure agent is initialized
  if (!agentInitialized) {
    await initializeAgent()
  }

  // Process with Crypto.com AI Agent SDK
  const result = await processWithAgent(
    request.message,
    request.userAddress,
    request.context?.previousMessages || []
  )

  return result as AgentResponse
}
