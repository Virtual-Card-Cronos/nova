/**
 * Agent Service - Main Exports
 * Located in lib/agent for consistency with other utilities
 */

export { processAgentRequest, initializeAgent } from './agent-processor'
export { findCard, issueGiftCard, getGiftCardByCode, listAllItems, triggerX402 } from './tools'
export { SYSTEM_PROMPT } from './prompts'
export { initializeCryptoAI, processWithAgent } from './agent'
export type { AgentRequest, AgentResponse, GiftCardItem, GiftCardOrder, GiftCard } from './types'
