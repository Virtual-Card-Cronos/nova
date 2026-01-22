/**
 * Shared Types for NovaAgent - Aegis Pattern Implementation
 */

// Agent and Policy Types
export interface AgentPolicy {
  address: `0x${string}`;
  spendingLimit: bigint;
  isActive: boolean;
}

export interface PolicyCheck {
  agent: `0x${string}`;
  amount: bigint;
  approved: boolean;
  timestamp: number;
}

// x402 Protocol Types (HTTP 402 Payment Required)
export interface X402Challenge {
  scheme: 'x402';
  network: string;
  resource: X402Resource;
  signature?: string;
}

export interface X402Resource {
  type: 'payment';
  amount: string; // USDC amount as string to avoid precision issues
  currency: 'USDC';
  recipient: `0x${string}`;
  description: string;
  facilitatorUrl: string;
}

export interface X402Response {
  status: 402;
  challenge: X402Challenge;
  headers: {
    'WWW-Authenticate': string;
  };
}

// Purchase and Transaction Types
export interface PurchaseIntent {
  agentId: string;
  /**
   * Amount in atomic units (USDC base units) as a string.
   * Rationale: JSON-safe across API boundaries and aligns with x402 payloads.
   */
  amount: string;
  currency: 'USDC';
  description: string;
  recipient: `0x${string}`;
  metadata?: Record<string, any>;
}

export interface PurchaseRequest {
  intent: PurchaseIntent;
  agentSignature?: string;
  userAddress: `0x${string}`;
}

export interface PurchaseResponse {
  success: boolean;
  transactionHash?: `0x${string}`;
  error?: string;
}

// Gift Card and Fulfillment Types
export interface GiftCardOrder {
  type: 'amazon' | 'google_play' | 'steam' | 'other';
  amount: number;
  currency: string;
  delivery: {
    email: string;
    method: 'email';
  };
}

export interface FulfillmentResult {
  orderId: string;
  status: 'pending' | 'completed' | 'failed';
  cardCode?: string;
  deliveryStatus?: string;
  error?: string;
}

// AI Agent Types
export interface AgentMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface AgentContext {
  userId: string;
  sessionId: string;
  preferences: UserPreferences;
  conversation: AgentMessage[];
}

export interface UserPreferences {
  budget: {
    daily: number;
    monthly: number;
  };
  categories: string[];
  restrictions: string[];
}

// Wallet and Signature Types
export interface EIP3009Signature {
  v: number;
  r: `0x${string}`;
  s: `0x${string}`;
}

export interface PaymentAuthorization {
  spender: `0x${string}`;
  amount: bigint;
  deadline: bigint;
  signature: EIP3009Signature;
}