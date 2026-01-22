/**
 * Shared Constants for NovaAgent
 */

// Network Configurations
export const NETWORKS = {
  CRONOS: {
    chainId: 25,
    name: 'Cronos',
    rpcUrl: 'https://evm.cronos.org',
    blockExplorer: 'https://cronoscan.com',
    nativeCurrency: {
      name: 'CRO',
      symbol: 'CRO',
      decimals: 18,
    },
  },
  CRONOS_TESTNET: {
    chainId: 338,
    name: 'Cronos Testnet',
    rpcUrl: 'https://evm-t3.cronos.org',
    blockExplorer: 'https://testnet.cronoscan.com',
    nativeCurrency: {
      name: 'TCRO',
      symbol: 'TCRO',
      decimals: 18,
    },
  },
} as const;

// Contract Addresses
export const CONTRACTS = {
  // Will be populated after deployment
  AGENT_POLICY: {
    mainnet: '' as `0x${string}`,
    testnet: '' as `0x${string}`,
  },
  USDC: {
    cronos: '0xc21223249CA28397B4B6541dfFaEcC539BfF0c59' as `0x${string}`,
    cronos_testnet: '0x66e428c3f67a68878562e79A0234c1F83c208770' as `0x${string}`,
  },
} as const;

// x402 Protocol Constants
export const X402_SCHEME = 'x402' as const;
export const X402_VERSION = '1.0' as const;

// Facilitator Configuration
export const FACILITATOR_CONFIG = {
  baseUrl: 'https://facilitator.crypto.com',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
} as const;

// Tillo API Configuration
export const TILLO_CONFIG = {
  baseUrl: 'https://api.tillo.com/v2',
  timeout: 30000,
  supportedCurrencies: ['USD', 'EUR', 'GBP'],
} as const;

// Agent Configuration
export const AGENT_CONFIG = {
  maxDailySpend: 1000n * 10n ** 18n, // 1000 USDC (with 18 decimals)
  maxMonthlySpend: 10000n * 10n ** 18n, // 10000 USDC
  defaultTimeout: 300000, // 5 minutes
  maxRetries: 3,
} as const;

// Gift Card Categories
export const GIFT_CARD_CATEGORIES = [
  'amazon',
  'google_play',
  'steam',
  'apple',
  'nintendo',
  'playstation',
  'xbox',
  'other',
] as const;

// Error Messages
export const ERROR_MESSAGES = {
  INSUFFICIENT_FUNDS: 'Insufficient funds for transaction',
  POLICY_VIOLATION: 'Transaction violates agent policy',
  INVALID_SIGNATURE: 'Invalid or expired signature',
  NETWORK_ERROR: 'Network connection failed',
  FACILITATOR_ERROR: 'Facilitator service unavailable',
  CONTRACT_ERROR: 'Smart contract interaction failed',
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  PAYMENT_REQUIRED: 402,
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Time Constants
export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
} as const;