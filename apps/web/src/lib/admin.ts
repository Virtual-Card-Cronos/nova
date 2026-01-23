/**
 * Admin Utilities
 * Tracks the first user to log in as admin using localStorage
 * Provides mock transaction data for the Crypto.com testnet
 */

// Storage keys
const ADMIN_ADDRESS_KEY = 'nova_admin_address'

// Network configuration for Cronos Testnet
export const CRONOS_TESTNET_CONFIG = {
  chainId: 338,
  name: 'Cronos Testnet',
  rpc: 'https://evm-t3.cronos.org',
  explorer: 'testnet.cronoscan.com',
  facilitatorAddress: '0x1f7b0c087e821f60cd9f85a5f7a4ad33c5d8c97c',
}

/**
 * Check if the current user is the admin (first user to log in)
 */
export function isAdmin(currentAddress: string | undefined): boolean {
  if (typeof window === 'undefined' || !currentAddress) {
    return false
  }
  
  const adminAddress = localStorage.getItem(ADMIN_ADDRESS_KEY)
  
  // If no admin is set, this is the first user - make them admin
  if (!adminAddress) {
    localStorage.setItem(ADMIN_ADDRESS_KEY, currentAddress)
    console.log('[Admin] 👑 First user detected, setting as admin:', currentAddress)
    return true
  }
  
  return adminAddress.toLowerCase() === currentAddress.toLowerCase()
}

/**
 * Get the admin address
 */
export function getAdminAddress(): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  return localStorage.getItem(ADMIN_ADDRESS_KEY)
}

/**
 * Reset admin (for testing purposes)
 */
export function resetAdmin(): void {
  if (typeof window === 'undefined') {
    return
  }
  localStorage.removeItem(ADMIN_ADDRESS_KEY)
  console.log('[Admin] Admin reset')
}

// Mock Transaction Status types
export type TransactionStatus = 'pending' | 'confirming' | 'completed' | 'failed'

// Mock Transaction interface
export interface MockTransaction {
  id: string
  txHash: string
  fromAddress: string
  toAddress: string
  amount: string
  currency: string
  usdValue: number
  status: TransactionStatus
  timestamp: Date
  blockNumber?: number
  confirmations: number
  giftCardBrand?: string
  giftCardAmount?: number
  recipientEmail?: string
  network: string
}

// Generate a mock transaction hash
function generateMockTxHash(): string {
  const chars = 'abcdef0123456789'
  let hash = '0x'
  for (let i = 0; i < 64; i++) {
    hash += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return hash
}

// Generate a mock wallet address
function generateMockAddress(): string {
  const chars = 'abcdef0123456789'
  let address = '0x'
  for (let i = 0; i < 40; i++) {
    address += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return address
}

// Mock gift card brands for transactions
const mockBrands = [
  'Amazon', 'Steam', 'Netflix', 'Spotify', 'Apple', 
  'Google Play', 'Xbox', 'PlayStation', 'Roblox', 'Starbucks'
]

// Mock email domains
const mockEmails = [
  'john.doe@gmail.com',
  'jane.smith@outlook.com',
  'alex.crypto@proton.me',
  'mike.web3@yahoo.com',
  'sarah.nft@icloud.com',
]

// Transaction status distribution (weighted for realistic demo)
const STATUS_DISTRIBUTION: TransactionStatus[] = [
  'pending', 'confirming', 'completed', 'completed', 'completed', 'failed'
]

/**
 * Generate mock transactions for the admin dashboard
 * Simulates orders being processed through Crypto.com testnet
 */
export function generateMockTransactions(count: number = 10): MockTransaction[] {
  const transactions: MockTransaction[] = []
  const now = new Date()
  
  for (let i = 0; i < count; i++) {
    const status: TransactionStatus = STATUS_DISTRIBUTION[Math.floor(Math.random() * STATUS_DISTRIBUTION.length)]
    const brand = mockBrands[Math.floor(Math.random() * mockBrands.length)]
    const amount = [10, 25, 50, 100][Math.floor(Math.random() * 4)]
    const usdcAmount = amount * 1_000_000 // USDC has 6 decimals
    
    // Create timestamp within last 24 hours
    const hoursAgo = Math.random() * 24
    const timestamp = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000)
    
    const confirmations = status === 'completed' ? 12 + Math.floor(Math.random() * 100) : 
                          status === 'confirming' ? Math.floor(Math.random() * 11) : 0
    
    transactions.push({
      id: `order-${Date.now()}-${i}`,
      txHash: generateMockTxHash(),
      fromAddress: generateMockAddress(),
      toAddress: CRONOS_TESTNET_CONFIG.facilitatorAddress,
      amount: usdcAmount.toString(),
      currency: 'USDC',
      usdValue: amount,
      status,
      timestamp,
      blockNumber: status !== 'pending' ? 15000000 + Math.floor(Math.random() * 100000) : undefined,
      confirmations,
      giftCardBrand: brand,
      giftCardAmount: amount,
      recipientEmail: mockEmails[Math.floor(Math.random() * mockEmails.length)],
      network: 'Cronos Testnet',
    })
  }
  
  // Sort by timestamp, most recent first
  return transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

/**
 * Format transaction hash for display
 */
export function formatTxHash(hash: string): string {
  if (hash.length <= 16) return hash
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`
}

/**
 * Format address for display
 */
export function formatAddress(address: string): string {
  if (address.length <= 12) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

/**
 * Get status color for transaction status
 */
export function getStatusColor(status: TransactionStatus): string {
  switch (status) {
    case 'completed':
      return 'text-green-500 bg-green-500/10'
    case 'confirming':
      return 'text-yellow-500 bg-yellow-500/10'
    case 'pending':
      return 'text-blue-500 bg-blue-500/10'
    case 'failed':
      return 'text-red-500 bg-red-500/10'
    default:
      return 'text-slate-500 bg-slate-500/10'
  }
}

/**
 * Format time ago
 */
export function formatTimeAgo(date: Date): string {
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}
