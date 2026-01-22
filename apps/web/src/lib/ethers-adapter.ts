/**
 * Ethers Signer Adapter for thirdweb Accounts
 * Converts thirdweb account to ethers-compatible signer for facilitator SDK
 * Based on: https://docs.cronos.org/cronos-x402-facilitator/resources-and-next-steps
 */

import type { Account } from 'thirdweb/wallets'
import type { Signer } from 'ethers'
import { JsonRpcProvider } from 'ethers'

/**
 * Creates an ethers-compatible signer from a thirdweb account
 * This adapter allows the facilitator SDK's generatePaymentHeader to work with thirdweb accounts
 * 
 * @param account - Thirdweb account instance
 * @param chainId - Chain ID for the network
 * @param rpcUrl - RPC URL for the network (optional, defaults to Cronos testnet)
 */
export function createEthersSignerAdapter(
  account: Account,
  chainId: number,
  rpcUrl?: string
): Signer {
  const provider = new JsonRpcProvider(
    rpcUrl || process.env.NEXT_PUBLIC_CRONOS_RPC || 'https://evm-t3.cronos.org'
  )

  // Create a proxy object that implements ethers Signer interface
  const signer = {
    // Required Signer properties
    getAddress: async (): Promise<string> => {
      return account.address
    },

    signMessage: async (message: string | Uint8Array): Promise<string> => {
      const messageStr = typeof message === 'string' 
        ? message 
        : new TextDecoder().decode(message)
      return await account.signMessage({ message: messageStr })
    },

    signTypedData: async (domain: any, types: any, value: any): Promise<string> => {
      // Convert ethers domain format to thirdweb format
      const thirdwebDomain = {
        name: domain.name,
        version: domain.version || '1',
        chainId: BigInt(domain.chainId || chainId),
        verifyingContract: domain.verifyingContract as `0x${string}`,
      }

      // Find primary type from types object
      const primaryType = Object.keys(types).find(key => 
        key !== 'EIP712Domain' && types[key]
      ) || Object.keys(types)[0]

      return await account.signTypedData({
        domain: thirdwebDomain,
        types: types as any,
        primaryType: primaryType,
        message: value,
      })
    },

    // Provider reference
    provider,

    // Chain ID
    getChainId: async (): Promise<number> => chainId,

    // Connect method (returns self)
    connect: () => signer,
  } as unknown as Signer

  return signer
}
